/**
 * ينسخ أعلام الدول المستخدمة فعليًا من حزمة flag-icons إلى public/assets/flags/country/
 *
 * لماذا النسخ الانتقائي؟ الحزمة فيها 270 علمًا بحجم 2.9 ميجابايت، ولا نحتاج
 * منها إلا دول المطارات (69). ننسخ ما نحتاجه فقط فيبقى المستودع والنشر خفيفين،
 * وتبقى الأعلام محلية تعمل بلا إنترنت — وهو ما يلزم تطبيقًا يُستخدم أثناء السفر.
 *
 * المصدر الوحيد للحقيقة هو country_iso2 في ملف المطارات. لا يُستنتج البلد
 * من رمز المطار ولا من اسم المدينة.
 *
 * يُشغَّل تلقائيًا قبل npm run dev و npm run build.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AIRPORTS = join(ROOT, 'src', 'data', 'airports.json');
const SRC_DIR = join(ROOT, 'node_modules', 'flag-icons', 'flags', '4x3');
const OUT_DIR = join(ROOT, 'public', 'assets', 'flags', 'country');

function main() {
  const data = JSON.parse(readFileSync(AIRPORTS, 'utf8'));
  const airports = data.airports ?? [];

  // رموز الدول الفريدة — علم واحد لكل دولة مهما تعدّدت مطاراتها
  const codes = new Set();
  const invalid = [];
  for (const a of airports) {
    const iso = a.country_iso2;
    if (typeof iso !== 'string' || !/^[A-Za-z]{2}$/.test(iso)) {
      invalid.push(`${a.iata ?? '?'} → ${JSON.stringify(iso)}`);
      continue;
    }
    codes.add(iso.toLowerCase());
  }

  if (!existsSync(SRC_DIR)) {
    console.warn('[flags] حزمة flag-icons غير مثبّتة — تخطّي. شغّل: npm install');
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });

  // تنظيف الأعلام التي لم تعد مستخدمة
  for (const f of readdirSync(OUT_DIR)) {
    if (f.endsWith('.svg') && !codes.has(f.replace('.svg', ''))) {
      rmSync(join(OUT_DIR, f));
    }
  }

  let copied = 0;
  const missing = [];
  for (const code of [...codes].sort()) {
    const src = join(SRC_DIR, `${code}.svg`);
    if (!existsSync(src)) {
      missing.push(code);
      continue;
    }
    writeFileSync(join(OUT_DIR, `${code}.svg`), readFileSync(src));
    copied++;
  }

  console.log(`[flags] ${copied} علمًا لـ ${airports.length} مطارًا (${codes.size} دولة).`);

  if (missing.length) {
    console.warn(`[flags] ⚠ لا يوجد علم لهذه الرموز، وستظهر أيقونة كرة أرضية بدلًا منها: ${missing.join(' ')}`);
  }
  if (invalid.length) {
    console.warn(`[flags] ⚠ رموز دول غير صالحة في البيانات:\n        ${invalid.join('\n        ')}`);
  }
}

main();
