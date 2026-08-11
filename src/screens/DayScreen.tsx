'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Empty, Icon } from '@/components/ui';
import { tint } from '@/lib/asset';
import { ITEM_TYPES } from '@/lib/constants';
import { DOW_SHORT, dow, fmtHijri, fmtLong, DOW_LONG } from '@/lib/dates';
import { nightKeys } from '@/lib/blocks';
import type { Trip } from '@/lib/types';

export default function DayScreen({ trip }: { trip: Trip }) {
  const day = useStore((s) => s.ui.day);
  const setDay = useStore((s) => s.setDay);
  const openSheet = useStore((s) => s.openSheet);
  const removeItem = useStore((s) => s.removeItem);

  const keys = useMemo(() => nightKeys(trip.nights), [trip.nights]);
  const cityOf = (id: string) => trip.cities.find((c) => c.id === id);
  const cityId = trip.nights[day];
  const city = cityId ? cityOf(cityId) : null;
  const items = trip.plans[day] ?? [];

  const stripRef = useRef<HTMLDivElement>(null);

  // إن كان اليوم المختار خارج الليالي، انتقل لأول ليلة
  useEffect(() => {
    if (keys.length && !keys.includes(day)) setDay(keys[0]);
  }, [keys, day, setDay]);

  // تمرير شريط الأيام إلى اليوم النشط
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [day]);

  if (!keys.length) {
    return (
      <div className="px-5 pt-4">
        <Empty icon="empty-day" lottie="car" text="لا توجد أيام بعد" hint="لوّن ليالي المبيت في تبويب «الليالي» أولًا" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-8 pt-1.5">

      {/* شريط الأيام */}
      <div ref={stripRef} className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
        {keys.map((k) => {
          const on = k === day;
          const c = cityOf(trip.nights[k]);
          return (
            <button
              key={k}
              type="button"
              data-active={on}
              onClick={() => setDay(k)}
              className="flex w-[58px] flex-none flex-col items-center gap-0.5 rounded-12 border py-2 transition active:scale-[.97]"
              style={{
                background: on ? '#0D151A' : '#fff',
                borderColor: on ? '#0D151A' : '#E7E8E8',
              }}
            >
              <span className="text-[9.5px]" style={{ color: on ? '#B6B9BA' : '#868A8D' }}>
                {DOW_SHORT[dow(k)]}
              </span>
              <span className="num text-[15px] font-bold leading-none" style={{ color: on ? '#fff' : '#0D151A' }}>
                {Number(k.slice(8, 10))}
              </span>
              <span
                className="max-w-full truncate px-1 text-[8.5px] leading-none"
                style={{ color: on ? '#B6B9BA' : c?.color ?? '#868A8D' }}
              >
                {c?.name ?? '—'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 px-5">

        {/* عنوان اليوم */}
        <div className="flex animate-rise items-center gap-2.5 rounded-16 border border-cream-line bg-cream p-[13px_14px]">
          <div className="flex min-w-0 flex-col gap-px">
            <span className="text-[13.5px] font-bold">
              {fmtLong(day)} · {city?.name ?? 'بلا مبيت'}
            </span>
            <span className="text-[10px] font-light text-muted">
              {fmtHijri(day)} · {DOW_LONG[dow(day)]}
            </span>
          </div>
          <button
            type="button"
            onClick={() => openSheet('ai', { mode: 'day' })}
            className="mr-auto flex flex-none items-center gap-1.5 rounded-12 bg-ink px-3 py-2.5 text-[10.5px] font-bold text-white"
          >
            <Icon slot="ai-sparkle" size={14} color="#00A8DA" />
            تحسين المسار
          </button>
        </div>

        {/* المخطط الزمني */}
        {items.length === 0 ? (
          <Empty icon="empty-day" text="لا يوجد نشاط لهذا اليوم" hint="أضف نشاطًا أو اطلب اقتراحًا بالذكاء الاصطناعي" />
        ) : (
          <div className="flex flex-col">
            {items.map((it, idx) => {
              const t = ITEM_TYPES[it.type] ?? ITEM_TYPES.place;
              const last = idx === items.length - 1;
              return (
                <div key={it.id} className="flex animate-rise gap-2.5">
                  {/* عمود الأيقونة والخط */}
                  <div className="flex w-[30px] flex-none flex-col items-center">
                    <div
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-10"
                      style={{ background: t.tint }}
                    >
                      <Icon slot={t.icon} size={15} color="#3D4348" />
                    </div>
                    {!last && <div className="dash-line w-px flex-1" />}
                  </div>

                  {/* البطاقة */}
                  <div className={`mb-2.5 flex flex-1 flex-col gap-1.5 ${last ? 'mb-0' : ''}`}>
                    <div
                      className="flex flex-col gap-1.5 rounded-14 border border-line p-[11px_12px]"
                      style={{ background: it.type === 'food' ? '#FFFCE5' : '#fff' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="num text-[10.5px] font-medium text-cyan-deep">{it.time}</span>
                        <span className="text-[9.5px] font-light text-muted-3">{it.dur}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(day, it.id)}
                          aria-label="حذف النشاط"
                          className="mr-auto"
                        >
                          <Icon slot="action-delete" size={14} color="#9EA1A4" />
                        </button>
                      </div>

                      <span className="text-[13px] font-bold leading-snug">{it.title}</span>
                      {it.note && (
                        <span className="text-[10.5px] font-light leading-relaxed text-muted">{it.note}</span>
                      )}

                      <div className="flex gap-1.5 pt-0.5">
                        {it.map && (
                          <a
                            href={it.map}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded-8 border border-line bg-white px-2 py-1.5 text-[9.5px] font-medium text-ink-2"
                          >
                            <Icon slot="action-location" size={11} color="#6E7276" />
                            الموقع
                          </a>
                        )}
                        {it.menu && (
                          <button
                            type="button"
                            onClick={() => openSheet('menu', { name: it.title })}
                            className="flex items-center gap-1 rounded-8 border border-line bg-white px-2 py-1.5 text-[9.5px] font-medium text-cyan-deep"
                          >
                            <Icon slot="ai-sparkle" size={11} color="#00A8DA" />
                            المنيو · ترجمة
                          </button>
                        )}
                      </div>
                    </div>

                    {it.transfer && (
                      <span className="px-1 text-[9.5px] font-light text-muted-3">↳ {it.transfer}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => openSheet('activity', { type: 'place', time: '10:00', dur: 'ساعة' })}
          className="flex items-center justify-center gap-1.5 rounded-14 border border-dashed border-line py-3 text-[11.5px] font-medium text-muted-2"
        >
          <Icon slot="action-add" size={13} color="#868A8D" />
          إضافة نشاط لهذا اليوم
        </button>

        {city && (
          <a
            href={city.map}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-14 border border-line bg-surface py-3 text-[11.5px] font-medium text-ink-2"
          >
            <Icon slot="action-map" size={14} color="#6E7276" />
            فتح {city.name} في خرائط جوجل
          </a>
        )}
      </div>
    </div>
  );
}
