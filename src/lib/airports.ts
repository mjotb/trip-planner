import raw from '@/data/airports.json';
import { asset } from './asset';

/**
 * بيانات المطارات وأعلام الدول.
 *
 * قاعدة صارمة: `country_iso2` هو المفتاح **الوحيد** لاختيار العلم.
 * لا يُستنتج البلد من رمز المطار (LHR) ولا من اسم المدينة ولا من اسم الدولة —
 * لأن هذه الاستنتاجات تنكسر في حالات حقيقية: هونغ كونغ وماكاو وتايوان لها
 * رموز دول مستقلة، ومدن بأسماء متطابقة تقع في دول مختلفة.
 */

export type Airport = {
  iata: string;
  city_ar: string;
  city_en: string;
  airport_name_ar: string;
  airport_name_en: string;
  country_ar: string;
  country_en: string;
  country_iso2: string;
  region: string;
};

export const AIRPORTS: Airport[] = (raw as { airports: Airport[] }).airports;

const BY_IATA = new Map<string, Airport>(AIRPORTS.map((a) => [a.iata.toUpperCase(), a]));

export function airportByIata(iata: string | undefined | null): Airport | undefined {
  if (!iata) return undefined;
  return BY_IATA.get(iata.trim().toUpperCase());
}

/** يستخرج رمز IATA من نص حر مثل «لندن LHR» أو «LHR». */
export function extractIata(text: string | undefined | null): string | undefined {
  if (!text) return undefined;
  const direct = BY_IATA.get(text.trim().toUpperCase());
  if (direct) return direct.iata;
  const m = text.toUpperCase().match(/\b([A-Z]{3})\b/g);
  if (!m) return undefined;
  return m.map((c) => BY_IATA.get(c)?.iata).find(Boolean);
}

/* ------------------------------------------------------------------ */
/* الأعلام                                                             */
/* ------------------------------------------------------------------ */

/** رموز الدول التي نملك لها ملف علم — تُولَّد من نفس البيانات. */
const HAVE_FLAG = new Set(AIRPORTS.map((a) => normalizeIso(a.country_iso2)).filter(Boolean));

function normalizeIso(iso: string | undefined | null): string {
  if (typeof iso !== 'string') return '';
  const v = iso.trim().toLowerCase();
  return /^[a-z]{2}$/.test(v) ? v : '';
}

/**
 * مسار علم الدولة، أو null إن كان الرمز مفقودًا أو غير صالح —
 * وحينها تعرض الواجهة أيقونة كرة أرضية محايدة بدل صورة مكسورة.
 */
export function flagUrl(iso: string | undefined | null): string | null {
  const code = normalizeIso(iso);
  if (!code || !HAVE_FLAG.has(code)) return null;
  return asset(`/assets/flags/country/${code}.svg`);
}

/** علم دولة المطار انطلاقًا من رمز IATA. */
export function flagUrlForIata(iata: string | undefined | null): string | null {
  const a = airportByIata(iata);
  return a ? flagUrl(a.country_iso2) : null;
}

/* ------------------------------------------------------------------ */
/* البحث                                                               */
/* ------------------------------------------------------------------ */

/** يبحث بالرمز أو المدينة أو اسم المطار أو الدولة، عربيًا وإنجليزيًا. */
export function searchAirports(query: string, limit = 30): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRPORTS.slice(0, limit);

  const scored: { a: Airport; score: number }[] = [];
  for (const a of AIRPORTS) {
    const iata = a.iata.toLowerCase();
    let score = 0;

    if (iata === q) score = 100;
    else if (iata.startsWith(q)) score = 90;
    else if (a.city_ar.startsWith(q) || a.city_en.toLowerCase().startsWith(q)) score = 80;
    else if (a.city_ar.includes(q) || a.city_en.toLowerCase().includes(q)) score = 60;
    else if (a.airport_name_ar.includes(q) || a.airport_name_en.toLowerCase().includes(q)) score = 40;
    else if (a.country_ar.includes(q) || a.country_en.toLowerCase().includes(q)) score = 20;

    if (score) scored.push({ a, score });
  }

  return scored
    .sort((x, y) => y.score - x.score || x.a.city_ar.localeCompare(y.a.city_ar, 'ar'))
    .slice(0, limit)
    .map((s) => s.a);
}

/** «لندن LHR» — الصيغة المخزَّنة في حقول التذكرة. */
export function airportLabel(a: Airport): string {
  return `${a.city_ar} ${a.iata}`;
}

/* ------------------------------------------------------------------ */
/* الدول                                                               */
/* ------------------------------------------------------------------ */

export type Country = { iso: string; ar: string; en: string };

/** قائمة الدول الفريدة المشتقّة من بيانات المطارات، مرتّبة عربيًا. */
export const COUNTRIES: Country[] = (() => {
  const map = new Map<string, Country>();
  for (const a of AIRPORTS) {
    const iso = a.country_iso2?.toUpperCase();
    if (!iso || map.has(iso)) continue;
    map.set(iso, { iso, ar: a.country_ar, en: a.country_en });
  }
  return [...map.values()].sort((x, y) => x.ar.localeCompare(y.ar, 'ar'));
})();

export function countryByIso(iso: string | undefined | null): Country | undefined {
  if (!iso) return undefined;
  return COUNTRIES.find((c) => c.iso === iso.toUpperCase());
}

export function searchCountries(query: string): Country[] {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRIES;
  return COUNTRIES.filter(
    (c) => c.ar.includes(q) || c.en.toLowerCase().includes(q) || c.iso.toLowerCase() === q,
  );
}
