'use client';

import { useStore } from '@/lib/store';
import { Btn, Chip, Field, Sheet } from '@/components/ui';
import { AIRLINES, airlineOf } from '@/lib/constants';
import AirportPicker from '@/components/AirportPicker';

export default function FlightSheet({ open }: { open: boolean }) {
  const form = useStore((s) => s.ui.form);
  const setField = useStore((s) => s.setField);
  const close = useStore((s) => s.closeSheet);
  const addFlight = useStore((s) => s.addFlight);
  const updateFlight = useStore((s) => s.updateFlight);
  const toast = useStore((s) => s.toast);
  const fail = useStore((s) => s.fail);

  const code = form.code ?? 'SV';
  const custom = code === 'OTHER';

  function save() {
    if (!form.from || !form.to) return fail('أكمل مدينتي المغادرة والوصول', ['from', 'to']);
    const payload = {
      code: custom ? (form.customCode || '—').toUpperCase().slice(0, 3) : code,
      airline: custom ? (form.customName || 'ناقل آخر') : airlineOf(code)?.name ?? code,
      kind: form.kind ?? 'ذهاب',
      cabin: form.cabin || 'اقتصادي',
      date: form.date ?? '',
      from: form.from,
      to: form.to,
      fromIata: form.fromIata,
      toIata: form.toIata,
      dep: form.dep || '00:00',
      arr: form.arr || '00:00',
      dur: form.dur || '—',
      ref: form.ref || undefined,
    };
    if (form.edit && form.id) {
      updateFlight(form.id, payload);
      close();
      return toast('حُدّثت التذكرة');
    }
    addFlight(payload);
    close();
    toast('أُضيفت التذكرة');
  }

  return (
    <Sheet
      open={open}
      title={form.edit ? 'تعديل التذكرة' : 'إضافة تذكرة سفر'}
      onClose={close}
      footer={<Btn variant="primary" onClick={save} full className="py-3">{form.edit ? 'حفظ التعديل' : 'حفظ التذكرة'}</Btn>}
    >
      <span className="text-[10.5px] font-medium text-muted-3">الناقل</span>
      <div className="grid grid-cols-3 gap-1.5">
        {AIRLINES.map((a) => (
          <Chip key={a.code} active={code === a.code} onClick={() => setField('code', a.code)} className="!px-1.5">
            <span className="num text-[9.5px] font-bold" style={{ color: a.color }}>{a.code}</span>
            <span className="truncate text-[9px]">{a.name.replace('الخطوط ', '')}</span>
          </Chip>
        ))}
        <Chip active={custom} onClick={() => setField('code', 'OTHER')} className="!px-1.5">
          <span className="text-[9.5px]">＋ ناقل آخر</span>
        </Chip>
      </div>

      {custom && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="اسم الناقل" value={form.customName ?? ''} onChange={(v) => setField('customName', v)} placeholder="طيران الرياض" />
          <Field label="الرمز" value={form.customCode ?? ''} onChange={(v) => setField('customCode', v)} placeholder="RX" dir="ltr" />
        </div>
      )}

      <span className="pt-1 text-[10.5px] font-medium text-muted-3">النوع</span>
      <div className="flex gap-1.5">
        {(['ذهاب', 'عودة', 'داخلي'] as const).map((k) => (
          <Chip key={k} active={(form.kind ?? 'ذهاب') === k} onClick={() => setField('kind', k)} className="flex-1">
            {k}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <AirportPicker
          name="from" label="من"
          valueText={form.from ?? ''} valueIata={form.fromIata}
          onChange={(text, iata) => { setField('from', text); setField('fromIata', iata); }}
          placeholder="مطار المغادرة"
        />
        <AirportPicker
          name="to" label="إلى"
          valueText={form.to ?? ''} valueIata={form.toIata}
          onChange={(text, iata) => { setField('to', text); setField('toIata', iata); }}
          placeholder="مطار الوصول"
        />
      </div>

      <Field label="التاريخ" type="date" value={form.date ?? ''} onChange={(v) => setField('date', v)} dir="ltr" />

      <div className="grid grid-cols-3 gap-2">
        <Field label="الإقلاع" type="time" value={form.dep ?? ''} onChange={(v) => setField('dep', v)} dir="ltr" />
        <Field label="الوصول" type="time" value={form.arr ?? ''} onChange={(v) => setField('arr', v)} dir="ltr" />
        <Field label="المدة" value={form.dur ?? ''} onChange={(v) => setField('dur', v)} placeholder="6س 35د" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="الدرجة" value={form.cabin ?? ''} onChange={(v) => setField('cabin', v)} placeholder="اقتصادي" />
        <Field label="رقم الحجز" value={form.ref ?? ''} onChange={(v) => setField('ref', v)} placeholder="ABC123" dir="ltr" />
      </div>
    </Sheet>
  );
}
