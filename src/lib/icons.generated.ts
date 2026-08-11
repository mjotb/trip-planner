/* ملف مُولَّد آليًا — لا تعدّله يدويًا.
 * يُعاد توليده عند كل npm run dev / npm run build من محتويات
 * public/assets/custom/. لإضافة أيقونة: سمِّ الملف باسم الخانة وضعه هناك.
 */

import type { IconSlot } from './icons';

type GeneratedDef = { file: string; mode: 'mask' | 'color' };

export const GENERATED: Partial<Record<IconSlot, GeneratedDef>> = {
  // لا توجد أيقونات مخصّصة بعد — ضع ملفاتك في public/assets/custom/
};
