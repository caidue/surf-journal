import type { Feel, Session, Settings, Spot } from '../types';
import { CONDITIONS_VERSION } from '../types';
import { db } from '../db';
import { fetchSeries, cellKey } from './openMeteo';
import { samplePoint } from './geo';
import { deriveSeries, windKind } from './conditions';
import { rateSpot } from './rating';
import { DEFAULT_PROFILE, OBSERVED_SIZES, snapshot } from './skill';
import { addDays, isoToMin, todayAt, uid } from './time';

/**
 * Demo sessions on REAL past dates with REAL conditions from Open-Meteo, but an invented surfer:
 * random spots (a few favourites), days, times, gear and notes, and ratings that follow the actual
 * conditions (likes mid-to-high tide and clean wind). Different every time; marked demo:true so
 * they can be removed in one click. Adding again replaces the previous demo set. Demo sessions
 * never change your surfing profile.
 */

const BOARDS = ["6'0 shortboard", "6'4 shortboard", "7'0 mid-length", "9'0 longboard", "5'10 fish"];
const CROWD = ['Empty', 'Few', 'Moderate', 'Crowded', 'Packed'];
const NOTES = [
  'Demo session: real conditions, invented ratings.',
  'Demo: sets were inconsistent, long waits between them.',
  'Demo: paddled out in the channel, current pulled left.',
  'Demo: best waves in the first hour, then the wind came up.',
  'Demo: worked on bottom turns, a few good ones.',
  'Demo: crowded at the main peak, found some on the inside.',
  'Demo: fun session, long rides on the sets.',
  'Demo: tide too high at the end, waves got fat.',
];

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const between = (lo: number, hi: number, step = 1) => lo + step * Math.floor(Math.random() * ((hi - lo) / step + 1));
const shuffle = <T,>(xs: T[]) => xs.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(([, x]) => x);

export async function addDemoSessions(spots: Spot[], settings: Settings): Promise<number> {
  if (!spots.length) return 0;
  const today = todayAt();
  const start = addDays(today, -60);
  const end = addDays(today, -2);

  // A few favourite spots get most sessions, a couple of others the rest.
  const pool = shuffle(spots);
  const favourites = pool.slice(0, Math.min(pool.length, between(3, 5)));
  const others = pool.slice(favourites.length, favourites.length + 3);
  const count = between(12, 16);
  const plan: { spot: Spot; date: string; startMin: number; len: number }[] = [];
  const used = new Set<string>();
  for (let tries = 0; plan.length < count && tries < count * 10; tries++) {
    const spot = Math.random() < 0.8 || !others.length ? pick(favourites) : pick(others);
    const date = addDays(today, -between(2, 60));
    if (used.has(`${spot.id}|${date}`)) continue;
    used.add(`${spot.id}|${date}`);
    const len = between(60, 180, 15);
    const startMin = between(7 * 60 + 30, 18 * 60 - len, 15);
    plan.push({ spot, date, startMin, len });
  }

  const pts = [...new Map(plan.map((p) => [p.spot.id, samplePoint(p.spot)])).values()];
  const series = await fetchSeries(pts, start, end);
  const favouriteBoard = pick(BOARDS);
  const profile = settings.profile ?? DEFAULT_PROFILE;
  const out: Session[] = [];

  for (const p of plan) {
    const s = series.get(cellKey(samplePoint(p.spot)));
    const hours = s?.hours.filter((h) => h.time.startsWith(p.date)) ?? [];
    if (hours.length < 20) continue;
    const der = deriveSeries(p.spot, hours);
    const idx = hours.map((h, k) => ({ k, m: isoToMin(h.time) ?? 0 })).filter(({ m }) => m + 60 > p.startMin && m < p.startMin + p.len);
    if (!idx.length) continue;
    const avg = (f: (k: number) => number) => idx.reduce((a, { k }) => a + f(k), 0) / idx.length;
    const q = avg((k) => rateSpot(p.spot, der[k], profile).quality.q);
    const tideBonus = avg((k) => (der[k].tideNorm != null ? (der[k].tideNorm! - 0.4) * 2 : 0));
    const hb = avg((k) => der[k].hb ?? 1);
    const mid = der[idx[Math.floor(idx.length / 2)].k];
    const wind = windKind(mid);
    const mood = (Math.random() - 0.5) * 1.5;
    const clamp = (v: number) => Math.round(Math.max(1, Math.min(10, v)) * 2) / 2;
    const fun = clamp(1.5 + q * 0.85 + tideBonus + mood + (Math.random() - 0.5) * 0.8);

    // Tags that fit what actually happened, plus the odd random one.
    const tags = new Set<string>();
    if (wind === 'glassy' || wind === 'offshore') tags.add('Glassy');
    if (wind === 'onshore' || wind === 'cross-on') tags.add('Choppy');
    if (hb > 2) tags.add('Closeouts');
    if (fun >= 7.5) tags.add(pick(['Long rides', 'Progress made', 'Barrels']));
    if (Math.random() < 0.15) tags.add(pick(['Strong current', 'Crowded peak', 'Sea life', 'New board']));
    // The size you saw: near the estimate, sometimes not noted.
    const target = hb * (0.8 + Math.random() * 0.4);
    const seen = Math.random() < 0.6 ? OBSERVED_SIZES.reduce((a, o) => (Math.abs(o.m - target) < Math.abs(a.m - target) ? o : a)) : null;
    // How the size felt, against the comfortable size (sometimes not noted).
    const feel: Feel | undefined =
      Math.random() < 0.3 ? undefined : hb < profile.comfort * 0.6 ? 'small' : hb <= profile.comfort * 1.05 ? 'comfortable' : hb <= profile.max ? 'pushing' : 'over';
    const month = Number(p.date.slice(5, 7));
    const now = Date.now();
    out.push({
      id: uid(),
      spotId: p.spot.id,
      date: p.date,
      startMin: p.startMin,
      endMin: p.startMin + p.len,
      ratings: {
        fun,
        exertion: clamp(3 + (p.len / 60) * 1.5 + hb * 0.8 + (Math.random() - 0.5)),
        confidence: clamp(8 - Math.max(0, hb - 1.2) * 3 + (Math.random() - 0.5) * 1.5),
      },
      conditions: hours,
      conditionsSource: s!.source,
      conditionsVersion: CONDITIONS_VERSION,
      days: s!.days.filter((x) => x.date === p.date),
      fields: {
        board: Math.random() < 0.7 ? favouriteBoard : pick(BOARDS),
        wetsuit: month >= 11 || month <= 4 ? pick(['3/2', '4/3']) : pick(['Shorty / top', '3/2']),
        crowd: pick(CROWD),
        waves: between(3, 20),
        observedSize: seen && seen.id !== 'flat' ? seen.id : undefined,
        vsForecast: Math.random() < 0.5 ? pick(['Worse', 'As forecast', 'Better']) : undefined,
        feel,
      },
      tags: [...tags],
      notes: pick(NOTES),
      excluded: false,
      skillAtTime: snapshot(profile),
      demo: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  await db.transaction('rw', db.sessions, async () => {
    await db.sessions.filter((x) => !!x.demo).delete(); // replace the previous demo set
    await db.sessions.bulkPut(out);
  });
  return out.length;
}

export async function removeDemoSessions(): Promise<number> {
  return db.sessions.filter((s) => !!s.demo).delete();
}
