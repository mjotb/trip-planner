/**
 * تحقّق من بيانات شركات الطيران.
 *
 * يشمل المصدر كما وصل، والتصحيحات والإضافات التي نطبّقها في الكود.
 * منطق التطبيع مُعاد هنا بـ JavaScript لأن node --test لا يقرأ TypeScript.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = JSON.parse(readFileSync(join(ROOT, 'src/data/airlines.json'), 'utf8'));
const FLAG_DIR = join(ROOT, 'public/assets/flags/country');

// نفس ما في src/lib/airlines.ts
const ADDITIONS = [
  { iata: 'AZ', country: 'IT', name: 'ITA Airways', color: '#00205B' },
  { iata: 'F3', country: 'SA', name: 'flyadeal', color: '#582C83' },
  { iata: 'MS', country: 'EG', name: 'EgyptAir', color: '#0B4EA2' },
];
const FIXES = { SK: 'SE', IB: '#D7192D', QF: '#E40000', TG: '#330066' };
const FEATURED = ['SV', 'QR', 'EK', 'AF', 'KL', 'AZ', 'LH'];

const expand = (h) =>
  /^#[0-9a-fA-F]{3}$/.test(h) ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;

const isoOf = (a) => (a.iata === 'SK' ? 'SE' : a.country);
const colorOf = (a) => {
  const fix = FIXES[a.iata];
  const raw = (fix && fix.startsWith('#') ? fix : a.branding?.primary_color) ?? '';
  return expand(raw.trim());
};
const flagPath = (iso) => join(FLAG_DIR, `${iso.toLowerCase()}.svg`);

test('المصدر مصفوفة غير فارغة', () => {
  assert.ok(Array.isArray(SRC) && SRC.length > 0);
});

test('كل ناقل له رمز IATA فريد وصالح', () => {
  const all = [...SRC.map((a) => a.iata), ...ADDITIONS.map((a) => a.iata)];
  const bad = all.filter((c) => !/^[A-Z0-9]{2}$/.test(c));
  assert.deepEqual(bad, [], `رموز غير صالحة: ${bad.join(' ')}`);
  assert.equal(new Set(all).size, all.length, 'يوجد رمز ناقل مكرّر');
});

test('الناقلات المضافة ليست موجودة أصلًا في المصدر', () => {
  const src = new Set(SRC.map((a) => a.iata));
  for (const a of ADDITIONS) {
    assert.ok(!src.has(a.iata), `${a.iata} صار موجودًا في المصدر — احذفه من ADDITIONS`);
  }
});

test('رمز دولة كل ناقل صالح بعد التصحيح', () => {
  const bad = [];
  for (const a of [...SRC, ...ADDITIONS]) {
    const iso = isoOf(a);
    if (!/^[A-Z]{2}$/.test(iso ?? '')) bad.push(`${a.iata}:${iso}`);
  }
  assert.deepEqual(bad, [], `رموز دول غير صالحة: ${bad.join(' ')}`);
});

test('الإسكندنافية SK صُحّحت — المصدر فيه DK,NO,SE', () => {
  const sk = SRC.find((a) => a.iata === 'SK');
  if (!sk) return;
  assert.ok(!/^[A-Z]{2}$/.test(sk.country), 'المصدر تغيّر — راجع التصحيح');
  assert.equal(isoOf(sk), 'SE');
});

test('كل ناقل له علم دولة موجود', () => {
  const missing = [];
  for (const a of [...SRC, ...ADDITIONS]) {
    const iso = isoOf(a);
    if (/^[A-Z]{2}$/.test(iso) && !existsSync(flagPath(iso))) missing.push(`${a.iata}:${iso}`);
  }
  assert.deepEqual(missing, [], `أعلام ناقصة: ${missing.join(' ')}`);
});

test('كل ناقل له لون هيكس صالح بعد التصحيح', () => {
  const bad = [];
  for (const a of SRC) {
    const c = colorOf(a);
    if (c && !/^#[0-9a-fA-F]{6}$/.test(c)) bad.push(`${a.iata}:${c}`);
  }
  assert.deepEqual(bad, [], `ألوان غير صالحة: ${bad.join(' ')}`);
});

test('الناقلات ذات اللون الفارغ في المصدر مُصحَّحة', () => {
  for (const a of SRC) {
    if (!a.branding?.primary_color) {
      assert.ok(FIXES[a.iata], `${a.iata} بلا لون وبلا تصحيح — سيظهر رماديًا`);
    }
  }
});

test('الناقلات المعتادة كلها موجودة', () => {
  const all = new Set([...SRC.map((a) => a.iata), ...ADDITIONS.map((a) => a.iata)]);
  const missing = FEATURED.filter((c) => !all.has(c));
  assert.deepEqual(missing, [], `ناقلات معتادة مفقودة: ${missing.join(' ')}`);
});

test('الناقلات التي كانت في التطبيق سابقًا لم تُفقد', () => {
  const all = new Set([...SRC.map((a) => a.iata), ...ADDITIONS.map((a) => a.iata)]);
  const before = ['SV', 'XY', 'F3', 'KL', 'QR', 'EK', 'ET', 'TK', 'MS', 'BA', 'AF', 'LH'];
  const lost = before.filter((c) => !all.has(c));
  assert.deepEqual(lost, [], `ناقلات اختفت في الترقية: ${lost.join(' ')}`);
});

test('ألوان الرموز مقروءة على خلفية فاتحة', () => {
  const lum = (h) => {
    const n = parseInt(h.slice(1), 16);
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  };
  // اللون الفاتح جدًا يُغمَّق في الكود؛ هنا نتأكد أن الاشتقاق يبلغ حدًا مقبولًا
  const darken = (h) => {
    if (lum(h) <= 0.62) return h;
    const n = parseInt(h.slice(1), 16);
    const d = (c) => Math.round(c * 0.55);
    return `#${(((1 << 24) | (d((n >> 16) & 255) << 16) | (d((n >> 8) & 255) << 8) | d(n & 255)) >>> 0).toString(16).slice(1)}`;
  };
  const bad = [];
  for (const a of SRC) {
    const c = colorOf(a);
    if (!/^#[0-9a-fA-F]{6}$/.test(c)) continue;
    if (lum(darken(c)) > 0.66) bad.push(`${a.iata}:${c}`);
  }
  assert.deepEqual(bad, [], `ألوان تبقى فاتحة بعد التغميق: ${bad.join(' ')}`);
});
