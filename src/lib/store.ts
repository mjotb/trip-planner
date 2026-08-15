'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nextKey, rangeKeys, todayKey, type DayKey } from './dates';
import { setCityNights } from './blocks';
import { mapsLink, nextCityColor, SCHEMA_VERSION, STORAGE_KEY } from './constants';
import type {
  City, CityId, DayItem, Flight, MenuLine, MoveId, Place, SheetKind, Tab, Tool, Trip,
} from './types';

let seq = 0;
export function uid(prefix = 'x'): string {
  seq += 1;
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}`;
}

function emptyTrip(title: string, start: DayKey, end: DayKey): Trip {
  const now = Date.now();
  return {
    id: uid('t'),
    title,
    start,
    end,
    createdAt: now,
    updatedAt: now,
    cities: [],
    nights: {},
    moves: {},
    flights: [],
    plans: {},
    places: [],
  };
}

/** رحلة المثال — نفس بيانات النموذج، لكن بتواريخ ISO حقيقية. */
function seedTrip(): Trip {
  const t = emptyTrip('رحلة أوروبا · خريف 2026', '2026-10-20', '2026-11-04');
  t.cities = [
    { id: 'uk', name: 'لندن', country: 'المملكة المتحدة', color: '#00A8DA', flag: 'flag-uk', countryIso: 'GB', hotel: 'The Bloomsbury', hotelMap: mapsLink('The Bloomsbury Hotel London'), map: mapsLink('London') },
    { id: 'nl', name: 'أمستردام', country: 'هولندا', color: '#DE8000', flag: 'flag-nl', countryIso: 'NL', hotel: 'Pulitzer Amsterdam', hotelMap: mapsLink('Pulitzer Amsterdam'), map: mapsLink('Amsterdam') },
    { id: 'be', name: 'بروكسل', country: 'بلجيكا', color: '#00BD74', flag: 'flag-be', countryIso: 'BE', hotel: 'Hotel Amigo', hotelMap: mapsLink('Hotel Amigo Brussels'), map: mapsLink('Brussels') },
    { id: 'fr', name: 'باريس', country: 'فرنسا', color: '#E0619F', flag: 'flag-fr', countryIso: 'FR', hotel: 'Hôtel Le Six', hotelMap: mapsLink('Hotel Le Six Paris'), map: mapsLink('Paris') },
  ];
  const nights: Record<DayKey, CityId> = {};
  rangeKeys('2026-10-22', '2026-10-23').forEach((k) => (nights[k] = 'uk'));
  rangeKeys('2026-10-24', '2026-10-27').forEach((k) => (nights[k] = 'nl'));
  rangeKeys('2026-10-28', '2026-10-29').forEach((k) => (nights[k] = 'be'));
  rangeKeys('2026-10-30', '2026-11-01').forEach((k) => (nights[k] = 'fr'));
  t.nights = nights;
  t.moves = {
    '2026-10-22': 'plane-out',
    '2026-10-24': 'train',
    '2026-10-28': 'train',
    '2026-10-30': 'train',
    '2026-11-02': 'plane-in',
  };
  t.flights = [
    { id: uid('f'), code: 'SV', airline: 'Saudia', kind: 'ذهاب', cabin: 'اقتصادي', date: '2026-10-22', from: 'الرياض RUH', to: 'لندن LHR', fromIata: 'RUH', toIata: 'LHR', dep: '09:40', arr: '14:15', dur: '6س 35د' },
    { id: uid('f'), code: 'KL', airline: 'KLM', kind: 'عودة', cabin: 'اقتصادي', date: '2026-11-02', from: 'باريس CDG', to: 'الرياض RUH', fromIata: 'CDG', toIata: 'RUH', dep: '15:30', arr: '23:55', dur: '6س 25د' },
  ];
  t.plans = {
    '2026-10-22': [
      { id: uid('i'), type: 'hotel', time: '16:00', dur: '30 د', title: 'تسجيل الدخول — The Bloomsbury', note: 'الغرفة جاهزة بعد الرابعة، الأمتعة تُحفظ قبلها.', map: mapsLink('The Bloomsbury Hotel London'), menu: false, transfer: 'الأنبوب من هيثرو · خط بيكاديللي · 50 د' },
      { id: uid('i'), type: 'food', time: '19:30', dur: 'ساعة', title: 'عشاء في Dishoom Covent Garden', note: 'حجز مسبق مطلوب. المنيو بالإنجليزية.', map: mapsLink('Dishoom Covent Garden'), menu: true, transfer: 'مشي 12 د' },
    ],
    '2026-10-24': [
      { id: uid('i'), type: 'train', time: '08:12', dur: '3س 52د', title: 'يوروستار: لندن ← أمستردام', note: 'الوصول لمحطة سانت بانكراس قبل 75 دقيقة.', map: mapsLink('St Pancras International'), menu: false, transfer: 'مترو 51 من المحطة للفندق · 18 د' },
      { id: uid('i'), type: 'place', time: '14:30', dur: 'ساعتان', title: 'قنوات يوردان + سوق Noordermarkt', note: 'أفضل ضوء للصور قبل الغروب بساعة.', map: mapsLink('Jordaan Amsterdam'), menu: false, transfer: 'ترام 13 · 9 د' },
    ],
  };
  t.places = [
    { id: uid('p'), name: 'Dishoom Covent Garden', city: 'لندن', type: 'food', map: mapsLink('Dishoom Covent Garden') },
    { id: uid('p'), name: 'متحف ريكس', city: 'أمستردام', type: 'place', map: mapsLink('Rijksmuseum') },
    { id: uid('p'), name: 'Maison Dandoy — وافل بروكسل', city: 'بروكسل', type: 'food', map: mapsLink('Maison Dandoy Brussels') },
    { id: uid('p'), name: 'حي لومارايه للتسوق', city: 'باريس', type: 'shop', map: mapsLink('Le Marais Paris') },
  ];
  return t;
}

type UI = {
  tab: Tab;
  tool: Tool;
  sheet: SheetKind;
  form: Record<string, any>;
  day: DayKey;
  placeFilter: string;
  toast: string;
  /** 'error' يعرض الرسالة بالأحمر حتى لا تُقرأ خطأً كتأكيد نجاح. */
  toastKind: 'ok' | 'error';
  /** أسماء الحقول الناقصة، تُحاط بإطار أحمر في الورقة المفتوحة. */
  missing: string[];
  hydrated: boolean;
};

type State = {
  trips: Trip[];
  activeId: string;
  ui: UI;
};

type Actions = {
  // مساعدات
  trip: () => Trip;
  patch: (fn: (t: Trip) => void) => void;

  // واجهة
  setTab: (t: Tab) => void;
  setTool: (t: Tool) => void;
  setDay: (d: DayKey) => void;
  setPlaceFilter: (f: string) => void;
  openSheet: (k: SheetKind, form?: Record<string, any>) => void;
  closeSheet: () => void;
  setField: (k: string, v: any) => void;
  toast: (m: string) => void;
  /** رسالة خطأ حمراء + تأشير الحقول الناقصة. تُعيد false دائمًا للاختصار. */
  fail: (m: string, missing?: string[]) => false;

  // رحلات
  createTrip: (title: string, start: DayKey, end: DayKey) => void;
  updateTrip: (id: string, patch: Partial<Pick<Trip, 'title' | 'start' | 'end'>>) => void;
  deleteTrip: (id: string) => void;
  selectTrip: (id: string) => void;
  duplicateTrip: (id: string) => void;

  // ليالٍ
  paint: (k: DayKey) => void;
  clearNights: () => void;

  // مدن
  addCity: (c: Omit<City, 'id' | 'color'> & { nights?: number }) => void;
  editCity: (id: CityId, patch: Partial<City>, wantNights?: number) => void;
  removeCity: (id: CityId) => void;

  // تذاكر
  addFlight: (f: Omit<Flight, 'id'>) => void;
  updateFlight: (id: string, patch: Partial<Flight>) => void;
  removeFlight: (id: string) => void;

  // مخطط اليوم
  addItem: (day: DayKey, item: Omit<DayItem, 'id'>) => void;
  addItems: (day: DayKey, items: Omit<DayItem, 'id'>[]) => void;
  removeItem: (day: DayKey, id: string) => void;

  // أماكن
  addPlace: (p: Omit<Place, 'id'>) => void;
  removePlace: (id: string) => void;
  setPlaceMenu: (id: string, lines: MenuLine[]) => void;

  // بيانات
  exportJSON: () => string;
  importJSON: (raw: string, mode: 'merge' | 'replace') => { ok: boolean; message: string };
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      trips: [seedTrip()],
      activeId: '',
      ui: {
        tab: 'trip',
        tool: { type: 'city', id: 'uk' },
        sheet: null,
        form: {},
        day: '2026-10-22',
        placeFilter: 'الكل',
        toast: '',
        toastKind: 'ok',
        missing: [],
        hydrated: false,
      },

      trip: () => {
        const s = get();
        return s.trips.find((t) => t.id === s.activeId) ?? s.trips[0];
      },

      /**
       * يعدّل الرحلة النشطة.
       *
       * حرجٌ أن يستهدف هذا نفس الرحلة التي تعرضها الواجهة بالضبط. لذلك يمرّ
       * عبر trip() — نفس المُحدِّد الذي تستخدمه الشاشات — بدل مطابقة activeId
       * مباشرة. سابقًا كان يطابق activeId، فإن صار معلّقًا (يشير إلى رحلة
       * محذوفة أو أُعيدت تسمية معرّفها عند الاستيراد) عرضت الشاشة الرحلة الأولى
       * بينما لم يطابق التعديل أي رحلة، فتُبتلع الإضافات بصمت مع رسالة نجاح.
       */
      patch: (fn) => {
        const target = get().trip();
        if (!target) return;
        set((s) => ({
          // شفاء ذاتي: يثبّت المعرّف على الرحلة المعروضة فعلًا
          activeId: target.id,
          trips: s.trips.map((t) => {
            if (t.id !== target.id) return t;
            const copy: Trip = JSON.parse(JSON.stringify(t));
            fn(copy);
            copy.updatedAt = Date.now();
            return copy;
          }),
        }));
      },

      setTab: (tab) => set((s) => ({ ui: { ...s.ui, tab } })),
      setTool: (tool) => set((s) => ({ ui: { ...s.ui, tool } })),
      setDay: (day) => set((s) => ({ ui: { ...s.ui, day } })),
      setPlaceFilter: (placeFilter) => set((s) => ({ ui: { ...s.ui, placeFilter } })),
      openSheet: (sheet, form = {}) => set((s) => ({ ui: { ...s.ui, sheet, form, missing: [] } })),
      closeSheet: () => set((s) => ({ ui: { ...s.ui, sheet: null, form: {}, missing: [] } })),

      // الكتابة في حقل ناقص تُزيل تأشيره فورًا
      setField: (k, v) =>
        set((s) => ({
          ui: { ...s.ui, form: { ...s.ui.form, [k]: v }, missing: s.ui.missing.filter((m) => m !== k) },
        })),

      toast: (toast) => {
        set((s) => ({ ui: { ...s.ui, toast, toastKind: 'ok' } }));
        if (toast) setTimeout(() => set((s) => (s.ui.toast === toast ? { ui: { ...s.ui, toast: '' } } : s)), 2400);
      },

      fail: (toast, missing = []) => {
        set((s) => ({ ui: { ...s.ui, toast, toastKind: 'error', missing } }));
        setTimeout(() => set((s) => (s.ui.toast === toast ? { ui: { ...s.ui, toast: '' } } : s)), 3200);
        return false;
      },

      createTrip: (title, start, end) =>
        set((s) => {
          const t = emptyTrip(title || 'رحلة جديدة', start, end);
          return {
            trips: [...s.trips, t],
            activeId: t.id,
            ui: { ...s.ui, tab: 'trip', day: start, tool: { type: 'erase', id: null } },
          };
        }),

      updateTrip: (id, patch) =>
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
        })),

      deleteTrip: (id) =>
        set((s) => {
          const trips = s.trips.filter((t) => t.id !== id);
          if (!trips.length) {
            const fresh = emptyTrip('رحلة جديدة', todayKey(), nextKey(todayKey(), 7));
            return { trips: [fresh], activeId: fresh.id };
          }
          return { trips, activeId: s.activeId === id ? trips[0].id : s.activeId };
        }),

      selectTrip: (id) =>
        set((s) => {
          const t = s.trips.find((x) => x.id === id);
          return { activeId: id, ui: { ...s.ui, tab: 'trip', day: t ? (Object.keys(t.nights).sort()[0] ?? t.start) : s.ui.day } };
        }),

      duplicateTrip: (id) =>
        set((s) => {
          const src = s.trips.find((t) => t.id === id);
          if (!src) return s;
          const copy: Trip = JSON.parse(JSON.stringify(src));
          copy.id = uid('t');
          copy.title = `${src.title} (نسخة)`;
          copy.createdAt = copy.updatedAt = Date.now();
          return { trips: [...s.trips, copy], activeId: copy.id };
        }),

      paint: (k) => {
        const { tool } = get().ui;
        get().patch((t) => {
          if (tool.type === 'erase') {
            delete t.nights[k];
            delete t.moves[k];
          } else if (tool.type === 'city') {
            if (t.nights[k] === tool.id) delete t.nights[k];
            else t.nights[k] = tool.id;
          } else {
            if (t.moves[k] === tool.id) delete t.moves[k];
            else t.moves[k] = tool.id as MoveId;
          }
        });
      },

      clearNights: () => get().patch((t) => { t.nights = {}; t.moves = {}; }),

      addCity: (c) => {
        const t = get().trip();
        const id = uid('c');
        const color = nextCityColor(t.cities.map((x) => x.color));
        const want = Math.max(0, c.nights ?? 0);
        get().patch((tr) => {
          tr.cities.push({
            id, color,
            name: c.name,
            country: c.country || '—',
            flag: c.flag || '',
            countryIso: c.countryIso,
            hotel: c.hotel || 'لم يُحدَّد الفندق',
            hotelMap: c.hotelMap || (c.hotel ? mapsLink(`${c.hotel} ${c.name}`) : ''),
            map: c.map || mapsLink(c.name),
            notes: c.notes,
          });
          if (want > 0) {
            const keys = Object.keys(tr.nights).sort();
            const anchor = keys.length ? nextKey(keys[keys.length - 1]) : tr.start;
            tr.nights = setCityNights(tr.nights, id, want, anchor, tr.end);
          }
        });
        get().setTool({ type: 'city', id });
      },

      editCity: (id, patch, wantNights) =>
        get().patch((t) => {
          t.cities = t.cities.map((c) => (c.id === id ? { ...c, ...patch } : c));
          if (wantNights !== undefined) {
            const keys = Object.keys(t.nights).sort();
            const anchor = keys.length ? nextKey(keys[keys.length - 1]) : t.start;
            t.nights = setCityNights(t.nights, id, wantNights, anchor, t.end);
          }
        }),

      removeCity: (id) =>
        get().patch((t) => {
          t.cities = t.cities.filter((c) => c.id !== id);
          for (const k of Object.keys(t.nights)) if (t.nights[k] === id) delete t.nights[k];
        }),

      addFlight: (f) => get().patch((t) => { t.flights.push({ ...f, id: uid('f') }); }),
      updateFlight: (id, patchF) =>
        get().patch((t) => { t.flights = t.flights.map((f) => (f.id === id ? { ...f, ...patchF } : f)); }),
      removeFlight: (id) => get().patch((t) => { t.flights = t.flights.filter((f) => f.id !== id); }),

      addItem: (day, item) =>
        get().patch((t) => {
          const list = t.plans[day] ?? [];
          t.plans[day] = [...list, { ...item, id: uid('i') }].sort((a, b) => a.time.localeCompare(b.time));
        }),

      addItems: (day, items) =>
        get().patch((t) => {
          const list = t.plans[day] ?? [];
          const withIds = items.map((i) => ({ ...i, id: uid('i') }));
          t.plans[day] = [...list, ...withIds].sort((a, b) => a.time.localeCompare(b.time));
        }),

      removeItem: (day, id) =>
        get().patch((t) => { t.plans[day] = (t.plans[day] ?? []).filter((i) => i.id !== id); }),

      addPlace: (p) => get().patch((t) => { t.places.push({ ...p, id: uid('p') }); }),
      removePlace: (id) => get().patch((t) => { t.places = t.places.filter((p) => p.id !== id); }),
      setPlaceMenu: (id, lines) =>
        get().patch((t) => { t.places = t.places.map((p) => (p.id === id ? { ...p, menuLines: lines } : p)); }),

      exportJSON: () => {
        const s = get();
        return JSON.stringify(
          { app: 'tourly-planner', version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), trips: s.trips },
          null, 2,
        );
      },

      importJSON: (raw, mode) => {
        try {
          const data = JSON.parse(raw);
          const incoming: Trip[] = Array.isArray(data) ? data : data.trips;
          if (!Array.isArray(incoming) || !incoming.length) {
            return { ok: false, message: 'الملف لا يحتوي رحلات' };
          }
          for (const t of incoming) {
            if (!t.id || !t.start || !t.end || typeof t.nights !== 'object') {
              return { ok: false, message: 'بنية الملف غير متوافقة' };
            }
          }
          set((s) => {
            if (mode === 'replace') return { trips: incoming, activeId: incoming[0].id };
            const ids = new Set(s.trips.map((t) => t.id));
            const merged = [...s.trips];
            // نتتبّع المعرّف الفعلي للرحلة الأولى المستوردة: إن كان مكرّرًا
            // فسيُعطى معرّفًا جديدًا، وتثبيت activeId على القديم يجعله معلّقًا.
            let firstId = '';
            for (const t of incoming) {
              const added = ids.has(t.id)
                ? { ...t, id: uid('t'), title: `${t.title} (مستورد)` }
                : t;
              merged.push(added);
              ids.add(added.id);
              if (!firstId) firstId = added.id;
            }
            return { trips: merged, activeId: firstId };
          });
          return { ok: true, message: `استُوردت ${incoming.length} رحلة` };
        } catch {
          return { ok: false, message: 'تعذّرت قراءة الملف — تأكد أنه JSON صادر من التطبيق' };
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      // الواجهة لا تُحفظ عدا التبويب واليوم المختار
      partialize: (s) => ({ trips: s.trips, activeId: s.activeId }) as any,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.activeId || !state.trips.find((t) => t.id === state.activeId)) {
          state.activeId = state.trips[0]?.id ?? '';
        }
        const t = state.trips.find((x) => x.id === state.activeId);
        if (t) {
          const keys = Object.keys(t.nights).sort();
          state.ui = {
            ...state.ui,
            hydrated: true,
            day: keys[0] ?? t.start,
            tool: t.cities.length ? { type: 'city', id: t.cities[0].id } : { type: 'erase', id: null },
          };
        } else {
          state.ui = { ...state.ui, hydrated: true };
        }
      },
    },
  ),
);
