'use client';

import { useStore } from '@/lib/store';
import { Btn, Field, Sheet } from '@/components/ui';
import { daysBetween } from '@/lib/dates';

export default function TripSheet({ open, isNew }: { open: boolean; isNew: boolean }) {
  const form = useStore((s) => s.ui.form);
  const setField = useStore((s) => s.setField);
  const close = useStore((s) => s.closeSheet);
  const createTrip = useStore((s) => s.createTrip);
  const updateTrip = useStore((s) => s.updateTrip);
  const toast = useStore((s) => s.toast);

  const start = form.start ?? '';
  const end = form.end ?? '';
  const span = start && end ? daysBetween(start, end) + 1 : 0;

  function save() {
    if (!form.title) return toast('اكتب اسم الرحلة');
    if (!start || !end) return toast('حدّد تاريخي البداية والنهاية');
    if (end < start) return toast('تاريخ النهاية قبل البداية');
    if (span > 400) return toast('المدى طويل جدًا — أقصى 400 يوم');

    if (isNew) {
      createTrip(form.title, start, end);
      toast('أُنشئت الرحلة — أضف مدنها');
    } else {
      updateTrip(form.id, { title: form.title, start, end });
      toast('حُدّثت الرحلة');
    }
    close();
  }

  return (
    <Sheet
      open={open}
      title={isNew ? 'رحلة جديدة' : 'تعديل الرحلة'}
      onClose={close}
      footer={<Btn variant="primary" onClick={save} full className="py-3">{isNew ? 'إنشاء' : 'حفظ'}</Btn>}
    >
      <Field label="اسم الرحلة" value={form.title ?? ''} onChange={(v) => setField('title', v)} placeholder="رحلة أوروبا · خريف 2026" />

      <div className="grid grid-cols-2 gap-2">
        <Field label="أول يوم" type="date" value={start} onChange={(v) => setField('start', v)} dir="ltr" />
        <Field label="آخر يوم" type="date" value={end} onChange={(v) => setField('end', v)} dir="ltr" />
      </div>

      {span > 0 && (
        <span className="text-[10.5px] font-light text-muted">
          المدى {span} يومًا — أي حتى {span - 1} ليلة كحد أقصى، لأن يوم المغادرة النهائي لا يُحسب ليلة.
        </span>
      )}

      {!isNew && (
        <span className="text-[9.5px] font-light leading-relaxed text-muted-3">
          تقليص المدى لا يحذف الليالي الملوّنة خارجه، لكنها لن تظهر في التقويم. وسّع المدى مجددًا لتعود.
        </span>
      )}
    </Sheet>
  );
}
