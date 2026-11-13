import { describe, expect, it } from 'vitest';
import type { HourConditions, Session, Settings, Spot, WaveTrain } from '../types';
import { SLOTS } from '../types';
import { angdiff, destination, haversineKm } from './geo';
import { breakingHeight, deriveHour, deriveSeries, exposure, tideExtremes, totalEnergyKJ, waveEnergyKJ, windKind } from './conditions';
import { fPeriod, quality, rateSpot, ratedPeaks, scoreLabel, suitability } from './rating';
import { bodyRange, learnFromSession, profileForStage, profileSummary, snapshot, undoLastChange } from './skill';
import { RETIRED_SPOTS, SEED_SPOTS } from '../data/seedSpots';
import { distance, kernel, SIMILAR_MIN_K } from './similarity';
import { calibratedGain, predict, buildHistory, recommendSpotDay, sessionWeight, insights, ratingFor, sessionOverall } from './recommend';
import { parseRegionQuery, subBox } from './geocode';
import { monthRanges } from './format';
import { DEFAULT_SETTINGS, withCurrentCategories } from '../db';

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

type T3 = [number, number, number] | null; // height, peak period, direction

/** One hour offshore: a 1.5 m @ 11 s swell from 320° unless told otherwise. */
function hour(time: string, o: Partial<HourConditions> & { swell?: T3; swell2?: T3; wind?: T3 } = {}): HourConditions {
  const { swell = [1.5, 11, 320], swell2 = null, wind = null, ...rest } = o;
  const trains: WaveTrain[] = [];
  if (swell) trains.push({ kind: 'swell', h: swell[0], tp: swell[1], dir: swell[2] });
  if (swell2) trains.push({ kind: 'swell', h: swell2[0], tp: swell2[1], dir: swell2[2] });
  if (wind) trains.push({ kind: 'wind', h: wind[0], tp: wind[1], dir: wind[2] });
  return {
    time,
    waveH: null,
    waveDir: null,
    waveTp: null,
    waveTe: null,
    trains,
    windSpeed: 10,
    windDir: 180,
    windGust: 15,
    seaLevel: 0,
    waterTemp: 20,
    airTemp: 22,
    ...rest,
  };
}

function day(date: string, o: (h: number) => Parameters<typeof hour>[1] = () => ({})): HourConditions[] {
  return Array.from({ length: 24 }, (_, h) =>
    hour(`${date}T${String(h).padStart(2, '0')}:00`, { seaLevel: Math.sin((h / 12.4) * 2 * Math.PI), ...o(h) }),
  );
}

const stage4 = profileForStage(4);
const settings: Settings = {
  id: 'settings',
  profile: stage4,
  categories: [{ id: 'fun', name: 'Fun', color: '#000' }],
  halfLifeMonths: 24,
  ignoreBefore: null,
  boards: [],
  heightUnit: 'm',
  windUnit: 'kmh',
};

function session(date: string, fun: number, o: Partial<Session> = {}, cond = day(date)): Session {
  return {
    id: `${date}-${fun}`,
    spotId: 's',
    date,
    startMin: 480,
    endMin: 600,
    ratings: { fun },
    conditions: cond,
    conditionsSource: 'test',
    fields: {},
    tags: [],
    notes: '',
    excluded: false,
    skillAtTime: snapshot(stage4),
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
    const d = deriveHour(spot, hour('t', { swell: null, waveH: 2, waveTp: 10, waveDir: 320 }));
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

  it('energy is a property of the grid cell: the strongest train, growing with peak period²', () => {
    const e10 = waveEnergyKJ(hour('t', { swell: [1.5, 10, 320] }))!;
    const e14 = waveEnergyKJ(hour('t', { swell: [1.5, 14, 320] }))!;
    expect(e10).toBeCloseTo(1.96 * 1.5 * 1.5 * 100, -1);
    expect(e14 / e10).toBeCloseTo(1.96, 1);
    // Same sea state from the opposite direction: same energy (no spot swell window applied).
    expect(waveEnergyKJ(hour('t', { swell: [1.5, 10, 140] }))).toBeCloseTo(e10, 6);
    // Headline = strongest train (as surf-forecast.com shows it); the total adds the others.
    const mixed = hour('t', { swell: [1.5, 10, 320], wind: [0.8, 5, 30] });
    expect(waveEnergyKJ(mixed)).toBeCloseTo(e10, 6);
    expect(totalEnergyKJ(mixed)! - e10).toBeCloseTo(1.96 * 0.64 * 25, -1);
  });
});

describe('rating', () => {
  it('onshore wind lowers quality, offshore keeps it', () => {
    const off = quality(spot, deriveHour(spot, hour('t', { windDir: 180, windSpeed: 15 })));
    const on = quality(spot, deriveHour(spot, hour('t', { windDir: 0, windSpeed: 25 })));
    expect(off.q).toBeGreaterThan(on.q * 2);
    expect(on.potential).toBeCloseTo(off.potential, 5);
  });
  it('scores the PEAK period: chop below 6 s, groundswell from 12 s', () => {
    expect(fPeriod(5)).toBe(0.25);
    expect(fPeriod(9)).toBeCloseTo(0.75);
    expect(fPeriod(12)).toBe(1);
    expect(scoreLabel(9.5)).toBe('Epic');
    expect(scoreLabel(9)).toBe('Good');
    expect(scoreLabel(4)).toBe('Fair');
  });
});

describe('suitability rules', () => {
  const small = deriveHour(spot, hour('t', { swell: [0.5, 9, 320] })); // ~0.85 m face
  it('beginners are kept away from big surf, and spots far above your stage', () => {
    const big = deriveHour(spot, hour('t', { swell: [3, 14, 320] }));
    expect(suitability(spot, big, profileForStage(2)).status).toBe('unsuitable');
    expect(suitability({ ...spot, level: 'expert' }, small, profileForStage(5)).status).toBe('unsuitable');
    expect(suitability({ ...spot, level: 'expert' }, small, profileForStage(6)).status).toBe('challenging');
  });
  it('good in your range, with a positive reason', () => {
    const r = suitability(spot, small, stage4);
    expect(r.status).toBe('good');
    expect(r.reasons.some((x) => x.positive && /Right in your range/.test(x.text))).toBe(true);
  });
  it('size reasons name both sizes, and "push my limits" makes it a stretch session', () => {
    const mid = { ...small, hb: 1.4 }; // between C 1.2 and M 1.5
    const r = suitability(spot, mid, stage4);
    expect(r.status).toBe('challenging');
    const size = r.reasons.find((x) => x.kind === 'size')!;
    expect(size.text).toContain('1.4 m');
    expect(size.text).toContain('1.2 m');
    // (paddleOut 2: with 1, getting out through sets above C keeps it challenging anyway)
    const stretch = suitability(spot, mid, { ...stage4, paddleOut: 2, wantsChallenge: true });
    expect(stretch.status).toBe('stretch');
    expect(stretch.factor).toBe(0.7);
  });
  it('compares sizes as shown: ~2.2 m is not "bigger" than a 2.2 m comfort size', () => {
    const r = suitability(spot, { ...small, hb: 2.248 }, profileForStage(6));
    expect(r.reasons.find((x) => x.kind === 'size')?.text).toMatch(/^Top of your comfort zone/);
  });
  it('beyond your biggest wave is unsuitable below stage 6', () => {
    expect(suitability(spot, { ...small, hb: 1.65 }, stage4).status).toBe('unsuitable');
    expect(suitability(spot, { ...small, hb: 3.3 }, profileForStage(6)).status).toBe('challenging');
  });
  it('says plainly when size is fine but the reef is the problem', () => {
    const r = suitability(spot, small, { ...stage4, reefExp: 0 });
    expect(r.status).toBe('challenging');
    expect(r.reasons[0].text).toMatch(/^Size is fine; it's the reef/);
  });
  it('long-period groundswell is flagged for stage 5 and below', () => {
    const d = { ...small, hb: 1.0, tDom: 14 };
    expect(suitability(spot, d, stage4).reasons.some((x) => x.kind === 'period')).toBe(true);
    expect(suitability(spot, d, profileForStage(6)).reasons.some((x) => x.kind === 'period')).toBe(false);
  });
});

describe('skill profile', () => {
  it('summarises the profile in one line', () => {
    expect(profileSummary(stage4)).toBe('Stage 4 · comfortable to chest high (1.2 m) · caught up to 1.5 m · some reef · mid-length');
    expect(bodyRange(1.8, 2.3)).toBe('head to overhead');
    expect(bodyRange(1.0, 1.4)).toBe('waist to shoulder high');
  });
  const sess = (feel: Session['fields']['feel'], observedSize: string, o: Partial<Session> = {}) => session('2026-03-01', 7, { id: `${feel}-${observedSize}`, fields: { feel, observedSize }, ...o });
  it('comfortable in bigger waves moves C a quarter of the way, at most one step', () => {
    const next = learnFromSession(stage4, sess('comfortable', 'shoulder'), spot, 1.5, [], [spot])!;
    expect(next.comfort).toBeCloseTo(1.3, 2); // 1.2 + (1.5 − 1.2) / 4 = 1.275 → 1.3 (5 cm steps)
    expect(next.lastChange?.reasons[0]).toMatch(/Comfortable size 1\.2 m → 1\.3 m/);
    const far = learnFromSession(stage4, sess('comfortable', 'bigger'), spot, 5, [], [spot])!;
    expect(far.comfort).toBe(1.5); // capped at the next body-scale step without a second session
    expect(far.max).toBe(5);
  });
  it('out of my depth at or below C lowers it; undo restores the profile', () => {
    const next = learnFromSession(stage4, sess('over', 'chest'), spot, 1.2, [], [spot])!;
    expect(next.comfort).toBeLessThan(1.2);
    expect(undoLastChange(next).comfort).toBe(1.2);
  });
  it('never changes the stage on its own, but asks', () => {
    const p = { ...profileForStage(5), comfort: 2.0, max: 2.2 };
    const next = learnFromSession(p, sess('comfortable', 'well-overhead'), spot, 3.0, [], [spot])!;
    expect(next.stage).toBe(5);
    expect(next.lastChange?.stagePrompt).toBe(6);
  });
  it('fun alone changes nothing', () => {
    expect(learnFromSession(stage4, session('2026-03-01', 10, { fields: {} }), { ...spot, bottom: 'sand' }, 2, [], [spot])).toBeNull();
  });
});

describe('spots and peaks', () => {
  const byId = (id: string) => SEED_SPOTS.find((s) => s.id === id)!;
  it('uses Surfline names and keeps other names as aliases', () => {
    const gen = byId('fv-generoso');
    expect(gen.name).toBe('Generosa');
    expect(gen.aliases).toContain('Generoso');
  });
  it('splits El Hierro into its three waves, west to east, each linking to Surfline’s one spot', () => {
    const left = byId('fv-el-hierro');
    const right = byId('fv-derecha-alemanes');
    const bubble = byId('fv-the-bubble');
    expect([left.name, right.name, bubble.name]).toEqual(['Izquierda del Hierro', 'Derecha de los Alemanes', 'The Bubble']);
    expect(left.aliases).toContain('El Hierro');
    expect(bubble.aliases).toContain('The Bubble (Hierro Right)');
    expect(left.lon).toBeLessThan(right.lon);
    expect(right.lon).toBeLessThan(bubble.lon);
    for (const s of [left, right, bubble]) {
      expect(s.externalIds?.surfline).toContain('5842041f4e65fad6a7708cbf');
      expect(s.peaks).toHaveLength(1);
      expect(ratedPeaks(s)).toEqual([]);
    }
    expect(RETIRED_SPOTS['fv-the-bubble']).toBeUndefined();
  });
  it('rates the three El Hierro waves on their own: The Bubble is the expert one', () => {
    // ~1.9 m face, mid tide: within a stage-6 surfer's comfort size; The Bubble needs stage 7.
    const h = hour('2026-01-01T10:00', { swell: [1.2, 12, 320], seaLevel: 0 });
    const rate = (id: string) => rateSpot(byId(id), deriveHour({ ...byId(id), gain: 1 }, h, { norm: 0.6, trend: 0 }), profileForStage(6));
    expect(rate('fv-el-hierro').suit.status).toBe('ok'); // top of the comfort zone
    expect(rate('fv-the-bubble').suit.status).toBe('challenging');
    expect(rate('fv-el-hierro').score).toBeGreaterThan(rate('fv-the-bubble').score);
  });
  it('includes the spots other services list, each with a guide', () => {
    expect(new Set(SEED_SPOTS.map((s) => s.id)).size).toBe(SEED_SPOTS.length);
    expect(SEED_SPOTS.every((s) => s.guide && s.peaks.length > 0)).toBe(true);
    expect(byId('fv-corralejo-beach').externalIds?.surfline).toContain('584204204e65fad6a77096a4');
    expect(byId('fv-playa-los-matos').externalIds?.surfline).toContain('640b893a4878eb50bf195f71');
    const suicides = byId('fv-suicides');
    expect(suicides.externalIds?.surfForecast).toBe('Suicides_2');
    expect(suicides.aliases).toContain('Suicidios');
    // West to east along the North Shore: Mejillones, Suicides, Generosa (as the forecast sites order them).
    expect(byId('fv-mejillones').lon).toBeLessThan(suicides.lon);
    expect(suicides.lon).toBeLessThan(byId('fv-generoso').lon);
  });
  it('rates Suicides per peak: the inside left for an advanced surfer', () => {
    const suicides = SEED_SPOTS.find((s) => s.id === 'fv-suicides')!;
    expect(ratedPeaks(suicides).map((p) => p.id)).toEqual(['main', 'inside-left']);
    // ~1.8 m face: in a stage-6 surfer's range; the main reef is an expert (stage 7) wave.
    const d = deriveHour({ ...suicides, gain: 1 }, hour('2026-01-01T10:00', { swell: [1.1, 13, 330], seaLevel: 0.5 }), { norm: 0.8, trend: 0 });
    expect(rateSpot(suicides, d, profileForStage(6)).peak?.id).toBe('inside-left');
  });
});

describe('similarity & prediction', () => {
  it('identical conditions have distance 0, different ones are far', () => {
    const a = deriveSeries(spot, day('2026-01-01'))[9];
    const b = deriveSeries(spot, day('2026-01-02', () => ({ swell: [3, 11, 320], windDir: 0, windSpeed: 30 })))[9];
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

  it('sessions from another stage count less', () => {
    const then = session('2026-02-01', 5, { skillAtTime: snapshot(profileForStage(2)) });
    expect(sessionWeight(then, settings, '2026-02-01').w).toBeCloseTo(0.5, 5);
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
    const otherDay = day('2026-02-01', () => ({ swell: [3.5, 15, 320], windDir: 0, windSpeed: 35 }));
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
    const rec = recommendSpotDay(spot, hours, [{ date: '2026-03-01', sunrise: '2026-03-01T07:30', sunset: '2026-03-01T19:00' }], [], settings, settings.profile, '2026-03-01', '2026-03-01', null);
    expect(rec.hours.length).toBe(24);
    expect(rec.hours.filter((h) => h.daylight).length).toBe(12);
    expect(rec.best).not.toBeNull();
    expect(rec.bestWindow![0]).toBeGreaterThanOrEqual(450);
    expect(rec.dayOver).toBe(false);
    // Evening: no daylight left, but "now" is still reported.
    const late = recommendSpotDay(spot, hours, [{ date: '2026-03-01', sunrise: '2026-03-01T07:30', sunset: '2026-03-01T19:00' }], [], settings, settings.profile, '2026-03-01', '2026-03-01', 20 * 60 + 15);
    expect(late.dayOver).toBe(true);
    expect(late.best).toBeNull();
    expect(late.now?.time).toBe('2026-03-01T20:00');
  });

  it('tide insight compares single-value ratings with your average at the spot', () => {
    const tideAt9 = (sign: number) => day('2026-02-01', (h) => ({ seaLevel: sign * Math.cos(((h - 9) / 12.4) * 2 * Math.PI) }));
    const hiS = session('2026-02-01', 8, { id: 'hi' }, tideAt9(1));
    const loS = session('2026-02-01', 4, { id: 'lo' }, tideAt9(-1));
    const { byTide } = insights(spot, [hiS, loS]);
    const keys = Object.keys(byTide);
    expect(keys.some((k) => k.startsWith('high'))).toBe(true);
    expect(keys.some((k) => k.startsWith('low'))).toBe(true);
    for (const [k, b] of Object.entries(byTide)) {
      if (k.startsWith('high')) expect(b.mean).toBeCloseTo(2, 5);
      if (k.startsWith('low')) expect(b.mean).toBeCloseTo(-2, 5);
    }
  });

  it('reads one rating per category; fun is the session rating', () => {
    const s = session('2026-01-01', 8, { ratings: { fun: 8, exertion: 6 } });
    expect(ratingFor(s, 'fun')).toBe(8);
    expect(ratingFor(s, 'exertion')).toBe(6);
    expect(ratingFor(s, 'confidence')).toBeNull();
    expect(sessionOverall(s)).toBe(8);
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

describe('season', () => {
  it('summarises best months, wrapping over the new year', () => {
    expect(monthRanges([10, 11, 12, 1, 2, 3])).toBe('Oct–Mar');
    expect(monthRanges([1, 2, 6, 7])).toBe('Jan–Feb, Jun–Jul');
    expect(monthRanges([5])).toBe('May');
    expect(monthRanges(Array.from({ length: 12 }, (_, i) => i + 1))).toBe('all year');
    expect(monthRanges([])).toBe('');
  });
});

describe('rating categories', () => {
  it('replaces the old "Wave quality" default with Confidence and keeps your own categories', () => {
    const old: Settings = {
      ...settings,
      categories: [
        { id: 'fun', name: 'Fun', color: '#0ea5e9' },
        { id: 'waves', name: 'Wave quality', color: '#16a34a' },
        { id: 'exertion', name: 'Exertion', color: '#f97316' },
        { id: 'mine', name: 'Paddling', color: '#123456' },
      ],
    };
    const ids = withCurrentCategories(old).categories.map((c) => c.id);
    expect(ids).toEqual(['fun', 'exertion', 'mine', 'confidence']);
    expect(DEFAULT_SETTINGS.categories.map((c) => c.name)).toEqual(['Fun', 'Exertion', 'Confidence']);
  });
});
