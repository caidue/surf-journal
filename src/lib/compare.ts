import type { Spot } from '../types';
import type { Derived } from './conditions';
import { distance, similarityPct, SPOT_FEATURES } from './similarity';
import { isoToMin } from './time';

/**
 * Lining a logged session up against another day (the spot's Sessions tab): the session is moved
 * along the day to the minute, and each surfed hour is compared with the day's conditions at
 * the time it lands on (interpolated between the forecast's hours). The best match (and the list's
 * "27 % like today") is the position with the closest single pair that keeps at least an hour of
 * the session in daylight: night hours may be part of it, but it is never all night.
 */

export interface DayHour {
  d: Derived;
  daylight: boolean;
}

export interface Pair {
  /** Start minute of the surfed hour (on the session's day) and the minute of the day it lands on. */
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

/** The session moves (dragging, Best match) to the minute; the buttons add 15 or 30. */
export const SHIFT_STEP = 1;

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

const lerp = (a: number | null, b: number | null, f: number) => (a == null || b == null ? (f < 0.5 ? a : b) : a + (b - a) * f);
const lerpDeg = (a: number | null, b: number | null, f: number) => {
  if (a == null || b == null) return f < 0.5 ? a : b;
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * f + 360) % 360;
};

/**
 * The day's conditions at any minute: the forecast is hourly, so between two hours the compared
 * values are interpolated (directions the short way round).
 */
export function dayAt(dm: Map<number, DayHour>, min: number): DayHour | null {
  const h0 = Math.floor(min / 60) * 60;
  const f = (min - h0) / 60;
  const a = dm.get(h0);
  const b = dm.get(h0 + 60);
  if (!a) return f === 0 ? null : b && f >= 0.5 ? b : null;
  if (f === 0 || !b) return a;
  const x = a.d;
  const y = b.d;
  const d: Derived = {
    ...x,
    hb: lerp(x.hb, y.hb, f),
    hIn: lerp(x.hIn, y.hIn, f),
    tDom: lerp(x.tDom, y.tDom, f),
    dirDom: lerpDeg(x.dirDom, y.dirDom, f),
    uOff: lerp(x.uOff, y.uOff, f),
    uX: lerp(x.uX, y.uX, f),
    windSpeed: lerp(x.windSpeed, y.windSpeed, f),
    windDir: lerpDeg(x.windDir, y.windDir, f),
    tideNorm: lerp(x.tideNorm, y.tideNorm, f),
    tideTrend: lerp(x.tideTrend, y.tideTrend, f),
  };
  return { d, daylight: f < 0.5 ? a.daylight : b.daylight };
}

/** The session's surfed hours moved `shift` minutes: each compared with the day at the minute it lands on. */
export function align(spot: Spot, surfed: Derived[], day: DayHour[], shift: number): Alignment {
  const dm = byMinute(day);
  const pairs: Pair[] = [];
  for (const s of surfed) {
    const sm = isoToMin(s.time);
    if (sm == null) continue;
    const at = sm + shift;
    const h = dayAt(dm, at);
    const p = h && pair(spot, s, sm, h, at);
    if (p) pairs.push(p);
  }
  const best = pairs.reduce<Pair | null>((a, b) => (!a || b.pct > a.pct ? b : a), null);
  const mean = pairs.length ? Math.round(pairs.reduce((a, b) => a + b.pct, 0) / pairs.length) : null;
  return { shift, pairs, mean, best };
}

/** A best match keeps at least this much of the session in daylight (all of it when shorter). */
export const MIN_DAYLIGHT = 60;

/** Minutes of [start, end] between sunrise and sunset. */
export const daylightOverlap = (start: number, end: number, rise: number, set: number) => Math.max(0, Math.min(end, set) - Math.max(start, rise));

/**
 * The best position of the session on the day (to the minute): the closest single pair, the
 * better average on ties, among positions with at least MIN_DAYLIGHT minutes in daylight. This is
 * what the list's "% like today" shows.
 */
export function bestMatch(spot: Spot, surfed: Derived[], day: DayHour[], startMin: number, endMin: number, rise: number, set: number): Alignment | null {
  const need = Math.min(MIN_DAYLIGHT, endMin - startMin);
  const [lo, hi] = shiftRange(startMin, endMin, 0, 1440);
  let best: Alignment | null = null;
  for (let sh = lo; sh <= hi; sh += SHIFT_STEP) {
    if (daylightOverlap(startMin + sh, endMin + sh, rise, set) < need) continue;
    const a = align(spot, surfed, day, sh);
    if (!a.best) continue;
    if (!best || a.best.pct > best.best!.pct || (a.best.pct === best.best!.pct && (a.mean ?? 0) > (best.mean ?? 0))) best = a;
  }
  return best;
}

/** Shifts (whole minutes) that keep the whole session between `from` and `to` minutes of the day. */
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
