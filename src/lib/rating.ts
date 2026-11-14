import type { Peak, SkillProfile, Spot, SpotLevel, TidePref } from '../types';
import type { Derived } from './conditions';
import { boardInfo, bodyWord, levelName, REQUIRED_STAGE, stageInfo } from './skill';

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

/** Period factor on the PEAK period (the one surf sites show): wind chop below 6 s, groundswell from 12 s. */
export function fPeriod(t: number | null): number {
  if (t == null) return 0.5;
  if (t < 6) return 0.25;
  if (t < 9) return 0.25 + ((t - 6) / 3) * 0.5;
  if (t < 12) return 0.75 + ((t - 9) / 3) * 0.25;
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

/* ---------------- peaks ---------------- */

const OVERRIDES = ['level', 'minSize', 'maxSize', 'tide', 'power', 'peel'] as const;

/** Peaks rated on their own (two or more peaks that override a rating field); [] = rate the spot as a whole. */
export function ratedPeaks(spot: Spot): Peak[] {
  const own = spot.peaks.filter((p) => OVERRIDES.some((k) => p[k] != null));
  return own.length >= 2 ? own : [];
}

/** The spot as this peak sees it: the peak's level, size range, tide, bottom and shape override the spot's. */
export function peakSpot(spot: Spot, peak: Peak | null | undefined): Spot {
  if (!peak) return spot;
  return {
    ...spot,
    level: peak.level ?? spot.level,
    minSize: peak.minSize ?? spot.minSize,
    maxSize: peak.maxSize ?? spot.maxSize,
    tide: peak.tide ?? spot.tide,
    power: peak.power ?? spot.power,
    peel: peak.peel ?? spot.peel,
    bottom: peak.bottom ?? spot.bottom,
    breakType: peak.breakType ?? spot.breakType,
  };
}

/* ---------------- suitability: the rules for your skill profile ---------------- */

export type Suit = 'good' | 'ok' | 'stretch' | 'challenging' | 'unsuitable';
export const SUIT_ORDER: Suit[] = ['good', 'ok', 'stretch', 'challenging', 'unsuitable'];
export const SUIT_FACTOR: Record<Suit, number> = { good: 1, ok: 0.85, stretch: 0.7, challenging: 0.5, unsuitable: 0 };
const worse = (a: Suit, b: Suit) => (SUIT_ORDER.indexOf(a) >= SUIT_ORDER.indexOf(b) ? a : b);

export type ReasonKind = 'spot' | 'size' | 'board' | 'period' | 'bottom' | 'shape' | 'wind' | 'paddle' | 'water' | 'summary';

export interface SuitReason {
  kind: ReasonKind;
  status: Suit;
  text: string;
  /** A point in favour (shown when the hour is good for you). */
  positive?: boolean;
}

export interface Suitability {
  status: Suit;
  factor: number;
  /** At most three, worst first (plus one positive when good). Size reasons link to "Edit comfort size". */
  reasons: SuitReason[];
}

const LEVEL_WORD: Record<SpotLevel, string> = { beginner: 'beginner', all: 'basic', intermediate: 'intermediate', advanced: 'advanced', expert: 'expert' };
/** Words for "Size is fine; it's the …". */
const CAUSE: Partial<Record<ReasonKind, string>> = {
  spot: "spot's level",
  bottom: 'reef',
  shape: 'hollow waves',
  wind: 'wind',
  paddle: 'paddle-out',
  water: 'missing lifeguard',
  period: 'long-period swell',
};
const OVERHEAD = 2.0;

/**
 * Is this hour at this spot (or peak, via peakSpot) right for you? Each rule gives a status and a
 * reason; the worst status wins (good 1 · ok 0.85 · stretch 0.7 · challenging 0.5 · unsuitable 0).
 * Sizes are face heights compared with your comfortable size C and biggest wave M.
 */
export function suitability(spot: Spot, d: Derived, p: SkillProfile, unit: 'm' | 'ft' = 'm'): Suitability {
  const all: SuitReason[] = [];
  const add = (kind: ReasonKind, status: Suit, text: string, positive = false) => all.push({ kind, status, text, positive });
  const h = (m: number) => (unit === 'ft' ? `${Math.round(m * 3.281)} ft` : `${m.toFixed(1)} m`);
  const st = p.stage;
  const C = p.comfort;
  const M = Math.max(p.max, C);
  const steep = p.steepExp ?? stageInfo(st).steepExp;
  // Compare the size as it is shown (0.1 m or 1 ft), so a reason never reads "~2.2 m vs 2.2 m".
  const H = d.hb == null ? null : unit === 'ft' ? Math.round(d.hb * 3.281) / 3.281 : Math.round(d.hb * 10) / 10;

  // The spot's (or peak's) level, as a stage.
  const req = REQUIRED_STAGE[spot.level];
  if (req - st > 1) add('spot', 'unsuitable', `This spot needs ${LEVEL_WORD[spot.level]} skills (${levelName(req)}, stage ${req}+). Your level: ${levelName(st)}.`);
  else if (req - st === 1) add('spot', 'challenging', `A step up: this spot is usually surfed from ${levelName(req)} (stage ${req}). Your level: ${levelName(st)}.`);

  if (H != null) {
    if (H <= 0.8 * C) add('size', 'good', `Right in your range: ~${h(H)} (${bodyWord(H)}); you're comfortable to ${bodyWord(C)} (${h(C)}).`, true);
    else if (H <= C) add('size', 'ok', `Top of your comfort zone: ~${h(H)} vs your ${h(C)} (${bodyWord(C)}).`);
    else if (H <= M)
      add(
        'size',
        p.wantsChallenge ? 'stretch' : 'challenging',
        `${p.wantsChallenge ? 'Stretch session: ' : ''}bigger than you're comfortable in, ~${h(H)} vs ${bodyWord(C)} (${h(C)}), but within the ${h(M)} you've caught.`.replace(/^b/, 'B'),
      );
    else if (H <= 1.15 * M) add('size', st >= 6 ? 'challenging' : 'unsuitable', `Bigger than anything you've surfed: ~${h(H)} vs your biggest ${h(M)}.`);
    else add('size', 'unsuitable', `Well beyond your biggest waves: ~${h(H)} vs ${h(M)}.`);
    if (H > OVERHEAD && st <= 5) add('size', 'challenging', `Overhead sets (~${h(H)}): injury risk rises sharply before stage 6.`);

    const board = boardInfo(p.board);
    if (H < board.min) add('board', 'ok', `Small for your ${board.label.replace(/ \(.*\)$/, '').toLowerCase()} (~${h(H)}): take something with more volume.`);

    const tp = d.tDom ?? 0;
    if (tp >= 13 && H > 0.7 * C && st <= 5) add('period', H > C ? 'challenging' : 'ok', `Long-period groundswell (${Math.round(tp)} s peak): sets hit harder than the height suggests.`);

    if (H > spot.maxSize * 1.15) add('spot', st >= 7 ? 'challenging' : 'unsuitable', `Bigger than this spot handles well: ~${h(H)}, it works up to about ${h(spot.maxSize)}.`);
  }

  // Bottom.
  const hard = spot.bottom === 'reef' || spot.bottom === 'rock';
  if (hard && p.reefExp === 0) add('bottom', st <= 3 || (H ?? 0) > C ? 'unsuitable' : 'challenging', `${spot.bottom === 'rock' ? 'Rock' : 'Reef'} bottom and you haven't surfed reef yet: wear booties and avoid low tide.`);
  else if (spot.bottom === 'mixed' && p.reefExp === 0) add('bottom', 'ok', 'Rocks in places: wear booties.');
  if (spot.bottom === 'sand' && st <= 3) add('bottom', 'good', 'Sand bottom: forgiving falls.', true);

  // Shape of the wave.
  if ((spot.power === 'hollow' || spot.power === 'slab') && steep === 0)
    add('shape', (H ?? 0) > C ? 'unsuitable' : 'challenging', `${spot.power === 'slab' ? 'Slabby, shallow' : 'Hollow'} waves with steep take-offs, and you prefer mellow ones.`);
  if ((spot.peel === 'fast' || spot.peel === 'sectiony') && st <= 3) add('shape', 'challenging', `${spot.peel === 'fast' ? 'Fast' : 'Sectiony'} waves: hard to make before you can ride along the face (stage 4).`);
  if (spot.power === 'mellow' && st <= 4) add('shape', 'good', 'Mellow, forgiving waves.', true);

  // Wind.
  if (d.windSpeed != null) {
    const w = `${Math.round(d.windSpeed)} km/h`;
    if (d.windSpeed > 45) add('wind', st >= 6 ? 'challenging' : 'unsuitable', `Very strong wind (${w}).`);
    else if (d.windSpeed > 30 && st <= 3) add('wind', 'challenging', `Strong wind (${w}): hard to paddle and stay in position.`);
    if ((d.uOff ?? 0) > 25 && steep === 0) add('wind', 'ok', `Strong offshore wind (${Math.round(d.uOff!)} km/h): later, steeper take-offs.`);
  }

  // Getting out.
  if (spot.hazards.some((x) => /rip|current/i.test(x)) && p.paddleOut <= 1)
    add('paddle', (H ?? 0) > 0.8 * C ? 'challenging' : 'ok', 'Rips and currents here, and getting out is hard for you: go out with someone who knows the spot.');
  if (H != null && H > C && p.paddleOut <= 1) add('paddle', 'challenging', 'Getting out through sets bigger than your comfort size takes a solid duck-dive or turtle roll.');

  // Water confidence.
  if (p.waterConfidence && p.waterConfidence !== 'yes' && st <= 3 && !spot.lifeguard)
    add('water', p.waterConfidence === 'no' ? 'challenging' : 'ok', "No lifeguard here and you're not sure you'd stay calm out of your depth: stay where you can stand.");

  const negatives = all.filter((r) => !r.positive && r.status !== 'good');
  const status = negatives.reduce<Suit>((a, r) => worse(r.status, a), 'good');
  negatives.sort((a, b) => SUIT_ORDER.indexOf(b.status) - SUIT_ORDER.indexOf(a.status));

  let reasons = negatives.slice(0, 3);
  // Mixed causes: say plainly that size is fine when other things drag the hour down.
  const size = all.find((r) => r.kind === 'size');
  if ((status === 'challenging' || status === 'unsuitable') && size && (size.status === 'good' || size.status === 'ok')) {
    const causes = [...new Set(negatives.filter((r) => SUIT_ORDER.indexOf(r.status) >= SUIT_ORDER.indexOf('challenging') && r.kind !== 'size').map((r) => CAUSE[r.kind]).filter(Boolean))];
    if (causes.length) reasons = [{ kind: 'summary', status, text: `Size is fine; it's the ${causes.slice(0, 2).join(' and the ')}.` }, ...negatives.slice(0, 2)];
  }
  if (status === 'good') {
    const plus = all.find((r) => r.positive);
    if (plus) reasons = [...reasons, plus];
  }
  return { status, factor: SUIT_FACTOR[status], reasons };
}

/** One line for tooltips: "Top of your comfort zone…; Reef bottom…". */
export const reasonsText = (s: Suitability) => s.reasons.map((r) => r.text.replace(/\.$/, '')).join('; ');

/** Recommendability 0-10 for your profile = quality × suitability. */
export function recommendability(spot: Spot, d: Derived, profile: SkillProfile, unit: 'm' | 'ft' = 'm'): { score: number; quality: Quality; suit: Suitability } {
  const qq = quality(spot, d);
  const suit = suitability(spot, d, profile, unit);
  return { score: qq.q * suit.factor, quality: qq, suit };
}

/** Colour for a 0–10 score, matching the word ladder below. */
export interface SpotRating {
  /** For you: the peak that suits you best (null when the spot is rated as a whole or the peaks don't differ). */
  peak: Peak | null;
  score: number;
  suit: Suitability;
  /** Spot rating: how good the waves are at the best peak, whoever you are. */
  quality: Quality;
}

/** Rates a spot for one hour: per peak when its peaks differ (ratedPeaks), else as a whole. */
export function rateSpot(spot: Spot, d: Derived, profile: SkillProfile, unit: 'm' | 'ft' = 'm'): SpotRating {
  const peaks = ratedPeaks(spot);
  const rated = (peaks.length ? peaks : [null]).map((peak) => ({ peak, r: recommendability(peakSpot(spot, peak), d, profile, unit) }));
  const mine = rated.reduce((a, b) => (b.r.score > a.r.score ? b : a));
  const waves = rated.reduce((a, b) => (b.r.quality.q > a.r.quality.q ? b : a));
  // Name a peak only when the peaks really differ for you this hour.
  const differ = rated.some((x) => Math.abs(x.r.score - mine.r.score) > 0.05 || x.r.suit.status !== mine.r.suit.status);
  return { peak: differ ? mine.peak : null, score: mine.r.score, suit: mine.r.suit, quality: waves.r.quality };
}

export function scoreColor(score: number | null | undefined): string {
  if (score == null) return '#94a3b8';
  if (score < 2) return '#94a3b8';
  if (score < 3.5) return '#38bdf8';
  if (score < 5) return '#14b8a6';
  if (score < 6.5) return '#22c55e';
  if (score <= 9) return '#16a34a';
  return '#ca8a04';
}

/** Surf-forecast-style word ladder for the spot rating: Poor … Good, and Epic only above 9. */
export function scoreLabel(score: number): string {
  if (score < 2) return 'Poor';
  if (score < 3.5) return 'Poor–Fair';
  if (score < 5) return 'Fair';
  if (score < 6.5) return 'Fair–Good';
  if (score <= 9) return 'Good';
  return 'Epic';
}

export const SUIT_COLOR: Record<Suit, string> = {
  good: '#16a34a',
  ok: '#65a30d',
  stretch: '#0891b2',
  challenging: '#d97706',
  unsuitable: '#dc2626',
};

export const SUIT_LABEL: Record<Suit, string> = {
  good: 'Good for you',
  ok: 'OK for you',
  stretch: 'Stretch session',
  challenging: 'Challenging',
  unsuitable: 'Not for you',
};
