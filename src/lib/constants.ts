import type { IconSlot } from './icons';
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

// قائمة الناقلات انتقلت إلى src/lib/airlines.ts (مصدرها src/data/airlines.json)

export const MOVES: { id: MoveId; name: string; icon: IconSlot; dot: string }[] = [
  { id: 'plane-out', name: 'طائرة مغادرة', icon: 'type-plane', dot: '#0084AF' },
  { id: 'plane-in', name: 'طائرة وصول', icon: 'type-plane', dot: '#00BD74' },
  { id: 'train', name: 'قطار', icon: 'type-train', dot: '#DE8000' },
  { id: 'car', name: 'سيارة', icon: 'type-car', dot: '#8B3A62' },
  { id: 'bus', name: 'حافلة', icon: 'type-car', dot: '#6E7276' },
];

export function moveOf(id: MoveId) {
  return MOVES.find((m) => m.id === id);
}

export const ITEM_TYPES: Record<ItemType, { label: string; icon: IconSlot; tint: string }> = {
  place: { label: 'مَعلم', icon: 'type-place', tint: '#ECF2FD' },
  food: { label: 'مطعم', icon: 'type-food', tint: '#FFF7BA' },
  metro: { label: 'مترو', icon: 'type-metro', tint: '#E6F7FC' },
  train: { label: 'قطار', icon: 'type-train', tint: '#FDF0E0' },
  shop: { label: 'أسواق', icon: 'type-shop', tint: '#F7EAF1' },
  hotel: { label: 'فندق', icon: 'type-hotel', tint: '#E9F7F1' },
  plane: { label: 'طيران', icon: 'type-plane', tint: '#E7EBF2' },
};

export const PLACE_TYPES: Record<PlaceType, { label: string; icon: IconSlot; tint: string }> = {
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
