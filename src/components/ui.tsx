'use client';

import React from 'react';
import { asset } from '@/lib/asset';
import { iconDef, type IconSlot } from '@/lib/icons';
import { useStore } from '@/lib/store';
import Lottie, { type LottieName } from './Lottie';

/* ------------------------------------------------------------------ */
/* أيقونة                                                              */
/* ------------------------------------------------------------------ */

/**
 * أيقونة من سجلّ الخانات (src/lib/icons.ts).
 *
 * الخانات ذات الوضع mask تُلوَّن بالخاصية color، والخانات ذات الوضع color
 * تُعرض بألوانها الأصلية فتُتجاهل color — وهذا ما يتيح أيقونات ملوّنة
 * وأخرى تتبع لون السياق في التطبيق نفسه.
 */
export function Icon({
  slot, size = 16, color = '#3D4348', className = '',
}: { slot: IconSlot; size?: number; color?: string; className?: string }) {
  const def = iconDef(slot);
  const url = `url(${asset(`/assets/${def.file}`)})`;

  if (def.mode === 'color') {
    return (
      <span
        aria-hidden
        className={`flex-none bg-contain bg-center bg-no-repeat ${className}`}
        style={{ width: size, height: size, backgroundImage: url }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`icon ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: url,
        maskImage: url,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* أزرار                                                               */
/* ------------------------------------------------------------------ */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'dark' | 'cream' | 'ghost';
  icon?: IconSlot;
  iconColor?: string;
  full?: boolean;
};

const BTN: Record<string, string> = {
  primary: 'bg-primary border border-primary-line text-ink font-bold',
  secondary: 'bg-white border border-line text-ink-2 font-medium',
  dark: 'bg-ink border border-ink text-white font-bold',
  cream: 'bg-cream border border-cream-line text-ink-2 font-medium',
  ghost: 'bg-transparent border border-transparent text-muted-3 font-medium',
};

export function Btn({
  variant = 'secondary', icon, iconColor, full, className = '', children, ...rest
}: BtnProps) {
  return (
    <button
      type="button"
      className={`flex items-center justify-center gap-1.5 rounded-12 px-3 py-2.5 text-[11.5px] leading-none transition active:scale-[.98] disabled:opacity-40 ${BTN[variant]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon && <Icon slot={icon} size={14} color={iconColor ?? (variant === 'dark' ? '#FFEA75' : '#3D4348')} />}
      {children}
    </button>
  );
}

/** شريحة اختيار (فلاتر، أدوات، أنواع). */
export function Chip({
  active, onClick, children, activeBg = '#FFEA75', activeBorder = '#E3C64B', className = '',
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
  activeBg?: string; activeBorder?: string; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-10 border px-2.5 py-2 text-[10.5px] font-medium leading-none transition active:scale-[.97] ${className}`}
      style={{
        background: active ? activeBg : '#fff',
        borderColor: active ? activeBorder : '#E7E8E8',
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* حقول                                                                */
/* ------------------------------------------------------------------ */

export function Field({
  label, value, onChange, placeholder, type = 'text', dir, align, name,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; dir?: 'ltr' | 'rtl';
  /** المحاذاة داخل الحقل. الافتراضي: يمين ليطابق العنوان العربي فوقه.
   *  استخدم 'left' للروابط الطويلة حيث تهمّ رؤية بدايتها. */
  align?: 'right' | 'left';
  /** مفتاح الحقل في النموذج — يُحاط بالأحمر إن أشّرت عليه دالة fail. */
  name?: string;
}) {
  const missing = useStore((s) => s.ui.missing);
  const invalid = !!name && missing.includes(name);
  const alignClass = (align ?? 'right') === 'left' ? 'text-left' : 'text-right';
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-medium" style={{ color: invalid ? '#DC2632' : '#868A8D' }}>
        {label}
        {invalid && ' · مطلوب'}
      </span>
      <input
        type={type}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-12 border bg-surface px-3 py-2.5 text-[12px] font-medium placeholder:font-light placeholder:text-muted-4 ${alignClass} ${invalid ? 'border-red' : 'border-line'}`}
      />
    </label>
  );
}

export function TextArea({
  label, value, onChange, placeholder, rows = 4, mono,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-medium text-muted-3">{label}</span>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        dir={mono ? 'ltr' : undefined}
        className={`resize-none rounded-12 border border-line bg-surface px-3 py-2.5 text-[11.5px] leading-relaxed placeholder:font-light placeholder:text-muted-4 ${mono ? 'font-num text-[10.5px]' : ''}`}
      />
    </label>
  );
}

/** عدّاد الليالي. */
export function Stepper({
  label, value, onChange, min = 0, max = 60,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center justify-between rounded-12 border border-line bg-surface px-3 py-2.5">
      <span className="text-[11.5px] font-medium text-ink-2">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-8 border border-line bg-white text-[15px] font-bold leading-none text-ink-2 active:scale-95"
        >
          −
        </button>
        <span className="num min-w-[18px] text-center text-[15px] font-bold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-8 border border-primary-line bg-primary text-[15px] font-bold leading-none text-ink active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* بطاقات وحاويات                                                      */
/* ------------------------------------------------------------------ */

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-0.5 pt-2">
      <span className="text-[12.5px] font-bold text-ink">{title}</span>
      {action}
    </div>
  );
}

/**
 * حالة فارغة. إن مُرِّر lottie عُرضت الحركة بدل الأيقونة الساكنة —
 * والأيقونة تبقى بديلًا إن تعذّر تحميل المكتبة.
 */
export function Empty({
  icon, text, hint, lottie,
}: { icon: IconSlot; text: string; hint?: string; lottie?: LottieName }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-14 border border-dashed border-line px-4 py-6 text-center">
      {lottie ? <Lottie name={lottie} size={92} /> : <Icon slot={icon} size={22} color="#9EA1A4" />}
      <span className="text-[12px] font-medium text-muted-2">{text}</span>
      {hint && <span className="text-[10px] font-light text-muted-3">{hint}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ورقة سفلية                                                          */
/* ------------------------------------------------------------------ */

export function Sheet({
  open, title, onClose, children, footer,
}: {
  open: boolean; title: string; onClose: () => void;
  children: React.ReactNode; footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 animate-fade bg-[rgba(13,21,26,.45)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[82%] animate-sheetup flex-col rounded-t-24 bg-white shadow-sheet"
      >
        <div className="flex flex-col items-center pt-3">
          <div className="h-1 w-[42px] rounded-full bg-line" />
        </div>
        <div className="flex items-center justify-between px-5 pb-1 pt-3">
          <span className="text-[14px] font-bold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-8 border border-line text-[13px] leading-none text-muted-3"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto px-5 pb-4 pt-2">{children}</div>
        {footer && <div className="border-t border-line-3 px-5 pb-7 pt-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

export function Toast({ message, kind = 'ok' }: { message: string; kind?: 'ok' | 'error' }) {
  if (!message) return null;
  const error = kind === 'error';
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[112px] z-50 flex justify-center px-6">
      <div
        className="flex animate-toast items-center gap-2 rounded-12 px-4 py-2.5 text-[11.5px] font-medium text-white shadow-toast"
        style={{ background: error ? '#DC2632' : '#0D151A' }}
      >
        {error && <span className="text-[13px] leading-none">!</span>}
        {message}
      </div>
    </div>
  );
}
