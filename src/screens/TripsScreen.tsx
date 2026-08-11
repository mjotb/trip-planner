'use client';

import { useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { Btn, Icon, SectionTitle } from '@/components/ui';
import { deriveBlocks, nightKeys } from '@/lib/blocks';
import { fmtShort, nextKey, todayKey } from '@/lib/dates';
import type { Trip } from '@/lib/types';

export default function TripsScreen({ trips, activeId }: { trips: Trip[]; activeId: string }) {
  const selectTrip = useStore((s) => s.selectTrip);
  const deleteTrip = useStore((s) => s.deleteTrip);
  const duplicateTrip = useStore((s) => s.duplicateTrip);
  const openSheet = useStore((s) => s.openSheet);
  const exportJSON = useStore((s) => s.exportJSON);
  const importJSON = useStore((s) => s.importJSON);
  const toast = useStore((s) => s.toast);

  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function onExport() {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `مخطط-الرحلة-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('نُزّل ملف النسخة الاحتياطية');
  }

  async function onImport(file: File, mode: 'merge' | 'replace') {
    const text = await file.text();
    const res = importJSON(text, mode);
    toast(res.message);
  }

  return (
    <div className="flex flex-col gap-3 px-5 pb-8 pt-1.5">

      <SectionTitle
        title="الرحلات المحفوظة"
        action={
          <button
            type="button"
            onClick={() =>
              openSheet('newTrip', { title: '', start: todayKey(), end: nextKey(todayKey(), 10) })
            }
            className="flex items-center gap-1 text-[10.5px] font-medium text-cyan-deep"
          >
            <Icon slot="action-add" size={11} color="#0084AF" />
            رحلة جديدة
          </button>
        }
      />

      {trips.map((t) => {
        const on = t.id === activeId;
        const nights = nightKeys(t.nights).length;
        const blocks = deriveBlocks(t.nights);
        return (
          <div
            key={t.id}
            className="flex animate-rise flex-col gap-2.5 rounded-15 border p-[13px_14px]"
            style={{ borderColor: on ? '#E3C64B' : '#E7E8E8', background: on ? '#FFFCE5' : '#fff' }}
          >
            <div className="flex items-start gap-2.5">
              <div className="flex min-w-0 flex-col gap-px">
                <span className="truncate text-[13.5px] font-bold">{t.title}</span>
                <span className="text-[10px] text-muted-3">
                  {fmtShort(t.start)} ← {fmtShort(t.end)} · {nights} ليلة · {blocks.length} إقامة
                </span>
              </div>
              {on && (
                <span className="mr-auto flex-none rounded-8 border border-primary-line bg-white px-2 py-1 text-[9.5px] font-medium text-ink-2">
                  نشطة
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {t.cities.slice(0, 5).map((c) => (
                <span
                  key={c.id}
                  className="flex items-center gap-1 rounded-8 bg-white px-2 py-1 text-[9.5px] font-medium"
                  style={{ border: `1px solid ${c.color}33`, color: c.color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </span>
              ))}
              {t.cities.length > 5 && (
                <span className="rounded-8 bg-white px-2 py-1 text-[9.5px] text-muted-3">
                  +{t.cities.length - 5}
                </span>
              )}
            </div>

            <div className="flex gap-1.5">
              {!on && (
                <Btn variant="primary" onClick={() => selectTrip(t.id)} className="flex-1">فتح</Btn>
              )}
              <Btn variant="secondary" icon="action-edit"
                onClick={() => openSheet('editTrip', { id: t.id, title: t.title, start: t.start, end: t.end })}
                className="flex-1">
                تعديل
              </Btn>
              <Btn variant="secondary" icon="action-add" onClick={() => duplicateTrip(t.id)} className="flex-1">
                نسخة
              </Btn>
              {confirmId === t.id ? (
                <Btn
                  variant="secondary"
                  onClick={() => { deleteTrip(t.id); setConfirmId(null); toast('حُذفت الرحلة'); }}
                  className="flex-1 !border-red !text-red"
                >
                  تأكيد
                </Btn>
              ) : (
                <Btn variant="ghost" onClick={() => setConfirmId(t.id)} className="!px-2.5">حذف</Btn>
              )}
            </div>
          </div>
        );
      })}

      {/* النسخ الاحتياطي */}
      <SectionTitle title="النسخ الاحتياطي والمزامنة" />

      <div className="flex flex-col gap-2.5 rounded-15 border border-line p-[13px_14px]">
        <span className="text-[10.5px] font-light leading-relaxed text-muted">
          بياناتك محفوظة في هذا المتصفح فقط. نزّل ملف نسخة وضعه في Google Drive أو OneDrive،
          ثم استورده على أي جهاز آخر لتتابع من حيث توقفت.
        </span>

        <Btn variant="dark" icon="action-copy" onClick={onExport} full className="py-3">
          تنزيل نسخة احتياطية (JSON)
        </Btn>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            const mode = (e.target.dataset.mode as 'merge' | 'replace') ?? 'merge';
            if (f) onImport(f, mode);
            e.target.value = '';
          }}
        />

        <div className="flex gap-2">
          <Btn
            variant="secondary"
            onClick={() => { if (fileRef.current) { fileRef.current.dataset.mode = 'merge'; fileRef.current.click(); } }}
            className="flex-1 py-3"
          >
            استيراد وإضافة
          </Btn>
          <Btn
            variant="secondary"
            onClick={() => { if (fileRef.current) { fileRef.current.dataset.mode = 'replace'; fileRef.current.click(); } }}
            className="flex-1 py-3"
          >
            استيراد واستبدال
          </Btn>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-12 bg-surface px-3 py-3">
        <span className="text-[10px] font-medium text-ink-2">كيف يعمل هذا التطبيق</span>
        <span className="text-[9.5px] font-light leading-relaxed text-muted">
          المبدأ الوحيد: تلوين يوم بلون مدينة يعني «سأبيت ليلةَ هذا اليوم هناك».
          يوم الانتقال يُحسب ليلة واحدة للمدينة الجديدة فقط، ويوم المغادرة النهائي لا يُحسب ليلة —
          فيخرج جدول الحجوزات بلا ازدواج ولا ليلة زائدة.
        </span>
      </div>
    </div>
  );
}
