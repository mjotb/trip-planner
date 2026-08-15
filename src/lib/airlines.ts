import raw from '@/data/airlines.json';
import { flagUrl } from './airports';

/**
 * شركات الطيران.
 *
 * المصدر `src/data/airlines.json` يبقى **كما وصل بلا تعديل**، وكل التصحيحات
 * والإضافات هنا في الكود. فائدة ذلك: حين تصلك نسخة أحدث من الملف تستبدلها
 * مباشرة بلا أن تفقد شيئًا، ويبقى واضحًا ما أضفناه نحن وما جاء من المصدر.
 *
 * الأسماء إنجليزية عمدًا — هكذا تُكتب على التذاكر وبطاقات الصعود.
 */

type RawAirline = {
  name: string;
  iata: string;
  icao: string;
  country: string;
  flag_carrier?: boolean;
  website?: string;
  alliance?: string;
  branding?: { primary_color?: string; colors?: Record<string, string[]> };
  slug?: string;
};

export type Airline = {
  code: string;      // IATA — المفتاح المخزَّن في التذكرة
  icao: string;
  name: string;
  countryIso: string; // ISO-2 — مصدر العلم
  color: string;     // لون العلامة، يُستخدم لنص الرمز
  tint: string;      // خلفية فاتحة مشتقّة من اللون
  alliance?: string;
  website?: string;
  featured?: boolean;
};

/**
 * ناقلات ناقصة من المصدر.
 *
 * الثلاثة الأولى كانت في القائمة السابقة للتطبيق، وحذفها تراجع.
 * ITA Airways هي الناقل الوطني الإيطالي — الملف فيه Air Dolomiti فقط.
 */
const ADDITIONS: RawAirline[] = [
  { name: 'ITA Airways', iata: 'AZ', icao: 'ITY', country: 'IT', flag_carrier: true,
    alliance: 'SkyTeam', website: 'https://www.itaspa.com', branding: { primary_color: '#00205B' } },
  { name: 'flyadeal', iata: 'F3', icao: 'FAD', country: 'SA',
    website: 'https://www.flyadeal.com', branding: { primary_color: '#582C83' } },
  { name: 'EgyptAir', iata: 'MS', icao: 'MSR', country: 'EG', flag_carrier: true,
    alliance: 'Star Alliance', website: 'https://www.egyptair.com', branding: { primary_color: '#0B4EA2' } },
];

/**
 * تصحيحات على المصدر.
 *
 * - SK: رمز الدولة فيه "DK,NO,SE" وليس ISO2 صالحًا، فلا يُنتج علمًا.
 *       الإسكندنافية شركة ثلاثية الجنسية، ومقرّها التشغيلي ستوكهولم.
 * - IB و QF: حقل اللون فارغ في المصدر.
 * - TG: اللون مكتوب بثلاث خانات (#306) وبعض المتصفحات القديمة لا تقبله في SVG.
 */
const FIXES: Record<string, Partial<RawAirline> & { primary_color?: string }> = {
  SK: { country: 'SE' },
  IB: { primary_color: '#D7192D' },
  QF: { primary_color: '#E40000' },
  TG: { primary_color: '#330066' },
};

/** ناقلاتك المعتادة — تظهر أولًا قبل البحث. */
const FEATURED = ['SV', 'QR', 'EK', 'AF', 'KL', 'AZ', 'LH'];

/* ------------------------------------------------------------------ */

function expandHex(hex: string): string {
  const h = hex.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(h)) return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h : '';
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

/**
 * خلفية فاتحة مشتقّة من لون العلامة — مزج مع الأبيض بنسبة ثابتة،
 * فتبقى الشريحة قابلة للقراءة مهما كان اللون الأصلي.
 */
function tintOf(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.88);
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * لون نص الرمز. الألوان الفاتحة جدًا (أصفر برونا وسكوت) لا تُقرأ على خلفية
 * فاتحة، فتُغمَّق حتى تبلغ حدًا مقبولًا من التباين.
 */
function readable(hex: string): string {
  if (luminance(hex) <= 0.62) return hex;
  const n = parseInt(hex.slice(1), 16);
  const dark = (c: number) => Math.round(c * 0.55);
  const r = dark((n >> 16) & 255), g = dark((n >> 8) & 255), b = dark(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

const FALLBACK = '#3D4348';

function normalize(a: RawAirline): Airline {
  const fix = FIXES[a.iata] ?? {};
  const rawColor = fix.primary_color ?? a.branding?.primary_color ?? '';
  const base = expandHex(rawColor) || FALLBACK;
  const color = readable(base);

  return {
    code: a.iata,
    icao: a.icao,
    name: a.name,
    countryIso: (fix.country ?? a.country ?? '').toUpperCase(),
    color,
    tint: tintOf(base),
    alliance: a.alliance,
    website: a.website,
    featured: FEATURED.includes(a.iata),
  };
}

export const AIRLINES: Airline[] = [...(raw as RawAirline[]), ...ADDITIONS]
  .map(normalize)
  .sort((x, y) => {
    const fx = FEATURED.indexOf(x.code), fy = FEATURED.indexOf(y.code);
    if (fx !== -1 || fy !== -1) {
      if (fx === -1) return 1;
      if (fy === -1) return -1;
      return fx - fy;
    }
    return x.name.localeCompare(y.name, 'en');
  });

const BY_CODE = new Map(AIRLINES.map((a) => [a.code, a]));

export function airlineOf(code: string | undefined | null): Airline | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code.trim().toUpperCase());
}

/** علم دولة الناقل — بنفس آلية أعلام المطارات. */
export function airlineFlag(code: string | undefined | null): string | null {
  const a = airlineOf(code);
  return a ? flagUrl(a.countryIso) : null;
}

export const FEATURED_AIRLINES = AIRLINES.filter((a) => a.featured);

/** بحث بالاسم أو رمز IATA أو ICAO أو التحالف. */
export function searchAirlines(query: string, limit = 60): Airline[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRLINES.slice(0, limit);

  const scored: { a: Airline; score: number }[] = [];
  for (const a of AIRLINES) {
    let score = 0;
    const name = a.name.toLowerCase();
    if (a.code.toLowerCase() === q) score = 100;
    else if (a.icao.toLowerCase() === q) score = 95;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else if (a.alliance?.toLowerCase().includes(q)) score = 30;
    if (score) scored.push({ a, score });
  }

  return scored
    .sort((x, y) => y.score - x.score || x.a.name.localeCompare(y.a.name, 'en'))
    .slice(0, limit)
    .map((s) => s.a);
}
