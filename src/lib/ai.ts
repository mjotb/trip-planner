/**
 * جسر الذكاء الاصطناعي — بلا مفتاح API وبلا تكلفة.
 *
 * الفكرة: التطبيق يبني الطلب كاملًا ويضعه في الحافظة، فتلصقه في تطبيق
 * Claude أو ChatGPT باشتراكك العادي، ثم تلصق ناتج JSON هنا فيُضاف للمخطط.
 * وهكذا نحصل على نتيجة الذكاء الاصطناعي دون تسريب مفتاح في مستودع عام.
 */

import { fmtLong, fmtHijri, type DayKey } from './dates';
import { ITEM_TYPES } from './constants';
import type { DayItem, ItemType, MenuLine } from './types';
import { mapsLink } from './constants';

const TYPE_KEYS = Object.keys(ITEM_TYPES).join(' | ');

/** طلب اقتراح مسار ليوم واحد. */
export function dayPlanPrompt(opts: {
  day: DayKey;
  cityName: string;
  country: string;
  hotel: string;
  existing: DayItem[];
  interests?: string;
}): string {
  const { day, cityName, country, hotel, existing, interests } = opts;
  const have = existing.length
    ? existing.map((i) => `- ${i.time} · ${i.title}`).join('\n')
    : '(لا يوجد شيء مجدول بعد)';

  return `أنت مخطط رحلات خبير. اقترح لي مسار يوم واحد.

المدينة: ${cityName}${country && country !== '—' ? ` — ${country}` : ''}
الفندق: ${hotel}
التاريخ: ${fmtLong(day)}${fmtHijri(day) ? ` (${fmtHijri(day)})` : ''}
${interests ? `اهتماماتي: ${interests}\n` : ''}
المجدول حاليًا في هذا اليوم:
${have}

المطلوب: اقترح من 3 إلى 6 عناصر إضافية لا تتعارض مع المجدول، مرتّبة زمنيًا،
واقعية من حيث المسافات ووقت التنقل، ومع تنويه لأي حجز مسبق مطلوب.
راعِ توفّر خيارات طعام حلال أو نباتي حيث أمكن.

أعد **JSON فقط** بلا أي نص قبله أو بعده، بهذا الشكل بالضبط:

{
  "items": [
    {
      "type": "${TYPE_KEYS}",
      "time": "HH:MM",
      "dur": "مدة مختصرة مثل: ساعة، 45 د، ساعتان",
      "title": "اسم النشاط بالعربية (يجوز إبقاء الاسم الأجنبي كما هو)",
      "note": "ملاحظة عملية قصيرة",
      "query": "اسم المكان بالإنجليزية للبحث في خرائط جوجل",
      "transfer": "وسيلة الوصول والمدة، مثل: مترو 51 · 18 د"
    }
  ]
}`;
}

/** طلب ترجمة منيو من صورة. */
export function menuPrompt(placeName: string): string {
  return `أرفقتُ صورة منيو مطعم${placeName ? ` باسم «${placeName}»` : ''}.

اقرأ الصورة وأعد الأطباق مترجمة للعربية. لكل طبق: الاسم بالعربية، الاسم الأصلي كما هو
في المنيو، والسعر كما هو مكتوب. نبّهني في حقل الترجمة العربية إن كان الطبق يحتوي
لحم خنزير أو كحول بكتابة «— يحتوي…» بعد الاسم.

أعد **JSON فقط** بلا أي نص قبله أو بعده:

{
  "lines": [
    { "ar": "الاسم بالعربية", "orig": "الاسم الأصلي", "price": "€12" }
  ]
}`;
}

/** طلب هيكلة رحلة كاملة (مدن وليالٍ) — يُستخدم في شاشة رحلاتي. */
export function tripSkeletonPrompt(opts: { start: DayKey; end: DayKey; idea: string }): string {
  return `أنا أخطط رحلة من ${fmtLong(opts.start)} إلى ${fmtLong(opts.end)}.
فكرتي: ${opts.idea}

وزّع الليالي على المدن توزيعًا منطقيًا يراعي وقت التنقل بينها.
انتبه: عدد الليالي = عدد الأيام التي أبيتها فعلًا، ويوم المغادرة النهائي لا يُحسب ليلة.

أعد **JSON فقط**:

{
  "cities": [
    { "name": "اسم المدينة بالعربية", "country": "الدولة بالعربية", "nights": 3, "hotelIdea": "منطقة مقترحة للسكن" }
  ]
}`;
}

/* ------------------------------------------------------------------ */
/* قراءة الناتج                                                        */
/* ------------------------------------------------------------------ */

/** يستخرج أول كائن JSON من نص قد يحيط به شرح أو أسوار كود. */
function extractJSON(raw: string): any {
  const text = raw.trim();
  if (!text) throw new Error('empty');

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;

  try {
    return JSON.parse(body);
  } catch {
    const start = body.indexOf('{');
    const end = body.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('no-json');
    return JSON.parse(body.slice(start, end + 1));
  }
}

const VALID_TYPES = new Set(Object.keys(ITEM_TYPES));

export type ParseResult<T> = { ok: true; data: T } | { ok: false; message: string };

/** يحوّل ناتج الذكاء الاصطناعي إلى عناصر يوم جاهزة للإضافة. */
export function parseDayItems(raw: string, cityName: string): ParseResult<Omit<DayItem, 'id'>[]> {
  let data: any;
  try {
    data = extractJSON(raw);
  } catch {
    return { ok: false, message: 'لم أجد JSON صالحًا في النص — انسخ الناتج كاملًا وحاول مجددًا' };
  }

  const list = Array.isArray(data) ? data : data.items;
  if (!Array.isArray(list) || !list.length) return { ok: false, message: 'الناتج لا يحتوي عناصر' };

  const items: Omit<DayItem, 'id'>[] = [];
  for (const r of list) {
    const title = String(r?.title ?? '').trim();
    if (!title) continue;
    const type: ItemType = VALID_TYPES.has(r?.type) ? r.type : 'place';
    const time = /^\d{1,2}:\d{2}$/.test(String(r?.time ?? '')) ? String(r.time).padStart(5, '0') : '10:00';
    items.push({
      type,
      time,
      dur: String(r?.dur ?? 'ساعة').trim() || 'ساعة',
      title,
      note: String(r?.note ?? '').trim(),
      map: r?.map ? String(r.map) : mapsLink(String(r?.query ?? `${title} ${cityName}`)),
      menu: type === 'food',
      transfer: String(r?.transfer ?? '').trim(),
    });
  }

  if (!items.length) return { ok: false, message: 'لم أتعرّف على أي عنصر صالح' };
  return { ok: true, data: items };
}

/** يحوّل ناتج ترجمة المنيو إلى أسطر. */
export function parseMenuLines(raw: string): ParseResult<MenuLine[]> {
  let data: any;
  try {
    data = extractJSON(raw);
  } catch {
    return { ok: false, message: 'لم أجد JSON صالحًا في النص' };
  }

  const list = Array.isArray(data) ? data : data.lines ?? data.items ?? data.dishes;
  if (!Array.isArray(list) || !list.length) return { ok: false, message: 'الناتج لا يحتوي أطباقًا' };

  const lines: MenuLine[] = [];
  list.forEach((r: any, i: number) => {
    const ar = String(r?.ar ?? r?.arabic ?? '').trim();
    if (!ar) return;
    lines.push({
      id: `m${i}`,
      ar,
      orig: String(r?.orig ?? r?.original ?? '').trim(),
      price: String(r?.price ?? '').trim(),
    });
  });

  if (!lines.length) return { ok: false, message: 'لم أتعرّف على أي طبق' };
  return { ok: true, data: lines };
}

/** يحوّل ناتج هيكلة الرحلة إلى قائمة مدن. */
export function parseCities(raw: string): ParseResult<{ name: string; country: string; nights: number; hotelIdea: string }[]> {
  let data: any;
  try {
    data = extractJSON(raw);
  } catch {
    return { ok: false, message: 'لم أجد JSON صالحًا في النص' };
  }

  const list = Array.isArray(data) ? data : data.cities;
  if (!Array.isArray(list) || !list.length) return { ok: false, message: 'الناتج لا يحتوي مدنًا' };

  const out = list
    .map((r: any) => ({
      name: String(r?.name ?? '').trim(),
      country: String(r?.country ?? '—').trim(),
      nights: Math.max(0, Math.round(Number(r?.nights) || 0)),
      hotelIdea: String(r?.hotelIdea ?? r?.hotel ?? '').trim(),
    }))
    .filter((c) => c.name);

  if (!out.length) return { ok: false, message: 'لم أتعرّف على أي مدينة' };
  return { ok: true, data: out };
}

/** نسخ إلى الحافظة مع بديل يعمل في السياقات غير الآمنة. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* يسقط للبديل */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
