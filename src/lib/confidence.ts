import type { Spot, SpotRule } from '../types';
import type { Derived } from './conditions';
import { rulesFor } from '../data/spotRules';

/**
 * How sure the app is about a rating (decision 0019). A good local says "I don't know that reef
 * at low tide" instead of guessing; so does the app:
 *  - per spot: how much local knowledge it has (rules with sources, data/spotRules.ts);
 *  - per hour: that, lowered when the wind models disagree or the spot's forecast point or
 *    location is doubtful, raised when your own sessions there in similar conditions back it up;
 *  - withheld: no rating at all when a key fact is missing and guessing could send you into
 *    danger (an advanced or expert reef at low tide that no source describes).
 */

export type Knowledge = 'local' | 'partial' | 'general';
export type Sure = 'high' | 'medium' | 'low';

export const KNOWLEDGE_LABEL: Record<Knowledge, string> = {
  local: 'Local knowledge',
  partial: 'Partial local knowledge',
  general: 'General model only',
};
export const SURE_LABEL: Record<Sure, string> = { high: 'Reliable', medium: 'Less certain', low: 'Rough guide' };

/** The three things a local knows about a spot; a rule counts for the group of its kind. */
const GROUP: Partial<Record<SpotRule['kind'], 'tide' | 'conditions' | 'size'>> = {
  tide: 'tide',
  swell: 'conditions',
  wind: 'conditions',
  size: 'size',
  role: 'size',
  level: 'size',
};

export interface SpotKnowledge {
  level: Knowledge;
  /** Rules with sources (all confidences). */
  rules: number;
  /** One line for the Info tab. */
  text: string;
}

/**
 * Local knowledge = well-sourced rules (some support or better) covering at least two of tide,
 * swell/wind and size/role/level; partial = any rules; general = none (your own spots, anywhere
 * outside the built-in area).
 */
export function spotKnowledge(spot: Pick<Spot, 'id'>): SpotKnowledge {
  const rules = rulesFor(spot.id);
  if (!rules.length) return { level: 'general', rules: 0, text: 'No local knowledge yet: rated by the general model from the spot’s settings.' };
  const groups = new Set(rules.filter((r) => r.confidence !== 'low').map((r) => GROUP[r.kind]).filter(Boolean));
  const level: Knowledge = groups.size >= 2 ? 'local' : 'partial';
  const n = `${rules.length} local rule${rules.length > 1 ? 's' : ''}`;
  return {
    level,
    rules: rules.length,
    text: level === 'local' ? `${n} with sources, covering ${[...groups].join(', ')}.` : `${n}, but ${rules.length > 1 ? 'they cover' : 'it covers'} only part of what a local would know (${[...groups].join(', ') || 'disputed sources'}).`,
  };
}

/** Does any source tell us how this spot behaves with the tide? */
export function tideKnown(spot: Pick<Spot, 'id' | 'tide'>): boolean {
  if (spot.tide !== 'all') return true;
  return rulesFor(spot.id).some(
    (r) => (r.kind === 'tide' && r.confidence !== 'low') || r.apply?.type === 'tideBySize' || (r.apply?.type === 'levelWhen' && (r.apply.tideBelow != null || r.apply.tideAbove != null)),
  );
}

export interface Sureness {
  level: Sure;
  /** Why, one short phrase each ("local knowledge", "the wind models disagree"). */
  reasons: string[];
  /** Set when the app gives no rating for this hour, with the reason. */
  withheld?: string;
}

const DOWN: Record<Sure, Sure> = { high: 'medium', medium: 'low', low: 'low' };
const UP: Record<Sure, Sure> = { high: 'high', medium: 'high', low: 'medium' };

/**
 * How sure the rating of one hour is.
 * @param windSpread largest direction difference between the wind models (deg)
 * @param history how much your similar past sessions here weigh (Prediction.sumW)
 */
export function sureness(spot: Spot, d: Derived, windSpread: number | undefined, history: number): Sureness {
  const k = spotKnowledge(spot);
  let level: Sure = k.level === 'local' ? 'high' : k.level === 'partial' ? 'medium' : 'low';
  const reasons = [KNOWLEDGE_LABEL[k.level].toLowerCase()];
  if ((windSpread ?? 0) >= 45) {
    level = DOWN[level];
    reasons.push('the wind models disagree');
  }
  if (spot.dataNote) {
    level = DOWN[level];
    reasons.push(spot.dataNote.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase()));
  }
  if (history >= 1.2) {
    level = UP[level];
    reasons.push('your sessions here in similar conditions');
  }
  const out: Sureness = { level, reasons };
  // Never guess where it can be dangerous: advanced/expert reefs at low tide with no tide source.
  const hard = spot.bottom === 'reef' || spot.bottom === 'rock';
  if ((spot.level === 'advanced' || spot.level === 'expert') && hard && !tideKnown(spot) && d.tideNorm != null && d.tideNorm < 0.25)
    out.withheld = 'No source describes this reef at low tide, and low tide on shallow lava can be dangerous: check it locally.';
  return out;
}
