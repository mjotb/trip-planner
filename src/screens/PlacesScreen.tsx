'use client';

import { useStore } from '@/lib/store';
import { Chip, Empty, Icon, SectionTitle } from '@/components/ui';
import { PLACE_TYPES } from '@/lib/constants';
import { fmtShort } from '@/lib/dates';
import type { PlaceType, Trip } from '@/lib/types';

const FILTERS: { label: string; type: PlaceType | null }[] = [
  { label: 'الكل', type: null },
  { label: 'مطاعم', type: 'food' },
  { label: 'معالم', type: 'place' },
  { label: 'أسواق', type: 'shop' },
];

export default function PlacesScreen({ trip }: { trip: Trip }) {
  const filter = useStore((s) => s.ui.placeFilter);
  const day = useStore((s) => s.ui.day);
  const setFilter = useStore((s) => s.setPlaceFilter);
  const openSheet = useStore((s) => s.openSheet);
  const removePlace = useStore((s) => s.removePlace);
  const addItem = useStore((s) => s.addItem);
  const setTab = useStore((s) => s.setTab);
  const toast = useStore((s) => s.toast);

  const active = FILTERS.find((f) => f.label === filter) ?? FILTERS[0];
  const list = active.type ? trip.places.filter((p) => p.type === active.type) : trip.places;

  return (
    <div className="flex flex-col gap-3 px-5 pb-8 pt-1.5">

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.label} active={filter === f.label} onClick={() => setFilter(f.label)} className="flex-1">
            {f.label}
          </Chip>
        ))}
      </div>

      <SectionTitle
        title={`${list.length} مكان`}
        action={
          <button
            type="button"
            onClick={() => openSheet('place', { type: 'food' })}
            className="flex items-center gap-1 text-[10.5px] font-medium text-cyan-deep"
          >
            <Icon slot="action-add" size={11} color="#0084AF" />
            إضافة
          </button>
        }
      />

      {list.length === 0 ? (
        <Empty
          icon="empty-places"
          text="لا توجد أماكن في هذا التصنيف"
          hint="احفظ مطاعمك وأماكنك المهمة هنا لتضيفها لأي يوم بنقرة"
        />
      ) : (
        list.map((p) => {
          const t = PLACE_TYPES[p.type];
          return (
            <div key={p.id} className="flex animate-rise flex-col gap-2.5 rounded-15 border border-line p-[13px_14px]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-10" style={{ background: t.tint }}>
                  <Icon slot={t.icon} size={16} color="#3D4348" />
                </div>
                <div className="flex min-w-0 flex-col gap-px">
                  <span className="truncate text-[13px] font-bold">{p.name}</span>
                  <span className="text-[10px] text-muted-3">{p.city} · {t.label}</span>
                </div>
                <button type="button" onClick={() => removePlace(p.id)} aria-label="حذف المكان" className="mr-auto">
                  <Icon slot="action-delete" size={14} color="#9EA1A4" />
                </button>
              </div>

              {p.menuLines && p.menuLines.length > 0 && (
                <div className="flex flex-col gap-1.5 rounded-12 bg-surface px-3 py-2.5">
                  <span className="text-[9.5px] font-medium text-muted-3">المنيو المترجم</span>
                  {p.menuLines.slice(0, 4).map((m) => (
                    <div key={m.id} className="flex items-baseline gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[11px] font-bold">{m.ar}</span>
                        <span className="num truncate text-[9px] font-light text-muted-3">{m.orig}</span>
                      </div>
                      <span className="num mr-auto flex-none text-[10px] font-medium text-ink-2">{m.price}</span>
                    </div>
                  ))}
                  {p.menuLines.length > 4 && (
                    <span className="text-[9px] font-light text-muted-3">+{p.menuLines.length - 4} طبق آخر</span>
                  )}
                </div>
              )}

              <div className="flex gap-1.5">
                <a
                  href={p.map}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-1 rounded-12 border border-line bg-white py-2.5 text-[10.5px] font-medium text-ink-2"
                >
                  <Icon slot="action-map" size={13} color="#6E7276" />
                  الخريطة
                </a>
                {p.type === 'food' && (
                  <button
                    type="button"
                    onClick={() => openSheet('menu', { name: p.name, placeId: p.id })}
                    className="flex flex-1 items-center justify-center gap-1 rounded-12 border border-cream-line bg-cream py-2.5 text-[10.5px] font-medium text-ink-2"
                  >
                    <Icon slot="ai-sparkle" size={13} color="#00A8DA" />
                    ترجمة المنيو
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    addItem(day, {
                      type: p.type, time: '13:00', dur: 'ساعة', title: p.name,
                      note: 'من قائمة أماكني.', map: p.map, menu: p.type === 'food', transfer: '',
                    });
                    setTab('day');
                    toast(`أُضيف إلى ${fmtShort(day)}`);
                  }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-12 border border-primary-line bg-primary py-2.5 text-[10.5px] font-bold text-ink"
                >
                  <Icon slot="action-add" size={13} color="#0D151A" />
                  أضف لليوم
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
