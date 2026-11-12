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
