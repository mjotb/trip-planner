'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Btn, Chip, Field, Icon, Sheet, TextArea } from '@/components/ui';
import { copyText, dayPlanPrompt, parseCities, parseDayItems, tripSkeletonPrompt } from '@/lib/ai';
import { fmtShort } from '@/lib/dates';
import type { Block, Trip } from '@/lib/types';

type Mode = 'day' | 'trip';

export default function AiSheet({ open, trip, blocks }: { open: boolean; trip: Trip; blocks: Block[] }) {
  const day = useStore((s) => s.ui.day);
  const close = useStore((s) => s.closeSheet);
  const addItems = useStore((s) => s.addItems);
  const addCity = useStore((s) => s.addCity);
  const setTab = useStore((s) => s.setTab);
  const toast = useStore((s) => s.toast);
  const fail = useStore((s) => s.fail);

  const [mode, setMode] = useState<Mode>('day');
  const [interests, setInterests] = useState('');
  const [idea, setIdea] = useState('');
  const [answer, setAnswer] = useState('');
  const [copied, setCopied] = useState(false);

  const cityId = trip.nights[day];
  const city = cityId ? trip.cities.find((c) => c.id === cityId) : null;

  function buildPrompt(): string {
    if (mode === 'trip') {
      return tripSkeletonPrompt({ start: trip.start, end: trip.end, idea: idea || trip.title });
    }
    return dayPlanPrompt({
      day,
      cityName: city?.name ?? 'المدينة',
      country: city?.country ?? '',
      hotel: city?.hotel ?? 'لم يُحدَّد',
      existing: trip.plans[day] ?? [],
      interests: interests.trim() || undefined,
    });
  }

  async function onCopy() {
    const ok = await copyText(buildPrompt());
    setCopied(ok);
    toast(ok ? 'نُسخ الطلب — الصقه في Claude أو ChatGPT' : 'تعذّر النسخ، حدّد النص يدويًا');
  }

  function onApply() {
    if (!answer.trim()) return fail('الصق ناتج الذكاء الاصطناعي أولًا');

    if (mode === 'trip') {
      const res = parseCities(answer);
      if (!res.ok) return fail(res.message);
      for (const c of res.data) {
        addCity({
          name: c.name, country: c.country, flag: '',
          hotel: c.hotelIdea || 'لم يُحدَّد الفندق',
          hotelMap: '', map: '', nights: c.nights,
        });
      }
      close();
      setAnswer('');
      setTab('cal');
      return toast(`أُضيفت ${res.data.length} مدينة — راجع توزيع الليالي`);
    }

    const res = parseDayItems(answer, city?.name ?? '');
    if (!res.ok) return fail(res.message);
    addItems(day, res.data);
    close();
    setAnswer('');
    setTab('day');
    toast(`أُضيف ${res.data.length} عنصر إلى ${fmtShort(day)}`);
  }

  return (
    <Sheet
      open={open}
      title="الذكاء الاصطناعي — جسر النسخ واللصق"
      onClose={close}
      footer={
        <Btn variant="primary" onClick={onApply} full className="py-3" disabled={!answer.trim()}>
          أضف الناتج إلى الخطة
        </Btn>
      }
    >
      <div className="flex items-start gap-2 rounded-12 border border-cream-line bg-cream px-3 py-2.5">
        <Icon name="sparkle-cyan" size={14} color="#00A8DA" />
        <span className="text-[10px] font-light leading-relaxed text-ink-2">
          بلا مفتاح API وبلا تكلفة: انسخ الطلب، الصقه في تطبيق Claude أو ChatGPT باشتراكك،
          ثم انسخ الرد كاملًا والصقه في الحقل الثاني.
        </span>
      </div>

      <div className="flex gap-1.5">
        <Chip active={mode === 'day'} onClick={() => setMode('day')} className="flex-1">
          مسار يوم
        </Chip>
        <Chip active={mode === 'trip'} onClick={() => setMode('trip')} className="flex-1">
          توزيع المدن والليالي
        </Chip>
      </div>

      {mode === 'day' ? (
        <>
          <div className="flex items-center gap-2 rounded-12 bg-surface px-3 py-2.5">
            <span className="text-[10.5px] text-muted-3">اليوم</span>
            <span className="text-[11.5px] font-bold">{fmtShort(day)}</span>
            {city && (
              <span
                className="mr-auto rounded-8 px-2 py-1 text-[10px] font-medium"
                style={{ background: `${city.color}1f`, color: city.color }}
              >
                {city.name}
              </span>
            )}
          </div>
          <Field
            label="اهتماماتك (اختياري)"
            value={interests}
            onChange={setInterests}
            placeholder="متاحف، أسواق شعبية، مطاعم حلال، مشي قليل"
          />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-12 bg-surface px-3 py-2.5">
            <span className="text-[10.5px] text-muted-3">المدى</span>
            <span className="text-[11px] font-bold">{fmtShort(trip.start)} ← {fmtShort(trip.end)}</span>
            <span className="mr-auto text-[10px] text-muted-3">{blocks.length} إقامة حاليًا</span>
          </div>
          <Field
            label="فكرة الرحلة"
            value={idea}
            onChange={setIdea}
            placeholder="جولة أوروبية بالقطار: لندن وهولندا وبلجيكا وفرنسا"
          />
        </>
      )}

      <Btn variant="dark" icon="share" onClick={onCopy} full className="py-3">
        {copied ? '✓ نُسخ الطلب — انسخه مجددًا' : '١ · نسخ الطلب'}
      </Btn>

      <details className="rounded-12 border border-line bg-surface px-3 py-2.5">
        <summary className="cursor-pointer text-[10.5px] font-medium text-muted-2">معاينة نص الطلب</summary>
        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[9.5px] font-light leading-relaxed text-muted" dir="rtl">
          {buildPrompt()}
        </pre>
      </details>

      <TextArea
        label="٢ · الصق رد الذكاء الاصطناعي هنا"
        value={answer}
        onChange={setAnswer}
        rows={6}
        mono
        placeholder='{ "items": [ … ] }'
      />

      <span className="text-[9.5px] font-light leading-relaxed text-muted-3">
        لا بأس إن كان الرد يحتوي شرحًا حول الـ JSON — التطبيق يستخرج الجزء المطلوب تلقائيًا.
      </span>
    </Sheet>
  );
}
