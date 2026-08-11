/**
 * يمسح public/assets/custom/ ويولّد src/lib/icons.generated.ts
 *
 * القاعدة: اسم الملف = اسم الخانة. ضع `tab-trip.svg` في المجلد فتحلّ
 * محل أيقونة تبويب «رحلتي» في التطبيق كله — بلا تعديل أي كود.
 *
 * يُشغَّل تلقائيًا قبل npm run dev و npm run build.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CUSTOM_DIR = join(ROOT, 'public', 'assets', 'custom');
const OUT = join(ROOT, 'src', 'lib', 'icons.generated.ts');

/** أسماء الخانات — يجب أن تطابق IconSlot في icons.ts */
const SLOTS = [
  'tab-trip', 'tab-nights', 'tab-day', 'tab-places', 'tab-trips',
  'type-place', 'type-food', 'type-metro', 'type-train',
  'type-shop', 'type-hotel', 'type-plane', 'type-car', 'type-bus',
  'action-add', 'action-edit', 'action-delete', 'action-more',
  'action-copy', 'action-map', 'action-location', 'action-erase',
  'brand-logo', 'ai-sparkle',
  'empty-flights', 'empty-cities', 'empty-day', 'empty-places',
  'status-warning', 'status-check',
];

const ALLOWED = new Set(['.svg', '.png', '.webp']);

/**
 * يقرّر وضع العرض.
 *
 * الوضع mask يستخدم شكل الأيقونة قالبًا ويلوّنها حسب السياق — مناسب
 * للأيقونة أحادية اللون. أما الملوّنة فتُعرض كما هي، وإلا سُطّحت ألوانها.
 * نكتشف ذلك بعدّ الألوان المميّزة داخل ملف SVG.
 */
function detectMode(file) {
  if (extname(file).toLowerCase() !== '.svg') return 'color'; // PNG/WebP دائمًا ملوّنة

  let svg;
  try {
    svg = readFileSync(file, 'utf8');
  } catch {
    return 'mask';
  }

  if (/<image\b|<linearGradient\b|<radialGradient\b|<pattern\b/i.test(svg)) return 'color';

  const colors = new Set();
  for (const m of svg.matchAll(/(?:fill|stroke)\s*[:=]\s*["']?\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|[a-zA-Z]+)/g)) {
    const c = m[1].toLowerCase();
    if (['none', 'currentcolor', 'transparent', 'inherit'].includes(c)) continue;
    colors.add(c);
  }
  return colors.size > 1 ? 'color' : 'mask';
}

function main() {
  if (!existsSync(CUSTOM_DIR)) mkdirSync(CUSTOM_DIR, { recursive: true });

  const found = {};
  const unknown = [];

  for (const entry of readdirSync(CUSTOM_DIR)) {
    const ext = extname(entry).toLowerCase();
    if (!ALLOWED.has(ext)) continue;

    const slot = basename(entry, ext);
    if (!SLOTS.includes(slot)) {
      unknown.push(entry);
      continue;
    }
    found[slot] = { file: `custom/${entry}`, mode: detectMode(join(CUSTOM_DIR, entry)) };
  }

  const entries = Object.entries(found);

  const body = entries.length
    ? entries
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([slot, def]) => `  '${slot}': { file: '${def.file}', mode: '${def.mode}' },`)
        .join('\n')
    : '  // لا توجد أيقونات مخصّصة بعد — ضع ملفاتك في public/assets/custom/';

  writeFileSync(
    OUT,
    `/* ملف مُولَّد آليًا — لا تعدّله يدويًا.
 * يُعاد توليده عند كل npm run dev / npm run build من محتويات
 * public/assets/custom/. لإضافة أيقونة: سمِّ الملف باسم الخانة وضعه هناك.
 */

import type { IconSlot } from './icons';

type GeneratedDef = { file: string; mode: 'mask' | 'color' };

export const GENERATED: Partial<Record<IconSlot, GeneratedDef>> = {
${body}
};
`,
    'utf8',
  );

  // تقرير مقروء أثناء البناء
  if (entries.length) {
    console.log(`[icons] ${entries.length} أيقونة مخصّصة:`);
    for (const [slot, def] of entries.sort(([a], [b]) => a.localeCompare(b))) {
      console.log(`        ${slot.padEnd(16)} → ${def.file}  (${def.mode === 'color' ? 'ملوّنة' : 'تتبع لون السياق'})`);
    }
  } else {
    console.log('[icons] لا توجد أيقونات مخصّصة — التطبيق يستخدم المدمجة.');
  }

  if (unknown.length) {
    console.warn(`\n[icons] ⚠ ${unknown.length} ملف اسمه لا يطابق أي خانة، فتُجوهل:`);
    for (const f of unknown) console.warn(`        ${f}`);
    console.warn('\n        الأسماء الصحيحة (انظر ICONS.md):');
    console.warn(`        ${SLOTS.join(' · ')}\n`);
  }
}

main();
