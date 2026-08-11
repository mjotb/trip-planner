'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Btn, Icon, Sheet, TextArea } from '@/components/ui';
import { copyText, menuPrompt, parseMenuLines } from '@/lib/ai';
import type { MenuLine } from '@/lib/types';

export default function MenuSheet({ open }: { open: boolean }) {
  const form = useStore((s) => s.ui.form);
  const close = useStore((s) => s.closeSheet);
  const setPlaceMenu = useStore((s) => s.setPlaceMenu);
  const toast = useStore((s) => s.toast);
  const fail = useStore((s) => s.fail);

  const [answer, setAnswer] = useState('');
  const [lines, setLines] = useState<MenuLine[]>([]);

  const name = form.name ?? '';
  const placeId = form.placeId as string | undefined;

  async function onCopy() {
    const ok = await copyText(menuPrompt(name));
    toast(ok ? 'نُسخ الطلب — أرفق صورة المنيو في Claude والصقه' : 'تعذّر النسخ');
  }

  function onParse() {
    if (!answer.trim()) return fail('الصق ناتج الترجمة أولًا');
    const res = parseMenuLines(answer);
    if (!res.ok) return fail(res.message);
    setLines(res.data);
    toast(`تُرجم ${res.data.length} طبق`);
  }

  function onSave() {
    if (!lines.length) return fail('لا يوجد شيء لحفظه');
    if (!placeId) {
      close();
      return toast('احفظ المطعم في «أماكني» أولًا لتبقى الترجمة معه');
    }
    setPlaceMenu(placeId, lines);
    close();
    setAnswer('');
    setLines([]);
    toast('حُفظ المنيو المترجم مع المكان');
  }

  return (
    <Sheet
      open={open}
      title="المنيو والترجمة"
      onClose={close}
      footer={
        lines.length ? (
          <Btn variant="primary" onClick={onSave} full className="py-3">حفظ في المكان</Btn>
        ) : (
          <Btn variant="dark" onClick={onParse} full className="py-3" disabled={!answer.trim()}>
            اقرأ الترجمة
          </Btn>
        )
      }
    >
      {name && (
        <div className="flex items-center gap-2 rounded-12 bg-surface px-3 py-2.5">
          <Icon slot="type-food" size={15} color="#3D4348" />
          <span className="text-[11.5px] font-bold">{name}</span>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-12 border border-cream-line bg-cream px-3 py-3">
        <span className="text-[10.5px] font-bold text-ink-2">الخطوات</span>
        <span className="text-[10px] font-light leading-relaxed text-muted">
          ١ · انسخ الطلب أدناه · ٢ · افتح تطبيق Claude وأرفق <b>صورة المنيو</b> والصق الطلب معها ·
          ٣ · انسخ الرد كاملًا والصقه هنا.
        </span>
      </div>

      <Btn variant="dark" icon="action-copy" onClick={onCopy} full className="py-3">نسخ طلب الترجمة</Btn>

      <TextArea
        label="الصق رد الترجمة"
        value={answer}
        onChange={setAnswer}
        rows={5}
        mono
        placeholder='{ "lines": [ … ] }'
      />

      {lines.length > 0 && (
        <div className="flex flex-col gap-2 rounded-12 border border-line px-3 py-3">
          <span className="text-[10.5px] font-medium text-muted-3">{lines.length} طبق</span>
          {lines.map((m) => (
            <div key={m.id} className="flex items-baseline gap-2 border-b border-line-3 pb-1.5 last:border-0 last:pb-0">
              <div className="flex min-w-0 flex-col">
                <span className="text-[12px] font-bold leading-snug">{m.ar}</span>
                {m.orig && <span className="num truncate text-[9.5px] font-light text-muted-3">{m.orig}</span>}
              </div>
              {m.price && <span className="num mr-auto flex-none text-[11px] font-medium text-ink-2">{m.price}</span>}
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}
