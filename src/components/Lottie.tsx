'use client';

import { useEffect, useRef, useState } from 'react';
import { asset } from '@/lib/asset';

/**
 * مشغّل أنيميشن Lottie.
 *
 * المكتبة تُحمَّل عند أول استخدام فقط (dynamic import)، فلا تثقّل أول فتح
 * للتطبيق لمن لا تظهر له أي حركة. وتُحترم تفضيلات تقليل الحركة في النظام:
 * إن فعّلها المستخدم يُعرض الإطار الأول ساكنًا بدل التشغيل.
 */

export type LottieName = 'airplane' | 'train' | 'car' | 'booking';

export default function Lottie({
  name,
  size = 120,
  loop = true,
  className = '',
}: {
  name: LottieName;
  size?: number;
  loop?: boolean;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let anim: { destroy: () => void; goToAndStop: (f: number, isFrame: boolean) => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        // النسخة light تكفي لأنيميشنات الأشكال وتوفّر نحو 130 كيلوبايت
        const lottie = (await import('lottie-web/build/player/lottie_light')).default;
        if (cancelled || !box.current) return;

        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        anim = lottie.loadAnimation({
          container: box.current,
          renderer: 'svg',
          loop: loop && !reduce,
          autoplay: !reduce,
          path: asset(`/assets/lottie/${name}.json`),
        }) as any;

        if (reduce) anim?.goToAndStop(0, true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, [name, loop]);

  if (failed) return null;

  return (
    <div
      ref={box}
      aria-hidden
      className={`flex-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
