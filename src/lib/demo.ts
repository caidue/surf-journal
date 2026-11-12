import type { Session, Settings, Spot } from '../types';
import { SLOT_MIN, SLOTS } from '../types';
import { db } from '../db';
import { fetchSeries, cellKey } from './openMeteo';
import { samplePoint } from './geo';
import { deriveSeries } from './conditions';
import { recommendability } from './rating';
import { addDays, isoToMin, todayAt, uid } from './time';

/**
 * Demo sessions on REAL past dates with REAL conditions from Open-Meteo, but invented
 * ratings (a simulated surfer who likes mid-to-high tide and clean wind). Marked demo:true
 * so they can be removed in one click.
 */

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const PLAN: { spotId: string; daysAgo: number; start: number; len: number }[] = [
  { spotId: 'fv-rocky-point', daysAgo: 4, start: 600, len: 120 },
  { spotId: 'fv-majanicho', daysAgo: 7, start: 540, len: 150 },
  { spotId: 'fv-cotillo-piedra-playa', daysAgo: 9, start: 960, len: 90 },
  { spotId: 'fv-rocky-point', daysAgo: 12, start: 720, len: 105 },
  { spotId: 'fv-punta-blanca', daysAgo: 16, start: 570, len: 120 },
  { spotId: 'fv-majanicho', daysAgo: 20, start: 900, len: 120 },
  { spotId: 'fv-glass-beach', daysAgo: 23, start: 630, len: 90 },
  { spotId: 'fv-rocky-point', daysAgo: 27, start: 510, len: 135 },
  { spotId: 'fv-cotillo-piedra-playa', daysAgo: 31, start: 600, len: 120 },
  { spotId: 'fv-la-caleta', daysAgo: 36, start: 690, len: 100 },
  { spotId: 'fv-majanicho', daysAgo: 41, start: 570, len: 140 },
  { spotId: 'fv-rocky-point', daysAgo: 46, start: 840, len: 110 },
  { spotId: 'fv-punta-blanca', daysAgo: 52, start: 660, len: 120 },
  { spotId: 'fv-cotillo-piedra-playa', daysAgo: 58, start: 540, len: 120 },
];

export async function addDemoSessions(spots: Spot[], settings: Settings): Promise<number> {
  const today = todayAt();
  const start = addDays(today, -60);
  const end = addDays(today, -2);
  const bySpot = new Map(spots.map((s) => [s.id, s]));
  const plan = PLAN.filter((p) => bySpot.has(p.spotId));
  const pts = [...new Set(plan.map((p) => p.spotId))].map((id) => samplePoint(bySpot.get(id)!));
  const series = await fetchSeries(pts, start, end);
  const rand = rng(42);
  const out: Session[] = [];
  for (const p of plan) {
    const spot = bySpot.get(p.spotId)!;
    const s = series.get(cellKey(samplePoint(spot)));
    const date = addDays(today, -p.daysAgo);
    const hours = s?.hours.filter((h) => h.time.startsWith(date)) ?? [];
    if (hours.length < 20) continue;
    const der = deriveSeries(spot, hours);
    const curves: Record<string, (number | null)[]> = {};
    for (const c of settings.categories) curves[c.id] = Array(SLOTS).fill(null);
    const zones: (string | null)[] = Array(SLOTS).fill(null);
    const lo = Math.floor(p.start / SLOT_MIN);
    const hi = Math.floor((p.start + p.len) / SLOT_MIN) - 1;
    const mood = (rand() - 0.5) * 1.5;
    for (let slot = lo; slot <= hi; slot++) {
      const m = slot * SLOT_MIN;
      const hIdx = hours.findIndex((h) => {
        const hm = isoToMin(h.time) ?? 0;
        return m >= hm && m < hm + 60;
      });
      const d = der[hIdx];
      const r = recommendability(spot, d, settings.level);
      const tideBonus = d.tideNorm != null ? (d.tideNorm - 0.4) * 2 : 0;
      const t = (slot - lo) / Math.max(1, hi - lo);
      const fatigue = t > 0.75 ? (t - 0.75) * 4 : 0;
      const fun = Math.max(1, Math.min(10, 1.5 + r.quality.q * 0.85 + tideBonus + mood - fatigue + (rand() - 0.5) * 0.6));
      const set = (id: string, v: number) => {
        if (curves[id]) curves[id][slot] = Math.round(Math.max(1, Math.min(10, v)) * 10) / 10;
      };
      set('fun', fun);
      set('waves', 1 + r.quality.q * 0.9 + (rand() - 0.5) * 0.5);
      set('exertion', 3 + t * 5 + (d.hb ?? 1) * 0.8);
      set('confidence', 8 - Math.max(0, (d.hb ?? 1) - 1.2) * 3 + (rand() - 0.5));
      if (spot.peaks.length) zones[slot] = spot.peaks[t < 0.45 ? 0 : spot.peaks.length - 1].id;
    }
    // Light smoothing so curves look hand-drawn rather than stepped.
    for (const id of Object.keys(curves)) {
      const a = curves[id];
      const b = a.slice();
      for (let k = lo + 1; k < hi; k++) if (a[k - 1] != null && a[k] != null && a[k + 1] != null) b[k] = Math.round(((a[k - 1]! + a[k]! + a[k + 1]!) / 3) * 10) / 10;
      curves[id] = b;
    }
    const now = Date.now();
    out.push({
      id: uid(),
      spotId: spot.id,
      date,
      startMin: p.start,
      endMin: p.start + p.len,
      zones,
      curves,
      conditions: hours,
      conditionsSource: s!.source,
      days: s!.days.filter((x) => x.date === date),
      fields: { board: rand() > 0.5 ? "7'0 mid-length" : "6'4 shortboard", crowd: ['Few', 'Moderate', 'Crowded'][Math.floor(rand() * 3)], wetsuit: '3/2', waves: Math.round(4 + rand() * 12) },
      tags: [],
      notes: 'Demo session: real conditions, invented ratings.',
      overall: null,
      excluded: false,
      skillAtTime: settings.level,
      demo: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  await db.sessions.bulkPut(out);
  return out.length;
}

export async function removeDemoSessions(): Promise<number> {
  return db.sessions.filter((s) => !!s.demo).delete();
}
