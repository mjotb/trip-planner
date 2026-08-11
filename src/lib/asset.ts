/** مسار أصل ثابت يحترم basePath عند النشر تحت مجلد فرعي (GitHub Pages). */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function asset(path: string): string {
  return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function iconUrl(name: string): string {
  return asset(`/assets/ui/${name}.svg`);
}

export function flagUrl(name: string): string {
  return asset(`/assets/flags/${name}.svg`);
}

/** لون بشفافية من هيكس. */
export function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
