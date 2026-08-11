/**
 * سجلّ الأيقونات — «خانات» دلالية بدل أسماء ملفات.
 *
 * كل موضع في الواجهة يشير إلى خانة (مثل 'tab-trip')، والخانة تشير إلى ملف.
 * فائدة ذلك: لاستبدال أيقونة في التطبيق كله يكفي وضع ملفك في
 * public/assets/custom/ وإضافة سطر في CUSTOM أدناه — بلا لمس أي شاشة.
 *
 * وضعان للعرض:
 *  - mask  (الافتراضي): يُستخدم شكل الأيقونة قالبًا ويُلوَّن برمجيًا،
 *          فتتبع لون السياق (أبيض على داكن، رمادي على فاتح…).
 *          يتطلب أيقونة أحادية اللون — أي ألوان داخلها ستُسطَّح.
 *  - color: تُعرض كما هي بألوانها الأصلية. للشعارات والحالات الفارغة.
 */

import { GENERATED } from './icons.generated';

export type IconSlot =
  // شريط التبويب السفلي
  | 'tab-trip' | 'tab-nights' | 'tab-day' | 'tab-places' | 'tab-trips'
  // أنواع عناصر اليوم ووسائل التنقل
  | 'type-place' | 'type-food' | 'type-metro' | 'type-train'
  | 'type-shop' | 'type-hotel' | 'type-plane' | 'type-car' | 'type-bus'
  // أفعال
  | 'action-add' | 'action-edit' | 'action-delete' | 'action-more'
  | 'action-copy' | 'action-map' | 'action-location' | 'action-erase'
  // الهوية والذكاء الاصطناعي
  | 'brand-logo' | 'ai-sparkle'
  // الحالات الفارغة
  | 'empty-flights' | 'empty-cities' | 'empty-day' | 'empty-places'
  // الحالة
  | 'status-warning' | 'status-check';

type IconDef = {
  /** مسار الملف داخل public/assets/ */
  file: string;
  /** color = تُعرض بألوانها الأصلية، mask = تُلوَّن برمجيًا (الافتراضي) */
  mode?: 'mask' | 'color';
};

/** الأيقونات المدمجة — مستخرجة من تصدير Figma لملف Tourly. */
const BUILT_IN: Record<IconSlot, IconDef> = {
  'tab-trip': { file: 'ui/map.svg' },
  'tab-nights': { file: 'ui/target.svg' },
  'tab-day': { file: 'ui/activity.svg' },
  'tab-places': { file: 'ui/pin.svg' },
  'tab-trips': { file: 'ui/pace.svg' },

  'type-place': { file: 'ui/activity.svg' },
  'type-food': { file: 'ui/food.svg' },
  'type-metro': { file: 'ui/target.svg' },
  'type-train': { file: 'ui/train.svg' },
  'type-shop': { file: 'ui/heart.svg' },
  'type-hotel': { file: 'ui/bed.svg' },
  'type-plane': { file: 'ui/plane.svg' },
  'type-car': { file: 'ui/car.svg' },
  'type-bus': { file: 'ui/car.svg' },

  'action-add': { file: 'ui/plus.svg' },
  'action-edit': { file: 'ui/pencil.svg' },
  'action-delete': { file: 'ui/dots.svg' },
  'action-more': { file: 'ui/dots.svg' },
  'action-copy': { file: 'ui/share.svg' },
  'action-map': { file: 'ui/map-muted.svg' },
  'action-location': { file: 'ui/pin.svg' },
  'action-erase': { file: 'ui/pencil.svg' },

  'brand-logo': { file: 'ui/sparkle.svg' },
  'ai-sparkle': { file: 'ui/sparkle-cyan.svg' },

  'empty-flights': { file: 'ui/plane.svg' },
  'empty-cities': { file: 'ui/target.svg' },
  'empty-day': { file: 'ui/activity.svg' },
  'empty-places': { file: 'ui/pin.svg' },

  'status-warning': { file: 'ui/target.svg' },
  'status-check': { file: 'ui/check.svg' },
};

/** كل الخانات — تستخدمها شاشة معاينة الأيقونات. */
export const ALL_SLOTS = Object.keys(BUILT_IN) as IconSlot[];

/**
 * ────────────── هنا تضع أيقوناتك ──────────────
 *
 * لا تحتاج تعديل هذا الملف إطلاقًا. يكفي:
 *
 *   ١ · سمِّ الملف باسم الخانة:  tab-trip.svg
 *   ٢ · ضعه في:  public/assets/custom/
 *
 * يلتقطه البناء تلقائيًا (عبر scripts/scan-icons.mjs) ويقرّر بنفسه
 * أهي ملوّنة أم تتبع لون السياق، بحسب عدد ألوانها.
 *
 * أما OVERRIDES أدناه فلحالات نادرة فقط: أن ترغب في اسم ملف مختلف،
 * أو أن تجبر وضع عرض معيّنًا خلافًا لما اكتشفه الماسح.
 * ما تكتبه هنا يعلو على المكتشَف آليًا.
 */
export const OVERRIDES: Partial<Record<IconSlot, IconDef>> = {
  // 'brand-logo': { file: 'custom/شعاري.svg', mode: 'color' },
};

export function iconDef(slot: IconSlot): IconDef {
  return OVERRIDES[slot] ?? GENERATED[slot] ?? BUILT_IN[slot];
}

/** الخانات التي استُبدلت بأيقونة من عندك. */
export function customizedSlots(): IconSlot[] {
  return ALL_SLOTS.filter((s) => OVERRIDES[s] || GENERATED[s]);
}

