import type { Level, Spot, SpotLevel, TidePref } from '../types';
import type { Derived } from './conditions';

/**
 * Rule-based spot rating, synthesised from public descriptions of Surf-Forecast,
 * Magicseaweed and open-source raters: size (energy) × period × wind × tide,
 * multiplicative so that one fatal flaw sinks the score.
 */

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function fSize(hb: number | null, min: number, max: number): number {
  if (hb == null) return 0;
  if (hb < min * 0.5) return 0;
  if (hb < min) return 0.6 * ((hb - min * 0.5) / (min * 0.5));
  if (hb <= max) {
    const sweet = Math.sqrt(min * max);
    const spread = Math.max(0.2, 0.5 * Math.log(max / min));
    return 0.65 + 0.35 * clamp(1 - Math.abs(Math.log(hb / sweet)) / spread, 0, 1);
  }
  return 0.65 * clamp(1 - (hb - max) / (0.5 * max), 0, 1);
}

export function fPeriod(t: number | null): number {
  if (t == null) return 0.5;
  if (t < 5) return 0.25;
  if (t < 8) return 0.25 + ((t - 5) / 3) * 0.5;
  if (t < 11) return 0.75 + ((t - 8) / 3) * 0.25;
  return 1;
}

export function fWind(speed: number | null, uOff: number | null, uX: number | null): number {
  if (speed == null || uOff == null || uX == null) return 0.8;
  if (speed < 6) return 1;
  const on = Math.max(0, -uOff);
  const off = Math.max(0, uOff);
  let f = 1 - Math.min(1, on / 22) * 0.85 - Math.min(1, uX / 35) * 0.5;
  if (off > 30) f *= Math.max(0.4, 1 - (off - 30) / 40);
  if (speed > 45) f *= 0.25;
  return clamp(f, 0.05, 1);
}

const TIDE_RANGE: Record<TidePref, [number, number]> = {
  low: [0, 0.35],
  'low-mid': [0, 0.6],
  mid: [0.25, 0.75],
  'mid-high': [0.4, 1],
  high: [0.65, 1],
  all: [0, 1],
};

export function fTide(norm: number | null, pref: TidePref): number {
  if (norm == null || pref === 'all') return 1;
  const [lo, hi] = TIDE_RANGE[pref];
  const dist = norm < lo ? lo - norm : norm > hi ? norm - hi : 0;
  return Math.max(0.3, 1 - dist * 2.2);
}

export interface Quality {
  /** 0-10 overall (relative to what the spot can do). */
  q: number;
  /** 0-10 ignoring wind ("solid stars"), to show how much wind is costing. */
  potential: number;
  factors: { size: number; period: number; wind: number; tide: number };
}

export function quality(spot: Spot, d: Derived): Quality {
  const size = fSize(d.hb, spot.minSize, spot.maxSize);
  const period = fPeriod(d.tDom);
  const wind = fWind(d.windSpeed, d.uOff, d.uX);
  const tide = fTide(d.tideNorm, spot.tide);
  const potential = 10 * size * period * tide;
  return { q: potential * wind, potential, factors: { size, period, wind, tide } };
}

export type Suit = 'good' | 'ok' | 'challenging' | 'unsuitable';

export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const LEVEL_RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };
const SPOT_REQ: Record<SpotLevel, number> = { beginner: 0, all: 0, intermediate: 1, advanced: 2, expert: 3 };
/** Breaking height (m) up to which each level is comfortable. Blog/vendor consensus, tune per user. */
export const SIZE_CAP: Record<Level, number> = { beginner: 1.0, intermediate: 1.8, advanced: 3.0, expert: 6.0 };

export interface Suitability {
  status: Suit;
  factor: number;
  reasons: string[];
}

export function suitability(spot: Spot, d: Derived, level: Level): Suitability {
  const reasons: string[] = [];
  const rank = LEVEL_RANK[level];
  let status: Suit = 'good';
  const worsen = (s: Suit) => {
    const order: Suit[] = ['good', 'ok', 'challenging', 'unsuitable'];
    if (order.indexOf(s) > order.indexOf(status)) status = s;
  };

  if (rank < SPOT_REQ[spot.level]) {
    worsen('unsuitable');
    reasons.push(`Spot is rated for ${spot.level} surfers`);
  }
  const cap = SIZE_CAP[level];
  if (d.hb != null) {
    if (d.hb > cap * 1.3) {
      worsen('unsuitable');
      reasons.push(`Too big for your level (~${d.hb.toFixed(1)} m)`);
    } else if (d.hb > cap) {
      worsen('challenging');
      reasons.push(`Above your usual size (~${d.hb.toFixed(1)} m)`);
    } else if (d.hb > cap * 0.8) {
      worsen('ok');
      reasons.push('Upper end of your size range');
    }
    if (d.hb > spot.maxSize * 1.15) {
      worsen(level === 'expert' ? 'challenging' : 'unsuitable');
      reasons.push('Bigger than this spot handles well');
    }
    // Long-period swell is far more powerful at the same height.
    if (rank <= 1 && (d.tDom ?? 0) >= 13 && d.hb > cap * 0.7) {
      worsen('challenging');
      reasons.push('Long-period swell: more power than the height suggests');
    }
  }
  if (rank === 0) {
    if (spot.bottom !== 'sand' && spot.level !== 'beginner' && spot.level !== 'all') {
      worsen('challenging');
      reasons.push(`${spot.bottom} bottom`);
    }
    const risky = spot.hazards.filter((h) => /rip|current|shallow|rock|urchin|local/i.test(h));
    if (risky.length) {
      worsen('ok');
      reasons.push(`Watch out: ${risky.join(', ')}`);
    }
  }
  if (d.windSpeed != null) {
    if (d.windSpeed > 45) {
      worsen(rank >= 2 ? 'challenging' : 'unsuitable');
      reasons.push('Very strong wind');
    } else if (d.windSpeed > 30 && rank === 0) {
      worsen('challenging');
      reasons.push('Strong wind');
    }
  }
  const factor = { good: 1, ok: 0.85, challenging: 0.5, unsuitable: 0 }[status];
  return { status, factor, reasons };
}

/** Recommendability 0-10 for a given level = quality × suitability. */
export function recommendability(spot: Spot, d: Derived, level: Level): { score: number; quality: Quality; suit: Suitability } {
  const qq = quality(spot, d);
  const suit = suitability(spot, d, level);
  return { score: qq.q * suit.factor, quality: qq, suit };
}

export function scoreColor(score: number | null | undefined): string {
  if (score == null) return '#94a3b8';
  if (score < 1.5) return '#94a3b8';
  if (score < 3.5) return '#38bdf8';
  if (score < 5.5) return '#14b8a6';
  if (score < 7.5) return '#16a34a';
  return '#ca8a04';
}

export function scoreLabel(score: number): string {
  if (score < 1.5) return 'flat / poor';
  if (score < 3.5) return 'poor-fair';
  if (score < 5.5) return 'fair';
  if (score < 7.5) return 'good';
  return 'epic';
}

export const SUIT_COLOR: Record<Suit, string> = {
  good: '#16a34a',
  ok: '#65a30d',
  challenging: '#d97706',
  unsuitable: '#dc2626',
};
