'use client';

import { useStore } from '@/lib/store';
import { Btn, Chip, Field, Sheet, Stepper } from '@/components/ui';
import { FLAGS, mapsLink } from '@/lib/constants';
import { flagUrl } from '@/lib/asset';
import type { Trip } from '@/lib/types';

export default function CitySheet({ open, isNew, trip }: { open: boolean; isNew: boolean; trip: Trip }) {
  const form = useStore((s) => s.ui.form);
  const setField = useStore((s) => s.setField);
  const close = useStore((s) => s.closeSheet);
  const addCity = useStore((s) => s.addCity);
  const editCity = useStore((s) => s.editCity);
  const removeCity = useStore((s) => s.removeCity);
  const toast = useStore((s) => s.toast);

  const nights = form.nights ?? 2;

  function save() {
    if (!form.name) return toast('اكتب اسم المدينة');
    const payload = {
      name: form.name,
      country: form.country ?? '—',
      flag: form.flag ?? '',
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
        <Field label="المدينة" value={form.name ?? ''} onChange={(v) => setField('name', v)} placeholder="لندن" />
        <Field label="الدولة" value={form.country ?? ''} onChange={(v) => setField('country', v)} placeholder="المملكة المتحدة" />
      </div>

      <span className="text-[10.5px] font-medium text-muted-3">العلم (اختياري)</span>
      <div className="flex gap-1.5">
        {Object.entries(FLAGS).map(([k, file]) => (
          <Chip key={k} active={form.flag === file} onClick={() => setField('flag', form.flag === file ? '' : file)}>
            <span
              className="h-[14px] w-[14px] rounded-[4px] bg-cover bg-center"
              style={{ backgroundImage: `url(${flagUrl(file)})` }}
            />
          </Chip>
        ))}
        <Chip active={!form.flag} onClick={() => setField('flag', '')} className="flex-1">
          بلا علم
        </Chip>
      </div>

      <Field label="فندق الإقامة" value={form.hotel ?? ''} onChange={(v) => setField('hotel', v)} placeholder="اسم الفندق" />
      <Field label="رابط الفندق في جوجل ماب" value={form.hotelMap ?? ''} onChange={(v) => setField('hotelMap', v)} placeholder="https://maps.google.com/…" dir="ltr" />
      <Field label="رابط المدينة في جوجل ماب" value={form.map ?? ''} onChange={(v) => setField('map', v)} placeholder="يُبنى تلقائيًا من اسم المدينة" dir="ltr" />

      <Stepper label="عدد الليالي" value={nights} onChange={(v) => setField('nights', v)} />

      <span className="text-[9.5px] font-light leading-relaxed text-muted-3">
        تقليل العدد يحذف الليالي الأخيرة، وزيادته تضيف أيامًا متتالية بعد آخر ليلة
        {isNew ? ' ابتداءً من اليوم التالي لآخر ليلة في الرحلة' : ''} — ضمن مدى الرحلة
        ({trip.start} ← {trip.end}). يمكنك دائمًا التعديل يدويًا في التقويم.
      </span>
    </Sheet>
  );
}
