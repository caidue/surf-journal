import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db';
import { SEED_SPOTS } from '../data/seedSpots';
import type { ConditionsSeries, HourConditions, Session } from '../types';
import { CONDITIONS_VERSION, SLOTS } from '../types';
import { cellKey, fetchSeries, gridKey, marineHour } from './openMeteo';
import { profileForStage, snapshot } from './skill';
import { samplePoint } from './geo';
import { syncPendingSessions } from './sync';
import { addDays, todayAt } from './time';

const today = todayAt();
const spot = SEED_SPOTS[0];
const cell = samplePoint(spot);

const hour = (time: string, waveH = 1.2): HourConditions => ({
  time,
  waveH,
  waveDir: 0,
  waveTp: 11,
  waveTe: 9,
  trains: [{ kind: 'swell', h: waveH, tp: 11, dir: 0 }],
  windSpeed: 12,
  windDir: 180,
  windGust: 18,
  seaLevel: 0.5,
  waterTemp: 20,
  airTemp: 22,
});
const dayHours = (date: string, waveH?: number) => Array.from({ length: 24 }, (_, h) => hour(`${date}T${String(h).padStart(2, '0')}:00`, waveH));

function savedSeries(start: string, end: string, fetchedAt: number): ConditionsSeries {
  const dates = [start, addDays(start, 1), addDays(start, 2)].filter((d) => d <= end);
  return {
    key: `${cellKey(cell)}|${start}|${end}`,
    lat: cell.lat,
    lon: cell.lon,
    timezone: 'Atlantic/Canary',
    utcOffsetSeconds: 0,
    hours: dates.flatMap((d) => dayHours(d)),
    days: dates.map((d) => ({ date: d, sunrise: `${d}T07:30`, sunset: `${d}T18:30` })),
    source: 'test',
    version: CONDITIONS_VERSION,
    fetchedAt,
  };
}

/** Fake Open-Meteo: answers marine and weather requests for one location and date. */
function openMeteoResponse(url: string): Response {
  const date = new URL(url).searchParams.get('start_date')!;
  const time = dayHours(date).map((h) => h.time);
  const body = url.includes('marine-api')
    ? {
        latitude: cell.lat,
        longitude: cell.lon,
        timezone: 'Atlantic/Canary',
        utc_offset_seconds: 0,
        hourly: {
          time,
          wave_height_meteofrance_wave: time.map(() => 1.5),
          wave_height_ncep_gfswave016: time.map(() => 1.4),
          swell_wave_height_ncep_gfswave016: time.map(() => 1.4),
          swell_wave_period_ncep_gfswave016: time.map(() => 12),
          swell_wave_direction_ncep_gfswave016: time.map(() => 330),
          wave_peak_period_ecmwf_wam: time.map(() => 12.5),
        },
      }
    : {
        timezone: 'Atlantic/Canary',
        utc_offset_seconds: 0,
        hourly: { time, wind_speed_10m: time.map(() => 10), wind_direction_10m: time.map(() => 150) },
        daily: { time: [date], sunrise: [`${date}T07:40`], sunset: [`${date}T18:20`] },
      };
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

function pendingSession(id: string, date: string, extra: Partial<Session> = {}): Session {
  return {
    id,
    spotId: spot.id,
    date,
    startMin: 480,
    endMin: 570,
    ratings: { fun: 7 },
    conditions: [],
    conditionsSource: '',
    conditionsPending: true,
    fields: { board: "6'0" },
    tags: ['Glassy'],
    notes: 'logged at the beach',
    excluded: false,
    skillAtTime: snapshot(profileForStage(4)),
    createdAt: 1,
    updatedAt: 1,
    ...extra,
  };
}

const offline = () => vi.fn(async () => Promise.reject(new TypeError('Failed to fetch')));

beforeEach(async () => {
  await Promise.all([db.forecasts.clear(), db.sessions.clear(), db.spots.clear()]);
  await db.spots.put(spot);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('offline conditions', () => {
  it('falls back to the newest saved series that covers the day, cut to that day', async () => {
    const twoHoursAgo = Date.now() - 2 * 3600e3;
    await db.forecasts.bulkPut([savedSeries(today, addDays(today, 2), twoHoursAgo), savedSeries(today, addDays(today, 2), twoHoursAgo - 3600e3)].map((s, i) => ({ ...s, key: i ? `${s.key}x` : s.key })));
    vi.stubGlobal('fetch', offline());
    const tomorrow = addDays(today, 1);
    const out = await fetchSeries([cell], tomorrow, tomorrow);
    const s = out.get(cellKey(cell))!;
    expect(s.stale).toBe(true);
    expect(s.fetchedAt).toBe(twoHoursAgo);
    expect(s.hours).toHaveLength(24);
    expect(s.hours.every((h) => h.time.startsWith(tomorrow))).toBe(true);
    expect(s.days.map((d) => d.date)).toEqual([tomorrow]);
    // The stale copy is never written back as if it were fresh.
    expect(await db.forecasts.get(`${cellKey(cell)}|${tomorrow}|${tomorrow}`)).toBeUndefined();
  });

  it('throws a network error when nothing is saved', async () => {
    vi.stubGlobal('fetch', offline());
    await expect(fetchSeries([cell], today, today)).rejects.toBeInstanceOf(TypeError);
  });

  it('returns fresh data and caches it when online', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => openMeteoResponse(url)));
    const out = await fetchSeries([cell], today, today);
    const s = out.get(cellKey(cell))!;
    expect(s.stale).toBeUndefined();
    expect(s.hours[0].waveH).toBe(1.5);
    expect(await db.forecasts.get(`${cellKey(cell)}|${today}|${today}`)).toBeTruthy();
  });
});

describe('sessions logged offline', () => {
  it('fills in conditions when back online and keeps everything the surfer logged', async () => {
    const date = addDays(today, -3);
    await db.sessions.put(pendingSession('a', date));
    vi.stubGlobal('fetch', vi.fn(async (url: string) => openMeteoResponse(url)));
    expect(await syncPendingSessions()).toBe(1);
    const s = (await db.sessions.get('a'))!;
    expect(s.conditionsPending).toBe(false);
    expect(s.conditions).toHaveLength(24);
    expect(s.conditions[8].waveH).toBe(1.5);
    expect(s.conditions[8].trains[0]).toEqual({ kind: 'swell', h: 1.5, tp: 12, dir: 330 });
    expect(s.conditionsVersion).toBe(CONDITIONS_VERSION);
    expect(s.days?.[0].sunrise).toBe(`${date}T07:40`);
    expect(s.notes).toBe('logged at the beach');
    expect(s.ratings.fun).toBe(7);
    expect(s.startMin).toBe(480);
  });

  it('replaces conditions taken from an older saved forecast', async () => {
    await db.sessions.put(pendingSession('b', today, { conditions: dayHours(today, 0.4) }));
    vi.stubGlobal('fetch', vi.fn(async (url: string) => openMeteoResponse(url)));
    expect(await syncPendingSessions()).toBe(1);
    expect((await db.sessions.get('b'))!.conditions[10].waveH).toBe(1.5);
  });

  it('leaves sessions pending while offline', async () => {
    await db.sessions.put(pendingSession('c', addDays(today, -1)));
    const f = offline();
    vi.stubGlobal('fetch', f);
    expect(await syncPendingSessions()).toBe(0);
    expect((await db.sessions.get('c'))!.conditionsPending).toBe(true);
  });

  it('re-fetches snapshots stored with an older conditions version (mean periods)', async () => {
    const date = addDays(today, -4);
    await db.sessions.put(pendingSession('old', date, { conditions: dayHours(date, 0.9), conditionsPending: false, conditionsVersion: 1 }));
    vi.stubGlobal('fetch', vi.fn(async (url: string) => openMeteoResponse(url)));
    expect(await syncPendingSessions()).toBe(1);
    const s = (await db.sessions.get('old'))!;
    expect(s.conditionsVersion).toBe(CONDITIONS_VERSION);
    expect(s.conditions[6].waveTp).toBe(12.5);
  });

  it('skips a session the API rejects and still fills in the others', async () => {
    await db.sessions.bulkPut([pendingSession('bad', '2020-01-01'), pendingSession('good', addDays(today, -2))]);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('2020-01-01') ? new Response(JSON.stringify({ error: true, reason: 'out of range' }), { status: 400 }) : openMeteoResponse(url),
      ),
    );
    expect(await syncPendingSessions()).toBe(1);
    expect((await db.sessions.get('bad'))!.conditionsPending).toBe(true);
    expect((await db.sessions.get('good'))!.conditionsPending).toBe(false);
  });

  it('does not touch sessions that already have conditions', async () => {
    await db.sessions.put(pendingSession('done', addDays(today, -5), { conditions: dayHours(addDays(today, -5)), conditionsPending: false, conditionsVersion: CONDITIONS_VERSION }));
    const f = vi.fn(async (url: string) => openMeteoResponse(url));
    vi.stubGlobal('fetch', f);
    expect(await syncPendingSessions()).toBe(0);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('grid cells', () => {
  it('identifies a model cell by its centre, to 2 decimals', () => {
    const base = { key: 'k', lat: 0, lon: 0, timezone: 'UTC', utcOffsetSeconds: 0, hours: [], days: [], fetchedAt: 0, source: '', version: CONDITIONS_VERSION };
    const a = { ...base, gridLat: 28.791664, gridLon: -13.958336 };
    const b = { ...base, gridLat: 28.7917, gridLon: -13.9583 };
    const other = { ...base, gridLat: 28.708336, gridLon: -14.041664 };
    expect(gridKey(a)).toBe(gridKey(b));
    expect(gridKey(a)).not.toBe(gridKey(other));
    expect(gridKey(base)).toBeNull();
  });
});

describe('four-model marine data', () => {
  const at = (o: Record<string, number | null>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [v]]));
  it('takes swell trains from GFS-Wave (peak periods), scaled to the MFWAM total; zeros mean no train', () => {
    const h = marineHour(
      at({
        wave_height_meteofrance_wave: 1.92,
        wave_period_meteofrance_wave: 9.95,
        wave_height_ncep_gfswave016: 1.76,
        swell_wave_height_ncep_gfswave016: 1.46,
        swell_wave_period_ncep_gfswave016: 10.4,
        swell_wave_direction_ncep_gfswave016: 333,
        secondary_swell_wave_height_ncep_gfswave016: 1.0,
        secondary_swell_wave_period_ncep_gfswave016: 11.75,
        secondary_swell_wave_direction_ncep_gfswave016: 320,
        tertiary_swell_wave_height_ncep_gfswave016: 0,
        tertiary_swell_wave_period_ncep_gfswave016: 0,
        tertiary_swell_wave_direction_ncep_gfswave016: 0,
        wind_wave_height_ncep_gfswave016: 0,
        wind_wave_period_ncep_gfswave016: 0,
        wind_wave_direction_ncep_gfswave016: 0,
        wave_peak_period_ecmwf_wam: 11.45,
        sea_level_height_msl_meteofrance_currents: -0.32,
      }),
      0,
    );
    expect(h.waveH).toBe(1.92);
    expect(h.waveTe).toBe(9.95);
    expect(h.waveTp).toBe(11.45);
    expect(h.trains).toHaveLength(2);
    expect(h.trains[0].tp).toBe(10.4);
    expect(h.trains[0].h).toBeCloseTo(1.46 * (1.92 / 1.76), 2);
    expect(h.seaLevel).toBe(-0.32);
    expect(h.tpEstimated).toBeUndefined();
  });
  it('estimates peak periods from MFWAM mean periods when GFS-Wave has no data for the date', () => {
    const h = marineHour(
      at({
        wave_height_meteofrance_wave: 1.38,
        wave_period_meteofrance_wave: 8,
        swell_wave_height_meteofrance_wave: 1.02,
        swell_wave_period_meteofrance_wave: 8,
        swell_wave_direction_meteofrance_wave: 330,
      }),
      0,
    );
    expect(h.trains).toEqual([{ kind: 'swell', h: 1.02, tp: 10.4, dir: 330 }]);
    expect(h.waveTp).toBe(10.4);
    expect(h.tpEstimated).toBe(true);
  });
});
