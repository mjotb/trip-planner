'use client';

import { useStore } from '@/lib/store';
import { Btn, Chip, Field, Sheet, Stepper } from '@/components/ui';
import { mapsLink } from '@/lib/constants';
import { fmtShort } from '@/lib/dates';
import Flag from '@/components/Flag';
import { COUNTRIES, countryByIso } from '@/lib/airports';
import type { Trip } from '@/lib/types';

export default function CitySheet({ open, isNew, trip }: { open: boolean; isNew: boolean; trip: Trip }) {
  const form = useStore((s) => s.ui.form);
  const setField = useStore((s) => s.setField);
  const close = useStore((s) => s.closeSheet);
  const addCity = useStore((s) => s.addCity);
  const editCity = useStore((s) => s.editCity);
  const removeCity = useStore((s) => s.removeCity);
  const toast = useStore((s) => s.toast);
  const fail = useStore((s) => s.fail);

  const nights = form.nights ?? 2;

  function save() {
    if (!form.name) return fail('اكتب اسم المدينة', ['name']);
    const payload = {
      name: form.name,
      country: form.country ?? '—',
      flag: form.flag ?? '',
      countryIso: form.countryIso,
      hotel: form.hotel ?? '',
      hotelMap: form.hotelMap || (form.hotel ? mapsLink(`${form.hotel} ${form.name}`) : ''),
      map: form.map || mapsLink(form.name),
      notes: form.notes,
    };
    if (isNew) {
      addCity({ ...payload, nights });
      toast('أُضيفت المدينة — لوّن لياليها في التقويم');
    } else {
      editCity(form.id, payload, nights);
      toast('حُدّثت المدينة والإقامة');
    }
    close();
  }

  return (
    <Sheet
      open={open}
      title={isNew ? 'إضافة مدينة جديدة' : 'تعديل المدينة والإقامة'}
      onClose={close}
      footer={
        <div className="flex gap-2">
          {!isNew && (
            <Btn
              variant="secondary"
              onClick={() => { removeCity(form.id); close(); toast('حُذفت المدينة ولياليها'); }}
              className="!border-red !text-red"
            >
              حذف
            </Btn>
          )}
          <Btn variant="primary" onClick={save} className="flex-1 py-3">حفظ</Btn>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <Field name="name" label="المدينة" value={form.name ?? ''} onChange={(v) => setField('name', v)} placeholder="لندن" />
        <Field label="الدولة" value={form.country ?? ''} onChange={(v) => setField('country', v)} placeholder="المملكة المتحدة" />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10.5px] font-medium text-muted-3">الدولة والعلم</span>
        <div className="flex items-center gap-2 rounded-12 border border-line bg-surface px-3 py-2">
          <Flag iso={form.countryIso} label={form.country} />
          <select
            value={form.countryIso ?? ''}
            onChange={(e) => {
              const iso = e.target.value;
              setField('countryIso', iso || undefined);
              const c = countryByIso(iso);
              if (c && !form.country) setField('country', c.ar);
            }}
            className="flex-1 bg-transparent text-[12px] font-medium outline-none"
          >
            <option value="">— بلا علم —</option>
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>{c.ar} ({c.iso})</option>
            ))}
          </select>
        </div>
        <span className="text-[9.5px] font-light text-muted-3">
          العلم يُختار برمز الدولة حصريًا، لا باسم المدينة.
        </span>
      </div>

      <Field label="فندق الإقامة" value={form.hotel ?? ''} onChange={(v) => setField('hotel', v)} placeholder="اسم الفندق" />
      <Field label="رابط الفندق في جوجل ماب" value={form.hotelMap ?? ''} onChange={(v) => setField('hotelMap', v)} placeholder="https://maps.google.com/…" dir="ltr" align="left" />
      <Field label="رابط المدينة في جوجل ماب" value={form.map ?? ''} onChange={(v) => setField('map', v)} placeholder="يُبنى تلقائيًا من اسم المدينة" dir="ltr" align="left" />

      <Stepper label="عدد الليالي" value={nights} onChange={(v) => setField('nights', v)} />

      <span className="text-[9.5px] font-light leading-relaxed text-muted-3">
        تقليل العدد يحذف الليالي الأخيرة، وزيادته تضيف أيامًا متتالية بعد آخر ليلة
        {isNew ? ' ابتداءً من اليوم التالي لآخر ليلة في الرحلة' : ''} — ضمن مدى الرحلة
        ({fmtShort(trip.start)} ← {fmtShort(trip.end)}). يمكنك دائمًا التعديل يدويًا في التقويم.
      </span>
    </Sheet>
  );
}
