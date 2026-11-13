import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, mergeSeedSpots } from '../db';
import { SEED_SPOTS } from '../data/seedSpots';
import type { ConditionsSeries, HourConditions, Session } from '../types';
import { SLOTS } from '../types';
import { cellKey, fetchSeries, gridKey } from './openMeteo';
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
  wavePer: 11,
  swellH: waveH,
  swellPer: 11,
  swellDir: 0,
  swell2H: null,
  swell2Per: null,
  swell2Dir: null,
  windWaveH: null,
  windWavePer: null,
  windWaveDir: null,
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
        hourly: { time, wave_height: time.map(() => 1.5), swell_wave_height: time.map(() => 1.4), swell_wave_period: time.map(() => 12), swell_wave_direction: time.map(() => 330) },
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
  const curves = { fun: Array<number | null>(SLOTS).fill(null) };
  curves.fun[100] = 7;
  return {
    id,
    spotId: spot.id,
    date,
    startMin: 480,
    endMin: 570,
    zones: Array(SLOTS).fill(null),
    curves,
    conditions: [],
    conditionsSource: '',
    conditionsPending: true,
    fields: { board: "6'0" },
    tags: ['Glassy'],
    notes: 'logged at the beach',
    overall: 7,
    excluded: false,
    skillAtTime: 'intermediate',
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
    expect(s.days?.[0].sunrise).toBe(`${date}T07:40`);
    expect(s.notes).toBe('logged at the beach');
    expect(s.curves.fun[100]).toBe(7);
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
    await db.sessions.put(pendingSession('done', addDays(today, -5), { conditions: dayHours(addDays(today, -5)), conditionsPending: false }));
    const f = vi.fn(async (url: string) => openMeteoResponse(url));
    vi.stubGlobal('fetch', f);
    expect(await syncPendingSessions()).toBe(0);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('built-in spot data reaching existing devices', () => {
  it('updates untouched spots and only adds details to spots you edited', async () => {
    const [a, b] = SEED_SPOTS.filter((s) => s.peaks.length > 0);
    await db.spots.bulkPut([
      { ...a, description: 'old text', peaks: a.peaks.map((p) => ({ id: p.id, name: p.name })), guide: undefined, lat: 1, lon: 2 },
      { ...b, peaks: b.peaks.map((p) => ({ id: p.id, name: `My ${p.name}` })), guide: undefined, updatedAt: 123, lat: 5, lon: 6 },
    ]);
    await mergeSeedSpots();
    const ua = (await db.spots.get(a.id))!;
    expect(ua.description).toBe(a.description);
    expect(ua.peaks).toEqual(a.peaks);
    expect(ua.guide).toEqual(a.guide);
    expect([ua.lat, ua.lon]).toEqual([a.lat, a.lon]); // never edited: corrected position comes through
    const ub = (await db.spots.get(b.id))!;
    expect(ub.peaks.map((p) => p.name)).toEqual(b.peaks.map((p) => `My ${p.name}`));
    expect(ub.peaks.map((p) => p.description)).toEqual(b.peaks.map((p) => p.description));
    expect(ub.guide).toEqual(b.guide);
    expect([ub.lat, ub.lon]).toEqual([5, 6]); // edited: your marker stays
  });
});

describe('grid cells', () => {
  it('identifies the same model cell from new and older cached series', () => {
    const base = { key: 'k', lat: 0, lon: 0, timezone: 'UTC', utcOffsetSeconds: 0, hours: [], days: [], fetchedAt: 0 };
    const fresh = { ...base, gridLat: 28.791664, gridLon: -13.958336, source: 'Open-Meteo marine (grid 28.79, -13.96) + weather model wind' };
    const old = { ...base, source: 'Open-Meteo marine (grid 28.79, -13.96) + weather model wind' };
    const other = { ...base, gridLat: 28.708336, gridLon: -14.041664, source: '' };
    expect(gridKey(fresh)).toBe(gridKey(old));
    expect(gridKey(fresh)).not.toBe(gridKey(other));
    expect(gridKey({ ...base, source: 'Open-Meteo marine (unavailable)' })).toBeNull();
  });
});
