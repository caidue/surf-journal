import type { ConditionsSeries, DayInfo, HourConditions } from '../types';
import { db } from '../db';
import { addDays, daysBetween, todayAt } from './time';

/**
 * Open-Meteo (CC BY 4.0, free for non-commercial use, no API key):
 *  - Marine API: swell partitions, wind waves, sea level incl. tide, SST. Partition history from ~Nov 2021.
 *  - Forecast API (recent past ~3 months + 16-day forecast), Historical Forecast API (2022+),
 *    ERA5 Archive (1940+) for wind, sunrise/sunset.
 */

const MARINE_VARS = [
  'wave_height',
  'wave_direction',
  'wave_period',
  'swell_wave_height',
  'swell_wave_period',
  'swell_wave_direction',
  'secondary_swell_wave_height',
  'secondary_swell_wave_period',
  'secondary_swell_wave_direction',
  'wind_wave_height',
  'wind_wave_period',
  'wind_wave_direction',
  'sea_level_height_msl',
  'sea_surface_temperature',
];
const WEATHER_VARS = ['wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'temperature_2m'];

export interface Point {
  lat: number;
  lon: number;
}

export const cellKey = (p: Point) => `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`;

function weatherEndpoint(start: string, today: string): string {
  const age = daysBetween(start, today);
  if (age <= 80) return 'https://api.open-meteo.com/v1/forecast';
  if (start >= '2022-01-01') return 'https://historical-forecast-api.open-meteo.com/v1/forecast';
  return 'https://archive-api.open-meteo.com/v1/archive';
}

type Json = Record<string, any>;

/** Give up on a hanging request (weak signal at the beach) so the saved copy can be shown instead. */
const TIMEOUT_MS = 25_000;

async function getJson(url: string): Promise<Json[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const res = await fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.error) {
    throw new Error(body?.reason || `Request failed (${res.status})`);
  }
  return Array.isArray(body) ? body : [body];
}

function qs(points: Point[], vars: string[], start: string, end: string, extra = ''): string {
  return (
    `latitude=${points.map((p) => p.lat.toFixed(3)).join(',')}` +
    `&longitude=${points.map((p) => p.lon.toFixed(3)).join(',')}` +
    `&hourly=${vars.join(',')}&timezone=auto&start_date=${start}&end_date=${end}${extra}`
  );
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function merge(marine: Json | undefined, weather: Json | undefined): { hours: HourConditions[]; days: DayInfo[] } {
  const times: string[] = marine?.hourly?.time ?? weather?.hourly?.time ?? [];
  const mh = marine?.hourly ?? {};
  const wh = weather?.hourly ?? {};
  const wIndex = new Map<string, number>((weather?.hourly?.time ?? []).map((t: string, i: number) => [t, i]));
  const hours = times.map((time, i) => {
    const j = wIndex.get(time);
    const w = (k: string) => (j == null ? null : num(wh[k]?.[j]));
    return {
      time,
      waveH: num(mh.wave_height?.[i]),
      waveDir: num(mh.wave_direction?.[i]),
      wavePer: num(mh.wave_period?.[i]),
      swellH: num(mh.swell_wave_height?.[i]),
      swellPer: num(mh.swell_wave_period?.[i]),
      swellDir: num(mh.swell_wave_direction?.[i]),
      swell2H: num(mh.secondary_swell_wave_height?.[i]),
      swell2Per: num(mh.secondary_swell_wave_period?.[i]),
      swell2Dir: num(mh.secondary_swell_wave_direction?.[i]),
      windWaveH: num(mh.wind_wave_height?.[i]),
      windWavePer: num(mh.wind_wave_period?.[i]),
      windWaveDir: num(mh.wind_wave_direction?.[i]),
      windSpeed: w('wind_speed_10m'),
      windDir: w('wind_direction_10m'),
      windGust: w('wind_gusts_10m'),
      seaLevel: num(mh.sea_level_height_msl?.[i]),
      waterTemp: num(mh.sea_surface_temperature?.[i]),
      airTemp: w('temperature_2m'),
    } satisfies HourConditions;
  });
  const d = weather?.daily;
  const days: DayInfo[] = (d?.time ?? []).map((date: string, i: number) => ({
    date,
    sunrise: d.sunrise?.[i] ?? null,
    sunset: d.sunset?.[i] ?? null,
  }));
  return { hours, days };
}

const inflight = new Map<string, Promise<ConditionsSeries>>();

/** True when the browser says there is no connection, or fetch() failed at the network level. */
export function isOfflineError(e: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return e instanceof TypeError || (e instanceof DOMException && e.name === 'AbortError');
}

/**
 * The newest saved series for this model cell that covers [start, end], cut to that range and
 * flagged `stale`. Lets the app work offline from whatever was loaded last (e.g. the 3-day
 * forecast loaded on Explore also serves today's session log).
 */
export async function findSaved(ck: string, start: string, end: string): Promise<ConditionsSeries | null> {
  const rows = await db.forecasts.where('key').startsWith(`${ck}|`).toArray();
  let best: ConditionsSeries | null = null;
  for (const r of rows) {
    const [, s, e] = r.key.split('|');
    if (s <= start && e >= end && (!best || r.fetchedAt > best.fetchedAt)) best = r;
  }
  if (!best) return null;
  const inRange = (d: string) => d >= start && d <= end;
  return {
    ...best,
    key: `${ck}|${start}|${end}`,
    hours: best.hours.filter((h) => inRange(h.time.slice(0, 10))),
    days: best.days.filter((d) => inRange(d.date)),
    stale: true,
  };
}

/**
 * Hourly conditions for several points over [start, end] (local dates at the points).
 * Results are cached in IndexedDB: past days forever, today/future for one hour.
 * If the network fails, the newest saved copy is returned with `stale: true`; it only throws
 * when there is nothing saved for any of the points.
 */
export async function fetchSeries(points: Point[], start: string, end: string, opts: { force?: boolean } = {}): Promise<Map<string, ConditionsSeries>> {
  const out = new Map<string, ConditionsSeries>();
  const unique = new Map<string, Point>();
  for (const p of points) unique.set(cellKey(p), { lat: Number(p.lat.toFixed(2)), lon: Number(p.lon.toFixed(2)) });
  const today = todayAt();
  const permanent = end < addDays(today, -2);
  const missing: Point[] = [];
  const failed: Point[] = [];
  let firstError: unknown = null;
  const fail = (p: Point, e: unknown) => {
    failed.push(p);
    firstError ??= e;
  };

  for (const [ck, p] of unique) {
    const key = `${ck}|${start}|${end}`;
    const cached = opts.force ? undefined : await db.forecasts.get(key);
    if (cached && (permanent || Date.now() - cached.fetchedAt < 60 * 60 * 1000)) out.set(ck, cached);
    else if (inflight.has(key)) {
      try {
        out.set(ck, await inflight.get(key)!);
      } catch (e) {
        fail(p, e);
      }
    } else missing.push(p);
  }

  for (let i = 0; i < missing.length; i += 25) {
    const chunk = missing.slice(i, i + 25);
    const run = (async () => {
      const [marine, weather] = await Promise.all([
        getJson(`https://marine-api.open-meteo.com/v1/marine?${qs(chunk, MARINE_VARS, start, end)}`).catch((e) => {
          if (isOfflineError(e)) throw e;
          console.warn('marine', e);
          return [] as Json[];
        }),
        getJson(`${weatherEndpoint(start, today)}?${qs(chunk, WEATHER_VARS, start, end, '&daily=sunrise,sunset')}`),
      ]);
      const series = chunk.map((p, k) => {
        const m = marine[k];
        const w = weather[k];
        const { hours, days } = merge(m, w);
        const s: ConditionsSeries = {
          key: `${cellKey(p)}|${start}|${end}`,
          lat: p.lat,
          lon: p.lon,
          timezone: w?.timezone ?? m?.timezone ?? 'UTC',
          utcOffsetSeconds: w?.utc_offset_seconds ?? m?.utc_offset_seconds ?? 0,
          hours,
          days,
          gridLat: num(m?.latitude) ?? undefined,
          gridLon: num(m?.longitude) ?? undefined,
          source: `Open-Meteo marine (${m ? `grid ${num(m.latitude)?.toFixed(2)}, ${num(m.longitude)?.toFixed(2)}` : 'unavailable'}) + ${weatherEndpoint(start, today).includes('archive') ? 'ERA5 archive' : 'weather model'} wind`,
          fetchedAt: Date.now(),
        };
        return s;
      });
      await db.forecasts.bulkPut(series);
      return series;
    })();
    chunk.forEach((p, k) => {
      const one = run.then((s) => s[k]);
      one.catch(() => {}); // awaited elsewhere; don't report it as unhandled
      inflight.set(`${cellKey(p)}|${start}|${end}`, one);
    });
    try {
      const series = await run;
      series.forEach((s, k) => out.set(cellKey(chunk[k]), s));
    } catch (e) {
      chunk.forEach((p) => fail(p, e));
    } finally {
      chunk.forEach((p) => inflight.delete(`${cellKey(p)}|${start}|${end}`));
    }
  }

  for (const p of failed) {
    const saved = await findSaved(cellKey(p), start, end);
    if (saved) out.set(cellKey(p), saved);
  }
  if (failed.length && out.size === 0) throw firstError;
  return out;
}

export async function fetchOne(p: Point, start: string, end = start, opts?: { force?: boolean }): Promise<ConditionsSeries> {
  const m = await fetchSeries([p], start, end, opts);
  const s = m.get(cellKey(p));
  if (!s) throw new Error('No data');
  return s;
}

/** Drop cached forecasts older than a week that are not permanent history (keeps the DB small). */
export async function pruneCache(): Promise<void> {
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  await db.forecasts.where('fetchedAt').below(cutoff).delete();
}

/** Centre of the marine model grid cell a series comes from. */
export function gridOf(s: ConditionsSeries | undefined): { lat: number; lon: number } | null {
  return s?.gridLat != null && s.gridLon != null ? { lat: s.gridLat, lon: s.gridLon } : null;
}

/** Grid cells are ~0.08° apart, so 2 decimals identify one. */
export const gridKey = (s: ConditionsSeries | undefined) => {
  const g = gridOf(s);
  return g ? `${g.lat.toFixed(2)},${g.lon.toFixed(2)}` : null;
};
