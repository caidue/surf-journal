import type { HourConditions, Spot } from '../types';
import { angdiff, toRad } from './geo';

/**
 * Spot-relative quantities derived from the offshore model data for one hour.
 * Offshore values are stored as truth; everything here is recomputed on the fly,
 * so formula or spot-setting improvements apply to old sessions too.
 */
export interface Derived {
  time: string;
  /** Estimated breaking wave height at the spot (m). */
  hb: number | null;
  /** Energy-weighted dominant period (s) and direction (deg) of the swell reaching the spot. */
  tDom: number | null;
  dirDom: number | null;
  /** Offshore-model "energy" proxy Σ a·H²·T. */
  energy: number | null;
  windSpeed: number | null;
  windDir: number | null;
  windGust: number | null;
  /** Wind components relative to the spot (km/h). uOff > 0 = offshore, < 0 = onshore. */
  uOff: number | null;
  uX: number | null;
  /** Tide height normalised to the day's range (0 = lowest, 1 = highest) and trend (-1 falling .. 1 rising). */
  tideNorm: number | null;
  tideTrend: number | null;
  waterTemp: number | null;
}

const G = 9.81;
const KG = 0.39 * Math.pow(G, 0.2); // Komar & Gaughan (1972) breaker height coefficient

/** Komar–Gaughan breaking height for one swell train: Hb = 0.39 g^(1/5) (T H²)^(2/5). */
export function breakingHeight(h: number, t: number): number {
  if (h <= 0 || t <= 0) return 0;
  return KG * Math.pow(t * h * h, 0.4);
}

/** How much of a swell coming from `dir` reaches the spot: 1 inside the core window, cosine taper to 0 at the window edge. */
export function exposure(spot: Pick<Spot, 'idealSwellDir' | 'swellWindow'>, dir: number): number {
  const d = Math.abs(angdiff(dir, spot.idealSwellDir));
  const w = Math.max(10, spot.swellWindow);
  const core = w * 0.55;
  if (d <= core) return 1;
  if (d >= w) return 0;
  return 0.5 * (1 + Math.cos((Math.PI * (d - core)) / (w - core)));
}

interface Partition {
  h: number;
  t: number;
  dir: number;
  weight: number;
}

export function partitions(c: HourConditions): Partition[] {
  const out: Partition[] = [];
  if (c.swellH != null && c.swellPer != null && c.swellDir != null) out.push({ h: c.swellH, t: c.swellPer, dir: c.swellDir, weight: 1 });
  if (c.swell2H != null && c.swell2Per != null && c.swell2Dir != null) out.push({ h: c.swell2H, t: c.swell2Per, dir: c.swell2Dir, weight: 1 });
  if (c.windWaveH != null && c.windWavePer != null && c.windWaveDir != null) out.push({ h: c.windWaveH, t: c.windWavePer, dir: c.windWaveDir, weight: 0.7 });
  // Older archive data (ERA5) has no partitions: fall back to the total sea state.
  if (!out.length && c.waveH != null && c.wavePer != null && c.waveDir != null) out.push({ h: c.waveH, t: c.wavePer, dir: c.waveDir, weight: 1 });
  return out;
}

export function deriveHour(spot: Spot, c: HourConditions, tide?: { norm: number | null; trend: number | null }, gain = spot.gain): Derived {
  const parts = partitions(c);
  let hbSq = 0;
  let eSum = 0;
  let tNum = 0;
  let sx = 0;
  let sy = 0;
  for (const p of parts) {
    const a = exposure(spot, p.dir) * p.weight;
    const hb = breakingHeight(p.h, p.t) * a;
    hbSq += hb * hb;
    const e = a * p.h * p.h * p.t;
    eSum += e;
    tNum += e * p.t;
    sx += e * Math.cos(toRad(p.dir));
    sy += e * Math.sin(toRad(p.dir));
  }
  const hb = parts.length ? gain * Math.sqrt(hbSq) : null;
  const tDom = eSum > 0 ? tNum / eSum : parts.length ? parts[0].t : null;
  const dirDom = eSum > 0 ? (((Math.atan2(sy, sx) * 180) / Math.PI) + 360) % 360 : parts.length ? parts[0].dir : null;

  let uOff: number | null = null;
  let uX: number | null = null;
  if (c.windSpeed != null && c.windDir != null) {
    const offFrom = (spot.facing + 180) % 360;
    const d = toRad(angdiff(c.windDir, offFrom));
    uOff = c.windSpeed * Math.cos(d);
    uX = c.windSpeed * Math.abs(Math.sin(d));
  }
  return {
    time: c.time,
    hb,
    tDom,
    dirDom,
    energy: parts.length ? eSum : null,
    windSpeed: c.windSpeed,
    windDir: c.windDir,
    windGust: c.windGust,
    uOff,
    uX,
    tideNorm: tide?.norm ?? null,
    tideTrend: tide?.trend ?? null,
    waterTemp: c.waterTemp,
  };
}

/** Tide height normalised per calendar day, plus rising/falling trend. */
export function tideInfo(hours: HourConditions[]): { norm: number | null; trend: number | null }[] {
  const byDay = new Map<string, number[]>();
  hours.forEach((h, i) => {
    const day = h.time.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(i);
  });
  const out: { norm: number | null; trend: number | null }[] = hours.map(() => ({ norm: null, trend: null }));
  for (const idx of byDay.values()) {
    const vals = idx.map((i) => hours[i].seaLevel).filter((v): v is number => v != null);
    if (vals.length < 6) continue;
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const range = hi - lo;
    if (range < 0.05) continue;
    for (const i of idx) {
      const v = hours[i].seaLevel;
      if (v == null) continue;
      const prev = hours[i - 1]?.seaLevel ?? v;
      const next = hours[i + 1]?.seaLevel ?? v;
      const slope = (next - prev) / 2; // m per hour
      out[i] = {
        norm: (v - lo) / range,
        // Max slope of a semi-diurnal tide is ~ range * π / 12 per hour.
        trend: Math.max(-1, Math.min(1, slope / ((range * Math.PI) / 12))),
      };
    }
  }
  return out;
}

export function deriveSeries(spot: Spot, hours: HourConditions[], gain = spot.gain): Derived[] {
  const tide = tideInfo(hours);
  return hours.map((h, i) => deriveHour(spot, h, tide[i], gain));
}

export type WindKind = 'glassy' | 'offshore' | 'cross-off' | 'cross' | 'cross-on' | 'onshore';

export function windKind(d: Pick<Derived, 'windSpeed' | 'uOff' | 'uX'>): WindKind | null {
  if (d.windSpeed == null || d.uOff == null || d.uX == null) return null;
  if (d.windSpeed < 6) return 'glassy';
  const ang = (Math.atan2(d.uX, d.uOff) * 180) / Math.PI; // 0 = straight offshore, 180 = straight onshore
  if (ang < 35) return 'offshore';
  if (ang < 70) return 'cross-off';
  if (ang < 110) return 'cross';
  if (ang < 145) return 'cross-on';
  return 'onshore';
}

export const WIND_LABEL: Record<WindKind, string> = {
  glassy: 'glassy',
  offshore: 'offshore',
  'cross-off': 'cross-offshore',
  cross: 'cross-shore',
  'cross-on': 'cross-onshore',
  onshore: 'onshore',
};

export function tideLabel(norm: number | null, trend: number | null): string {
  if (norm == null) return '–';
  const lvl = norm < 0.2 ? 'low' : norm < 0.4 ? 'low-mid' : norm < 0.6 ? 'mid' : norm < 0.8 ? 'mid-high' : 'high';
  if (trend == null || Math.abs(trend) < 0.25) return lvl;
  return `${lvl}, ${trend > 0 ? 'rising' : 'falling'}`;
}

/* ---------- wave energy & tide extremes (for the hourly forecast table) ---------- */

/** ρ g² / (16 π) in kJ: energy of one wave per metre of crest is ≈ 1.96 · H² · T² kJ (H in m, T in s). */
const ENERGY_K = (1025 * 9.81 * 9.81) / (16 * Math.PI) / 1000;

/**
 * Swell energy reaching the spot (kJ per metre of wave crest, summed over swell trains,
 * each weighted by how much of it the spot's swell window lets in). Long-period swell
 * carries far more energy than the same height of short wind sea, which is why surfers
 * look at it next to the height.
 */
export function waveEnergyKJ(spot: Pick<Spot, 'idealSwellDir' | 'swellWindow'>, c: HourConditions): number | null {
  const parts = partitions(c);
  if (!parts.length) return null;
  let e = 0;
  for (const p of parts) e += exposure(spot, p.dir) * ENERGY_K * p.h * p.h * p.t * p.t;
  return e;
}

export interface TideExtreme {
  date: string;
  /** Minutes after local midnight (interpolated between the hourly values). */
  min: number;
  level: number;
  type: 'high' | 'low';
}

/** High and low tides on `date`, timed to the minute by fitting a parabola through the hourly sea level. */
export function tideExtremes(hours: HourConditions[], date: string): TideExtreme[] {
  const out: TideExtreme[] = [];
  for (let i = 1; i < hours.length - 1; i++) {
    const a = hours[i - 1].seaLevel;
    const b = hours[i].seaLevel;
    const c = hours[i + 1].seaLevel;
    if (a == null || b == null || c == null) continue;
    const high = b >= a && b > c;
    const low = b <= a && b < c;
    if (!high && !low) continue;
    const denom = a - 2 * b + c;
    const off = denom === 0 ? 0 : Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / denom)); // hours
    const level = b - 0.25 * (a - c) * off;
    const base = Number(hours[i].time.slice(11, 13)) * 60 + Number(hours[i].time.slice(14, 16));
    let min = Math.round(base + off * 60);
    let day = hours[i].time.slice(0, 10);
    if (min < 0) {
      min += 1440;
      day = hours[i - 1].time.slice(0, 10);
    } else if (min >= 1440) {
      min -= 1440;
      day = hours[i + 1].time.slice(0, 10);
    }
    if (day === date) out.push({ date: day, min, level, type: high ? 'high' : 'low' });
  }
  return out;
}
