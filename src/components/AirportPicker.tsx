'use client';

import { useMemo, useState } from 'react';
import Flag from './Flag';
import { AIRPORTS, airportByIata, airportLabel, searchAirports, type Airport } from '@/lib/airports';
import { useStore } from '@/lib/store';

/**
 * منتقي مطار بالبحث.
 *
 * يخزّن رمز IATA (المصدر الوحيد للعلم) إضافة إلى نص العرض «لندن LHR».
 * ويبقى الكتابة الحرة ممكنة لمطار خارج القائمة، فلا تنكسر تذكرة لمطار
 * غير مشمول بالبيانات — يظهر حينها بلا علم بدل علم خاطئ.
 */
export default function AirportPicker({
  label,
  name,
  valueText,
  valueIata,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  valueText: string;
  valueIata?: string;
  onChange: (text: string, iata: string | undefined) => void;
  placeholder?: string;
}) {
  const missing = useStore((s) => s.ui.missing);
  const invalid = missing.includes(name);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = airportByIata(valueIata);
  const results = useMemo(() => (open ? searchAirports(query, 40) : []), [open, query]);

  function pick(a: Airport) {
    onChange(airportLabel(a), a.iata);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-medium" style={{ color: invalid ? '#DC2632' : '#868A8D' }}>
        {label}
        {invalid && ' · مطلوب'}
      </span>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-12 border bg-surface px-3 py-2.5 text-right ${invalid ? 'border-red' : 'border-line'}`}
      >
        {selected ? (
          <>
            <Flag iso={selected.country_iso2} label={selected.country_ar} size="sm" />
            <span className="min-w-0 truncate text-[12px] font-medium">{selected.city_ar}</span>
            <span className="num mr-auto flex-none text-[11px] font-bold text-muted-2">{selected.iata}</span>
          </>
        ) : valueText ? (
          <span className="min-w-0 truncate text-[12px] font-medium">{valueText}</span>
        ) : (
          <span className="text-[12px] font-light text-muted-4">{placeholder ?? 'اختر المطار'}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 animate-fade bg-[rgba(13,21,26,.45)]" />
          <div
            className="relative flex max-h-[76vh] w-full max-w-[430px] animate-sheetup flex-col rounded-t-24 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center pt-3">
              <div className="h-1 w-[42px] rounded-full bg-line" />
            </div>

            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <span className="text-[14px] font-bold">{label}</span>
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
                placeholder="ابحث بالمدينة أو الرمز أو الدولة…"
                className="w-full rounded-12 border border-line bg-surface px-3 py-2.5 text-[12px] font-medium placeholder:font-light placeholder:text-muted-4"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-7">
              {results.length === 0 ? (
                <div className="flex flex-col gap-2.5 py-6 text-center">
                  <span className="text-[11.5px] text-muted-2">لا يوجد مطار مطابق</span>
                  {query.trim() && (
                    <button
                      type="button"
                      onClick={() => { onChange(query.trim(), undefined); setOpen(false); setQuery(''); }}
                      className="mx-auto rounded-12 border border-primary-line bg-primary px-4 py-2.5 text-[11.5px] font-bold"
                    >
                      استخدم «{query.trim()}» كما هو
                    </button>
                  )}
                  <span className="text-[9.5px] font-light text-muted-3">
                    المطار خارج القائمة يُحفظ بلا علم — لأن العلم يُشتق من رمز المطار حصريًا.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col">
                  {results.map((a) => (
                    <button
                      key={a.iata}
                      type="button"
                      onClick={() => pick(a)}
                      className="flex items-center gap-2.5 border-b border-line-3 py-2.5 text-right last:border-0"
                    >
                      <Flag iso={a.country_iso2} label={a.country_ar} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[12.5px] font-bold">{a.city_ar}</span>
                        <span className="truncate text-[9.5px] font-light text-muted-3">
                          {a.airport_name_ar} · {a.country_ar}
                        </span>
                      </span>
                      <span className="num mr-auto flex-none text-[13px] font-bold text-muted-2">{a.iata}</span>
                    </button>
                  ))}
                  <span className="py-3 text-center text-[9.5px] font-light text-muted-3">
                    {results.length} من {AIRPORTS.length} مطارًا
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
