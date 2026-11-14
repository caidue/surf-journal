import type { DayInfo, HourConditions, Peak, Session, Settings, SkillProfile, Spot } from '../types';
import { deriveSeries, windKind, type Derived } from './conditions';
import { rateSpot, type Quality, type Suitability } from './rating';
import { DEFAULT_PROFILE, levelName, OBSERVED_SIZES, stageGapWeight } from './skill';
import { sureness, type Sureness } from './confidence';
import { distance, kernel, mostDifferent, mostDifferentKey } from './similarity';
import { daysBetween, isoToMin } from './time';

/* ------------------------------------------------------------------ */
/* Session helpers                                                     */
/* ------------------------------------------------------------------ */

/** Your rating of a session in one category (1–10), or null if not rated. */
export function ratingFor(s: Session, cat: string): number | null {
  const v = s.ratings?.[cat];
  return typeof v === 'number' ? v : null;
}

/** The session's headline rating: fun. */
export function sessionOverall(s: Session): number | null {
  return ratingFor(s, 'fun');
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

export interface SessionWeight {
  w: number;
  why: string | null;
}

/**
 * How much a past session counts as evidence today: excluded → 0, before the
 * "ignore before" date → 0, exponential time decay, and down-weighting when you were at
 * another surfing stage then (one stage apart ¾, two ½, more ¼).
 */
export function sessionWeight(s: Session, settings: Pick<Settings, 'halfLifeMonths' | 'ignoreBefore' | 'profile'>, today: string): SessionWeight {
  if (s.excluded) return { w: 0, why: 'marked not relevant' };
  if (settings.ignoreBefore && s.date < settings.ignoreBefore) return { w: 0, why: 'before your cut-off date' };
  const ageMonths = Math.max(0, daysBetween(s.date, today)) / 30.44;
  const decay = Math.pow(0.5, ageMonths / Math.max(1, settings.halfLifeMonths));
  const then = s.skillAtTime?.stage;
  const now = settings.profile?.stage;
  const kappa = then && now ? stageGapWeight(then, now) : 1;
  return { w: decay * kappa, why: kappa < 1 ? `logged as ${levelName(then!)} (you're ${levelName(now!)} now)` : null };
}

/* ------------------------------------------------------------------ */
/* Size calibration from observed sizes                                */
/* ------------------------------------------------------------------ */

export { OBSERVED_SIZES };

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
  /** Feature key behind `differs` (see SPOT_FEATURES). */
  differsKey: string | null;
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
        y: ratingFor(h.session, cat),
        hourIdx: j,
        differs: mostDifferent(dist.parts),
        differsKey: mostDifferentKey(dist.parts),
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
  /** Spot rating: how good the waves are (the best peak), whoever you are. */
  quality: Quality;
  /** For you: the peak that suits you best, and why. */
  suit: Suitability;
  peak: Peak | null;
  rule: number;
  pred: Prediction;
  /** Final score 0-10 for you (0 when unsuitable or withheld). */
  score: number;
  /** How sure the rating is; `withheld` = no rating this hour (lib/confidence.ts). */
  sure: Sureness;
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
  /** When the wind turns onshore (or much worse) within 3 h after the best window starts: minutes after midnight. */
  windTurn: number | null;
  /** The best window doesn't clearly beat the rest of the day (by less than 0.5 points). */
  evenDay: boolean;
  /** The wind models disagree on the direction at the best hour (spread ≥ 45°). */
  windUnsure: boolean;
}

/** Wind models disagreeing by this much (deg) at the best hour is worth saying. */
export const WIND_UNSURE_DEG = 45;

/** Is a session worth it for you today, judged on the best pick's score (0–10)? */
export function dayVerdict(bestScore: number | null | undefined): { label: string; tone: 'go' | 'maybe' | 'no' } {
  if (bestScore == null || bestScore < 3) return { label: 'Not much for you', tone: 'no' };
  if (bestScore < 5) return { label: 'Marginal', tone: 'maybe' };
  return { label: 'Worth going', tone: 'go' };
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
  profile: SkillProfile | null,
  date: string,
  today: string,
  nowMin: number | null,
): SpotRec {
  const me = profile ?? DEFAULT_PROFILE;
  const { gain } = calibratedGain(spot, sessions);
  const derivedAll = deriveSeries(spot, hours, gain);
  const history = buildHistory(spot, sessions, settings, today, gain);
  const [rise, set] = daylight(days, date);
  const recs: HourRec[] = [];
  hours.forEach((h, i) => {
    if (!h.time.startsWith(date)) return;
    const m = isoToMin(h.time)!;
    // Counts as a daylight hour when at least half of it is between sunrise and sunset
    // (otherwise the best window can come out as e.g. 18:00–18:02).
    const daylight = Math.min(m + 60, set) - Math.max(m, rise) >= 30;
    const d = derivedAll[i];
    // Spots whose peaks differ (level, size range, tide, shape) are rated per peak.
    const r = rateSpot(spot, d, me, settings.heightUnit);
    const pred = predict(spot, d, r.score, history);
    const sure = sureness(spot, d, h.windSpread, pred.sumW);
    const score = r.suit.status === 'unsuitable' || sure.withheld ? 0 : pred.yhat;
    recs.push({ idx: i, time: h.time, daylight, derived: d, quality: r.quality, suit: r.suit, peak: r.peak, rule: r.score, pred, score, sure });
  });

  // Daylight hours only; upcoming ones only when looking at today.
  const candidates = recs.filter((r) => r.daylight && (nowMin == null || (isoToMin(r.time) ?? 0) + 60 > nowMin));
  let best: HourRec | null = null;
  let bestWindow: [number, number] | null = null;
  let bestVal = -1;
  const vals: number[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const a = candidates[i];
    const b = candidates[i + 1];
    const contiguous = b && (isoToMin(b.time) ?? 0) - (isoToMin(a.time) ?? 0) === 60;
    const val = contiguous ? (a.score + b.score) / 2 : a.score;
    vals.push(val);
    if (val > bestVal) {
      bestVal = val;
      best = contiguous && b.score > a.score ? b : a;
      const start = isoToMin(a.time) ?? 0;
      bestWindow = [Math.max(start, rise), Math.min(start + (contiguous ? 120 : 60), set)];
    }
  }
  // A window only stands out when it beats the typical rest of the day.
  const others = vals.filter((v) => v !== bestVal).sort((x, y) => x - y);
  const median = others.length ? others[Math.floor(others.length / 2)] : bestVal;
  const evenDay = bestVal > 0.5 && others.length >= 2 && bestVal - median < 0.5;
  // Go before the wind turns: the first hour within 3 h of the window start where the wind
  // factor falls below 0.5 while it was still decent at the start.
  let windTurn: number | null = null;
  if (bestWindow) {
    const start = bestWindow[0];
    const first = recs.find((r) => (isoToMin(r.time) ?? 0) + 60 > start);
    if (first && first.quality.factors.wind >= 0.6) {
      const turn = recs.find((r) => {
        const m = isoToMin(r.time) ?? 0;
        return m > start && m <= start + 180 && r.quality.factors.wind < 0.5 && r.quality.factors.wind < first.quality.factors.wind - 0.15;
      });
      if (turn) windTurn = isoToMin(turn.time) ?? null;
    }
  }
  const windUnsure = !!best && (hours[best.idx]?.windSpread ?? 0) >= WIND_UNSURE_DEG;
  const now =
    nowMin != null
      ? recs.find((r) => {
          const m = isoToMin(r.time) ?? 0;
          return nowMin >= m && nowMin < m + 60;
        }) ?? null
      : null;
  return { spot, gain, hours: recs, best, bestWindow, now, dayOver: nowMin != null && recs.length > 0 && candidates.length === 0, windTurn, evenDay, windUnsure };
}

/* ------------------------------------------------------------------ */
/* Explanations (generated only from computed numbers)                 */
/* The suitability reasons are shown separately (ui.tsx → SuitReasons). */
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
      `Your closest session here (${fmtSessionDate(c.session)}, ${Math.round(c.k * 100)}% similar${c.differs ? `, differs mainly in ${c.differs}` : ''}) is too different to count much: the score is mostly the spot guide and your surfing profile.`,
    );
  } else {
    out.push('No logged sessions here yet: the score comes from the spot guide and your surfing profile.');
  }
  // Local knowledge that changed this hour (lib/rules.ts), most certain first.
  const conf = { high: 0, medium: 1, low: 2 } as const;
  const word = { high: 'sources agree', medium: 'some support', low: 'sources disagree' } as const;
  for (const f of [...(r.quality.rules ?? [])].filter((x) => x.rule.apply?.type !== 'levelWhen').sort((a, b) => conf[a.rule.confidence] - conf[b.rule.confidence]).slice(0, 2))
    out.push(`Local knowledge (${word[f.rule.confidence]}): ${f.effect}.`);
  const f = r.quality.factors;
  const weak: string[] = [];
  if (f.size < 0.4) weak.push('size outside the range this spot likes');
  if (f.period < 0.6) weak.push('short-period swell (peak period under 8 s)');
  if (f.wind < 0.5) weak.push('wind is hurting it');
  if (f.tide < 0.7) weak.push('tide not ideal');
  if (weak.length) out.push(`Held back by: ${weak.join(', ')}.`);
  return out;
}

/* ------------------------------------------------------------------ */
/* Insights: your ratings × the conditions you surfed in               */
/* ------------------------------------------------------------------ */

export interface Bucket {
  mean: number;
  minutes: number;
}

/**
 * How your rating at a spot relates to tide stage and wind. Each surfed hour of a session
 * counts with the minutes you were in the water; tide is shown relative to your average rating
 * at the spot, wind as the plain average.
 */
export function insights(spot: Spot, sessions: Session[], cat = 'fun') {
  const byTide: Record<string, { sum: number; w: number }> = {};
  const byWind: Record<string, { sum: number; w: number }> = {};
  const relevant = sessions.filter((s) => s.spotId === spot.id && !s.excluded && ratingFor(s, cat) != null);
  const spotMean = relevant.length ? relevant.reduce((a, s) => a + ratingFor(s, cat)!, 0) / relevant.length : 0;
  for (const s of relevant) {
    const v = ratingFor(s, cat)!;
    const der = deriveSeries(spot, s.conditions);
    for (const i of surfedHourIdx(s)) {
      const d = der[i];
      const hm = isoToMin(d?.time) ?? 0;
      const minutes = Math.min(hm + 60, s.endMin) - Math.max(hm, s.startMin);
      if (!d || minutes <= 0) continue;
      if (d.tideNorm != null) {
        const k = d.tideNorm < 0.33 ? 'low' : d.tideNorm < 0.67 ? 'mid' : 'high';
        const key = d.tideTrend != null && Math.abs(d.tideTrend) > 0.25 ? `${k} ${d.tideTrend > 0 ? 'rising' : 'falling'}` : k;
        (byTide[key] ??= { sum: 0, w: 0 }).sum += (v - spotMean) * minutes;
        byTide[key].w += minutes;
      }
      const wk = windKind(d);
      if (wk) {
        (byWind[wk] ??= { sum: 0, w: 0 }).sum += v * minutes;
        byWind[wk].w += minutes;
      }
    }
  }
  const fin = (o: Record<string, { sum: number; w: number }>) =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { mean: v.sum / v.w, minutes: v.w } as Bucket]));
  return { byTide: fin(byTide), byWind: fin(byWind) };
}
