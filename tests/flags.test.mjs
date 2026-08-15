/**
 * تحقّق من ربط كل مطار بعلم دولته الصحيح.
 *
 * يتحقق من مجموعة البيانات كاملة لا من عيّنة: كل مطار له رمز دولة صالح،
 * وكل رمز له ملف علم موجود وغير فارغ، وكل دول متعددة المطارات تشترك في
 * ملف واحد بلا تكرار.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/airports.json'), 'utf8'));
const AIRPORTS = data.airports;
const FLAG_DIR = join(ROOT, 'public/assets/flags/country');

const flagPath = (iso) => join(FLAG_DIR, `${iso.toLowerCase()}.svg`);

test('الملف يحتوي مطارات ويطابق العدد المعلن', () => {
  assert.ok(Array.isArray(AIRPORTS) && AIRPORTS.length > 0);
  if (data.airport_count) assert.equal(AIRPORTS.length, data.airport_count);
});

test('كل مطار له رمز دولة ISO-2 صالح', () => {
  const bad = AIRPORTS.filter((a) => !/^[A-Z]{2}$/.test(a.country_iso2 ?? ''));
  assert.deepEqual(bad.map((a) => `${a.iata}:${a.country_iso2}`), []);
});

test('كل رمز دولة له ملف علم موجود وغير فارغ', () => {
  const codes = [...new Set(AIRPORTS.map((a) => a.country_iso2))];
  const missing = codes.filter((c) => !existsSync(flagPath(c)));
  assert.deepEqual(missing, [], `أعلام ناقصة: ${missing.join(' ')}`);

  const empty = codes.filter((c) => statSync(flagPath(c)).size < 50);
  assert.deepEqual(empty, [], `ملفات علم فارغة: ${empty.join(' ')}`);
});

test('ملفات الأعلام صور SVG سليمة', () => {
  for (const f of readdirSync(FLAG_DIR)) {
    const txt = readFileSync(join(FLAG_DIR, f), 'utf8');
    assert.ok(txt.includes('<svg'), `${f} ليس SVG`);
    assert.ok(/viewBox=/.test(txt), `${f} بلا viewBox — قد يُشوَّه عند التحجيم`);
  }
});

test('علم واحد لكل دولة مهما تعدّدت مطاراتها — بلا تكرار', () => {
  const codes = new Set(AIRPORTS.map((a) => a.country_iso2));
  const files = readdirSync(FLAG_DIR).filter((f) => f.endsWith('.svg'));
  assert.equal(files.length, codes.size, 'عدد ملفات الأعلام يجب أن يساوي عدد الدول تمامًا');

  // بريطانيا لها أكثر من مطار — يجب أن تشترك كلها في ملف واحد
  const gb = AIRPORTS.filter((a) => a.country_iso2 === 'GB');
  assert.ok(gb.length > 1, 'متوقع أكثر من مطار بريطاني في البيانات');
  const paths = new Set(gb.map((a) => flagPath(a.country_iso2)));
  assert.equal(paths.size, 1);
});

test('الحالات المطلوب التحقق منها تشير للأعلام الصحيحة', () => {
  const expected = {
    RUH: 'SA', CDG: 'FR', LHR: 'GB', EDI: 'GB',
    HKG: 'HK', MFM: 'MO', TPE: 'TW',
  };
  const byIata = Object.fromEntries(AIRPORTS.map((a) => [a.iata, a]));

  for (const [iata, iso] of Object.entries(expected)) {
    const a = byIata[iata];
    assert.ok(a, `المطار ${iata} غير موجود في البيانات`);
    assert.equal(a.country_iso2, iso, `${iata} يجب أن يكون ${iso} لا ${a.country_iso2}`);
    assert.ok(existsSync(flagPath(iso)), `ملف علم ${iso} مفقود`);
  }
});

test('هونغ كونغ وماكاو وتايوان لا تُخلط بالصين', () => {
  const byIata = Object.fromEntries(AIRPORTS.map((a) => [a.iata, a]));
  for (const iata of ['HKG', 'MFM', 'TPE']) {
    assert.notEqual(byIata[iata].country_iso2, 'CN', `${iata} أُسند خطأً إلى CN`);
  }
});

test('النصوص العربية والإنجليزية محفوظة لكل مطار', () => {
  for (const a of AIRPORTS) {
    for (const k of ['iata', 'city_ar', 'city_en', 'airport_name_ar', 'airport_name_en', 'country_ar', 'country_en', 'region']) {
      assert.ok(typeof a[k] === 'string' && a[k].length > 0, `${a.iata}: الحقل ${k} ناقص`);
    }
    assert.ok(/[؀-ۿ]/.test(a.city_ar), `${a.iata}: city_ar ليس عربيًا`);
  }
});

test('رموز IATA فريدة وبثلاثة أحرف', () => {
  const codes = AIRPORTS.map((a) => a.iata);
  assert.equal(new Set(codes).size, codes.length, 'يوجد رمز IATA مكرّر');
  const bad = codes.filter((c) => !/^[A-Z]{3}$/.test(c));
  assert.deepEqual(bad, []);
});
