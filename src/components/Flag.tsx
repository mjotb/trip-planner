'use client';

import { useState } from 'react';
import { flagUrl } from '@/lib/airports';

/**
 * علم دولة بمقاس موحّد 4:3.
 *
 * مقاس واحد لكل الأعلام في التطبيق، وبلا تشويه: الصورة تملأ الإطار عبر
 * object-fit: cover فتحافظ على نسبها. الملفات مصدرها حزمة flag-icons كما هي،
 * لا تُعاد رسمها ولا تُعدَّل.
 *
 * إن كان الرمز مفقودًا أو غير صالح، أو فشل تحميل الملف، تظهر أيقونة كرة
 * أرضية محايدة بدل صورة مكسورة.
 */
export default function Flag({
  iso,
  label,
  size = 'md',
  className = '',
}: {
  iso: string | undefined | null;
  /** اسم الدولة — يُقرأ بقارئ الشاشة */
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const url = flagUrl(iso);

  const dims = size === 'sm' ? { width: 20, height: 15 } : { width: 32, height: 24 };
  const base = 'flex-none rounded-[3px] object-cover align-middle shadow-[0_0_0_1px_rgba(0,0,0,.12)]';

  if (!url || broken) {
    return (
      <span
        role="img"
        aria-label={label ? `علم ${label} غير متوفر` : 'دولة غير معروفة'}
        className={`flex items-center justify-center bg-line-3 ${base} ${className}`}
        style={dims}
      >
        <svg viewBox="0 0 24 24" width={dims.height - 4} height={dims.height - 4} aria-hidden>
          <circle cx="12" cy="12" r="9" fill="none" stroke="#868A8D" strokeWidth="1.6" />
          <ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="#868A8D" strokeWidth="1.6" />
          <path d="M3.4 9h17.2M3.4 15h17.2" stroke="#868A8D" strokeWidth="1.6" />
        </svg>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={label ? `علم ${label}` : ''}
      width={dims.width}
      height={dims.height}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className={`${base} ${className}`}
      style={dims}
    />
  );
}
