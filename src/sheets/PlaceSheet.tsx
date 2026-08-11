'use client';

import { useStore } from '@/lib/store';
import { Btn, Chip, Field, Sheet } from '@/components/ui';
import { PLACE_TYPES, mapsLink } from '@/lib/constants';
import type { PlaceType, Trip } from '@/lib/types';

const ORDER: PlaceType[] = ['food', 'place', 'shop'];

export default function PlaceSheet({ open, trip }: { open: boolean; trip: Trip }) {
  const form = useStore((s) => s.ui.form);
  const setField = useStore((s) => s.setField);
  const close = useStore((s) => s.closeSheet);
  const addPlace = useStore((s) => s.addPlace);
  const toast = useStore((s) => s.toast);
  const fail = useStore((s) => s.fail);

  const type: PlaceType = form.type ?? 'food';

  function save() {
    if (!form.name) return fail('اكتب اسم المكان', ['name']);
    addPlace({
      name: form.name,
      city: form.city || '—',
      type,
      map: form.map || mapsLink(`${form.name} ${form.city ?? ''}`.trim()),
      note: form.note,
    });
    close();
    toast('أُضيف للمفضّلة');
  }

  return (
    <Sheet
      open={open}
      title="إضافة مطعم أو مكان"
      onClose={close}
      footer={<Btn variant="primary" onClick={save} full className="py-3">حفظ</Btn>}
    >
      <span className="text-[10.5px] font-medium text-muted-3">النوع</span>
      <div className="flex gap-1.5">
        {ORDER.map((k) => (
          <Chip key={k} active={type === k} onClick={() => setField('type', k)} className="flex-1">
            {PLACE_TYPES[k].label}
          </Chip>
        ))}
      </div>

      <Field name="name" label="الاسم" value={form.name ?? ''} onChange={(v) => setField('name', v)} placeholder="Dishoom Covent Garden" />

      <span className="text-[10.5px] font-medium text-muted-3">المدينة</span>
      <div className="flex flex-wrap gap-1.5">
        {trip.cities.map((c) => (
          <Chip
            key={c.id}
            active={form.city === c.name}
            onClick={() => setField('city', c.name)}
            activeBg={`${c.color}22`}
            activeBorder={c.color}
          >
            {c.name}
          </Chip>
        ))}
      </div>
      <Field label="أو اكتب مدينة أخرى" value={form.city ?? ''} onChange={(v) => setField('city', v)} placeholder="باريس" />

      <Field label="رابط جوجل ماب" value={form.map ?? ''} onChange={(v) => setField('map', v)} placeholder="يُبنى تلقائيًا من الاسم" dir="ltr" align="left" />
    </Sheet>
  );
}
