import type { ItemType, MoveId, PlaceType } from './types';

/** ألوان المدن — الأربعة الأولى من التصميم، ثم تدوير على البقية. */
export const CITY_PALETTE = [
  '#00A8DA', // سماوي
  '#DE8000', // برتقالي
  '#00BD74', // أخضر
  '#E0619F', // وردي
  '#8B3A62', // خمري
  '#0084AF', // سماوي غامق
  '#944500', // بني
  '#6D8DFF', // أزرق
];

export function nextCityColor(used: string[]): string {
  return CITY_PALETTE.find((c) => !used.includes(c)) ?? CITY_PALETTE[used.length % CITY_PALETTE.length];
}

export const AIRLINES = [
  { code: 'SV', name: 'الخطوط السعودية', color: '#0E7C5A', tint: '#E6F4EF' },
  { code: 'XY', name: 'طيران ناس', color: '#E8A200', tint: '#FDF4E0' },
  { code: 'F3', name: 'طيران أديل', color: '#7A2E8E', tint: '#F3EAF6' },
  { code: 'KL', name: 'الملكية الهولندية', color: '#00A1DE', tint: '#E4F4FB' },
  { code: 'QR', name: 'الخطوط القطرية', color: '#5C0632', tint: '#F4E8EE' },
  { code: 'EK', name: 'طيران الإمارات', color: '#D71921', tint: '#FBE8E9' },
  { code: 'ET', name: 'الإثيوبية', color: '#7B9E00', tint: '#F1F5E0' },
  { code: 'TK', name: 'الخطوط التركية', color: '#C70A0C', tint: '#FAE7E7' },
  { code: 'MS', name: 'مصر للطيران', color: '#0B4EA2', tint: '#E5EDF7' },
  { code: 'BA', name: 'الخطوط البريطانية', color: '#1B3B6F', tint: '#E7EBF2' },
  { code: 'AF', name: 'الفرنسية', color: '#00256C', tint: '#E5E9F0' },
  { code: 'LH', name: 'لوفتهانزا', color: '#05164D', tint: '#E5E7EE' },
];

export function airlineOf(code: string) {
  return AIRLINES.find((a) => a.code === code);
}

export const MOVES: { id: MoveId; name: string; icon: string; dot: string }[] = [
  { id: 'plane-out', name: 'طائرة مغادرة', icon: 'plane', dot: '#0084AF' },
  { id: 'plane-in', name: 'طائرة وصول', icon: 'plane', dot: '#00BD74' },
  { id: 'train', name: 'قطار', icon: 'train', dot: '#DE8000' },
  { id: 'car', name: 'سيارة', icon: 'car', dot: '#8B3A62' },
  { id: 'bus', name: 'حافلة', icon: 'car', dot: '#6E7276' },
];

export function moveOf(id: MoveId) {
  return MOVES.find((m) => m.id === id);
}

export const ITEM_TYPES: Record<ItemType, { label: string; icon: string; tint: string }> = {
  place: { label: 'مَعلم', icon: 'activity', tint: '#ECF2FD' },
  food: { label: 'مطعم', icon: 'food', tint: '#FFF7BA' },
  metro: { label: 'مترو', icon: 'target', tint: '#E6F7FC' },
  train: { label: 'قطار', icon: 'train', tint: '#FDF0E0' },
  shop: { label: 'أسواق', icon: 'heart', tint: '#F7EAF1' },
  hotel: { label: 'فندق', icon: 'bed', tint: '#E9F7F1' },
  plane: { label: 'طيران', icon: 'plane', tint: '#E7EBF2' },
};

export const PLACE_TYPES: Record<PlaceType, { label: string; icon: string; tint: string }> = {
  food: ITEM_TYPES.food,
  place: ITEM_TYPES.place,
  shop: ITEM_TYPES.shop,
};

/** الأعلام المتوفرة في public/assets/flags. */
export const FLAGS: Record<string, string> = {
  uk: 'flag-uk',
  nl: 'flag-nl',
  be: 'flag-be',
  fr: 'flag-fr',
};

export function mapsLink(q: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export const STORAGE_KEY = 'tourly-planner-v1';
export const SCHEMA_VERSION = 1;
