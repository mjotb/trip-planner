/**
 * فحص دخان للمتجر — يشغّل الأفعال الحقيقية من src/lib/store.ts
 * بعد ترجمتها إلى JavaScript، مع بديل بسيط لـ localStorage.
 *
 * التشغيل: npm run test:store
 */

import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, symlinkSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, '.smoke');

/* ---------- ترجمة ملفات lib ---------- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

execSync(
  `npx tsc src/lib/dates.ts src/lib/blocks.ts src/lib/constants.ts src/lib/types.ts src/lib/store.ts src/lib/ai.ts src/lib/asset.ts ` +
    `--outDir "${OUT}" --module esnext --target es2020 --moduleResolution bundler --skipLibCheck`,
  { cwd: ROOT, stdio: 'inherit' },
);

// إصلاح المسارات: @/lib/x → ./x.js
for (const f of readdirSync(OUT).filter((f) => f.endsWith('.js'))) {
  const p = join(OUT, f);
  writeFileSync(
    p,
    readFileSync(p, 'utf8')
      .replace(/from '@\/lib\//g, "from './")
      .replace(/from '\.\/([a-zA-Z]+)'/g, "from './$1.js'"),
  );
}
if (!existsSync(join(OUT, 'node_modules'))) {
  symlinkSync(join(ROOT, 'node_modules'), join(OUT, 'node_modules'), 'dir');
}

/* ---------- بيئة متصفح مصغّرة ---------- */
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, v),
  removeItem: (k) => mem.delete(k),
};
globalThis.window = { isSecureContext: false };
Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
globalThis.document = {
  createElement: () => ({ style: {}, setAttribute() {}, select() {} }),
  body: { appendChild() {}, removeChild() {} },
  execCommand: () => false,
};

/* ---------- الفحوص ---------- */
const { useStore } = await import(`file://${join(OUT, 'store.js')}`);
const { deriveBlocks, nightKeys } = await import(`file://${join(OUT, 'blocks.js')}`);
const { parseDayItems, parseMenuLines, parseCities } = await import(`file://${join(OUT, 'ai.js')}`);

const s = () => useStore.getState();
let failed = 0;
const ok = (label, cond, extra = '') => {
  if (!cond) failed++;
  console.log(`${cond ? '✓' : '✗ فشل'} ${label}${extra ? ' — ' + extra : ''}`);
};

s().selectTrip(s().trips[0].id);
let t = s().trip();
ok('رحلة المثال محمّلة', t.cities.length === 4 && nightKeys(t.nights).length === 11);
ok('4 كتل حجز', deriveBlocks(t.nights).length === 4);

s().setTool({ type: 'city', id: 'uk' });
s().paint('2026-10-21');
ok('تلوين يوم جديد يزيد الليالي', nightKeys(s().trip().nights).length === 12);
s().paint('2026-10-21');
ok('النقر بنفس الأداة يلغي', nightKeys(s().trip().nights).length === 11);
s().setTool({ type: 'erase', id: null });
s().paint('2026-10-22');
ok('الممحاة تحذف الليلة والتنقل معًا',
  s().trip().nights['2026-10-22'] === undefined && s().trip().moves['2026-10-22'] === undefined);
s().setTool({ type: 'city', id: 'uk' });
s().paint('2026-10-22');

const before = nightKeys(s().trip().nights).length;
s().addCity({ name: 'برلين', country: 'ألمانيا', flag: '', hotel: 'Hotel X', hotelMap: '', map: '', nights: 3 });
t = s().trip();
const berlin = t.cities.find((c) => c.name === 'برلين');
ok('المدينة الجديدة تأخذ لونًا غير مستخدم',
  !!berlin && !t.cities.filter((c) => c.id !== berlin.id).some((c) => c.color === berlin.color));
ok('عدّاد الليالي أضاف 3 ليالٍ متتالية', nightKeys(t.nights).length === before + 3);

s().editCity(berlin.id, {}, 1);
ok('تقليل العدّاد يحذف الليالي الأخيرة',
  Object.values(s().trip().nights).filter((v) => v === berlin.id).length === 1);

s().removeCity(berlin.id);
ok('حذف المدينة يحذف لياليها', !Object.values(s().trip().nights).includes(berlin.id));

s().createTrip('رحلة اليابان', '2027-03-05', '2027-03-20');
ok('أُنشئت رحلة ثانية فارغة', s().trips.length === 2 && nightKeys(s().trip().nights).length === 0);
s().addCity({ name: 'طوكيو', country: 'اليابان', flag: '', hotel: '', hotelMap: '', map: '', nights: 4 });
ok('عدّاد ليالٍ في رحلة فارغة يبدأ من تاريخ البداية',
  Object.keys(s().trip().nights).sort()[0] === '2027-03-05' && nightKeys(s().trip().nights).length === 4);
ok('الرحلة الأولى لم تتأثر', deriveBlocks(s().trips[0].nights).length === 4);

const json = s().exportJSON();
ok('التصدير ينتج JSON صالحًا', JSON.parse(json).trips.length === 2);
const r = s().importJSON(json, 'merge');
ok('الاستيراد بالدمج ينجح ويعيد تسمية المكرر', r.ok && s().trips.length === 4);
ok('الاستيراد يرفض ملفًا غير متوافق', !s().importJSON('{"nope":1}', 'merge').ok);

const messy =
  'طبعًا! إليك الخطة:\n```json\n{"items":[' +
  '{"type":"food","time":"9:30","dur":"ساعة","title":"فطور","note":"","query":"cafe tokyo","transfer":"مشي 5 د"},' +
  '{"type":"BAD","time":"xx","title":"معبد سينسوجي"}]}\n```\nبالتوفيق!';
const pr = parseDayItems(messy, 'طوكيو');
ok('يستخرج JSON من رد فيه شرح وأسوار كود', pr.ok && pr.data.length === 2);
ok('يصحّح وقتًا ناقصًا ونوعًا غير معروف',
  pr.ok && pr.data[0].time === '09:30' && pr.data[1].type === 'place' && pr.data[1].time === '10:00');
ok('يبني رابط خرائط من query', pr.ok && pr.data[0].map.includes('cafe'));
ok('يرفض نصًا بلا JSON', !parseDayItems('لا يوجد شيء هنا', 'x').ok);
ok('يقرأ أسطر المنيو', parseMenuLines('{"lines":[{"ar":"شوربة عدس","orig":"Lentil soup","price":"€7"}]}').ok);
const cr = parseCities('{"cities":[{"name":"روما","country":"إيطاليا","nights":"3"}]}');
ok('يقرأ المدن ويحوّل الليالي لرقم', cr.ok && cr.data[0].nights === 3);

s().addItems('2027-03-05', pr.data);
s().addItem('2027-03-05', { type: 'place', time: '08:00', dur: 'ساعة', title: 'أول شيء', note: '', map: '', menu: false, transfer: '' });
const times = s().trip().plans['2027-03-05'].map((i) => i.time);
ok('عناصر اليوم مفروزة بالوقت', times.join() === [...times].sort().join());

rmSync(OUT, { recursive: true, force: true });
console.log(failed ? `\n${failed} فحص فشل` : '\nكل الفحوص نجحت');
process.exit(failed ? 1 : 0);
