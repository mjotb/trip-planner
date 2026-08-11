'use client';

import { useStore } from '@/lib/store';
import { Btn, Chip, Field, Sheet, TextArea } from '@/components/ui';
import { ITEM_TYPES, mapsLink } from '@/lib/constants';
import type { ItemType } from '@/lib/types';

const ORDER: ItemType[] = ['place', 'food', 'metro', 'train', 'shop', 'hotel', 'plane'];

export default function ActivitySheet({ open }: { open: boolean }) {
  const form = useStore((s) => s.ui.form);
  const day = useStore((s) => s.ui.day);
  const setField = useStore((s) => s.setField);
  const close = useStore((s) => s.closeSheet);
  const addItem = useStore((s) => s.addItem);
  const toast = useStore((s) => s.toast);

  const type: ItemType = form.type ?? 'place';

  function save() {
    if (!form.title) return toast('اكتب اسم النشاط');
    addItem(day, {
      type,
      time: form.time || '10:00',
      dur: form.dur || 'ساعة',
      title: form.title,
      note: form.note ?? '',
      map: form.map || mapsLink(form.title),
      menu: type === 'food',
      transfer: form.transfer ?? '',
    });
    close();
    toast('أُضيف النشاط لليوم');
  }

  return (
    <Sheet
      open={open}
      title="إضافة نشاط"
      onClose={close}
      footer={<Btn variant="primary" onClick={save} full className="py-3">حفظ النشاط</Btn>}
    >
      <span className="text-[10.5px] font-medium text-muted-3">النوع</span>
      <div className="grid grid-cols-4 gap-1.5">
        {ORDER.map((k) => (
          <Chip key={k} active={type === k} onClick={() => setField('type', k)}>
            {ITEM_TYPES[k].label}
          </Chip>
        ))}
      </div>

      <Field label="النشاط" value={form.title ?? ''} onChange={(v) => setField('title', v)} placeholder="زيارة متحف ريكس" />

      <div className="grid grid-cols-2 gap-2">
        <Field label="الوقت" type="time" value={form.time ?? ''} onChange={(v) => setField('time', v)} dir="ltr" />
        <Field label="المدة" value={form.dur ?? ''} onChange={(v) => setField('dur', v)} placeholder="ساعتان" />
      </div>

      <TextArea label="ملاحظة" rows={2} value={form.note ?? ''} onChange={(v) => setField('note', v)} placeholder="حجز مسبق مطلوب" />
      <Field label="سطر الانتقال" value={form.transfer ?? ''} onChange={(v) => setField('transfer', v)} placeholder="مترو 51 · 18 د" />
      <Field label="رابط جوجل ماب" value={form.map ?? ''} onChange={(v) => setField('map', v)} placeholder="يُبنى تلقائيًا من اسم النشاط" dir="ltr" />
    </Sheet>
  );
}
