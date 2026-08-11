'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Btn, Chip, Empty, Icon } from '@/components/ui';
import { flagUrl, tint } from '@/lib/asset';
import { MOVES } from '@/lib/constants';
import {
  DOW_SHORT, fmtLong, hijriDay, isWeekend, monthsCovering, prevKey, type DayKey,
} from '@/lib/dates';
import { bookingText, cellState, findGaps, nightCounts, nightKeys } from '@/lib/blocks';
import { copyText } from '@/lib/ai';
import type { Block, Trip } from '@/lib/types';

export default function NightsScreen({ trip, blocks }: { trip: Trip; blocks: Block[] }) {
  const ui = useStore((s) => s.ui);
  const setTool = useStore((s) => s.setTool);
  const paint = useStore((s) => s.paint);
  const clearNights = useStore((s) => s.clearNights);
  const openSheet = useStore((s) => s.openSheet);
  const toast = useStore((s) => s.toast);

  const months = useMemo(() => monthsCovering(trip.start, trip.end), [trip.start, trip.end]);
  const counts = useMemo(() => nightCounts(trip.nights), [trip.nights]);
  const gaps = useMemo(() => findGaps(trip.nights), [trip.nights]);
  const total = nightKeys(trip.nights).length;
  const cityOf = (id: string) => trip.cities.find((c) => c.id === id);

  const inRange = (k: DayKey) => k >= trip.start && k <= trip.end;

  async function onCopy() {
    const text = bookingText(
      trip.title, blocks,
      (id) => { const c = cityOf(id); return c ? { name: c.name, hotel: c.hotel } : undefined; },
      [], total, fmtLong,
    );
    toast((await copyText(text)) ? 'نُسخ جدول الحجوزات' : 'تعذّر النسخ');
  }

  return (
    <div className="flex flex-col gap-3 px-5 pb-8 pt-1.5">

      {/* لوحة الأدوات */}
      <div className="flex flex-col gap-2.5 rounded-16 border border-line p-3">
        <span className="text-[10.5px] font-medium text-muted-3">
          اختر أداة ثم انقر الأيام — النقر مجددًا بنفس الأداة يلغي
        </span>

        {trip.cities.length === 0 ? (
          <button
            type="button"
            onClick={() => openSheet('newCity', { nights: 2 })}
            className="flex items-center justify-center gap-1.5 rounded-12 border border-dashed border-line py-3 text-[11.5px] font-medium text-muted-2"
          >
            <Icon name="plus" size={13} color="#868A8D" />
            أضف أول مدينة لتبدأ التلوين
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-[7px]">
            {trip.cities.map((c) => {
              const on = ui.tool.type === 'city' && ui.tool.id === c.id;
              return (
                <Chip
                  key={c.id}
                  active={on}
                  onClick={() => setTool({ type: 'city', id: c.id })}
                  activeBg={tint(c.color, 0.16)}
                  activeBorder={c.color}
                  className="!flex-col !items-start !gap-1 !px-2 !py-2"
                >
                  <span className="flex w-full items-center gap-1.5">
                    {c.flag ? (
                      <span
                        className="h-[14px] w-[14px] flex-none rounded-[4px] bg-cover bg-center"
                        style={{ backgroundImage: `url(${flagUrl(c.flag)})` }}
                      />
                    ) : (
                      <span className="h-[10px] w-[10px] flex-none rounded-full" style={{ background: c.color }} />
                    )}
                    <span className="truncate text-[10.5px] font-bold">{c.name}</span>
                  </span>
                  <span className="num text-[9px] font-light text-muted-3">{counts[c.id] || 0} ليلة</span>
                </Chip>
              );
            })}
            <Chip
              active={false}
              onClick={() => openSheet('newCity', { nights: 2 })}
              className="!border-dashed !py-2"
            >
              <Icon name="plus" size={12} color="#868A8D" />
              <span className="text-[10px] text-muted-3">مدينة</span>
            </Chip>
          </div>
        )}

        <div className="h-px bg-line-3" />

        <div className="flex flex-wrap gap-[7px]">
          {MOVES.map((m) => {
            const on = ui.tool.type === 'move' && ui.tool.id === m.id;
            return (
              <Chip key={m.id} active={on} onClick={() => setTool({ type: 'move', id: m.id })} activeBg="#FFF7BA">
                <span className="h-[10px] w-[10px] rounded-full" style={{ background: m.dot }} />
                {m.name}
              </Chip>
            );
          })}
          <Chip
            active={ui.tool.type === 'erase'}
            onClick={() => setTool({ type: 'erase', id: null })}
            activeBg="#0D151A"
            activeBorder="#0D151A"
            className={ui.tool.type === 'erase' ? '!text-white' : ''}
          >
            <Icon name="pencil" size={12} color={ui.tool.type === 'erase' ? '#fff' : '#868A8D'} />
            ممحاة
          </Chip>
        </div>
      </div>

      {gaps.length > 0 && (
        <div className="flex items-start gap-2 rounded-12 border border-cream-line bg-cream px-3 py-2.5">
          <Icon name="target" size={14} color="#DE8000" />
          <span className="text-[10.5px] leading-relaxed text-ink-2">
            فجوة في الليالي: {gaps.length} يوم داخل الرحلة بلا مدينة. تأكد أن هذا مقصود.
          </span>
        </div>
      )}

      {/* أسماء الأيام */}
      <div className="grid grid-cols-7 gap-1.5 pt-1">
        {DOW_SHORT.map((l, i) => (
          <span
            key={l}
            className="text-center text-[9.5px] font-medium"
            style={{ color: i === 5 || i === 6 ? '#DE8000' : '#868A8D' }}
          >
            {l}
          </span>
        ))}
      </div>

      {/* الأشهر */}
      {months.map((m) => (
        <div key={m.key} className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-[12.5px] font-bold">{m.title}</span>
            <span className="text-[9.5px] font-light text-muted-3">{m.hijriTitle}</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: m.lead }).map((_, i) => (
              <div key={`lead${i}`} className="h-[56px]" />
            ))}

            {m.days.map((k) => {
              const active = inRange(k);
              const { state, city, prevCity } = cellState(trip.nights, k, prevKey(k));
              const c = city ? cityOf(city) : null;
              const pc = prevCity ? cityOf(prevCity) : null;
              const move = trip.moves[k] ? MOVES.find((x) => x.id === trip.moves[k]) : null;
              const split = state === 'transition' && c && pc;
              const isCheckout = state === 'checkout';

              return (
                <button
                  key={k}
                  type="button"
                  disabled={!active}
                  onClick={() => paint(k)}
                  className="relative flex h-[56px] flex-col items-center justify-center overflow-hidden rounded-11 transition active:scale-[.96] disabled:opacity-35"
                  style={{
                    background: split ? 'transparent' : c ? tint(c.color, 0.13) : '#FBFBFC',
                    border: isCheckout
                      ? '1px dashed #868A8D'
                      : c
                        ? `1px solid ${tint(c.color, 0.45)}`
                        : '1px solid #F1F1F2',
                  }}
                >
                  {split && (
                    <>
                      <span className="absolute inset-x-0 top-0 h-1/2" style={{ background: tint(pc!.color, 0.16) }} />
                      <span className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: tint(c!.color, 0.22) }} />
                      <span className="absolute inset-x-0 top-1/2 h-px bg-[rgba(13,21,26,.18)]" />
                    </>
                  )}

                  {move && (
                    <span
                      className="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full"
                      style={{ background: move.dot }}
                    />
                  )}

                  <span
                    className="num relative z-10 text-[15px] font-bold leading-none"
                    style={{ color: isWeekend(k) && !c ? '#DE8000' : '#0D151A' }}
                  >
                    {Number(k.slice(8, 10))}
                  </span>
                  <span className="num relative z-10 text-[8px] font-light leading-none text-muted-3">
                    {hijriDay(k)}
                  </span>
                  <span
                    className="relative z-10 mt-0.5 max-w-full truncate px-1 text-[7.5px] font-medium leading-none"
                    style={{ color: c ? '#3D4348' : isCheckout ? '#868A8D' : 'transparent' }}
                  >
                    {c ? c.name : isCheckout ? 'خروج' : '·'}
                  </span>

                  {c && (
                    <span
                      className="absolute inset-x-0 bottom-0 z-10 h-[3px]"
                      style={{ background: c.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* المفتاح */}
      <div className="flex flex-col gap-1.5 rounded-12 bg-surface px-3 py-2.5">
        <span className="text-[10px] font-medium text-ink-2">المفتاح</span>
        <span className="text-[9.5px] font-light leading-relaxed text-muted">
          خلية بلون واحد = مبيت كامل · خلية بنصفين = يوم انتقال (ليلة واحدة للمدينة الجديدة) ·
          إطار متقطع = خروج نهائي بلا مبيت · نقطة أعلى اليمين = وسيلة تنقل.
        </span>
      </div>

      {/* الإجراءات */}
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={clearNights} className="flex-1 py-3">مسح الكل</Btn>
        <Btn variant="primary" icon="share" onClick={onCopy} className="flex-1 py-3">نسخ جدول الحجوزات</Btn>
      </div>

      {/* كتل الحجز */}
      {blocks.length === 0 ? (
        <Empty icon="target" text="لا توجد كتل حجز بعد" hint="لوّن أيام المبيت أعلاه" />
      ) : (
        <div className="flex flex-col gap-2">
          {blocks.map((b) => {
            const c = cityOf(b.city);
            if (!c) return null;
            return (
              <div key={`${b.city}-${b.start}`} className="flex items-center gap-2.5 rounded-12 border border-line px-3 py-2.5">
                <span className="h-[34px] w-1 flex-none rounded-full" style={{ background: c.color }} />
                <div className="flex min-w-0 flex-col gap-px">
                  <span className="text-[12px] font-bold">{c.name}</span>
                  <span className="text-[9.5px] font-light text-muted">
                    دخول {fmtLong(b.start)} · خروج {fmtLong(b.checkout)}
                  </span>
                </div>
                <span
                  className="mr-auto flex-none rounded-8 px-2 py-1 text-[10px] font-medium"
                  style={{ background: tint(c.color, 0.12), color: c.color }}
                >
                  {b.count} ليلة
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
