'use client';

import { useStore } from '@/lib/store';
import { Btn, Empty, Icon, SectionTitle } from '@/components/ui';
import { flagUrl, tint } from '@/lib/asset';
import { airlineOf } from '@/lib/constants';
import { fmtLong, fmtShort } from '@/lib/dates';
import { bookingText, nightKeys } from '@/lib/blocks';
import { copyText } from '@/lib/ai';
import type { Block, Trip } from '@/lib/types';

export default function TripScreen({ trip, blocks }: { trip: Trip; blocks: Block[] }) {
  const openSheet = useStore((s) => s.openSheet);
  const setTab = useStore((s) => s.setTab);
  const setDay = useStore((s) => s.setDay);
  const removeFlight = useStore((s) => s.removeFlight);
  const toast = useStore((s) => s.toast);

  const keys = nightKeys(trip.nights);
  const total = keys.length;
  const cityOf = (id: string) => trip.cities.find((c) => c.id === id);

  async function onCopy() {
    const text = bookingText(
      trip.title,
      blocks,
      (id) => {
        const c = cityOf(id);
        return c ? { name: c.name, hotel: c.hotel } : undefined;
      },
      trip.flights.map((f) => ({
        airline: f.airline || airlineOf(f.code)?.name || f.code,
        from: f.from,
        to: f.to,
        dateLabel: f.date ? fmtLong(f.date) : '—',
        dep: f.dep,
      })),
      total,
      fmtLong,
    );
    toast((await copyText(text)) ? 'نُسخ جدول الحجوزات' : 'تعذّر النسخ — انسخ يدويًا');
  }

  return (
    <div className="flex flex-col gap-3 px-5 pb-8 pt-1.5">

      {/* بطاقة الرحلة */}
      <div className="flex animate-rise flex-col gap-[11px] rounded-16 border border-cream-line bg-cream p-[15px_16px]">
        <div className="flex items-start gap-2.5">
          <div className="flex min-w-0 flex-col gap-[3px]">
            <span className="text-[17px] font-bold leading-tight">{trip.title}</span>
            <span className="text-[11.5px] text-muted">
              {total ? `${fmtLong(keys[0])} ← ${fmtLong(blocks[blocks.length - 1].checkout)}` : 'لم تُحدَّد ليالٍ بعد'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => openSheet('editTrip', { title: trip.title, start: trip.start, end: trip.end, id: trip.id })}
            className="mr-auto flex flex-none items-center gap-1 whitespace-nowrap rounded-8 border border-cream-line bg-white px-2 py-[5px] text-[10px] font-medium text-ink-2"
          >
            <Icon name="pencil" size={11} color="#3D4348" />
            تعديل
          </button>
        </div>
        <div className="h-px bg-cream-line" />
        <div className="flex gap-2">
          {[
            [String(total), 'ليلة'],
            [String(blocks.length), 'إقامة'],
            [String(trip.flights.length), 'تذكرة'],
            [String(trip.places.length), 'مكان'],
          ].map(([v, l]) => (
            <div key={l} className="flex flex-1 flex-col gap-0.5">
              <span className="num text-[15px] font-bold leading-none">{v}</span>
              <span className="text-[10px] text-muted-3">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* شريط الذكاء الاصطناعي */}
      <button
        type="button"
        onClick={() => openSheet('ai', { mode: 'day' })}
        className="flex animate-rise items-center gap-2.5 rounded-16 bg-ink p-[13px_15px] text-right"
      >
        <Icon name="sparkle-cyan" size={20} color="#00A8DA" />
        <div className="flex min-w-0 flex-col gap-px">
          <span className="text-[12.5px] font-bold text-white">خطّط رحلتي بالذكاء الاصطناعي</span>
          <span className="text-[10px] font-light text-muted-5">انسخ الطلب، الصقه في Claude، ثم الصق الناتج هنا</span>
        </div>
        <span className="mr-auto text-[13px] text-primary">←</span>
      </button>

      {/* التذاكر */}
      <SectionTitle
        title="تذاكر السفر"
        action={
          <button
            type="button"
            onClick={() => openSheet('flight', { code: 'SV', kind: 'ذهاب', cabin: 'اقتصادي' })}
            className="flex items-center gap-1 text-[10.5px] font-medium text-cyan-deep"
          >
            <Icon name="plus" size={11} color="#0084AF" />
            إضافة
          </button>
        }
      />

      {trip.flights.length === 0 ? (
        <Empty icon="plane" text="لا توجد تذاكر بعد" hint="أضف تذكرة الذهاب والعودة لتظهر في جدول النسخ" />
      ) : (
        trip.flights.map((f) => {
          const a = airlineOf(f.code);
          return (
            <div key={f.id} className="flex animate-rise flex-col gap-2.5 rounded-15 border border-line p-[13px_14px]">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-10"
                  style={{ background: a?.tint ?? '#F1F1F2' }}
                >
                  <span className="num text-[12px] font-bold" style={{ color: a?.color ?? '#3D4348' }}>
                    {f.code}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-px">
                  <span className="truncate text-[12.5px] font-medium">{f.airline || a?.name || f.code}</span>
                  <span className="text-[10px] text-muted-3">
                    {f.kind} · {f.cabin}
                    {f.ref ? ` · ${f.ref}` : ''}
                  </span>
                </div>
                <span className="mr-auto flex-none rounded-8 bg-cream px-2 py-1 text-[10px] text-ink-2">
                  {f.date ? fmtShort(f.date) : '—'}
                </span>
                <button type="button" onClick={() => removeFlight(f.id)} aria-label="حذف التذكرة">
                  <Icon name="dots" size={14} color="#9EA1A4" />
                </button>
              </div>

              <div className="flex items-center gap-3 rounded-12 bg-surface px-3 py-2.5">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="num text-[14px] font-bold leading-none">{f.dep}</span>
                  <span className="text-[9.5px] text-muted-3">{f.from}</span>
                </div>
                <div className="relative flex flex-1 flex-col items-center">
                  <span className="num mb-1 text-[9px] text-muted-3">{f.dur}</span>
                  <div className="h-px w-full bg-line-4" />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="num text-[14px] font-bold leading-none">{f.arr}</span>
                  <span className="text-[9.5px] text-muted-3">{f.to}</span>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* المدن والإقامة */}
      <SectionTitle
        title="المدن والإقامة"
        action={
          <button
            type="button"
            onClick={() => openSheet('newCity', { nights: 2 })}
            className="flex items-center gap-1 text-[10.5px] font-medium text-cyan-deep"
          >
            <Icon name="plus" size={11} color="#0084AF" />
            مدينة
          </button>
        }
      />

      {blocks.length === 0 ? (
        <Empty
          icon="target"
          text="لم تُلوَّن ليالٍ بعد"
          hint="افتح تبويب «الليالي» واختر مدينة ثم انقر أيام المبيت"
        />
      ) : (
        blocks.map((b, i) => {
          const c = cityOf(b.city);
          if (!c) return null;
          return (
            <div
              key={`${b.city}-${b.start}`}
              className="relative flex animate-rise flex-col gap-2.5 overflow-hidden rounded-15 border border-line p-[13px_14px]"
            >
              <span className="absolute inset-y-0 right-0 w-1" style={{ background: c.color }} />

              <div className="flex items-center gap-2.5 pr-1.5">
                {c.flag ? (
                  <span
                    className="h-[26px] w-[26px] flex-none rounded-7 bg-cover bg-center"
                    style={{ backgroundImage: `url(${flagUrl(c.flag)})` }}
                  />
                ) : (
                  <span
                    className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-7 text-[12px] font-bold text-white"
                    style={{ background: c.color }}
                  >
                    {c.name.slice(0, 1)}
                  </span>
                )}
                <div className="flex min-w-0 flex-col gap-px">
                  <span className="truncate text-[13.5px] font-bold">{c.name}</span>
                  <span className="text-[10px] text-muted-3">{c.country}</span>
                </div>
                <span
                  className="mr-auto flex-none rounded-8 px-2 py-1 text-[10px] font-medium"
                  style={{ background: tint(c.color, 0.12), color: c.color }}
                >
                  {b.count} ليلة
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-12 border border-cream-line bg-cream px-2.5 py-2">
                <Icon name="pin-orange" size={15} color="#DE8000" />
                <div className="flex min-w-0 flex-col gap-px">
                  <span className="truncate text-[11.5px] font-medium">{c.hotel}</span>
                  <span className="text-[9.5px] font-light text-muted">
                    دخول {fmtShort(b.start)} · خروج {fmtShort(b.checkout)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openSheet('city', {
                      id: c.id, name: c.name, country: c.country, hotel: c.hotel,
                      hotelMap: c.hotelMap, map: c.map, nights: b.count,
                    })
                  }
                  className="mr-auto flex-none text-[10.5px] font-medium text-cyan-deep"
                >
                  تعديل
                </button>
              </div>

              <div className="flex gap-2">
                <a
                  href={c.hotelMap || c.map}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-12 border border-line bg-white py-2.5 text-[11.5px] font-medium text-ink-2"
                >
                  <Icon name="map-muted" size={14} color="#6E7276" />
                  خريطة جوجل
                </a>
                <button
                  type="button"
                  onClick={() => { setDay(b.start); setTab('day'); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-12 border border-primary-line bg-primary py-2.5 text-[11.5px] font-bold text-ink"
                >
                  <Icon name="activity" size={14} color="#0D151A" />
                  مخطط الأيام
                </button>
              </div>
            </div>
          );
        })
      )}

      {blocks.length > 0 && (
        <Btn variant="dark" icon="share" onClick={onCopy} full className="mt-1 py-3">
          نسخ جدول الحجوزات
        </Btn>
      )}
    </div>
  );
}
