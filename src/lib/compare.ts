import type { Spot } from '../types';
import type { Derived } from './conditions';
import { distance, similarityPct, SPOT_FEATURES } from './similarity';
import { isoToMin } from './time';

/**
 * Lining a logged session up against another day (the spot's Sessions tab): the session's surfed
 * hours, shifted by whole hours, next to that day's hours. The list's "27 % like today" is the
 * closest single pair of a surfed hour and a daylight hour of the day; here you can see it and
 * slide the session along the day to compare other times yourself.
 */

export interface DayHour {
  d: Derived;
  daylight: boolean;
}

export interface Pair {
  /** Minute of the session hour (on the session's day) and of the day hour it is lined up with. */
  sessMin: number;
  dayMin: number;
  sess: Derived;
  day: Derived;
  pct: number;
  parts: Record<string, number>;
}

export interface Alignment {
  /** Minutes the session is moved by (a multiple of 60). */
  shift: number;
  pairs: Pair[];
  /** Average similarity of the lined-up pairs (null when none line up). */
  mean: number | null;
  /** The closest pair. */
  best: Pair | null;
}

const byMinute = (hours: DayHour[]) => {
  const m = new Map<number, DayHour>();
  for (const h of hours) {
    const t = isoToMin(h.d.time);
    if (t != null) m.set(t, h);
  }
  return m;
};

/** The session's surfed hours lined up with the day's hours `shift` minutes later. */
export function align(spot: Spot, surfed: Derived[], day: DayHour[], shift: number, daylightOnly = false): Alignment {
  const dm = byMinute(day);
  const pairs: Pair[] = [];
  for (const s of surfed) {
    const sm = isoToMin(s.time);
    if (sm == null) continue;
    const h = dm.get(sm + shift);
    if (!h || (daylightOnly && !h.daylight)) continue;
    const dist = distance(h.d, s, spot);
    if (!Number.isFinite(dist.d)) continue;
    pairs.push({ sessMin: sm, dayMin: sm + shift, sess: s, day: h.d, pct: similarityPct(dist.d), parts: dist.parts });
  }
  const best = pairs.reduce<Pair | null>((a, b) => (!a || b.pct > a.pct ? b : a), null);
  const mean = pairs.length ? Math.round(pairs.reduce((a, b) => a + b.pct, 0) / pairs.length) : null;
  return { shift, pairs, mean, best };
}

/**
 * Shifts (whole hours) that keep at least one surfed hour inside [from, to) minutes of the day, so
 * every pair the list's "% like today" can come from is reachable.
 */
export function shiftRange(surfed: Derived[], from: number, to: number): [number, number] | null {
  const mins = surfed.map((d) => isoToMin(d.time)).filter((m): m is number => m != null);
  if (!mins.length) return null;
  const first = Math.min(...mins);
  const last = Math.max(...mins);
  const lo = Math.ceil((from - last) / 60) * 60;
  const hi = Math.floor((to - 60 - first) / 60) * 60;
  return lo <= hi ? [lo, hi] : null;
}

/**
 * Where the session lines up best: the shift with the closest single pair on daylight hours (the
 * list's "% like today"), the better average on ties.
 */
export function bestAlignment(spot: Spot, surfed: Derived[], day: DayHour[], range: [number, number]): Alignment | null {
  let best: Alignment | null = null;
  for (let sh = range[0]; sh <= range[1]; sh += 60) {
    const a = align(spot, surfed, day, sh, true);
    if (!a.best) continue;
    if (!best || a.best.pct > best.best!.pct || (a.best.pct === best.best!.pct && (a.mean ?? 0) > (best.mean ?? 0))) best = a;
  }
  return best;
}

/** How close one condition is, 0–100 (100 = the same; ~61 = off by its usual tolerance). */
export function featureCloseness(key: string, parts: Record<string, number>): number | null {
  const f = SPOT_FEATURES.find((x) => x.key === key);
  const c = parts[key];
  if (!f || c == null) return null;
  return Math.round(100 * Math.exp(-c / f.weight / 2));
}
