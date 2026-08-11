import { isAdjacent, nextKey, type DayKey } from './dates';
import type { Block, CityId } from './types';

/**
 * اشتقاق كتل الحجز — الدالة المحورية في التطبيق كله.
 *
 * القاعدة: تلوين يوم بلون مدينة = «سأبيت ليلةَ هذا اليوم في تلك المدينة».
 * فالمتتاليات المتجاورة بنفس المدينة تُدمج في كتلة حجز واحدة،
 * وتاريخ الخروج = اليوم التالي لآخر ليلة.
 *
 * ينتج عن ذلك تلقائيًا:
 *  - يوم الانتقال يُحسب ليلة واحدة للمدينة الجديدة فقط (لا حجز مزدوج).
 *  - يوم المغادرة النهائي لا يُنتج ليلة، بل هو checkout الكتلة الأخيرة.
 *  - مجموع count عبر الكتل = عدد الأيام الملوّنة تمامًا.
 */
export function deriveBlocks(nights: Record<DayKey, CityId>): Block[] {
  const keys = Object.keys(nights).sort(); // ISO تُفرز أبجديًا = زمنيًا
  const out: Block[] = [];

  for (const k of keys) {
    const city = nights[k];
    const last = out[out.length - 1];
    if (last && last.city === city && isAdjacent(last.end, k)) {
      last.end = k;
      last.count++;
    } else {
      out.push({ city, start: k, end: k, checkout: k, count: 1 });
    }
  }

  // checkout يُحسب بعد اكتمال كل كتلة
  for (const b of out) b.checkout = nextKey(b.end);
  return out;
}

/** عدد ليالي كل مدينة. */
export function nightCounts(nights: Record<DayKey, CityId>): Record<CityId, number> {
  const out: Record<CityId, number> = {};
  for (const k of Object.keys(nights)) {
    const c = nights[k];
    out[c] = (out[c] || 0) + 1;
  }
  return out;
}

/** مفاتيح الليالي مرتّبة زمنيًا. */
export function nightKeys(nights: Record<DayKey, CityId>): DayKey[] {
  return Object.keys(nights).sort();
}

/**
 * حالة الخلية في التقويم:
 *  - 'stay'       مبيت كامل بمدينة واحدة
 *  - 'transition' يوم انتقال (اليوم السابق مدينة مختلفة) — يُعرض بنصفين
 *  - 'checkout'   خروج نهائي: لا مبيت ويسبقه يوم ملوّن
 *  - 'empty'      يوم خارج الرحلة أو غير ملوّن
 */
export type CellState = 'stay' | 'transition' | 'checkout' | 'empty';

export function cellState(
  nights: Record<DayKey, CityId>,
  key: DayKey,
  prev: DayKey,
): { state: CellState; city: CityId | null; prevCity: CityId | null } {
  const city = nights[key] ?? null;
  const prevCity = nights[prev] ?? null;

  if (city && prevCity && prevCity !== city) return { state: 'transition', city, prevCity };
  if (city) return { state: 'stay', city, prevCity: null };
  if (prevCity) return { state: 'checkout', city: null, prevCity };
  return { state: 'empty', city: null, prevCity: null };
}

/**
 * تنبيه الفجوات: يوم داخل مدى الرحلة بلا مدينة، ويليه يوم ملوّن —
 * أي أن المسافر «يختفي» ليلة ثم يعود. غالبًا خطأ في التلوين.
 */
export function findGaps(nights: Record<DayKey, CityId>): DayKey[] {
  const keys = nightKeys(nights);
  if (keys.length < 2) return [];
  const gaps: DayKey[] = [];
  for (let i = 0; i < keys.length - 1; i++) {
    let cursor = nextKey(keys[i]);
    while (cursor < keys[i + 1]) {
      gaps.push(cursor);
      cursor = nextKey(cursor);
    }
  }
  return gaps;
}

/**
 * ضبط عدد ليالي مدينة إلى العدد المطلوب.
 * التقليل يحذف الليالي الأخيرة، والزيادة تضيف أيامًا متتالية بعد آخر ليلة —
 * وإن لم يكن للمدينة ليالٍ أصلًا تبدأ من anchor (أول يوم شاغر مقترح).
 */
export function setCityNights(
  nights: Record<DayKey, CityId>,
  cityId: CityId,
  want: number,
  anchor: DayKey,
  limit?: DayKey,
): Record<DayKey, CityId> {
  const out = { ...nights };
  const mine = Object.keys(out).filter((k) => out[k] === cityId).sort();
  const target = Math.max(0, want);

  if (target === mine.length) return out;

  if (target < mine.length) {
    for (const k of mine.slice(target)) delete out[k];
    return out;
  }

  // زيادة — تبدأ بعد آخر ليلة للمدينة، أو من anchor إن لم تكن لها ليالٍ
  let cursor = mine.length ? nextKey(mine[mine.length - 1]) : anchor;
  let added = mine.length;
  let guard = 0;
  while (added < target && guard++ < 400) {
    if (limit && cursor > limit) break;
    out[cursor] = cityId;
    added++;
    cursor = nextKey(cursor);
  }
  return out;
}

/** نص جدول الحجوزات الجاهز للنسخ. */
export function bookingText(
  tripTitle: string,
  blocks: Block[],
  cityOf: (id: CityId) => { name: string; hotel: string } | undefined,
  flights: { airline: string; from: string; to: string; dateLabel: string; dep: string }[],
  totalNights: number,
  fmt: (k: DayKey) => string,
): string {
  let t = `${tripTitle}\n\nالحجوزات:\n`;
  for (const b of blocks) {
    const c = cityOf(b.city);
    if (!c) continue;
    t += `• ${c.name} — ${c.hotel}: دخول ${fmt(b.start)} / خروج ${fmt(b.checkout)} / ${b.count} ليلة\n`;
  }
  if (flights.length) {
    t += `\nالتذاكر:\n`;
    for (const f of flights) t += `• ${f.airline} — ${f.from} ← ${f.to} — ${f.dateLabel} ${f.dep}\n`;
  }
  t += `\nالإجمالي: ${totalNights} ليلة`;
  return t;
}
