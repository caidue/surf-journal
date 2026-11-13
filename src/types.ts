/** Surfer skill level (the user's own). */
export type Level = 'beginner' | 'intermediate' | 'advanced' | 'expert';
/** Minimum level a spot is suited for ('all' = works for everyone in the right conditions). */
export type SpotLevel = 'beginner' | 'all' | 'intermediate' | 'advanced' | 'expert';
export type BreakType = 'beach' | 'reef' | 'point';
export type Bottom = 'sand' | 'reef' | 'rock' | 'mixed';
export type TidePref = 'low' | 'low-mid' | 'mid' | 'mid-high' | 'high' | 'all';

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

export interface Spot {
  id: string;
  name: string;
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
  description: string;
  peaks: Peak[];
  guide?: SpotGuide;
  /** Multiplier from modelled breaking height to what you see at this spot. */
  gain: number;
  source?: string;
  custom?: boolean;
  updatedAt?: number;
}

/** One hour of conditions at a spot (local time at the spot). */
export interface HourConditions {
  time: string; // "2026-11-12T07:00" (local)
  waveH: number | null;
  waveDir: number | null;
  wavePer: number | null;
  swellH: number | null;
  swellPer: number | null;
  swellDir: number | null;
  swell2H: number | null;
  swell2Per: number | null;
  swell2Dir: number | null;
  windWaveH: number | null;
  windWavePer: number | null;
  windWaveDir: number | null;
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
  /** Centre of the Open-Meteo marine model grid cell the wave data comes from. */
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
  skillAtTime: Level;
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
  level: Level;
  categories: Category[];
  halfLifeMonths: number;
  ignoreBefore: string | null;
  boards: string[];
  heightUnit: 'm' | 'ft';
  windUnit: 'kmh' | 'kn';
  lastQuery?: string;
}

export const SLOT_MIN = 5;
export const SLOTS = (24 * 60) / SLOT_MIN; // 288
