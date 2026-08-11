import type { Config } from 'tailwindcss';

/**
 * توكنات Tourly — مستخرجة من حزمة التسليم design_handoff_tourly_planner.
 * لا تُغيَّر القيم هنا إلا بمقابل في التصميم.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0D151A',
        'ink-2': '#3D4348',
        muted: '#565B5F',
        'muted-2': '#6E7276',
        'muted-3': '#868A8D',
        'muted-4': '#9EA1A4',
        'muted-5': '#B6B9BA',
        line: '#E7E8E8',
        'line-2': '#EFEFF0',
        'line-3': '#F1F1F2',
        'line-4': '#CFD0D1',
        surface: '#FBFBFC',
        cream: '#FFFCE5',
        'cream-line': '#F1E6AE',
        primary: '#FFEA75',
        'primary-line': '#E3C64B',
        'primary-soft': '#FFF7BA',
        cyan: '#00A8DA',
        'cyan-deep': '#0084AF',
        green: '#00BD74',
        orange: '#DE8000',
        red: '#DC2632',
        plum: '#8B3A62',
        'info-blue': '#ECF2FD',
      },
      borderRadius: {
        7: '7px',
        8: '8px',
        10: '10px',
        11: '11px',
        12: '12px',
        14: '14px',
        15: '15px',
        16: '16px',
        20: '20px',
        24: '24px',
        pill: '26px',
      },
      boxShadow: {
        card: '0 8px 20px rgba(13,21,26,.06)',
        toast: '0 12px 28px rgba(13,21,26,.28)',
        sheet: '0 -10px 40px rgba(13,21,26,.18)',
      },
      fontFamily: {
        sans: ['Dubai', 'Poppins', 'system-ui', 'sans-serif'],
        num: ['Poppins', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        sheetup: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        toast: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '12%': { opacity: '1', transform: 'translateY(0)' },
          '86%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        rise: 'rise .28s ease both',
        sheetup: 'sheetup .26s cubic-bezier(.3,.8,.3,1) both',
        fade: 'fade .2s ease both',
        toast: 'toast 2.4s ease forwards',
      },
    },
  },
  plugins: [],
};

export default config;
