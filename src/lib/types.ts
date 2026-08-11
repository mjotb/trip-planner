import type { DayKey } from './dates';

export type CityId = string;
export type MoveId = 'plane-out' | 'plane-in' | 'train' | 'car' | 'bus';
export type ItemType = 'place' | 'food' | 'metro' | 'train' | 'shop' | 'hotel' | 'plane';
export type PlaceType = 'food' | 'place' | 'shop';

export type City = {
  id: CityId;
  name: string;
  country: string;
  color: string;
  flag: string;      // مسار ملف علم أو '' لاستخدام الحرف الأول
  hotel: string;
  hotelMap: string;  // رابط جوجل ماب للفندق
  map: string;       // رابط جوجل ماب للمدينة
  notes?: string;
};

export type Flight = {
  id: string;
  code: string;      // رمز الناقل: SV, KL, QR…
  airline: string;   // اسم الناقل (يسمح بناقل خارج القائمة)
  kind: 'ذهاب' | 'عودة' | 'داخلي';
  cabin: string;
  date: DayKey | '';
  from: string;
  to: string;
  dep: string;       // "09:40"
  arr: string;
  dur: string;
  ref?: string;      // رقم الحجز
};

export type DayItem = {
  id: string;
  type: ItemType;
  time: string;      // "10:30"
  dur: string;
  title: string;
  note: string;
  map: string;
  menu: boolean;     // يعرض زر ترجمة المنيو
  transfer: string;  // سطر الانتقال أسفل العنصر
};

export type Place = {
  id: string;
  name: string;
  city: string;
  type: PlaceType;
  map: string;
  note?: string;
  menuLines?: MenuLine[];
};

export type MenuLine = { id: string; ar: string; orig: string; price: string };

export type Trip = {
  id: string;
  title: string;
  start: DayKey;
  end: DayKey;
  createdAt: number;
  updatedAt: number;
  cities: City[];
  nights: Record<DayKey, CityId>;
  moves: Record<DayKey, MoveId>;
  flights: Flight[];
  plans: Record<DayKey, DayItem[]>;
  places: Place[];
};

/** كتلة حجز مشتقّة — ليست مخزَّنة، تُحسب من nights في كل مرة. */
export type Block = {
  city: CityId;
  start: DayKey;   // أول ليلة
  end: DayKey;     // آخر ليلة
  checkout: DayKey; // اليوم التالي لآخر ليلة
  count: number;
};

export type Tool =
  | { type: 'city'; id: CityId }
  | { type: 'move'; id: MoveId }
  | { type: 'erase'; id: null };

export type Tab = 'trip' | 'cal' | 'day' | 'places' | 'trips';

export type SheetKind =
  | 'flight' | 'city' | 'newCity' | 'activity' | 'place'
  | 'menu' | 'newTrip' | 'editTrip' | 'ai' | null;
