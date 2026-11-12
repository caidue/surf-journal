import { describe, expect, it } from 'vitest';
import type { HourConditions, Session, Settings, Spot } from '../types';
import { SLOTS } from '../types';
import { angdiff, destination, haversineKm } from './geo';
import { breakingHeight, deriveHour, deriveSeries, exposure, tideExtremes, waveEnergyKJ, windKind } from './conditions';
import { quality, suitability } from './rating';
import { distance, kernel, SIMILAR_MIN_K } from './similarity';
import { calibratedGain, predict, buildHistory, recommendSpotDay, sessionWeight, curveMean } from './recommend';
import { parseRegionQuery, subBox } from './geocode';

const spot: Spot = {
  id: 's',
  name: 'Test Reef',
  region: 'Test',
  lat: 28.75,
  lon: -13.88,
  coordsApprox: false,
  facing: 0,
  idealSwellDir: 320,
  swellWindow: 70,
  minSize: 0.6,
  maxSize: 3,
  tide: 'high',
  breakType: 'reef',
  bottom: 'reef',
  level: 'intermediate',
  hazards: [],
  description: '',
  peaks: [{ id: 'in', name: 'Inside' }],
  gain: 1,
};

function hour(time: string, o: Partial<HourConditions> = {}): HourConditions {
  return {
    time,
    waveH: null,
    waveDir: null,
    wavePer: null,
    swellH: 1.5,
    swellPer: 11,
    swellDir: 320,
    swell2H: null,
    swell2Per: null,
    swell2Dir: null,
    windWaveH: null,
    windWavePer: null,
    windWaveDir: null,
    windSpeed: 10,
    windDir: 180,
    windGust: 15,
    seaLevel: 0,
    waterTemp: 20,
    airTemp: 22,
    ...o,
  };
}

function day(date: string, o: (h: number) => Partial<HourConditions> = () => ({})): HourConditions[] {
  return Array.from({ length: 24 }, (_, h) =>
    hour(`${date}T${String(h).padStart(2, '0')}:00`, { seaLevel: Math.sin((h / 12.4) * 2 * Math.PI), ...o(h) }),
  );
}

const settings: Settings = {
  id: 'settings',
  level: 'intermediate',
  categories: [{ id: 'fun', name: 'Fun', color: '#000' }],
  halfLifeMonths: 24,
  ignoreBefore: null,
  boards: [],
  heightUnit: 'm',
  windUnit: 'kmh',
};

function session(date: string, fun: number, o: Partial<Session> = {}, cond = day(date)): Session {
  const curves = { fun: Array<number | null>(SLOTS).fill(null) };
  for (let s = 96; s < 120; s++) curves.fun[s] = fun; // 08:00–10:00
  return {
    id: `${date}-${fun}`,
    spotId: 's',
    date,
    startMin: 480,
    endMin: 600,
    zones: Array(SLOTS).fill(null),
    curves,
    conditions: cond,
    conditionsSource: 'test',
    fields: {},
    tags: [],
    notes: '',
    overall: null,
    excluded: false,
    skillAtTime: 'intermediate',
    createdAt: 0,
    updatedAt: 0,
    ...o,
  };
}

describe('geo', () => {
  it('angdiff wraps', () => {
    expect(angdiff(10, 350)).toBe(20);
    expect(angdiff(350, 10)).toBe(-20);
    expect(angdiff(180, 0)).toBe(-180);
  });
  it('destination ~ distance', () => {
    const [lat, lon] = destination(28.75, -13.88, 0, 2.5);
    expect(haversineKm(28.75, -13.88, lat, lon)).toBeCloseTo(2.5, 2);
  });
});

describe('conditions', () => {
  it('Komar–Gaughan breaking height grows with period', () => {
    expect(breakingHeight(1.5, 14)).toBeGreaterThan(breakingHeight(1.5, 8));
    expect(breakingHeight(2, 10)).toBeCloseTo(0.616 * Math.pow(40, 0.4), 2);
  });
  it('exposure blocks swell outside the window', () => {
    expect(exposure(spot, 320)).toBe(1);
    expect(exposure(spot, 140)).toBe(0);
    const edge = exposure(spot, 320 + 60);
    expect(edge).toBeGreaterThan(0);
    expect(edge).toBeLessThan(1);
  });
  it('wind components relative to a north-facing spot', () => {
    const off = deriveHour(spot, hour('2026-01-01T08:00', { windDir: 180, windSpeed: 20 }));
    expect(off.uOff).toBeCloseTo(20);
    expect(windKind(off)).toBe('offshore');
    const on = deriveHour(spot, hour('2026-01-01T08:00', { windDir: 0, windSpeed: 20 }));
    expect(on.uOff).toBeCloseTo(-20);
    expect(windKind(on)).toBe('onshore');
  });
  it('falls back to total sea state without partitions', () => {
    const d = deriveHour(spot, hour('t', { swellH: null, swellPer: null, swellDir: null, waveH: 2, wavePer: 10, waveDir: 320 }));
    expect(d.hb).toBeGreaterThan(1);
  });
});

describe('tide extremes & energy', () => {
  it('times high and low tide between the hourly values', () => {
    // Semi-diurnal tide: high at 03:30 and 15:54 (period 12.42 h), amplitude 1.2 m.
    const T = 12.42;
    const hrs = Array.from({ length: 48 }, (_, i) => {
      const d = i < 24 ? '2026-01-01' : '2026-01-02';
      const h = i % 24;
      return hour(`${d}T${String(h).padStart(2, '0')}:00`, { seaLevel: 1.2 * Math.cos((2 * Math.PI * (i - 3.5)) / T) });
    });
    const ex = tideExtremes(hrs, '2026-01-01');
    expect(ex.map((e) => e.type)).toEqual(['high', 'low', 'high', 'low']);
    expect(Math.abs(ex[0].min - 210)).toBeLessThanOrEqual(3);
    expect(Math.abs(ex[1].min - (210 + (T / 2) * 60))).toBeLessThanOrEqual(3);
    expect(ex[0].level).toBeCloseTo(1.2, 1);
    expect(ex[1].level).toBeCloseTo(-1.2, 1);
  });

  it('energy grows with the square of period and is cut by the swell window', () => {
    const e10 = waveEnergyKJ(spot, hour('t', { swellH: 1.5, swellPer: 10, swellDir: spot.idealSwellDir, swell2H: null, windWaveH: null }))!;
    const e14 = waveEnergyKJ(spot, hour('t', { swellH: 1.5, swellPer: 14, swellDir: spot.idealSwellDir, swell2H: null, windWaveH: null }))!;
    expect(e10).toBeCloseTo(1.96 * 1.5 * 1.5 * 100, -1);
    expect(e14 / e10).toBeCloseTo(1.96, 1);
    const blocked = waveEnergyKJ(spot, hour('t', { swellH: 1.5, swellPer: 14, swellDir: (spot.idealSwellDir + 180) % 360, swell2H: null, windWaveH: null }))!;
    expect(blocked).toBe(0);
  });
});

describe('rating', () => {
  it('onshore wind lowers quality, offshore keeps it', () => {
    const off = quality(spot, deriveHour(spot, hour('t', { windDir: 180, windSpeed: 15 })));
    const on = quality(spot, deriveHour(spot, hour('t', { windDir: 0, windSpeed: 25 })));
    expect(off.q).toBeGreaterThan(on.q * 2);
    expect(on.potential).toBeCloseTo(off.potential, 5);
  });
  it('beginners are kept away from big surf and expert spots', () => {
    const big = deriveHour(spot, hour('t', { swellH: 3, swellPer: 14 }));
    expect(suitability(spot, big, 'beginner').status).toBe('unsuitable');
    expect(suitability({ ...spot, level: 'expert' }, deriveHour(spot, hour('t')), 'advanced').status).toBe('unsuitable');
    expect(suitability(spot, deriveHour(spot, hour('t', { swellH: 0.8, swellPer: 9 })), 'intermediate').status).toBe('good');
  });
});

describe('similarity & prediction', () => {
  it('identical conditions have distance 0, different ones are far', () => {
    const a = deriveSeries(spot, day('2026-01-01'))[9];
    const b = deriveSeries(spot, day('2026-01-02', () => ({ swellH: 3, windDir: 0, windSpeed: 30 })))[9];
    expect(distance(a, a, spot).d).toBe(0);
    expect(kernel(distance(a, b, spot).d)).toBeLessThan(0.05);
    // One tolerance off in size only -> clearly similar but not identical.
    const c = { ...a, hb: Math.exp(Math.log(a.hb! + 0.2) + 0.25) - 0.2 };
    expect(distance(a, c, spot).d).toBeCloseTo(1, 5);
  });

  it('where the "similar sessions" line sits', () => {
    const a = deriveSeries(spot, day('2026-01-01'))[9];
    const k = (b: typeof a) => kernel(distance(a, b, spot).d);
    const grow = (f: number) => Math.exp(Math.log(a.hb! + 0.2) + f * 0.25) - 0.2;
    // One step off in size, onshore wind and tide together: still listed.
    expect(k({ ...a, hb: grow(1), uOff: a.uOff! - 9, tideNorm: Math.min(1, a.tideNorm! + 0.18) })).toBeGreaterThan(SIMILAR_MIN_K);
    // A 25° swell-direction change alone is still similar.
    expect(k({ ...a, dirDom: (a.dirDom! + 25) % 360 })).toBeGreaterThan(0.5);
    // 1.6 m vs 2.6 m at the spot is too different on its own.
    expect(kernel(distance({ ...a, hb: 1.6 }, { ...a, hb: 2.6 }, spot).d)).toBeLessThan(SIMILAR_MIN_K);
  });

  it('missing features do not make sessions look more similar', () => {
    const a = deriveSeries(spot, day('2026-01-01'))[9];
    const b = { ...a, uOff: a.uOff! + 9 };
    const full = distance(a, b, spot).d;
    const noTide = distance({ ...a, tideNorm: null, tideTrend: null }, { ...b, tideNorm: null, tideTrend: null }, spot).d;
    expect(noTide).toBeGreaterThan(full);
  });

  it('falls back to the rule score with no history and moves toward similar sessions', () => {
    const target = deriveSeries(spot, day('2026-03-01'))[9];
    const none = predict(spot, target, 4, []);
    expect(none.yhat).toBe(4);
    const hist = buildHistory(spot, [session('2026-02-01', 9), session('2026-02-10', 9)], settings, '2026-03-01');
    const p = predict(spot, target, 4, hist);
    expect(p.yhat).toBeGreaterThan(6);
    expect(p.neighbours.length).toBe(2);
  });

  it('excluded sessions and sessions before the cut-off carry no weight', () => {
    expect(sessionWeight(session('2026-01-01', 5, { excluded: true }), settings, '2026-03-01').w).toBe(0);
    expect(sessionWeight(session('2025-01-01', 5), { ...settings, ignoreBefore: '2025-06-01' }, '2026-03-01').w).toBe(0);
    const old = sessionWeight(session('2024-03-01', 5), settings, '2026-03-01').w;
    expect(old).toBeGreaterThan(0.45);
    expect(old).toBeLessThan(0.55);
    const target = deriveSeries(spot, day('2026-03-01'))[9];
    const hist = buildHistory(spot, [session('2026-02-01', 9, { excluded: true })], settings, '2026-03-01');
    expect(predict(spot, target, 4, hist).yhat).toBe(4);
  });

  it('dissimilar sessions barely move the prediction', () => {
    const target = deriveSeries(spot, day('2026-03-01'))[9];
    const otherDay = day('2026-02-01', () => ({ swellH: 3.5, swellPer: 15, windDir: 0, windSpeed: 35 }));
    const hist = buildHistory(spot, [session('2026-02-01', 1, {}, otherDay)], settings, '2026-03-01');
    expect(predict(spot, target, 6, hist).yhat).toBeCloseTo(6, 1);
  });

  it('calibrates the size gain from observed sizes', () => {
    const s1 = session('2026-02-01', 7, { fields: { observedSize: 'waist' } });
    const s2 = session('2026-02-02', 7, { fields: { observedSize: 'waist' } });
    const { gain, n } = calibratedGain(spot, [s1, s2]);
    expect(n).toBe(2);
    expect(gain).toBeLessThan(1); // 1.5 m @ 11 s models ~2 m; waist high means the spot is smaller
  });

  it('recommends a daylight window', () => {
    const hours = day('2026-03-01');
    const rec = recommendSpotDay(spot, hours, [{ date: '2026-03-01', sunrise: '2026-03-01T07:30', sunset: '2026-03-01T19:00' }], [], settings, 'intermediate', '2026-03-01', '2026-03-01', null);
    expect(rec.hours.length).toBe(24);
    expect(rec.hours.filter((h) => h.daylight).length).toBe(12);
    expect(rec.best).not.toBeNull();
    expect(rec.bestWindow![0]).toBeGreaterThanOrEqual(450);
    expect(rec.dayOver).toBe(false);
    // Evening: no daylight left, but "now" is still reported.
    const late = recommendSpotDay(spot, hours, [{ date: '2026-03-01', sunrise: '2026-03-01T07:30', sunset: '2026-03-01T19:00' }], [], settings, 'intermediate', '2026-03-01', '2026-03-01', 20 * 60 + 15);
    expect(late.dayOver).toBe(true);
    expect(late.best).toBeNull();
    expect(late.now?.time).toBe('2026-03-01T20:00');
  });

  it('curve means only count drawn slots in the session', () => {
    const s = session('2026-02-01', 8);
    expect(curveMean(s, 'fun')).toBe(8);
    expect(curveMean(s, 'fun', 540, 600)).toBe(8);
    expect(curveMean(s, 'nope')).toBeNull();
  });
});

describe('region parsing', () => {
  it('understands English, German and Spanish directions', () => {
    expect(parseRegionQuery('northern part of Fuerteventura')).toEqual({ place: 'Fuerteventura', part: 'north' });
    expect(parseRegionQuery('Norden von Fuerteventura')).toEqual({ place: 'Fuerteventura', part: 'north' });
    expect(parseRegionQuery('norte de Fuerteventura')).toEqual({ place: 'Fuerteventura', part: 'north' });
    expect(parseRegionQuery('south-west Portugal')).toEqual({ place: 'Portugal', part: 'southwest' });
    expect(parseRegionQuery('El Cotillo')).toEqual({ place: 'El Cotillo', part: null });
  });
  it('keeps the northern half of a box', () => {
    const b = subBox({ south: 28, north: 29, west: -14.5, east: -13.8 }, 'north');
    expect(b.south).toBeCloseTo(28.5);
    expect(b.north).toBe(29);
  });
});
