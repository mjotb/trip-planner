'use client';

import { useMemo, useState } from 'react';
import Flag from './Flag';
import { AIRLINES, FEATURED_AIRLINES, airlineOf, searchAirlines, type Airline } from '@/lib/airlines';

/**
 * منتقي شركة الطيران.
 *
 * ٩٦ ناقلًا أكثر من أن تُعرض شبكةَ شرائح، فتظهر ناقلاتك المعتادة أولًا
 * ووراءها بحث بالاسم أو رمز IATA أو ICAO. والكتابة الحرة تبقى ممكنة
 * لناقل خارج القائمة.
 */
export default function AirlinePicker({
  code,
  customName,
  onChange,
}: {
  code: string;
  customName?: string;
  onChange: (code: string, customName?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [manual, setManual] = useState('');

  const selected = airlineOf(code);
  const results = useMemo(() => (open ? searchAirlines(query) : []), [open, query]);
  const isCustom = !selected && !!code;

  function pick(a: Airline) {
    onChange(a.code);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10.5px] font-medium text-muted-3">الناقل</span>

      {/* الناقلات المعتادة */}
      <div className="grid grid-cols-4 gap-1.5">
        {FEATURED_AIRLINES.map((a) => {
          const on = code === a.code;
          return (
            <button
              key={a.code}
              type="button"
              onClick={() => onChange(a.code)}
              className="flex flex-col items-center gap-1 rounded-10 border px-1 py-2 transition active:scale-[.97]"
              style={{ background: on ? a.tint : '#fff', borderColor: on ? a.color : '#E7E8E8' }}
            >
              <span className="num text-[11px] font-bold" style={{ color: a.color }}>{a.code}</span>
              <span className="w-full truncate px-0.5 text-center text-[8.5px] text-muted-3">{a.name}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center justify-center gap-1 rounded-10 border border-dashed border-line px-1 py-2"
        >
          <span className="text-[12px] leading-none text-muted-3">⌕</span>
          <span className="text-[8.5px] text-muted-3">ناقل آخر</span>
        </button>
      </div>

      {/* المختار حين يكون خارج المعتادة */}
      {((selected && !selected.featured) || isCustom) && (
        <div
          className="flex items-center gap-2 rounded-12 border px-3 py-2"
          style={{ background: selected?.tint ?? '#FBFBFC', borderColor: selected?.color ?? '#E7E8E8' }}
        >
          <span className="num text-[12px] font-bold" style={{ color: selected?.color ?? '#3D4348' }}>
            {code}
          </span>
          <span className="min-w-0 truncate text-[11.5px] font-medium">
            {selected?.name ?? customName ?? 'ناقل آخر'}
          </span>
          {selected && <Flag iso={selected.countryIso} size="sm" className="mr-auto" />}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 animate-fade bg-[rgba(13,21,26,.45)]" />
          <div
            className="relative flex max-h-[78vh] w-full max-w-[430px] animate-sheetup flex-col rounded-t-24 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center pt-3">
              <div className="h-1 w-[42px] rounded-full bg-line" />
            </div>

            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <span className="text-[14px] font-bold">اختر الناقل</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-8 border border-line text-[13px] leading-none text-muted-3"
              >
                ✕
              </button>
            </div>

            <div className="px-5 pb-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Saudia · SV · SVA · Star Alliance"
                dir="ltr"
                className="w-full rounded-12 border border-line bg-surface px-3 py-2.5 text-left text-[12px] font-medium placeholder:font-light placeholder:text-muted-4"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-7">
              {results.length === 0 ? (
                <div className="flex flex-col gap-2.5 py-5">
                  <span className="text-center text-[11.5px] text-muted-2">لا يوجد ناقل مطابق</span>
                  <input
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                    placeholder="اكتب اسم الناقل"
                    className="rounded-12 border border-line bg-surface px-3 py-2.5 text-[12px] font-medium"
                  />
                  <button
                    type="button"
                    disabled={!manual.trim() && !query.trim()}
                    onClick={() => {
                      const name = manual.trim() || query.trim();
                      onChange(query.trim().toUpperCase().slice(0, 3) || 'XX', name);
                      setOpen(false);
                      setQuery('');
                      setManual('');
                    }}
                    className="rounded-12 border border-primary-line bg-primary py-2.5 text-[11.5px] font-bold disabled:opacity-40"
                  >
                    أضفه كناقل خارج القائمة
                  </button>
                </div>
              ) : (
                <div className="flex flex-col">
                  {results.map((a) => (
                    <button
                      key={a.code}
                      type="button"
                      onClick={() => pick(a)}
                      className="flex items-center gap-2.5 border-b border-line-3 py-2.5 text-right last:border-0"
                    >
                      <span
                        className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-8"
                        style={{ background: a.tint }}
                      >
                        <span className="num text-[11px] font-bold" style={{ color: a.color }}>{a.code}</span>
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[12.5px] font-bold" dir="ltr">{a.name}</span>
                        {a.alliance && (
                          <span className="truncate text-[9.5px] font-light text-muted-3">{a.alliance}</span>
                        )}
                      </span>
                      <Flag iso={a.countryIso} size="sm" className="mr-auto" />
                    </button>
                  ))}
                  <span className="py-3 text-center text-[9.5px] font-light text-muted-3">
                    {results.length} من {AIRLINES.length} ناقلًا
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
