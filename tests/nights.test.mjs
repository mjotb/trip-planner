/**
 * اختبارات منطق الليالي — تُشغَّل بـ `npm test` (node --test، بلا مكتبات).
 *
 * تعيد هذه الاختبارات تنفيذ نفس دوال src/lib بصيغة JavaScript خالصة،
 * لأن node --test لا يقرأ TypeScript مباشرة. أي تعديل في المنطق الأصلي
 * يجب أن يُعكس هنا — والاختبارات تحرس معايير القبول في وثيقة الفكرة.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

const MS_DAY = 86_400_000;

const keyToTime = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const timeToKey = (t) => {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};
const nextKey = (k, step = 1) => timeToKey(keyToTime(k) + step * MS_DAY);
const daysBetween = (a, b) => Math.round((keyToTime(b) - keyToTime(a)) / MS_DAY);
const isAdjacent = (a, b) => daysBetween(a, b) === 1;
const rangeKeys = (s, e) => {
  const out = [];
  for (let t = keyToTime(s); t <= keyToTime(e); t += MS_DAY) out.push(timeToKey(t));
  return out;
};

function deriveBlocks(nights) {
  const keys = Object.keys(nights).sort();
  const out = [];
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
  for (const b of out) b.checkout = nextKey(b.end);
  return out;
}

function cellState(nights, key, prev) {
  const city = nights[key] ?? null;
  const prevCity = nights[prev] ?? null;
  if (city && prevCity && prevCity !== city) return { state: 'transition', city, prevCity };
  if (city) return { state: 'stay', city, prevCity: null };
  if (prevCity) return { state: 'checkout', city: null, prevCity };
  return { state: 'empty', city: null, prevCity: null };
}

function setCityNights(nights, cityId, want, anchor, limit) {
  const out = { ...nights };
  const mine = Object.keys(out).filter((k) => out[k] === cityId).sort();
  const target = Math.max(0, want);
  if (target === mine.length) return out;
  if (target < mine.length) {
    for (const k of mine.slice(target)) delete out[k];
    return out;
  }
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

function findGaps(nights) {
  const keys = Object.keys(nights).sort();
  if (keys.length < 2) return [];
  const gaps = [];
  for (let i = 0; i < keys.length - 1; i++) {
    let c = nextKey(keys[i]);
    while (c < keys[i + 1]) { gaps.push(c); c = nextKey(c); }
  }
  return gaps;
}

/* ------------------------------------------------------------------ */
/* رحلة المثال من وثيقة الفكرة                                          */
/* ------------------------------------------------------------------ */

function sample() {
  const n = {};
  rangeKeys('2026-10-22', '2026-10-23').forEach((k) => (n[k] = 'uk'));
  rangeKeys('2026-10-24', '2026-10-27').forEach((k) => (n[k] = 'nl'));
  rangeKeys('2026-10-28', '2026-10-29').forEach((k) => (n[k] = 'be'));
  rangeKeys('2026-10-30', '2026-11-01').forEach((k) => (n[k] = 'fr'));
  return n;
}

test('كتل الحجز تطابق المثال: لندن 2، أمستردام 4، بروكسل 2، باريس 3', () => {
  const b = deriveBlocks(sample());
  assert.equal(b.length, 4);
  assert.deepEqual(b.map((x) => [x.city, x.count]), [['uk', 2], ['nl', 4], ['be', 2], ['fr', 3]]);
});

test('تاريخ الخروج = اليوم التالي لآخر ليلة', () => {
  const b = deriveBlocks(sample());
  assert.equal(b[0].checkout, '2026-10-24'); // لندن: آخر ليلة 23
  assert.equal(b[1].checkout, '2026-10-28'); // أمستردام: آخر ليلة 27
  assert.equal(b[2].checkout, '2026-10-30'); // بروكسل: آخر ليلة 29
});

test('العبور من 31 أكتوبر إلى 1 نوفمبر يبقى كتلة واحدة، والخروج 2 نوفمبر', () => {
  const b = deriveBlocks(sample());
  const paris = b[3];
  assert.equal(paris.start, '2026-10-30');
  assert.equal(paris.end, '2026-11-01');
  assert.equal(paris.count, 3);
  assert.equal(paris.checkout, '2026-11-02');
});

test('العبور من 31 ديسمبر إلى 1 يناير — نهاية السنة', () => {
  const n = {};
  rangeKeys('2026-12-30', '2027-01-02').forEach((k) => (n[k] = 'x'));
  const b = deriveBlocks(n);
  assert.equal(b.length, 1);
  assert.equal(b[0].count, 4);
  assert.equal(b[0].checkout, '2027-01-03');
});

test('29 فبراير في سنة كبيسة يُعالج بصحة', () => {
  const n = {};
  rangeKeys('2028-02-27', '2028-03-01').forEach((k) => (n[k] = 'x'));
  const b = deriveBlocks(n);
  assert.equal(b[0].count, 4);
  assert.deepEqual(Object.keys(n).sort(), ['2028-02-27', '2028-02-28', '2028-02-29', '2028-03-01']);
  assert.equal(b[0].checkout, '2028-03-02');
});

test('مجموع ليالي الكتل = عدد الأيام الملوّنة تمامًا', () => {
  const n = sample();
  const total = deriveBlocks(n).reduce((s, b) => s + b.count, 0);
  assert.equal(total, Object.keys(n).length);
  assert.equal(total, 11);
});

test('يوم الانتقال: نصفان، وليلة واحدة فقط للمدينة الجديدة', () => {
  const n = sample();
  const s = cellState(n, '2026-10-24', '2026-10-23');
  assert.equal(s.state, 'transition');
  assert.equal(s.prevCity, 'uk');
  assert.equal(s.city, 'nl');
  // 24 أكتوبر ليلة واحدة لأمستردام فقط — لا يظهر في كتلة لندن
  const blocks = deriveBlocks(n);
  assert.equal(blocks[0].end, '2026-10-23');
  assert.equal(blocks[1].start, '2026-10-24');
});

test('يوم المغادرة النهائي: حالة خروج ولا يُنتج ليلة', () => {
  const n = sample();
  const s = cellState(n, '2026-11-02', '2026-11-01');
  assert.equal(s.state, 'checkout');
  assert.equal(s.city, null);
  assert.equal(n['2026-11-02'], undefined);
});

test('عودة المسافر لمدينة سابقة تُنشئ كتلتين منفصلتين لا كتلة واحدة', () => {
  const n = {
    '2026-10-01': 'a', '2026-10-02': 'a',
    '2026-10-03': 'b',
    '2026-10-04': 'a', '2026-10-05': 'a',
  };
  const b = deriveBlocks(n);
  assert.equal(b.length, 3);
  assert.deepEqual(b.map((x) => x.count), [2, 1, 2]);
  assert.equal(b[0].checkout, '2026-10-03');
  assert.equal(b[2].checkout, '2026-10-06');
});

test('فجوة يوم بين ليلتين لنفس المدينة تُنتج كتلتين لا كتلة واحدة', () => {
  const n = { '2026-10-01': 'a', '2026-10-03': 'a' };
  const b = deriveBlocks(n);
  assert.equal(b.length, 2);
  assert.deepEqual(findGaps(n), ['2026-10-02']);
});

test('عدّاد الليالي: التقليل يحذف الليالي الأخيرة', () => {
  const n = setCityNights(sample(), 'nl', 2, '2026-10-24');
  assert.deepEqual(Object.keys(n).filter((k) => n[k] === 'nl'), ['2026-10-24', '2026-10-25']);
});

test('عدّاد الليالي: الزيادة تضيف أيامًا بعد آخر ليلة (وتطغى على التالي)', () => {
  const n = setCityNights(sample(), 'uk', 4, '2026-10-22');
  const uk = Object.keys(n).filter((k) => n[k] === 'uk');
  assert.deepEqual(uk, ['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']);
});

test('عدّاد الليالي يعمل لمدينة بلا ليالٍ — ثغرة النموذج الأولي', () => {
  const n = setCityNights({}, 'new', 3, '2026-05-10');
  assert.deepEqual(Object.keys(n).sort(), ['2026-05-10', '2026-05-11', '2026-05-12']);
  assert.equal(deriveBlocks(n)[0].checkout, '2026-05-13');
});

test('عدّاد الليالي يحترم نهاية مدى الرحلة', () => {
  const n = setCityNights({}, 'x', 10, '2026-05-10', '2026-05-12');
  assert.equal(Object.keys(n).length, 3);
});

test('عدّاد الليالي عند صفر يحذف كل ليالي المدينة', () => {
  const n = setCityNights(sample(), 'be', 0, '2026-10-28');
  assert.equal(Object.keys(n).filter((k) => n[k] === 'be').length, 0);
  assert.equal(Object.keys(n).length, 9);
});

test('تلوين يوم واحد يعيد الحساب فورًا دون أثر جانبي', () => {
  const n = { ...sample() };
  n['2026-10-25'] = 'be'; // شطر إقامة أمستردام
  const b = deriveBlocks(n);
  assert.deepEqual(b.map((x) => [x.city, x.count]), [
    ['uk', 2], ['nl', 1], ['be', 1], ['nl', 2], ['be', 2], ['fr', 3],
  ]);
  assert.equal(b.reduce((s, x) => s + x.count, 0), 11);
});

test('التقويم الهجري عبر Intl متاح ويعطي شهرًا عربيًا', () => {
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { month: 'long', day: 'numeric', timeZone: 'UTC' });
  } catch {
    return; // بيئة بلا ICU كامل — يتجاوز الاختبار
  }
  const out = fmt.format(new Date(Date.UTC(2026, 9, 22)));
  assert.ok(/[؀-ۿ]/.test(out), `متوقع نص عربي، جاء: ${out}`);
});
