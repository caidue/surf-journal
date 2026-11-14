import type { RuleApply, RuleConfidence, SpotLevel, SpotRule } from '../types';
import type { Derived } from './conditions';
import { rulesFor } from '../data/spotRules';

/**
 * The rules engine: applies the executable local rules of a spot (data/spotRules.ts → `apply`) to
 * one hour. Rules never invent quality, they only take it away (a tide window, a gate, a wind cap)
 * or raise the level a spot needs. How much a rule may take away depends on how well its sources
 * agree: a rule the sources dispute can cost at most about a third of the rating, so a weak prior
 * can never sink an hour the way the old single tide label did (decision 0018).
 *
 * Order: tide window (replaces the spot's tide factor) → caps (gate, wind; the lowest wins) →
 * level overrides (suitability). Every rule that changes something is returned with its text and
 * confidence, so the app can say which local rule applied.
 */

/** Lowest tide factor a rule may give, by confidence. */
export const TIDE_FLOOR: Record<RuleConfidence, number> = { high: 0.3, medium: 0.45, low: 0.65 };
/** How much of the rating above a cap survives, by confidence (0 = hard cap). */
const CAP_SOFTNESS: Record<RuleConfidence, number> = { high: 0, medium: 0.15, low: 0.35 };

export interface FiredRule {
  rule: SpotRule;
  /** What it did this hour, in words ("tide 0.2 is below this rule's window for small swells"). */
  effect: string;
}

export interface RuleResult {
  /** Replaces fTide when a tide rule applies. */
  tide: number | null;
  /** Highest spot rating (0–10) a gate allows (applies to the wave potential too); null = none. */
  cap: number | null;
  /** Highest spot rating a wind rule allows (the potential ignores wind); null = none. */
  windCap: number | null;
  /** The level the spot needs this hour, when a rule raises it. */
  level: SpotLevel | null;
  fired: FiredRule[];
}

const LEVEL_RANK: Record<SpotLevel, number> = { beginner: 0, all: 0, intermediate: 1, advanced: 2, expert: 3 };

/** True when `dir` lies in the clockwise range [a, b] (e.g. [300, 20] covers NW → N → NNE). */
export function inArc(dir: number, [a, b]: [number, number]): boolean {
  const d = ((dir % 360) + 360) % 360;
  return a <= b ? d >= a && d <= b : d >= a || d <= b;
}

/** Tide factor for a preferred range: 1 inside, falling 1/0.45 per unit outside, never below `floor`. */
export function tideWindowFactor(norm: number, [lo, hi]: [number, number], floor: number): number {
  const dist = norm < lo ? lo - norm : norm > hi ? norm - hi : 0;
  return floor + (1 - floor) * Math.max(0, 1 - dist / 0.45);
}

const fmtM = (m: number) => `${m.toFixed(1)} m`;
const pct = (x: number) => (x < 0.2 ? 'low' : x < 0.4 ? 'low-mid' : x < 0.6 ? 'mid' : x < 0.8 ? 'mid-high' : 'high');

function applies(a: RuleApply, peakId: string | null | undefined): boolean {
  return !a.peak || a.peak === peakId;
}

/** Evaluates a spot's executable rules for one hour (and one peak, when the spot is rated per peak). */
export function evaluateRules(spotId: string, d: Derived, peakId?: string | null): RuleResult {
  const out: RuleResult = { tide: null, cap: null, windCap: null, level: null, fired: [] };
  for (const rule of rulesFor(spotId)) {
    const a = rule.apply;
    if (!a || !applies(a, peakId)) continue;
    switch (a.type) {
      case 'tideBySize': {
        const size = a.size === 'open' ? d.openHb : d.hb;
        if (d.tideNorm == null || size == null) break;
        const row = a.rows.find((r) => r.below == null || size < r.below);
        if (!row) break;
        const f = tideWindowFactor(d.tideNorm, row.range, TIDE_FLOOR[rule.confidence]);
        out.tide = f;
        if (f < 0.99) out.fired.push({ rule, effect: `${pct(d.tideNorm)} tide is outside this rule's window (${pct(row.range[0])} to ${pct(row.range[1])}) for ${fmtM(size)} waves` });
        break;
      }
      case 'gate': {
        if (d.openHb == null || d.openHb >= a.atLeast) break;
        const cap = a.cap + (10 - a.cap) * CAP_SOFTNESS[rule.confidence];
        out.cap = out.cap == null ? cap : Math.min(out.cap, cap);
        out.fired.push({ rule, effect: `the open reefs are ~${fmtM(d.openHb)}, it needs about ${fmtM(a.atLeast)}` });
        break;
      }
      case 'windCap': {
        if (d.windDir == null || d.windSpeed == null || d.windSpeed <= a.aboveKmh || !inArc(d.windDir, a.from)) break;
        const cap = a.cap + (10 - a.cap) * CAP_SOFTNESS[rule.confidence];
        out.windCap = out.windCap == null ? cap : Math.min(out.windCap, cap);
        out.fired.push({ rule, effect: `${Math.round(d.windSpeed)} km/h from ${Math.round(d.windDir)}°` });
        break;
      }
      case 'levelWhen': {
        const t = d.tideNorm;
        const h = d.hb;
        const hit =
          (a.tideBelow != null && t != null && t < a.tideBelow) ||
          (a.tideAbove != null && t != null && t > a.tideAbove) ||
          (a.sizeAbove != null && h != null && h > a.sizeAbove);
        if (!hit) break;
        if (out.level == null || LEVEL_RANK[a.level] > LEVEL_RANK[out.level]) out.level = a.level;
        out.fired.push({ rule, effect: `needs ${a.level} skills now` });
        break;
      }
    }
  }
  return out;
}
