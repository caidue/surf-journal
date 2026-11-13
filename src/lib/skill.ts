import type { BoardKind, Feel, Session, SkillProfile, SkillSnapshot, Spot, SpotLevel, Stage } from '../types';
import { daysBetween } from './time';

/**
 * The surfer's skill profile: a stage (1–8), the face height you're comfortable in (C), the biggest
 * you've caught (M), your board and your reef, paddle-out and steep-wave experience. Filled in at
 * first launch (components/Onboarding.tsx), editable under Settings → Your surfing, and nudged by
 * logged sessions ("How did it feel?") in small, explained, undoable steps.
 */

/* ---------------- one body scale for onboarding, the journal and the forecast ---------------- */

export interface BodyStep {
  id: string;
  label: string;
  /** Face height in metres. */
  m: number;
}

/** Wave face height against an adult body (head = 1.8 m). Used everywhere sizes are chosen or described. */
export const BODY_SCALE: BodyStep[] = [
  { id: 'ankle', label: 'Ankle', m: 0.3 },
  { id: 'knee', label: 'Knee', m: 0.5 },
  { id: 'thigh', label: 'Thigh', m: 0.7 },
  { id: 'waist', label: 'Waist', m: 0.9 },
  { id: 'chest', label: 'Chest', m: 1.2 },
  { id: 'shoulder', label: 'Shoulder', m: 1.5 },
  { id: 'head', label: 'Head high', m: 1.8 },
  { id: 'overhead', label: 'Overhead', m: 2.2 },
  { id: 'well-overhead', label: 'Well overhead', m: 3.0 },
  { id: 'double', label: 'Double overhead', m: 3.6 },
  { id: 'bigger', label: 'Bigger', m: 5.0 },
];

/** Sizes you can note for a session ("Wave size you actually saw"): flat plus the body scale. */
export const OBSERVED_SIZES: BodyStep[] = [{ id: 'flat', label: 'Flat', m: 0.15 }, ...BODY_SCALE];

/** The body-scale step closest to a height (on a log scale, so 0.2 m matters more when small). */
export function nearestStep(m: number): BodyStep {
  return BODY_SCALE.reduce((a, s) => (Math.abs(Math.log(s.m / m)) < Math.abs(Math.log(a.m / m)) ? s : a));
}

const BODY_WORD: Record<string, string> = {
  ankle: 'ankle high',
  knee: 'knee high',
  thigh: 'thigh high',
  waist: 'waist high',
  chest: 'chest high',
  shoulder: 'shoulder high',
  head: 'head high',
  overhead: 'overhead',
  'well-overhead': 'well overhead',
  double: 'double overhead',
  bigger: 'double overhead+',
};

/** "chest high", "overhead"… for one height. */
export function bodyWord(m: number): string {
  if (m < 0.2) return 'flat';
  return BODY_WORD[nearestStep(m).id];
}

/** "head high to overhead" for a range (one word when both ends round to the same step). */
export function bodyRange(lo: number, hi: number): string {
  const a = bodyWord(lo);
  const b = bodyWord(hi);
  return a === b ? a : `${a.replace(/ high$/, '')} to ${b}`;
}

/* ---------------- stages ---------------- */

export interface StageInfo {
  stage: Stage;
  /** First-person statement shown in onboarding. */
  title: string;
  /** Default comfortable (C) and biggest (M) face height. */
  comfort: number;
  max: number;
  /** Pre-fills for the later questions. */
  reefExp: SkillProfile['reefExp'];
  steepExp: NonNullable<SkillProfile['steepExp']>;
  paddleOut: SkillProfile['paddleOut'];
}

export const STAGES: StageInfo[] = [
  { stage: 1, title: "I've never surfed, or I ride whitewater with a push", comfort: 0.5, max: 0.7, reefExp: 0, steepExp: 0, paddleOut: 0 },
  { stage: 2, title: 'I stand up and steer in the whitewater on my own', comfort: 0.7, max: 0.9, reefExp: 0, steepExp: 0, paddleOut: 0 },
  { stage: 3, title: "I'm catching my first green waves and starting to angle", comfort: 0.9, max: 1.2, reefExp: 0, steepExp: 0, paddleOut: 1 },
  { stage: 4, title: 'I catch green waves on my own and ride along the face', comfort: 1.2, max: 1.5, reefExp: 1, steepExp: 0, paddleOut: 1 },
  { stage: 5, title: 'I do bottom and top turns, generate speed, and surf head high on my own', comfort: 1.5, max: 1.8, reefExp: 1, steepExp: 1, paddleOut: 2 },
  { stage: 6, title: 'I link turns, make steep take-offs and enjoy overhead waves', comfort: 2.2, max: 3.0, reefExp: 2, steepExp: 1, paddleOut: 2 },
  { stage: 7, title: 'I surf heavy waves, barrels and shallow reefs, well overhead', comfort: 3.0, max: 5.0, reefExp: 2, steepExp: 2, paddleOut: 3 },
  { stage: 8, title: 'I surf big waves, double overhead and up', comfort: 3.6, max: 5.0, reefExp: 3, steepExp: 2, paddleOut: 3 },
];

export const stageInfo = (s: Stage) => STAGES[s - 1];

/** Stage a spot (or peak) level needs: beginner/all 1, intermediate 4, advanced 6, expert 7. */
export const REQUIRED_STAGE: Record<SpotLevel, Stage> = { beginner: 1, all: 1, intermediate: 4, advanced: 6, expert: 7 };

/* ---------------- boards and the other questions ---------------- */

export const BOARDS: { id: BoardKind; label: string; /** Smallest face height (m) it's fun on. */ min: number }[] = [
  { id: 'softtop', label: 'Soft-top', min: 0.3 },
  { id: 'longboard', label: "Longboard (9'+)", min: 0.3 },
  { id: 'midlength', label: "Mid-length (7–8'6)", min: 0.45 },
  { id: 'fish', label: 'Fish / groveller', min: 0.45 },
  { id: 'shortboard', label: 'Shortboard', min: 0.7 },
  { id: 'stepup', label: 'Step-up / gun', min: 1.5 },
  { id: 'bodyboard', label: 'Bodyboard', min: 0.4 },
];
export const boardInfo = (b: BoardKind) => BOARDS.find((x) => x.id === b) ?? BOARDS[0];

export const REEF_OPTIONS: { v: SkillProfile['reefExp']; label: string; short: string }[] = [
  { v: 0, label: 'Never surfed over reef or rock', short: 'sand only' },
  { v: 1, label: 'A few times', short: 'some reef' },
  { v: 2, label: 'Regularly', short: 'reef regularly' },
  { v: 3, label: 'Regularly, shallow reef at low tide too', short: 'shallow reef too' },
];

export const PADDLE_OPTIONS: { v: SkillProfile['paddleOut']; label: string }[] = [
  { v: 0, label: "I'd stay on the inside or on the beach" },
  { v: 1, label: 'I get out if there is a channel or a long lull' },
  { v: 2, label: 'I time the sets and duck-dive or turtle-roll through' },
  { v: 3, label: 'No problem, even when it is big and consistent' },
];

export const STEEP_OPTIONS: { v: NonNullable<SkillProfile['steepExp']>; label: string }[] = [
  { v: 0, label: 'I prefer mellow, rolling waves' },
  { v: 1, label: "I'm OK with steeper, faster waves" },
  { v: 2, label: 'I love late drops and barrels' },
];

export const FREQUENCY_OPTIONS: { v: NonNullable<SkillProfile['frequency']>; label: string }[] = [
  { v: 'rarely', label: 'A few times a year' },
  { v: 'monthly', label: 'About monthly' },
  { v: 'weekly', label: 'Weekly' },
  { v: 'often', label: 'Several times a week' },
];

export const YEARS_OPTIONS: { v: NonNullable<SkillProfile['years']>; label: string }[] = [
  { v: 'lt1', label: 'Less than a year' },
  { v: '1to3', label: '1–3 years' },
  { v: '3to10', label: '3–10 years' },
  { v: 'gt10', label: 'More than 10 years' },
];

export const WATER_OPTIONS: { v: NonNullable<SkillProfile['waterConfidence']>; label: string }[] = [
  { v: 'yes', label: 'Yes' },
  { v: 'unsure', label: 'Not sure' },
  { v: 'no', label: 'No' },
];

export const FEEL_OPTIONS: { id: Feel; label: string }[] = [
  { id: 'small', label: 'Too small' },
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'pushing', label: 'Pushing it' },
  { id: 'over', label: 'Out of my depth' },
];

/** A complete profile from a stage, with that stage's defaults. */
export function profileForStage(stage: Stage, board: BoardKind = stage <= 3 ? 'softtop' : stage <= 5 ? 'midlength' : 'shortboard'): SkillProfile {
  const s = stageInfo(stage);
  return { stage, comfort: s.comfort, max: s.max, board, reefExp: s.reefExp, paddleOut: s.paddleOut, steepExp: s.steepExp, updatedAt: Date.now() };
}

/** Used whenever no profile exists yet (before onboarding, in tests): a stage-4 surfer. */
export const DEFAULT_PROFILE: SkillProfile = { ...profileForStage(4), updatedAt: 0 };

export const snapshot = (p: SkillProfile): SkillSnapshot => ({ stage: p.stage, comfort: p.comfort, max: p.max });

/** What the old four-level picker meant, for sessions logged before the skill profile existed. */
export const LEGACY_STAGE: Record<string, Stage> = { beginner: 2, intermediate: 4, advanced: 6, expert: 7 };

/** How much a session logged at another stage counts: same 1, one stage apart ¾, two ½, more ¼. */
export function stageGapWeight(then: Stage, now: Stage): number {
  const gap = Math.abs(then - now);
  return gap === 0 ? 1 : gap === 1 ? 0.75 : gap === 2 ? 0.5 : 0.25;
}

/* ---------------- summary ---------------- */

const fmtM = (m: number, unit: 'm' | 'ft') => (unit === 'ft' ? `${Math.round(m * 3.281)} ft` : `${m.toFixed(1)} m`);

/** "Stage 4 · comfortable to chest high (1.2 m) · caught up to 1.5 m · sand only · mid-length". */
export function profileSummary(p: SkillProfile, unit: 'm' | 'ft' = 'm'): string {
  return [
    `Stage ${p.stage}`,
    `comfortable to ${bodyWord(p.comfort)} (${fmtM(p.comfort, unit)})`,
    `caught up to ${fmtM(Math.max(p.max, p.comfort), unit)}`,
    REEF_OPTIONS[p.reefExp].short,
    boardInfo(p.board).label.replace(/ \(.*\)$/, '').toLowerCase(),
  ].join(' · ');
}

/** A gentle check for answers that don't usually go together. */
export function profileCheck(p: SkillProfile): string | null {
  if (p.stage >= 6 && p.years === 'lt1') return 'Stage 6 and up usually takes a few years of regular surfing. Double-check your stage, so the app doesn’t send you into waves that are too heavy.';
  if (p.max < p.comfort) return 'Your biggest wave is smaller than your comfortable size; the app uses the comfortable size for both.';
  return null;
}

/* ---------------- learning from sessions ---------------- */

const round = (m: number) => Math.round(m * 20) / 20; // 5 cm
const stepAbove = (m: number) => BODY_SCALE.find((s) => s.m > m + 0.01)?.m ?? m;

/** The size you surfed: what you noted, else the forecast estimate for your time in the water. */
export function sessionSize(s: Session, estimate: number | null): number | null {
  const seen = OBSERVED_SIZES.find((o) => o.id === s.fields.observedSize);
  if (seen && seen.id !== 'flat') return seen.m;
  return estimate;
}

const hollow = (spot: Spot | undefined) => spot?.power === 'hollow' || spot?.power === 'slab' || !!spot?.peaks.some((p) => p.power === 'hollow' || p.power === 'slab');
const reefy = (spot: Spot | undefined) => spot?.bottom === 'reef' || spot?.bottom === 'rock';

/**
 * Bounded profile update after a session with "How did it feel?":
 *  - comfortable at S > C: C moves a quarter of the way to S (at most one body-scale step unless
 *    another session in the last 60 days also felt comfortable that big);
 *  - out of my depth at S ≤ C: C moves a quarter of the way down to 0.9 S;
 *  - comfortable or pushing it at S > M (and you caught waves): M becomes S;
 *  - reef and hollow-wave experience go up after such sessions that weren't out of your depth
 *    (never to the top answer: that one is yours to give).
 * The stage never changes automatically: when C reaches the next stage's size, the change asks.
 * Fun ratings never move anything here. Returns null when nothing changes.
 */
export function learnFromSession(
  p: SkillProfile,
  s: Session,
  spot: Spot | undefined,
  size: number | null,
  sessions: Session[],
  spots: Spot[],
  unit: 'm' | 'ft' = 'm',
): SkillProfile | null {
  const feel = s.fields.feel;
  const { lastChange: _drop, ...before } = p;
  const next: SkillProfile = { ...before };
  const reasons: string[] = [];
  const where = spot?.name ?? 'This session';
  const S = size;

  if (feel && S != null) {
    if (feel === 'comfortable' && S > p.comfort + 0.02) {
      let c = round(p.comfort + (S - p.comfort) / 4);
      const limit = stepAbove(p.comfort);
      if (c > limit) {
        const backup = sessions.some(
          (o) => o.id !== s.id && o.fields.feel === 'comfortable' && Math.abs(daysBetween(o.date, s.date)) <= 60 && (sessionSize(o, null) ?? 0) >= c,
        );
        if (!backup) c = limit;
      }
      if (c > p.comfort) {
        next.comfort = c;
        reasons.push(`Comfortable size ${fmtM(p.comfort, unit)} → ${fmtM(c, unit)}: ${where} felt comfortable at ~${fmtM(S, unit)}.`);
      }
    } else if (feel === 'over' && S <= p.comfort + 0.02) {
      const c = Math.max(0.3, round(p.comfort - (p.comfort - 0.9 * S) / 4));
      if (c < p.comfort) {
        next.comfort = c;
        reasons.push(`Comfortable size ${fmtM(p.comfort, unit)} → ${fmtM(c, unit)}: ${where} felt out of your depth at ~${fmtM(S, unit)}.`);
      }
    }
    if ((feel === 'comfortable' || feel === 'pushing') && S > p.max + 0.02 && s.fields.waves !== 0) {
      next.max = round(S);
      reasons.push(`Biggest wave ${fmtM(p.max, unit)} → ${fmtM(next.max, unit)}: you caught waves at ~${fmtM(S, unit)} at ${where}.`);
    }
  }
  next.max = Math.max(next.max, next.comfort);

  // Experience counts from the whole journal (this session included), only ever raising it.
  if (feel !== 'over') {
    const all = [...sessions.filter((o) => o.id !== s.id), s].filter((o) => o.fields.feel !== 'over');
    const spotOf = (o: Session) => (o.id === s.id ? spot : spots.find((x) => x.id === o.spotId));
    if (reefy(spot)) {
      const n = all.filter((o) => reefy(spotOf(o))).length;
      const reef = (n >= 5 ? 2 : n >= 1 ? 1 : 0) as SkillProfile['reefExp'];
      if (reef > p.reefExp) {
        next.reefExp = reef;
        reasons.push(`Reef experience: “${REEF_OPTIONS[p.reefExp].label}” → “${REEF_OPTIONS[reef].label}” (${n} reef session${n === 1 ? '' : 's'} logged).`);
      }
    }
    if (hollow(spot) && (p.steepExp ?? 0) < 1) {
      next.steepExp = 1;
      reasons.push(`Steep waves: now “${STEEP_OPTIONS[1].label}” after a session at ${where}.`);
    }
  }

  if (!reasons.length) return null;
  const nextStage = p.stage < 8 ? stageInfo((p.stage + 1) as Stage) : null;
  const stagePrompt = nextStage && next.comfort >= nextStage.comfort ? nextStage.stage : undefined;
  next.updatedAt = Date.now();
  next.lastChange = { at: next.updatedAt, sessionId: s.id, before, reasons, ...(stagePrompt ? { stagePrompt } : {}) };
  return next;
}

/** Undo the last automatic change. */
export function undoLastChange(p: SkillProfile): SkillProfile {
  return p.lastChange ? { ...p.lastChange.before, updatedAt: Date.now() } : p;
}

/**
 * After six months without a session (and without touching the profile), offer to lower the
 * comfortable size one step. Returns the suggested size, or null.
 */
export function rustyOffer(p: SkillProfile, sessions: Session[], today: string): number | null {
  const last = sessions.reduce<string | null>((a, s) => (!a || s.date > a ? s.date : a), null);
  if (!last || daysBetween(last, today) < 183) return null;
  if (Date.now() - p.updatedAt < 183 * 24 * 3600e3) return null;
  const lower = [...BODY_SCALE].reverse().find((s) => s.m < p.comfort - 0.01);
  return lower ? lower.m : null;
}
