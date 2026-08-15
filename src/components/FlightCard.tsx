'use client';

import { Icon } from './ui';
import Flag from './Flag';
import { airportByIata, extractIata } from '@/lib/airports';
import { airlineOf } from '@/lib/airlines';
import { fmtShort } from '@/lib/dates';
import type { Flight } from '@/lib/types';

/**
 * بطاقة تذكرة الطيران.
 *
 * التخطيط مستوحى من بطاقة «Your Flight»: رمزا المطارين كبيران على الطرفين،
 * وبينهما قوس متقطع تتوسّطه طائرة، ثم شريط تفاصيل أسفل.
 * وبما أن الواجهة عربية RTL فالمغادرة على اليمين والوصول على اليسار،
 * والطائرة تتجه يسارًا — أي مع اتجاه القراءة لا ضدّه.
 *
 * الألوان من توكنات Tourly الحالية بلا تغيير.
 */

const KIND_STYLE: Record<string, { dot: string; fg: string }> = {
  'ذهاب': { dot: '#00A8DA', fg: '#0084AF' },
  'عودة': { dot: '#00BD74', fg: '#00A063' },
  'داخلي': { dot: '#DE8000', fg: '#DE8000' },
};

export default function FlightCard({
  flight,
  onRemove,
  onEdit,
}: {
  flight: Flight;
  onRemove: () => void;
  onEdit?: () => void;
}) {
  const airline = airlineOf(flight.code);
  const kind = KIND_STYLE[flight.kind] ?? KIND_STYLE['ذهاب'];

  // المطار يُستنتج من رمز IATA المخزَّن، وإلا استُخرج من النص الحر
  // (يحفظ توافق التذاكر المضافة قبل ربط قاعدة المطارات).
  const fromA = airportByIata(flight.fromIata ?? extractIata(flight.from));
  const toA = airportByIata(flight.toIata ?? extractIata(flight.to));

  const fromCode = fromA?.iata ?? extractIata(flight.from) ?? shortLabel(flight.from);
  const toCode = toA?.iata ?? extractIata(flight.to) ?? shortLabel(flight.to);
  const fromCity = fromA?.city_ar ?? stripCode(flight.from);
  const toCity = toA?.city_ar ?? stripCode(flight.to);

  const details: { label: string; value: string }[] = [];
  if (flight.date) details.push({ label: 'التاريخ', value: fmtShort(flight.date) });
  if (flight.dep && flight.dep !== '00:00') details.push({ label: 'الإقلاع', value: flight.dep });
  if (flight.arr && flight.arr !== '00:00') details.push({ label: 'الوصول', value: flight.arr });
  if (flight.dur && flight.dur !== '—') details.push({ label: 'المدة', value: flight.dur });
  if (flight.ref) details.push({ label: 'الحجز', value: flight.ref });

  return (
    <div className="flex animate-rise flex-col gap-3 rounded-15 border border-line bg-white p-[13px_14px] shadow-card">

      {/* الناقل والحالة */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-10"
          style={{ background: airline?.tint ?? '#F1F1F2' }}
        >
          <span className="num text-[12px] font-bold" style={{ color: airline?.color ?? '#3D4348' }}>
            {flight.code}
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-px">
          <span className="truncate text-[12.5px] font-bold" dir="ltr">{flight.airline || airline?.name || flight.code}</span>
          <span className="truncate text-[10px] text-muted-3">
            {flight.cabin}
            {flight.ref ? ` · ${flight.ref}` : ''}
          </span>
        </div>

        <span className="mr-auto flex flex-none items-center gap-1.5">
          <span className="h-[7px] w-[7px] rounded-full" style={{ background: kind.dot }} />
          <span className="text-[11px] font-bold" style={{ color: kind.fg }}>{flight.kind}</span>
        </span>
      </div>

      {/* المسار */}
      <div className="flex items-start gap-2">
        <Endpoint code={fromCode} city={fromCity} iso={fromA?.country_iso2} country={fromA?.country_ar} align="start" />

        <div className="flex min-w-0 flex-1 flex-col items-center pt-1.5">
          <svg viewBox="0 0 120 34" className="w-full" style={{ height: 34 }} aria-hidden>
            {/* القوس يبدأ من اليمين (المغادرة) وينتهي يسارًا (الوصول) */}
            <path
              d="M114 28 Q 60 -2 6 22"
              fill="none"
              stroke="#CFD0D1"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="4 5"
            />
          </svg>
          <div className="-mt-[26px] flex h-6 w-6 items-center justify-center rounded-full bg-white">
            <Icon slot="type-plane" size={15} color="#0D151A" className="-scale-x-100" />
          </div>
        </div>

        <Endpoint code={toCode} city={toCity} iso={toA?.country_iso2} country={toA?.country_ar} align="end" />
      </div>

      {/* التفاصيل */}
      {details.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {details.map((d) => (
            <span
              key={d.label}
              className="flex items-center gap-1.5 rounded-10 border border-line bg-surface px-2.5 py-1.5"
            >
              <span className="text-[9.5px] font-light text-muted-3">{d.label}</span>
              <span className="num text-[11px] font-bold text-ink">{d.value}</span>
            </span>
          ))}

          <span className="mr-auto flex items-center gap-1">
            {onEdit && (
              <button type="button" onClick={onEdit} aria-label="تعديل التذكرة" className="p-1.5">
                <Icon slot="action-edit" size={13} color="#9EA1A4" />
              </button>
            )}
            <button type="button" onClick={onRemove} aria-label="حذف التذكرة" className="p-1.5">
              <Icon slot="action-delete" size={14} color="#9EA1A4" />
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

function Endpoint({
  code, city, iso, country, align,
}: {
  code: string; city: string; iso?: string; country?: string; align: 'start' | 'end';
}) {
  return (
    <div className={`flex min-w-[86px] flex-col gap-1 ${align === 'end' ? 'items-end text-left' : 'items-start text-right'}`}>
      <span className="num text-[26px] font-bold leading-none tracking-tight text-ink">{code}</span>
      <span className={`flex items-center gap-1.5 ${align === 'end' ? 'flex-row-reverse' : ''}`}>
        <Flag iso={iso} label={country} size="sm" />
        <span className="truncate text-[10.5px] text-muted-3">{city}</span>
      </span>
    </div>
  );
}

/** يزيل رمز IATA من نص حر: «لندن LHR» → «لندن» */
function stripCode(text: string): string {
  return text.replace(/\b[A-Z]{3}\b/g, '').trim() || text;
}

/** بديل حين لا نعرف المطار: أول 3 أحرف لاتينية أو أول كلمة. */
function shortLabel(text: string): string {
  const m = text.toUpperCase().match(/[A-Z]{2,3}/);
  return m ? m[0] : text.split(/\s+/)[0].slice(0, 3);
}
