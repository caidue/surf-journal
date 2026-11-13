import type { HourConditions, Spot, WaveTrain } from '../types';
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
  /** Energy-weighted dominant PEAK period (s) and direction (deg) of the swell reaching the spot. */
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

export interface Partition {
  h: number;
  /** Peak period (s). */
  t: number;
  dir: number;
  /** Wind sea counts 0.7: short, disorganised waves break weaker than swell of the same height. */
  weight: number;
  kind: WaveTrain['kind'];
}

/** The hour's swell trains and wind sea; the total sea when the model has no trains (flat or old data). */
export function partitions(c: HourConditions): Partition[] {
  const out: Partition[] = (c.trains ?? []).map((t) => ({ h: t.h, t: t.tp, dir: t.dir, weight: t.kind === 'wind' ? 0.7 : 1, kind: t.kind }));
  if (!out.length && c.waveH != null && c.waveTp != null && c.waveDir != null) out.push({ h: c.waveH, t: c.waveTp, dir: c.waveDir, weight: 1, kind: 'swell' });
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

/** ρ g² / (16 π) in kJ: energy of one wave per metre of crest is ≈ 1.96 · H² · T² kJ (H in m, T = peak period in s). */
const ENERGY_K = (1025 * 9.81 * 9.81) / (16 * Math.PI) / 1000;

/** Wave energy (kJ per metre of crest) of one train: 1.96 · H² · Tp², the number surf-forecast.com shows. */
export function trainEnergyKJ(h: number, tp: number): number {
  return ENERGY_K * h * h * tp * tp;
}

export interface TrainInfo extends Partition {
  kj: number;
}

/** The hour's trains with their energy, most energetic first. */
export function trainsByEnergy(c: HourConditions): TrainInfo[] {
  return partitions(c)
    .map((p) => ({ ...p, kj: trainEnergyKJ(p.h, p.t) }))
    .sort((a, b) => b.kj - a.kj);
}

/**
 * Headline wave energy (kJ per metre of crest) of the Open-Meteo grid cell: the MOST ENERGETIC
 * train, as surf-forecast.com shows it (not the sum). It depends only on the model cell, not on
 * the spot, so every spot whose forecast comes from the same cell shows the same value.
 * Rough guide: ~100 kJ barely surfable, 200–1,000 increasingly punchy, 1,000–5,000+ heavy.
 */
export function waveEnergyKJ(c: HourConditions): number | null {
  return trainsByEnergy(c)[0]?.kj ?? null;
}

/** Sum over all trains (shown as a tooltip next to the headline). */
export function totalEnergyKJ(c: HourConditions): number | null {
  const t = trainsByEnergy(c);
  return t.length ? t.reduce((a, p) => a + p.kj, 0) : null;
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
