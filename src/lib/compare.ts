import type { Spot } from '../types';
import type { Derived } from './conditions';
import { distance, similarityPct, SPOT_FEATURES } from './similarity';
import { isoToMin } from './time';

/**
 * Lining a logged session up against another day (the spot's Sessions tab): the session is moved
 * along the day in 15-minute steps, and each surfed hour is compared with the day's hour it lands
 * on. The list's "27 % like today" is the closest single pair of a surfed hour and a daylight hour.
 */

export interface DayHour {
  d: Derived;
  daylight: boolean;
}

export interface Pair {
  /** Start minute of the surfed hour (on the session's day) and of the day's hour it lands on. */
  sessMin: number;
  dayMin: number;
  sess: Derived;
  day: Derived;
  pct: number;
  parts: Record<string, number>;
}

export interface Alignment {
  /** Minutes the session is moved by. */
  shift: number;
  pairs: Pair[];
  /** Average similarity of the lined-up pairs (null when none line up). */
  mean: number | null;
  /** The closest pair. */
  best: Pair | null;
}

export const SHIFT_STEP = 15;

const byMinute = (hours: DayHour[]) => {
  const m = new Map<number, DayHour>();
  for (const h of hours) {
    const t = isoToMin(h.d.time);
    if (t != null) m.set(t, h);
  }
  return m;
};

const pair = (spot: Spot, s: Derived, sm: number, h: DayHour, dm: number): Pair | null => {
  const dist = distance(h.d, s, spot);
  if (!Number.isFinite(dist.d)) return null;
  return { sessMin: sm, dayMin: dm, sess: s, day: h.d, pct: similarityPct(dist.d), parts: dist.parts };
};

/** The session's surfed hours moved `shift` minutes: each compared with the day's hour it lands on (nearest whole hour). */
export function align(spot: Spot, surfed: Derived[], day: DayHour[], shift: number): Alignment {
  const dm = byMinute(day);
  const pairs: Pair[] = [];
  for (const s of surfed) {
    const sm = isoToMin(s.time);
    if (sm == null) continue;
    const at = Math.round((sm + shift) / 60) * 60;
    const h = dm.get(at);
    const p = h && pair(spot, s, sm, h, at);
    if (p) pairs.push(p);
  }
  const best = pairs.reduce<Pair | null>((a, b) => (!a || b.pct > a.pct ? b : a), null);
  const mean = pairs.length ? Math.round(pairs.reduce((a, b) => a + b.pct, 0) / pairs.length) : null;
  return { shift, pairs, mean, best };
}

/** The closest single pair of a surfed hour and a DAYLIGHT hour of the day: the list's "% like today". */
export function closestPair(spot: Spot, surfed: Derived[], day: DayHour[]): Pair | null {
  let best: Pair | null = null;
  for (const s of surfed) {
    const sm = isoToMin(s.time);
    if (sm == null) continue;
    for (const h of day) {
      if (!h.daylight) continue;
      const dm = isoToMin(h.d.time);
      const p = dm == null ? null : pair(spot, s, sm, h, dm);
      if (p && (!best || p.pct > best.pct)) best = p;
    }
  }
  return best;
}

/**
 * Shifts (multiples of 15 min) that keep the whole session between `from` and `to` (sunrise and
 * sunset), so it is never lined up with the night. A session longer than the day may start before
 * `from` and end after `to`, but stays over it.
 */
export function shiftRange(startMin: number, endMin: number, from: number, to: number, step = SHIFT_STEP): [number, number] {
  let lo = Math.ceil((from - startMin) / step) * step;
  let hi = Math.floor((to - endMin) / step) * step;
  if (lo > hi) [lo, hi] = [hi, lo];
  return [lo, hi];
}

/** How close one condition is, 0–100 (100 = the same; ~61 = off by its usual tolerance). */
export function featureCloseness(key: string, parts: Record<string, number>): number | null {
  const f = SPOT_FEATURES.find((x) => x.key === key);
  const c = parts[key];
  if (!f || c == null) return null;
  return Math.round(100 * Math.exp(-c / f.weight / 2));
}
