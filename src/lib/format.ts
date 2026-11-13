import type { Settings } from '../types';
import { compass } from './geo';
import { tideLabel, windKind, WIND_LABEL, type Derived } from './conditions';

export function fmtHeight(m: number | null | undefined, unit: Settings['heightUnit'], digits = 1): string {
  if (m == null) return '–';
  return unit === 'ft' ? `${(m * 3.281).toFixed(digits === 1 ? 0 : digits)} ft` : `${m.toFixed(digits)} m`;
}

/** Breaking-height range (face) shown to users: ±20 % around the estimate. */
export function fmtSurfRange(hb: number | null | undefined, unit: Settings['heightUnit']): string {
  if (hb == null) return '–';
  const lo = hb * 0.8;
  const hi = hb * 1.2;
  if (unit === 'ft') return `${Math.round(lo * 3.281)}–${Math.round(hi * 3.281)} ft`;
  return `${lo.toFixed(1)}–${hi.toFixed(1)} m`;
}

export function fmtWind(kmh: number | null | undefined, unit: Settings['windUnit']): string {
  if (kmh == null) return '–';
  return unit === 'kn' ? `${Math.round(kmh / 1.852)} kn` : `${Math.round(kmh)} km/h`;
}

export function fmtSwell(h: number | null, t: number | null, dir: number | null, unit: Settings['heightUnit']): string {
  if (h == null) return '–';
  return `${fmtHeight(h, unit)} @ ${t != null ? Math.round(t) : '–'} s ${compass(dir)}`;
}

export const fmtScore = (v: number | null | undefined) => (v == null ? '–' : v.toFixed(1));

/** One similarity feature of an hour in words, e.g. "1.6 m", "NNW 330°", "cross-onshore 14 km/h". */
export function fmtFeature(key: string, d: Derived | undefined, s: Pick<Settings, 'heightUnit' | 'windUnit'>): string {
  if (!d) return '–';
  switch (key) {
    case 'size':
      return fmtHeight(d.hb, s.heightUnit);
    case 'period':
      return d.tDom == null ? '–' : `${Math.round(d.tDom)} s`;
    case 'swellDir':
      return d.dirDom == null ? '–' : `${compass(d.dirDom)} ${Math.round(d.dirDom)}°`;
    case 'offshore':
    case 'cross': {
      const k = windKind(d);
      return k ? `${WIND_LABEL[k]} ${fmtWind(d.windSpeed, s.windUnit)}` : '–';
    }
    case 'tide':
    case 'tideTrend':
      return `${tideLabel(d.tideNorm, d.tideTrend)} tide`;
    default:
      return '–';
  }
}

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Oct–Mar" style summary of a set of months (handles wrapping over the new year). */
export function monthRanges(months: number[]): string {
  const set = new Set(months);
  if (!set.size) return '';
  if (set.size === 12) return 'all year';
  // Start a run at a month whose previous month is not in the set.
  const out: string[] = [];
  for (let m = 1; m <= 12; m++) {
    if (!set.has(m) || set.has(((m + 10) % 12) + 1)) continue;
    let end = m;
    while (set.has((end % 12) + 1) && (end % 12) + 1 !== m) end = (end % 12) + 1;
    out.push(end === m ? MONTH_NAMES[m - 1] : `${MONTH_NAMES[m - 1]}–${MONTH_NAMES[end - 1]}`);
  }
  return out.join(', ');
}

/** Colour ramp for wave energy (kJ per metre of crest): light grey → deep blue. */
export function energyColors(kj: number | null | undefined): { bg: string; fg: string } | null {
  if (kj == null) return null;
  const steps: [number, string, string][] = [
    [100, '#f1f5f9', '#475569'],
    [250, '#e0f2fe', '#0c4a6e'],
    [500, '#bae6fd', '#0c4a6e'],
    [1000, '#7dd3fc', '#0c4a6e'],
    [2000, '#38bdf8', '#082f49'],
    [3500, '#0284c7', '#ffffff'],
    [Infinity, '#075985', '#ffffff'],
  ];
  const [, bg, fg] = steps.find(([max]) => kj < max)!;
  return { bg, fg };
}

export const fmtEnergy = (kj: number | null | undefined) => (kj == null ? '–' : kj >= 1000 ? `${(kj / 1000).toFixed(1)}k` : `${Math.round(kj)}`);
