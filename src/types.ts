/** Minimum level a spot is suited for ('all' = works for everyone in the right conditions). */
export type SpotLevel = 'beginner' | 'all' | 'intermediate' | 'advanced' | 'expert';
export type BreakType = 'beach' | 'reef' | 'point';
export type Bottom = 'sand' | 'reef' | 'rock' | 'mixed';
export type TidePref = 'low' | 'low-mid' | 'mid' | 'mid-high' | 'high' | 'all';
/** How the wave breaks: mellow (crumbly), punchy, hollow (barrels, steep take-offs) or slab (heavy, very shallow). */
export type Power = 'mellow' | 'punchy' | 'hollow' | 'slab';
/** How fast the wave peels along: slow, medium, fast or sectiony (closes in sections). */
export type Peel = 'slow' | 'medium' | 'fast' | 'sectiony';

/* ---------------- the surfer (skill profile, see lib/skill.ts) ---------------- */

/** Surfing stage 1–8, from "never surfed" to "big waves" (see STAGES in lib/skill.ts). */
export type Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type BoardKind = 'softtop' | 'longboard' | 'midlength' | 'fish' | 'shortboard' | 'stepup' | 'bodyboard';

export interface SkillProfile {
  stage: Stage;
  /** C: face height (m) you are comfortable in. */
  comfort: number;
  /** M: biggest face height (m) you have caught. Never below C. */
  max: number;
  board: BoardKind;
  /** Reef experience: 0 never, 1 a few times, 2 regularly, 3 shallow reef at low tide too. */
  reefExp: 0 | 1 | 2 | 3;
  /** Getting out on a bigger day: 0 would struggle … 3 no problem. */
  paddleOut: 0 | 1 | 2 | 3;
  /** Steep and hollow waves: 0 prefer mellow, 1 OK with steeper, 2 love late drops and barrels. */
  steepExp?: 0 | 1 | 2;
  frequency?: 'rarely' | 'monthly' | 'weekly' | 'often';
  years?: 'lt1' | '1to3' | '3to10' | 'gt10';
  /** "Can you swim 25 m and stay calm out of your depth without your board?" */
  waterConfidence?: 'yes' | 'unsure' | 'no';
  /** Show sessions a bit above your comfort size as "Stretch session" instead of "Challenging". */
  wantsChallenge?: boolean;
  updatedAt: number;
  /** The last change a logged session made, so the app can explain it and undo it. */
  lastChange?: ProfileChange;
}

export interface ProfileChange {
  at: number;
  sessionId: string;
  before: Omit<SkillProfile, 'lastChange'>;
  /** One line per change, e.g. "Comfortable size 1.2 → 1.3 m: Majanicho felt comfortable at ~1.6 m." */
  reasons: string[];
  /** Comfort size now matches this stage: ask the surfer whether to move up (never automatic). */
  stagePrompt?: Stage;
  seen?: boolean;
}

/** The surfer's skill when a session was logged (for weighting old sessions). */
export interface SkillSnapshot {
  stage: Stage;
  comfort: number;
  max: number;
}

/** "How did it feel?" after a session: drives the bounded profile updates. */
export type Feel = 'small' | 'comfortable' | 'pushing' | 'over';

export interface Peak {
  id: string;
  name: string;
  description?: string;
  /** Spot-guide details for this wave (all optional; shown in the spot overview). */
  breakType?: BreakType;
  bottom?: Bottom;
  /** e.g. "left", "right", "left and right". */
  direction?: string;
  level?: SpotLevel;
  /** When it works best: tide, swell, wind, size. */
  goodWhen?: string;
  /** Best months 1–12 when they differ from the spot's. */
  season?: number[];
  /** Rating overrides: when set, this peak is rated on its own (see peakSpot() in lib/rating.ts). */
  minSize?: number;
  maxSize?: number;
  tide?: TidePref;
  power?: Power;
  peel?: Peel;
}

/** A freely licensed photo (Wikimedia Commons), shown with its credit. */
export interface SpotPhoto {
  imageUrl: string;
  pageUrl: string;
  author: string;
  license: string;
  caption?: string;
}

/** Practical spot guide: season, boards, access, warnings, parking, facilities, photos. */
export interface SpotGuide {
  /** Best months 1–12. */
  season?: number[];
  seasonNote?: string;
  boards?: string[];
  access?: { paddleOut?: string; paddleIn?: string; easier?: string; harder?: string };
  warnings?: string[];
  parking?: string;
  facilities?: string[];
  photos?: SpotPhoto[];
  sources?: string[];
}

/** The same spot in other services, for links out (we never copy their data). */
export interface ExternalIds {
  /** Surfline "slug/spotId", e.g. "majanicho/584204204e65fad6a77096a2". */
  surfline?: string;
  /** surf-forecast.com break slug, e.g. "Majanicho". */
  surfForecast?: string;
}

export interface Spot {
  id: string;
  /** Display name: Surfline's name where Surfline has the spot. */
  name: string;
  /** Other names people use (search finds them all). */
  aliases?: string[];
  externalIds?: ExternalIds;
  region: string;
  lat: number;
  lon: number;
  /** True when the coordinates are an estimate and should be checked/corrected. */
  coordsApprox: boolean;
  /** Seaward direction the break faces (deg, 0 = N). Offshore wind blows FROM facing + 180. */
  facing: number;
  /** Swell direction (deg, "coming from") that hits the spot best. */
  idealSwellDir: number;
  /** Half-width of the swell window around idealSwellDir (deg). */
  swellWindow: number;
  /** Breaking wave height (m) at which the spot starts to work / gets too big. */
  minSize: number;
  maxSize: number;
  tide: TidePref;
  breakType: BreakType;
  bottom: Bottom;
  level: SpotLevel;
  hazards: string[];
  power?: Power;
  peel?: Peel;
  lifeguard?: boolean;
  crowd?: 'low' | 'medium' | 'high';
  localism?: 'none' | 'some' | 'strong';
  description: string;
  peaks: Peak[];
  guide?: SpotGuide;
  /** Multiplier from modelled breaking height to what you see at this spot. */
  gain: number;
  source?: string;
  custom?: boolean;
  updatedAt?: number;
}

/** Version of the stored conditions (sessions and cached forecasts); older snapshots are re-fetched. */
export const CONDITIONS_VERSION = 2;

/** One swell train (or the wind sea) in one hour, offshore. */
export interface WaveTrain {
  kind: 'swell' | 'wind';
  /** Significant height (m), scaled so the trains add up to the reference model's total sea. */
  h: number;
  /** Peak period Tp (s): the period surf sites show. */
  tp: number;
  /** Direction the waves come from (deg). */
  dir: number;
}

/** One hour of conditions at a spot (local time at the spot). Offshore model values, see lib/openMeteo.ts. */
export interface HourConditions {
  time: string; // "2026-11-12T07:00" (local)
  /** Total sea: significant wave height (m) and mean direction (Météo-France MFWAM). */
  waveH: number | null;
  waveDir: number | null;
  /** Peak period of the total sea (s): ECMWF WAM, else GFS-Wave. */
  waveTp: number | null;
  /** Energy period Tm-1,0 of the total sea (s): MFWAM's "wave period". */
  waveTe: number | null;
  /** Swell trains (primary, secondary, tertiary) and the wind sea, from GFS-Wave 0.16°. */
  trains: WaveTrain[];
  /** Peak periods estimated from mean periods (dates before the peak-period archives start). */
  tpEstimated?: boolean;
  windSpeed: number | null; // km/h
  windDir: number | null; // deg, "coming from"
  windGust: number | null; // km/h
  seaLevel: number | null; // m relative to MSL, includes tide
  waterTemp: number | null;
  airTemp: number | null;
}

export interface DayInfo {
  date: string;
  sunrise: string | null; // "2026-11-12T07:41"
  sunset: string | null;
}

export interface ConditionsSeries {
  key: string;
  lat: number;
  lon: number;
  timezone: string;
  utcOffsetSeconds: number;
  hours: HourConditions[];
  days: DayInfo[];
  source: string;
  /** CONDITIONS_VERSION the hours were stored with. */
  version: number;
  /** Centre of the Open-Meteo marine model grid cell the wave data comes from (MFWAM). */
  gridLat?: number;
  gridLon?: number;
  fetchedAt: number;
  /** Set (never stored) when the network failed and this is the newest saved copy. */
  stale?: boolean;
}

export interface SessionFields {
  board?: string;
  wetsuit?: string;
  crowd?: string;
  waves?: number | null;
  observedSize?: string;
  vsForecast?: string;
  /** How the size felt for you. */
  feel?: Feel;
}

export interface Session {
  id: string;
  spotId: string;
  date: string; // YYYY-MM-DD (local at the spot)
  startMin: number; // minutes after local midnight
  endMin: number;
  /** Category id -> your 1–10 rating for the session ("fun" is required and drives recommendations). */
  ratings: Record<string, number>;
  /** Snapshot of the day's hourly conditions, stored with the session forever. */
  conditions: HourConditions[];
  conditionsSource: string;
  /** CONDITIONS_VERSION of the snapshot; older ones are re-fetched by lib/sync.ts. */
  conditionsVersion?: number;
  /**
   * Logged without a connection: conditions are missing or come from an older saved forecast.
   * Filled in automatically the next time the app is online (see lib/sync.ts).
   */
  conditionsPending?: boolean;
  days?: DayInfo[];
  fields: SessionFields;
  tags: string[];
  notes: string;
  /** "Not relevant anymore": kept in the journal, ignored for predictions. */
  excluded: boolean;
  skillAtTime: SkillSnapshot;
  demo?: boolean;
  createdAt: number;
  updatedAt: number;
}

/** A photo you added to a spot yourself (stored only on this device). */
export interface UserPhoto {
  id: string;
  spotId: string;
  /** JPEG, scaled down to at most 1600 px. */
  blob: Blob;
  width: number;
  height: number;
  caption?: string;
  addedAt: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Settings {
  id: 'settings';
  /** Your surfing (null until the first-launch questions are answered). */
  profile: SkillProfile | null;
  categories: Category[];
  halfLifeMonths: number;
  ignoreBefore: string | null;
  boards: string[];
  heightUnit: 'm' | 'ft';
  windUnit: 'kmh' | 'kn' | 'mph';
  lastQuery?: string;
  /** SEED_VERSION of the built-in spots on this device (see data/seedSpots.ts). */
  seedVersion?: number;
}

export const SLOT_MIN = 5;
export const SLOTS = (24 * 60) / SLOT_MIN; // 288
