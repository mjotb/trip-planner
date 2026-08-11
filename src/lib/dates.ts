/**
 * التواريخ — كل مفاتيح الأيام في التطبيق نصوص ISO بصيغة "YYYY-MM-DD".
 *
 * لماذا ISO؟ لأنها تُفرز أبجديًا بنفس ترتيبها الزمني، فتُلغي الحاجة لجدول ORD
 * الذي كان يقيّد النموذج الأولي بشهرين ثابتين. أي مدى تواريخ يعمل الآن،
 * بما فيه عبور نهاية السنة.
 *
 * كل الحسابات بتوقيت UTC عمدًا: التاريخ هنا "يوم في التقويم" لا لحظة زمنية،
 * فلا يجوز أن يزحف بفارق المنطقة الزمنية.
 */

export type DayKey = string; // "2026-10-22"

const MS_DAY = 86_400_000;

/** يحوّل مفتاح ISO إلى طابع زمني UTC. */
export function keyToTime(key: DayKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** يحوّل طابعًا زمنيًا (أو Date) إلى مفتاح ISO. */
export function timeToKey(t: number | Date): DayKey {
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** مفتاح اليوم التالي — يعبر حدود الشهر والسنة تلقائيًا. */
export function nextKey(key: DayKey, step = 1): DayKey {
  return timeToKey(keyToTime(key) + step * MS_DAY);
}

/** مفتاح اليوم السابق. */
export function prevKey(key: DayKey, step = 1): DayKey {
  return nextKey(key, -step);
}

/** عدد الأيام بين مفتاحين (b − a). */
export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((keyToTime(b) - keyToTime(a)) / MS_DAY);
}

/** هل المفتاحان متجاوران زمنيًا (b يلي a مباشرة)؟ */
export function isAdjacent(a: DayKey, b: DayKey): boolean {
  return daysBetween(a, b) === 1;
}

/** كل مفاتيح الأيام من start إلى end شاملًا الطرفين. */
export function rangeKeys(start: DayKey, end: DayKey): DayKey[] {
  const out: DayKey[] = [];
  const last = keyToTime(end);
  for (let t = keyToTime(start); t <= last; t += MS_DAY) out.push(timeToKey(t));
  return out;
}

/** مفتاح اليوم الحالي بتوقيت الجهاز، مُعبَّرًا عنه كيوم تقويمي. */
export function todayKey(): DayKey {
  const d = new Date();
  return timeToKey(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** رقم يوم الأسبوع: 0 = الأحد … 6 = السبت (كترتيب أعمدة التقويم). */
export function dow(key: DayKey): number {
  return new Date(keyToTime(key)).getUTCDay();
}

export const DOW_LONG = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const DOW_SHORT = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/** الجمعة أو السبت. */
export function isWeekend(key: DayKey): boolean {
  const d = dow(key);
  return d === 5 || d === 6;
}

export function dayOfMonth(key: DayKey): number {
  return Number(key.slice(8, 10));
}

export function monthIndex(key: DayKey): number {
  return Number(key.slice(5, 7)) - 1;
}

export function yearOf(key: DayKey): number {
  return Number(key.slice(0, 4));
}

/** "22 أكتوبر 2026" */
export function fmtLong(key: DayKey): string {
  return `${dayOfMonth(key)} ${MONTH_NAMES[monthIndex(key)]} ${yearOf(key)}`;
}

/** "22 أكتوبر" */
export function fmtShort(key: DayKey): string {
  return `${dayOfMonth(key)} ${MONTH_NAMES[monthIndex(key)]}`;
}

/* ------------------------------------------------------------------ */
/* التقويم الهجري — أم القرى عبر Intl، لا إزاحات ثابتة                  */
/* ------------------------------------------------------------------ */

type HijriParts = { day: number; month: string; year: number };

let hijriFmt: Intl.DateTimeFormat | null = null;
let hijriSupported: boolean | null = null;

function getHijriFormatter(): Intl.DateTimeFormat | null {
  if (hijriSupported === false) return null;
  if (hijriFmt) return hijriFmt;
  try {
    hijriFmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    hijriSupported = true;
    return hijriFmt;
  } catch {
    hijriSupported = false;
    return null;
  }
}

const hijriCache = new Map<DayKey, HijriParts>();

/**
 * يعيد المقابل الهجري ليوم ميلادي.
 * يعتمد Intl (تقويم أم القرى) — دقيق لأي سنة، بخلاف إزاحات النموذج الأولي
 * التي كانت تعمل لخريف 2026 فقط. إن لم تدعمه البيئة يعيد null بهدوء.
 */
export function hijri(key: DayKey): HijriParts | null {
  const cached = hijriCache.get(key);
  if (cached) return cached;

  const fmt = getHijriFormatter();
  if (!fmt) return null;

  const parts = fmt.formatToParts(new Date(keyToTime(key)));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';

  // Intl يعيد أرقامًا عربية-هندية (١٢٣) — نحوّلها لأرقام لاتينية.
  const toLatin = (s: string) =>
    Number(s.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660)).replace(/\D/g, ''));

  const out: HijriParts = {
    day: toLatin(get('day')),
    month: get('month'),
    year: toLatin(get('year')),
  };
  hijriCache.set(key, out);
  return out;
}

/** رقم اليوم الهجري فقط (للخلية الصغيرة). */
export function hijriDay(key: DayKey): string {
  const h = hijri(key);
  return h ? String(h.day) : '';
}

/** "9 جمادى الأولى 1448" */
export function fmtHijri(key: DayKey): string {
  const h = hijri(key);
  return h ? `${h.day} ${h.month} ${h.year}` : '';
}

/** وصف هجري لمدى شهر ميلادي كامل، مثل "ربيع الآخر — جمادى الأولى 1448". */
export function hijriSpan(first: DayKey, last: DayKey): string {
  const a = hijri(first);
  const b = hijri(last);
  if (!a || !b) return '';
  if (a.month === b.month) return `${a.month} ${b.year}`;
  return `${a.month} — ${b.month} ${b.year}`;
}

/* ------------------------------------------------------------------ */
/* بناء شبكة الأشهر                                                     */
/* ------------------------------------------------------------------ */

export type MonthGrid = {
  key: string;          // "2026-10"
  title: string;        // "أكتوبر 2026"
  hijriTitle: string;
  lead: number;         // خلايا فارغة قبل اليوم الأول
  days: DayKey[];
};

/**
 * يبني قائمة الأشهر التي تغطي المدى [start, end]، شهرًا كاملًا لكل واحد
 * حتى تبقى الأعمدة السبعة متسقة بصريًا.
 */
export function monthsCovering(start: DayKey, end: DayKey): MonthGrid[] {
  const out: MonthGrid[] = [];
  let y = yearOf(start);
  let m = monthIndex(start);
  const endY = yearOf(end);
  const endM = monthIndex(end);

  while (y < endY || (y === endY && m <= endM)) {
    const len = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const days: DayKey[] = [];
    for (let d = 1; d <= len; d++) days.push(timeToKey(Date.UTC(y, m, d)));
    out.push({
      key: `${y}-${String(m + 1).padStart(2, '0')}`,
      title: `${MONTH_NAMES[m]} ${y}`,
      hijriTitle: hijriSpan(days[0], days[len - 1]),
      lead: dow(days[0]),
      days,
    });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return out;
}
