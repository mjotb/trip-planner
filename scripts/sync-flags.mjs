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
const AIRLINES = join(ROOT, 'src', 'data', 'airlines.json');
const SRC_DIR = join(ROOT, 'node_modules', 'flag-icons', 'flags', '4x3');
const OUT_DIR = join(ROOT, 'public', 'assets', 'flags', 'country');

function main() {
  const data = JSON.parse(readFileSync(AIRPORTS, 'utf8'));
  const airports = data.airports ?? [];

  // رموز الدول الفريدة — علم واحد لكل دولة مهما تعدّدت مطاراتها أو ناقلاتها
  const codes = new Set();
  const invalid = [];

  const take = (iso, label) => {
    if (typeof iso !== 'string' || !/^[A-Za-z]{2}$/.test(iso)) {
      invalid.push(`${label} → ${JSON.stringify(iso)}`);
      return;
    }
    codes.add(iso.toLowerCase());
  };

  for (const a of airports) take(a.country_iso2, a.iata ?? '?');

  // دول الناقلات أيضًا — كثير منها خارج أوروبا وآسيا (أمريكا، أستراليا…)
  // فلولا هذه الخطوة لظهرت كرة أرضية بدل علمها.
  let airlineCount = 0;
  if (existsSync(AIRLINES)) {
    const list = JSON.parse(readFileSync(AIRLINES, 'utf8'));
    airlineCount = Array.isArray(list) ? list.length : 0;
    for (const a of list) {
      // "DK,NO,SE" للإسكندنافية يُصحَّح في src/lib/airlines.ts إلى SE
      const iso = a.iata === 'SK' ? 'SE' : a.country;
      take(iso, `ناقل ${a.iata ?? '?'}`);
    }
  }
  // ناقلات نضيفها في الكود ولا وجود لها في ملف المصدر
  for (const iso of ['IT', 'SA', 'EG']) codes.add(iso.toLowerCase());

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

  console.log(`[flags] ${copied} علمًا لـ ${airports.length} مطارًا و${airlineCount} ناقلًا (${codes.size} دولة).`);

  if (missing.length) {
    console.warn(`[flags] ⚠ لا يوجد علم لهذه الرموز، وستظهر أيقونة كرة أرضية بدلًا منها: ${missing.join(' ')}`);
  }
  if (invalid.length) {
    console.warn(`[flags] ⚠ رموز دول غير صالحة في البيانات:\n        ${invalid.join('\n        ')}`);
  }
}

main();
