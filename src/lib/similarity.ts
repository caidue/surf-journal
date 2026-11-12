import type { HourConditions, Spot } from '../types';
import type { Derived } from './conditions';
import { angdiff, toRad } from './geo';

/**
 * Analog-style similarity (weighted, tolerance-scaled Euclidean distance, Gower-style
 * handling of missing values). Two flavours:
 *  - spot-relative: for comparing hours at the SAME spot (uses breaking height, swell angle
 *    vs the spot's window, offshore/cross wind components, tide stage);
 *  - absolute: for comparing regional sea states across DIFFERENT spots.
 */

export interface FeatureSpec {
  key: string;
  label: string;
  weight: number;
  tol: number;
  get: (d: Derived, spot: Spot) => number | null;
  angular?: boolean;
}

export const SPOT_FEATURES: FeatureSpec[] = [
  // Size on a log scale: 0.3 m matters at 0.8 m, much less at 3 m.
  { key: 'size', label: 'wave size', weight: 3, tol: 0.25, get: (d) => (d.hb == null ? null : Math.log(d.hb + 0.2)) },
  { key: 'period', label: 'swell period', weight: 1.5, tol: 2, get: (d) => d.tDom },
  // 20°: model swell directions are uncertain by ~10–15°, and a swell turning out of the spot's
  // window already shows up in the size feature (via exposure), so don't double-punish it.
  { key: 'swellDir', label: 'swell direction', weight: 1.5, tol: 20, angular: true, get: (d) => d.dirDom },
  { key: 'offshore', label: 'offshore/onshore wind', weight: 2.5, tol: 9, get: (d) => d.uOff },
  { key: 'cross', label: 'cross-shore wind', weight: 1, tol: 9, get: (d) => d.uX },
  { key: 'tide', label: 'tide height', weight: 2, tol: 0.18, get: (d) => d.tideNorm },
  { key: 'tideTrend', label: 'rising/falling tide', weight: 1, tol: 0.6, get: (d) => d.tideTrend },
];

export interface Distance {
  d: number;
  /** Weighted squared contribution per feature (to explain which condition differed most). */
  parts: Record<string, number>;
}

/**
 * Reference weight: a difference of one tolerance in the heaviest feature (size, w = 3)
 * gives d = 1. Contributions are SUMMED (not averaged), so one big mismatch in a key
 * condition is not diluted by the features that happen to match.
 */
export const W_REF = 3;

export function distance(a: Derived, b: Derived, spot: Spot, specs = SPOT_FEATURES): Distance {
  let num = 0;
  let wsum = 0;
  let wall = 0;
  const parts: Record<string, number> = {};
  for (const f of specs) {
    wall += f.weight;
    const va = f.get(a, spot);
    const vb = f.get(b, spot);
    if (va == null || vb == null) continue;
    const delta = f.angular ? angdiff(va, vb) : va - vb;
    const c = f.weight * (delta / f.tol) ** 2;
    parts[f.key] = c;
    num += c;
    wsum += f.weight;
  }
  if (wsum === 0) return { d: Infinity, parts };
  // Gower-style: scale up when features are missing so gaps don't look like matches.
  return { d: Math.sqrt((num * (wall / wsum)) / W_REF), parts };
}

/** Gaussian kernel: 1 at identical conditions, 0.61 at one tolerance, ~0 beyond the cut-off. */
export function kernel(d: number, cutoff = 2.5): number {
  if (!Number.isFinite(d) || d > cutoff) return 0;
  return Math.exp((-d * d) / 2);
}

/** Sessions from this kernel value up are listed as "in similar conditions" (d ≈ 1.67). */
export const SIMILAR_MIN_K = 0.25;

/** Key of the feature that contributes most to the distance (if it matters at all). */
export function mostDifferentKey(parts: Record<string, number>): string | null {
  let best: string | null = null;
  let max = 0.5;
  for (const [k, v] of Object.entries(parts)) {
    if (v > max) {
      max = v;
      best = k;
    }
  }
  return best;
}

export function mostDifferent(parts: Record<string, number>, specs = SPOT_FEATURES): string | null {
  const best = mostDifferentKey(parts);
  return best ? specs.find((s) => s.key === best)?.label ?? best : null;
}

/* ---------- absolute (cross-spot) similarity on raw offshore data ---------- */

export interface AbsFeatures {
  h: number | null;
  t: number | null;
  dir: number | null;
  windU: number | null;
  windV: number | null;
}

export function absFeatures(c: HourConditions): AbsFeatures {
  const h = c.swellH ?? c.waveH;
  const t = c.swellPer ?? c.wavePer;
  const dir = c.swellDir ?? c.waveDir;
  let windU: number | null = null;
  let windV: number | null = null;
  if (c.windSpeed != null && c.windDir != null) {
    windU = c.windSpeed * Math.sin(toRad(c.windDir));
    windV = c.windSpeed * Math.cos(toRad(c.windDir));
  }
  return { h, t, dir, windU, windV };
}

export function absDistance(a: AbsFeatures, b: AbsFeatures): number {
  let num = 0;
  let wsum = 0;
  const add = (w: number, delta: number | null, tol: number) => {
    if (delta == null || Number.isNaN(delta)) return;
    num += w * (delta / tol) ** 2;
    wsum += w;
  };
  add(3, a.h != null && b.h != null ? Math.log(a.h + 0.2) - Math.log(b.h + 0.2) : null, 0.25);
  add(1.5, a.t != null && b.t != null ? a.t - b.t : null, 2);
  add(2, a.dir != null && b.dir != null ? angdiff(a.dir, b.dir) : null, 15);
  if (a.windU != null && b.windU != null && a.windV != null && b.windV != null) {
    const dv = Math.hypot(a.windU - b.windU, a.windV - b.windV);
    add(2.5, dv, 10);
  }
  return wsum ? Math.sqrt((num * (9 / wsum)) / W_REF) : Infinity;
}

export function similarityPct(d: number): number {
  return Math.round(100 * Math.exp((-d * d) / 2));
}
