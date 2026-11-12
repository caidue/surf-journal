import type { DayInfo, HourConditions, Level, Session, Settings, Spot } from '../types';
import { SLOT_MIN } from '../types';
import { deriveSeries, windKind, type Derived } from './conditions';
import { recommendability, type Quality, type Suitability } from './rating';
import { distance, kernel, mostDifferent } from './similarity';
import { daysBetween, isoToMin } from './time';

/* ------------------------------------------------------------------ */
/* Session helpers                                                     */
/* ------------------------------------------------------------------ */

/** Mean rating of a category between two minutes of the day (only drawn slots count). */
export function curveMean(s: Session, cat: string, fromMin = s.startMin, toMin = s.endMin): number | null {
  const curve = s.curves[cat];
  if (!curve) return null;
  const a = Math.max(s.startMin, fromMin);
  const b = Math.min(s.endMin, toMin);
  let sum = 0;
  let n = 0;
  for (let m = a; m < b; m += SLOT_MIN) {
    const v = curve[Math.floor(m / SLOT_MIN)];
    if (v != null) {
      sum += v;
      n++;
    }
  }
  return n ? sum / n : null;
}

/** Rating used for learning: category curve in the window → whole-session curve → overall rating. */
export function ratingFor(s: Session, cat: string, fromMin?: number, toMin?: number): number | null {
  return (
    (fromMin != null ? curveMean(s, cat, fromMin, toMin) : null) ??
    curveMean(s, cat) ??
    (cat === 'fun' ? s.overall : null)
  );
}

export function sessionOverall(s: Session): number | null {
  return s.overall ?? curveMean(s, 'fun');
}

/** Indices of the hourly conditions that overlap the surfed time range. */
export function surfedHourIdx(s: Session): number[] {
  const out: number[] = [];
  s.conditions.forEach((h, i) => {
    const m = isoToMin(h.time);
    if (m == null) return;
    if (m + 60 > s.startMin && m < s.endMin) out.push(i);
  });
  return out;
}

const LEVEL_RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

export interface SessionWeight {
  w: number;
  why: string | null;
}

/**
 * How much a past session counts as evidence today: excluded → 0, before the
 * "ignore before" date → 0, exponential time decay, and down-weighting when the
 * surfer's level at the time differs from today's.
 */
export function sessionWeight(s: Session, settings: Pick<Settings, 'halfLifeMonths' | 'ignoreBefore' | 'level'>, today: string): SessionWeight {
  if (s.excluded) return { w: 0, why: 'marked not relevant' };
  if (settings.ignoreBefore && s.date < settings.ignoreBefore) return { w: 0, why: 'before your cut-off date' };
  const ageMonths = Math.max(0, daysBetween(s.date, today)) / 30.44;
  const decay = Math.pow(0.5, ageMonths / Math.max(1, settings.halfLifeMonths));
  const gap = Math.abs(LEVEL_RANK[s.skillAtTime] - LEVEL_RANK[settings.level]);
  const kappa = gap === 0 ? 1 : gap === 1 ? 0.5 : 0.2;
  return { w: decay * kappa, why: gap ? 'logged at a different skill level' : null };
}

/* ------------------------------------------------------------------ */
/* Size calibration from observed sizes                                */
/* ------------------------------------------------------------------ */

export const OBSERVED_SIZES: { id: string; label: string; m: number }[] = [
  { id: 'flat', label: 'Flat', m: 0.15 },
  { id: 'ankle', label: 'Ankle', m: 0.3 },
  { id: 'knee', label: 'Knee', m: 0.45 },
  { id: 'waist', label: 'Waist', m: 0.75 },
  { id: 'chest', label: 'Chest', m: 1.1 },
  { id: 'head', label: 'Head high', m: 1.6 },
  { id: 'overhead', label: 'Overhead', m: 2.2 },
  { id: 'double', label: 'Double overhead', m: 3.4 },
  { id: 'bigger', label: 'Bigger', m: 5 },
];

/** Median ratio observed/modelled breaking height over sessions where the size was noted. */
export function calibratedGain(spot: Spot, sessions: Session[]): { gain: number; n: number } {
  const ratios: number[] = [];
  for (const s of sessions) {
    if (s.spotId !== spot.id || s.excluded) continue;
    const obs = OBSERVED_SIZES.find((o) => o.id === s.fields.observedSize);
    if (!obs || obs.id === 'flat') continue;
    const der = deriveSeries(spot, s.conditions, 1);
    const idx = surfedHourIdx(s);
    const hbs = idx.map((i) => der[i].hb).filter((v): v is number => v != null && v > 0.05);
    if (!hbs.length) continue;
    const mean = hbs.reduce((a, b) => a + b, 0) / hbs.length;
    ratios.push(obs.m / mean);
  }
  if (ratios.length < 2) return { gain: spot.gain, n: ratios.length };
  ratios.sort((a, b) => a - b);
  const mid = Math.floor(ratios.length / 2);
  const median = ratios.length % 2 ? ratios[mid] : (ratios[mid - 1] + ratios[mid]) / 2;
  return { gain: Math.max(0.3, Math.min(2.5, median)), n: ratios.length };
}

/* ------------------------------------------------------------------ */
/* Personal prediction (kernel-weighted analogs + rule-based prior)    */
/* ------------------------------------------------------------------ */

export interface HistoryItem {
  session: Session;
  derived: Derived[];
  hours: number[];
  base: SessionWeight;
}

export function buildHistory(spot: Spot, sessions: Session[], settings: Settings, today: string, gain = spot.gain): HistoryItem[] {
  return sessions
    .filter((s) => s.spotId === spot.id)
    .map((s) => ({ session: s, derived: deriveSeries(spot, s.conditions, gain), hours: surfedHourIdx(s), base: sessionWeight(s, settings, today) }));
}

export interface Neighbour {
  session: Session;
  /** Similarity kernel 0..1 for the best-matching hour of that session. */
  k: number;
  /** Final weight incl. decay/exclusion. */
  w: number;
  d: number;
  y: number | null;
  hourIdx: number;
  differs: string | null;
}

export interface Prediction {
  yhat: number;
  mu0: number;
  sumW: number;
  nEff: number;
  neighbours: Neighbour[];
}

export const PRIOR_N0 = 2;

export function matchSession(spot: Spot, target: Derived, h: HistoryItem, cat = 'fun'): Neighbour | null {
  let best: Neighbour | null = null;
  for (const j of h.hours) {
    const dj = h.derived[j];
    if (!dj) continue;
    const dist = distance(target, dj, spot);
    const k = kernel(dist.d);
    if (!best || dist.d < best.d) {
      const m = isoToMin(dj.time) ?? 0;
      best = {
        session: h.session,
        k,
        w: k * h.base.w,
        d: dist.d,
        y: ratingFor(h.session, cat, m, m + 60),
        hourIdx: j,
        differs: mostDifferent(dist.parts),
      };
    }
  }
  return best;
}

export function predict(spot: Spot, target: Derived, mu0: number, history: HistoryItem[], cat = 'fun'): Prediction {
  const neighbours: Neighbour[] = [];
  let sw = 0;
  let sw2 = 0;
  let swy = 0;
  for (const h of history) {
    const nb = matchSession(spot, target, h, cat);
    if (!nb) continue;
    neighbours.push(nb);
    if (nb.y == null || nb.w <= 0) continue;
    sw += nb.w;
    sw2 += nb.w * nb.w;
    swy += nb.w * nb.y;
  }
  neighbours.sort((a, b) => a.d - b.d);
  const yhat = (PRIOR_N0 * mu0 + swy) / (PRIOR_N0 + sw);
  return { yhat, mu0, sumW: sw, nEff: sw2 > 0 ? (sw * sw) / sw2 : 0, neighbours };
}

export type Confidence = 'no history' | 'low' | 'medium' | 'high';
export function confidence(p: Pick<Prediction, 'sumW' | 'nEff'>): Confidence {
  if (p.sumW < 0.25) return 'no history';
  if (p.sumW < 1.2) return 'low';
  if (p.sumW < 3.5) return 'medium';
  return 'high';
}

/* ------------------------------------------------------------------ */
/* Day recommendation per spot                                         */
/* ------------------------------------------------------------------ */

export interface HourRec {
  idx: number;
  time: string;
  daylight: boolean;
  derived: Derived;
  quality: Quality;
  suit: Suitability;
  rule: number;
  pred: Prediction;
  /** Final score 0-10 (0 when unsuitable for the level). */
  score: number;
}

export interface SpotRec {
  spot: Spot;
  gain: number;
  /** All hours of the day (night hours flagged daylight=false). */
  hours: HourRec[];
  /** Best upcoming daylight hour (null when no daylight is left). */
  best: HourRec | null;
  bestWindow: [number, number] | null; // minutes
  /** Current hour when looking at today (any time of day). */
  now: HourRec | null;
  /** True when looking at today and no daylight hours are left. */
  dayOver: boolean;
}

export function daylight(days: DayInfo[] | undefined, date: string): [number, number] {
  const d = days?.find((x) => x.date === date);
  const rise = isoToMin(d?.sunrise) ?? 7 * 60;
  const set = isoToMin(d?.sunset) ?? 19 * 60;
  return [rise, set];
}

export function recommendSpotDay(
  spot: Spot,
  hours: HourConditions[],
  days: DayInfo[] | undefined,
  sessions: Session[],
  settings: Settings,
  level: Level,
  date: string,
  today: string,
  nowMin: number | null,
): SpotRec {
  const { gain } = calibratedGain(spot, sessions);
  const derivedAll = deriveSeries(spot, hours, gain);
  const history = buildHistory(spot, sessions, settings, today, gain);
  const [rise, set] = daylight(days, date);
  const recs: HourRec[] = [];
  hours.forEach((h, i) => {
    if (!h.time.startsWith(date)) return;
    const m = isoToMin(h.time)!;
    const daylight = m + 60 > rise && m < set;
    const d = derivedAll[i];
    const r = recommendability(spot, d, level);
    const pred = predict(spot, d, r.score, history);
    const score = r.suit.status === 'unsuitable' ? 0 : pred.yhat;
    recs.push({ idx: i, time: h.time, daylight, derived: d, quality: r.quality, suit: r.suit, rule: r.score, pred, score });
  });

  // Daylight hours only; upcoming ones only when looking at today.
  const candidates = recs.filter((r) => r.daylight && (nowMin == null || (isoToMin(r.time) ?? 0) + 60 > nowMin));
  let best: HourRec | null = null;
  let bestWindow: [number, number] | null = null;
  let bestVal = -1;
  for (let i = 0; i < candidates.length; i++) {
    const a = candidates[i];
    const b = candidates[i + 1];
    const contiguous = b && (isoToMin(b.time) ?? 0) - (isoToMin(a.time) ?? 0) === 60;
    const val = contiguous ? (a.score + b.score) / 2 : a.score;
    if (val > bestVal) {
      bestVal = val;
      best = contiguous && b.score > a.score ? b : a;
      const start = isoToMin(a.time) ?? 0;
      bestWindow = [Math.max(start, rise), Math.min(start + (contiguous ? 120 : 60), set)];
    }
  }
  const now =
    nowMin != null
      ? recs.find((r) => {
          const m = isoToMin(r.time) ?? 0;
          return nowMin >= m && nowMin < m + 60;
        }) ?? null
      : null;
  return { spot, gain, hours: recs, best, bestWindow, now, dayOver: nowMin != null && recs.length > 0 && candidates.length === 0 };
}

/* ------------------------------------------------------------------ */
/* Explanations (generated only from computed numbers)                 */
/* ------------------------------------------------------------------ */

export function explain(r: HourRec, fmtSessionDate: (s: Session) => string): string[] {
  const out: string[] = [];
  const rated = r.pred.neighbours.filter((n) => n.y != null && !n.session.excluded);
  const used = rated.filter((n) => n.k >= 0.3 && n.w > 0.05);
  if (used.length) {
    const avg = used.reduce((a, n) => a + n.y! * n.w, 0) / used.reduce((a, n) => a + n.w, 0);
    out.push(`${used.length} past session${used.length > 1 ? 's' : ''} here in similar conditions → you rated them ${avg.toFixed(1)}/10 fun on average.`);
    const c = used[0];
    out.push(
      `Closest match: ${fmtSessionDate(c.session)} (${Math.round(c.k * 100)}% similar) → ${c.y!.toFixed(1)}/10.` +
        (c.differs ? ` Biggest difference: ${c.differs}.` : ''),
    );
  } else if (rated.length) {
    const c = rated[0];
    out.push(
      `Your closest session here (${fmtSessionDate(c.session)}, ${Math.round(c.k * 100)}% similar${c.differs ? `, differs mainly in ${c.differs}` : ''}) is too different to count much: the score is mostly the spot guide for your level.`,
    );
  } else {
    out.push('No logged sessions here yet: the score comes from the spot guide for your level.');
  }
  const f = r.quality.factors;
  const weak: string[] = [];
  if (f.size < 0.4) weak.push('size outside the range this spot likes');
  if (f.period < 0.6) weak.push('short-period swell');
  if (f.wind < 0.5) weak.push('wind is hurting it');
  if (f.tide < 0.7) weak.push('tide not ideal');
  if (weak.length) out.push(`Held back by: ${weak.join(', ')}.`);
  if (r.suit.reasons.length) out.push(`For your level: ${r.suit.reasons.join('; ')}.`);
  return out;
}

/* ------------------------------------------------------------------ */
/* Insights from rating curves × conditions × zones                    */
/* ------------------------------------------------------------------ */

export interface Bucket {
  mean: number;
  minutes: number;
}

export function insights(spot: Spot, sessions: Session[], cat = 'fun') {
  const byTide: Record<string, { sum: number; n: number }> = {};
  const byWind: Record<string, { sum: number; n: number }> = {};
  const byZone: Record<string, { sum: number; n: number }> = {};
  for (const s of sessions) {
    if (s.spotId !== spot.id || s.excluded) continue;
    const curve = s.curves[cat];
    if (!curve) continue;
    const der = deriveSeries(spot, s.conditions);
    // Within-session demeaning removes board / crowd / mood effects that are constant in a session.
    const mean = curveMean(s, cat);
    if (mean == null) continue;
    for (let m = s.startMin; m < s.endMin; m += SLOT_MIN) {
      const slot = Math.floor(m / SLOT_MIN);
      const v = curve[slot];
      if (v == null) continue;
      const hIdx = s.conditions.findIndex((h) => {
        const hm = isoToMin(h.time) ?? -1;
        return m >= hm && m < hm + 60;
      });
      const d = der[hIdx];
      const rel = v - mean;
      if (d?.tideNorm != null) {
        const k = d.tideNorm < 0.33 ? 'low' : d.tideNorm < 0.67 ? 'mid' : 'high';
        const key = d.tideTrend != null && Math.abs(d.tideTrend) > 0.25 ? `${k} ${d.tideTrend > 0 ? 'rising' : 'falling'}` : k;
        (byTide[key] ??= { sum: 0, n: 0 }).sum += rel;
        byTide[key].n++;
      }
      const wk = d ? windKind(d) : null;
      if (wk) {
        (byWind[wk] ??= { sum: 0, n: 0 }).sum += v;
        byWind[wk].n++;
      }
      const z = s.zones[slot];
      if (z) {
        (byZone[z] ??= { sum: 0, n: 0 }).sum += v;
        byZone[z].n++;
      }
    }
  }
  const fin = (o: Record<string, { sum: number; n: number }>) =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { mean: v.sum / v.n, minutes: v.n * SLOT_MIN } as Bucket]));
  return { byTide: fin(byTide), byWind: fin(byWind), byZone: fin(byZone) };
}
