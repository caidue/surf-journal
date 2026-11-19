import { describe, expect, it } from 'vitest';
import type { HourConditions, Session, Settings, Spot, WaveTrain } from '../types';
import { SLOTS } from '../types';
import { angdiff, destination, haversineKm } from './geo';
import { breakingHeight, deriveHour, hbBand, deriveSeries, exposure, tideExtremes, tideInfo, totalEnergyKJ, waveEnergyKJ, windKind } from './conditions';
import { fPeriod, peakDerived, quality, rateSpot, ratedPeaks, scoreLabel, sizeFit, suitability } from './rating';
import { bodyRange, learnFromSession, profileForStage, profileSummary, snapshot, undoLastChange } from './skill';
import { RETIRED_SPOTS, SEED_SPOTS } from '../data/seedSpots';
import { SPOT_RULES } from '../data/spotRules';
import { distance, kernel, SIMILAR_MIN_K, similarityPct } from './similarity';
import { calibratedGain, explain, matchSession, predict, buildHistory, recommendSpotDay, sessionWeight, insights, ratingFor, sessionOverall } from './recommend';
import { parseRegionQuery, subBox } from './geocode';
import { monthRanges } from './format';
import { isoToMin } from './time';
import { DEFAULT_SETTINGS, withCurrentCategories } from '../db';
import { evaluateRules, inArc } from './rules';
import { spotKnowledge, sureness, tideKnown } from './confidence';
import { marineHour, windHour } from './openMeteo';
import { align, bestMatch, dayAt, daylightOverlap, featureCloseness, shiftRange } from './compare';
import caleta from './fixtures/caleta-2026-11-14';

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
    const mid = { ...small, hb: 1.4, hbLo: null, hbHi: null }; // between C 1.2 and M 1.5
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
    const r = suitability(spot, { ...small, hb: 2.248, hbLo: null, hbHi: null }, profileForStage(6));
    expect(r.reasons.find((x) => x.kind === 'size')?.text).toMatch(/^Top of your comfort zone/);
  });
  it('beyond your biggest wave is unsuitable below stage 6 when even the low end of the range is', () => {
    // M = 1.5: 2.0 m has a low end of 1.6 m, still above it.
    expect(suitability(spot, { ...small, hb: 2.0, hbLo: null, hbHi: null }, stage4).status).toBe('unsuitable');
    expect(suitability(spot, { ...small, hb: 3.3, hbLo: null, hbHi: null }, profileForStage(6)).status).toBe('challenging');
  });
  it('a size whose range reaches your limit is a warning with a penalty, not an exclusion', () => {
    const r = suitability(spot, { ...small, hb: 1.65, hbLo: null, hbHi: null }, stage4);
    expect(r.status).toBe('challenging');
    expect(r.reasons.find((x) => x.kind === 'size')?.text).toMatch(/^May be bigger than you like: ~1\.7 m \(1\.3–2\.0 m\)/);
    expect(r.factor).toBeGreaterThan(0);
    expect(r.factor).toBeLessThan(0.5);
    // A wider range above the limit costs more.
    const wide = suitability(spot, { ...small, hb: 1.65, hbLo: 1.32, hbHi: 2.4, hsSpread: 0.3 }, stage4);
    expect(wide.factor).toBeLessThan(r.factor);
    expect(wide.reasons.find((x) => x.kind === 'size')?.text).toMatch(/wave models disagree/);
  });
  it('Majanicho 19 Nov 2026: 2.5 m (2.0–3.0 m) is a warning for a surfer whose biggest is 2.2 m, not "not for you"', () => {
    const maj = SEED_SPOTS.find((x) => x.id === 'fv-majanicho')!;
    const me = { ...profileForStage(5), comfort: 1.6, max: 2.2 };
    const d = { ...small, hb: 2.5, hbLo: 2.0, hbHi: 3.0, hsSpread: 0.21 };
    const r = rateSpot(maj, d, me);
    expect(r.suit.status).not.toBe('unsuitable');
    expect(r.score).toBeGreaterThan(0);
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
    expect(profileSummary(stage4)).toBe('Intermediate (stage 4) · comfortable to chest high (1.2 m) · caught up to 1.5 m · some reef · mid-length');
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

describe('local knowledge', () => {
  const byId = (id: string) => SEED_SPOTS.find((s) => s.id === id)!;
  it('has sourced rules for every built-in spot, and only for built-in spots', () => {
    for (const s of SEED_SPOTS) expect(SPOT_RULES[s.id]?.length, s.id).toBeGreaterThan(0);
    for (const [id, rules] of Object.entries(SPOT_RULES)) {
      expect(SEED_SPOTS.some((s) => s.id === id), id).toBe(true);
      for (const r of rules) expect(r.sources.length, r.id).toBeGreaterThan(0);
    }
    const ids = Object.values(SPOT_RULES).flat().map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('turns conflicting tide sources into no tide preference, not a hard one', () => {
    for (const id of ['fv-la-caleta', 'fv-generoso', 'fv-cotillo-spew-pits']) expect(byId(id).tide, id).toBe('all');
  });
  it('La Caleta: north to north-west swell gets in, a more westerly one does not', () => {
    const c = byId('fv-la-caleta');
    expect(exposure(c, 350)).toBe(1);
    expect(exposure(c, 328)).toBe(1);
    // 19 Nov 2026: the main swell from 311° got in fine.
    expect(exposure(c, 311)).toBeGreaterThan(0.5);
    expect(exposure(c, 300)).toBeLessThan(0.5);
    expect(exposure(c, 290)).toBe(0);
  });
});

describe('rules engine', () => {
  const byId = (id: string) => SEED_SPOTS.find((x) => x.id === id)!;
  const at = (id: string, o: Parameters<typeof hour>[1], tide = 0.5, peak?: string) => {
    const sp = byId(id);
    const d = deriveHour({ ...sp, gain: 1 }, hour('2026-01-01T10:00', o), { norm: tide, trend: 0.5 });
    return { sp, d, r: evaluateRules(id, d, peak) };
  };
  it('arcs wrap through north', () => {
    expect(inArc(350, [300, 20])).toBe(true);
    expect(inArc(10, [300, 20])).toBe(true);
    expect(inArc(90, [300, 20])).toBe(false);
  });
  it('Majanicho inside only works when the open reefs are about 2 m+', () => {
    const small = at('fv-majanicho', { swell: [0.9, 11, 330] }, 0.7, 'inside-right');
    expect(small.r.cap).toBeLessThanOrEqual(1);
    expect(small.r.fired[0].rule.id).toBe('majanicho-inside-gate');
    const big = at('fv-majanicho', { swell: [2.4, 14, 330] }, 0.7, 'inside-right');
    expect(big.r.cap).toBeNull();
  });
  it('Derecha de los Alemanes goes mushy in N–NW wind', () => {
    const n = at('fv-derecha-alemanes', { swell: [1.5, 12, 330], windSpeed: 20, windDir: 350 });
    expect(n.r.windCap).toBeLessThan(4);
    expect(quality(n.sp, n.d, n.r).q).toBeLessThan(4);
    expect(at('fv-derecha-alemanes', { swell: [1.5, 12, 330], windSpeed: 20, windDir: 160 }).r.windCap).toBeNull();
  });
  it('a disputed tide rule costs at most about a third; a well-sourced one more', () => {
    const caletaHigh = at('fv-la-caleta', { swell: [1, 11, 350] }, 1);
    expect(caletaHigh.r.tide).toBeGreaterThanOrEqual(0.65);
    const muelleHigh = at('fv-el-muelle', { swell: [1, 11, 320] }, 1);
    expect(muelleHigh.r.tide).toBeLessThan(0.5);
    // On a big swell El Muelle holds size at high tide.
    expect(at('fv-el-muelle', { swell: [2.6, 14, 320] }, 1).r.tide).toBe(1);
  });
  it('low tide at Bristol is for experts', () => {
    const low = at('fv-bristol', { swell: [1.3, 12, 320] }, 0.1);
    expect(low.r.level).toBe('expert');
    const s6 = suitability(low.sp, low.d, profileForStage(6), 'm', { level: 'expert', why: 'low tide' });
    expect(s6.status).toBe('challenging');
    expect(s6.reasons.some((x) => /Local knowledge/.test(x.text))).toBe(true);
  });
  it('Cotillo: beginners at the Piedra Playa peaks only at lower tide and under ~1 m', () => {
    const high = at('fv-cotillo-piedra-playa', { swell: [0.6, 10, 300] }, 0.8, 'piedra-peaks');
    expect(high.r.level).toBe('intermediate');
    expect(at('fv-cotillo-piedra-playa', { swell: [0.4, 9, 300] }, 0.2, 'piedra-peaks').r.level).toBeNull();
  });
});

describe('size fit and no cliffs', () => {
  const C = 1.8;
  const me = { ...stage4, comfort: C };
  it('thigh-high waves are small for an intermediate comfortable to head high (Flag Beach, 14 Nov)', () => {
    const r = suitability(spot, { ...deriveHour(spot, hour('t')), hb: 0.7, hbLo: null, hbHi: null }, me);
    expect(r.reasons[0].text).toMatch(/^Small for progressing/);
    expect(r.factor).toBeLessThan(0.5);
    expect(sizeFit(0.7, C, 2)).toBe(1); // beginners learn in small waves
    expect(sizeFit(1.4, C, 4)).toBe(1);
  });
  it('a few centimetres above your comfort size is never "nothing you have surfed"', () => {
    const r = suitability(spot, { ...deriveHour(spot, hour('t')), hb: 1.9, hbLo: null, hbHi: null }, { ...me, paddleOut: 2 });
    expect(r.status).not.toBe('unsuitable');
  });
  it('rips alone are advice, not a halving', () => {
    const r = suitability({ ...spot, hazards: ['rips'] }, { ...deriveHour(spot, hour('t')), hb: 1.3, hbLo: null, hbHi: null }, me);
    expect(r.status).not.toBe('challenging');
  });
});

describe('tide and timing', () => {
  it('measures the tide between the surrounding low and high, in the middle of the hour', () => {
    // Semi-diurnal tide with a much higher night high: the day's rise from -1 to +0.2 m still reaches "high".
    const level = (h: number) => (h < 12 ? 1.2 * Math.cos(((h - 3) / 12.4) * 2 * Math.PI) - 0.2 : 0.6 * Math.cos(((h - 15.4) / 12.4) * 2 * Math.PI) - 0.4);
    const hrs = day('2026-03-01', (h) => ({ seaLevel: Math.round(level(h) * 100) / 100 }));
    const t = tideInfo(hrs);
    expect(t[15].norm).toBeGreaterThan(0.85); // near the afternoon high, although the night high was higher
    expect(t[12].trend).toBeGreaterThan(0);
  });
  it('says when the wind turns onshore after the best window starts', () => {
    // Swell arrives at 10:00; the wind turns from offshore to onshore at 12:00.
    const hrs = day('2026-03-01', (h) => ({ swell: h < 10 ? [0.3, 8, 320] : [0.8, 11, 320], windSpeed: 22, windDir: h < 12 ? 180 : 10 }));
    const r = recommendSpotDay({ ...spot, tide: 'all' }, hrs, undefined, [], { ...DEFAULT_SETTINGS, profile: stage4 }, stage4, '2026-03-01', '2026-02-01', null);
    expect(r.bestWindow![0]).toBeLessThan(12 * 60);
    expect(r.windTurn).toBe(12 * 60);
  });
  it('La Caleta, 14 Nov 2026: the morning beats the afternoon push (regression case)', () => {
    const mh = caleta.marine.hourly;
    const wh = caleta.weather.hourly;
    const wi = new Map<string, number>(wh.time.map((t: string, i: number) => [t, i]));
    const hrs: HourConditions[] = mh.time.map((time: string, i: number) => ({ time, ...marineHour(mh, i), ...windHour(wh, wi.get(time)) }));
    const days = caleta.weather.daily.time.map((date: string, i: number) => ({ date, sunrise: caleta.weather.daily.sunrise_ecmwf_ifs[i], sunset: caleta.weather.daily.sunset_ecmwf_ifs[i] }));
    const me = { ...stage4, comfort: 1.8 };
    const c = SEED_SPOTS.find((x) => x.id === 'fv-la-caleta')!;
    const r = recommendSpotDay(c, hrs, days, [], { ...DEFAULT_SETTINGS, profile: me }, me, '2026-11-14', '2026-11-13', null);
    const at = (hh: string) => r.hours.find((h) => h.time.endsWith(`T${hh}:00`))!;
    expect(r.bestWindow![0]).toBeLessThanOrEqual(11 * 60);
    expect(at('11').score).toBeGreaterThan(at('13').score);
    expect(at('13').quality.rules.some((f) => f.rule.id === 'caleta-tide-by-size')).toBe(true);
    expect(at('11').quality.rules).toHaveLength(0);
  });
});

describe('how sure a rating is', () => {
  const byId = (id: string) => SEED_SPOTS.find((x) => x.id === id)!;
  const d = (id: string, tide: number) => deriveHour(byId(id), hour('2026-01-01T10:00', { swell: [1.5, 12, 330] }), { norm: tide, trend: 0.3 });
  it('grades what the app knows about a spot', () => {
    expect(spotKnowledge(byId('fv-la-caleta')).level).toBe('local');
    expect(spotKnowledge(byId('fv-the-bubble')).level).toBe('partial');
    expect(spotKnowledge(spot).level).toBe('general'); // your own spot, or anywhere outside the area
  });
  it('is less sure when the wind models disagree or the forecast point is doubtful, surer with your sessions', () => {
    expect(sureness(byId('fv-la-caleta'), d('fv-la-caleta', 0.5), 10, 0).level).toBe('high');
    expect(sureness(byId('fv-la-caleta'), d('fv-la-caleta', 0.5), 60, 0).level).toBe('medium');
    expect(sureness(byId('fv-flag-beach'), d('fv-flag-beach', 0.5), 10, 0).level).toBe('low');
    expect(sureness(spot, deriveHour(spot, hour('t')), 0, 2).level).toBe('medium');
  });
  it('gives no rating where guessing could be dangerous: an expert reef at low tide with no tide source', () => {
    expect(tideKnown(byId('fv-cotillo-spew-pits'))).toBe(false);
    expect(sureness(byId('fv-cotillo-spew-pits'), d('fv-cotillo-spew-pits', 0.1), 0, 0).withheld).toMatch(/low tide/);
    expect(sureness(byId('fv-cotillo-spew-pits'), d('fv-cotillo-spew-pits', 0.6), 0, 0).withheld).toBeUndefined();
    expect(sureness(byId('fv-derecha-alemanes'), d('fv-derecha-alemanes', 0.1), 0, 0).withheld).toBeUndefined();
    expect(sureness(byId('fv-la-caleta'), d('fv-la-caleta', 0.1), 0, 0).withheld).toBeUndefined();
  });
  it('a withheld hour never becomes a best window', () => {
    const sp = byId('fv-cotillo-spew-pits');
    const hrs = day('2026-03-01', (h) => ({ swell: [2.5, 14, 290], windSpeed: 10, windDir: 90, seaLevel: Math.sin(((h - 3) / 12.4) * 2 * Math.PI) }));
    const r = recommendSpotDay(sp, hrs, undefined, [], { ...DEFAULT_SETTINGS, profile: profileForStage(8) }, profileForStage(8), '2026-03-01', '2026-02-01', null);
    for (const h of r.hours.filter((x) => x.sure.withheld)) expect(h.score).toBe(0);
    expect(r.hours.some((x) => x.sure.withheld)).toBe(true);
    expect(r.best?.sure.withheld).toBeUndefined();
  });
});

describe('similarity & prediction', () => {
  it('identical conditions have distance 0, different ones are far', () => {
    const a = deriveSeries(spot, day('2026-01-01'))[9];
    const b = deriveSeries(spot, day('2026-01-02', () => ({ swell: [3, 11, 320], windDir: 0, windSpeed: 30 })))[9];
    expect(distance(a, a, spot).d).toBe(0);
    expect(kernel(distance(a, b, spot).d)).toBeLessThan(0.05);
    // One tolerance off in size only -> clearly similar but not identical.
    const c = { ...a, hIn: Math.exp(Math.log(a.hIn! + 0.2) + 0.25) - 0.2 };
    expect(distance(a, c, spot).d).toBeCloseTo(1, 5);
  });

  it('where the "similar sessions" line sits', () => {
    const a = deriveSeries(spot, day('2026-01-01'))[9];
    const k = (b: typeof a) => kernel(distance(a, b, spot).d);
    const grow = (f: number) => Math.exp(Math.log(a.hIn! + 0.2) + f * 0.25) - 0.2;
    // One step off in size, onshore wind and tide together: still listed.
    expect(k({ ...a, hIn: grow(1), uOff: a.uOff! - 9, tideNorm: Math.min(1, a.tideNorm! + 0.18) })).toBeGreaterThan(SIMILAR_MIN_K);
    // A 25° swell-direction change alone is still similar.
    expect(k({ ...a, dirDom: (a.dirDom! + 25) % 360 })).toBeGreaterThan(0.5);
    // 1.1 m vs 1.8 m of swell at the spot (about 1.6 vs 2.6 m faces) is too different on its own.
    expect(kernel(distance({ ...a, hIn: 1.1 }, { ...a, hIn: 1.8 }, spot).d)).toBeLessThan(SIMILAR_MIN_K);
    // The size factor (calibration) doesn't change how alike two hours are.
    expect(distance({ ...a, hb: 1 }, { ...a, hb: 3 }, spot).d).toBe(0);
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

  it('rating for another level leaves your sessions out and says so', () => {
    const hours = day('2026-03-01');
    const days = [{ date: '2026-03-01', sunrise: '2026-03-01T07:30', sunset: '2026-03-01T19:00' }];
    const mine = [session('2026-02-01', 9), session('2026-02-10', 9)];
    const me = recommendSpotDay(spot, hours, days, mine, settings, settings.profile, '2026-03-01', '2026-03-01', null);
    expect(me.best!.pred.sumW).toBeGreaterThan(0.5);
    const friend = recommendSpotDay(spot, hours, days, mine, settings, profileForStage(6), '2026-03-01', '2026-03-01', null, { history: false });
    expect(friend.best!.pred.sumW).toBe(0);
    expect(friend.best!.score).toBeCloseTo(friend.best!.rule, 5);
    expect(explain(friend.best!, (s) => s.date, 'Advanced')[0].text).toMatch(/typical Advanced surfer.*your own sessions are left out/);
  });

  it('tide insight: average rating per tide stage, with your average at the spot as reference', () => {
    const tideAt9 = (sign: number) => day('2026-02-01', (h) => ({ seaLevel: sign * Math.cos(((h - 9) / 12.4) * 2 * Math.PI) }));
    const hiS = session('2026-02-01', 8, { id: 'hi' }, tideAt9(1));
    const loS = session('2026-02-01', 4, { id: 'lo' }, tideAt9(-1));
    const { byTide, mean, sessions } = insights(spot, [hiS, loS]);
    expect(mean).toBe(6);
    expect(sessions).toBe(2);
    const keys = Object.keys(byTide);
    expect(keys.some((k) => k.startsWith('high'))).toBe(true);
    expect(keys.some((k) => k.startsWith('low'))).toBe(true);
    for (const [k, b] of Object.entries(byTide)) {
      if (k.startsWith('high')) expect(b.mean).toBeCloseTo(8, 5);
      if (k.startsWith('low')) expect(b.mean).toBeCloseTo(4, 5);
    }
    // One session: the bars show its rating instead of "+0.0" everywhere.
    const one = insights(spot, [hiS]);
    expect(Object.values(one.byTide).every((b) => b.mean === 8)).toBe(true);
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

describe('size uncertainty (decision 0023)', () => {
  it('the breaking-height range is the wave models\' spread, at least ±20 %', () => {
    // Majanicho 19 Nov 12:00: MFWAM 2.32, ECMWF 1.98, GFS 1.90 m; median 1.98.
    const b = hbBand(2.5, { waveH: 1.98, waveHModels: [2.32, 1.98, 1.9] });
    expect(b.spread).toBeCloseTo(0.21, 2);
    expect(b.lo).toBeCloseTo(2.0, 2); // the models' low end (−3 %) is inside the ±20 % floor
    expect(b.hi).toBeCloseTo(3.0, 2);
    const wide = hbBand(2, { waveH: 2, waveHModels: [1.2, 2, 3] });
    expect(wide.lo!).toBeLessThan(1.6);
    expect(wide.hi!).toBeGreaterThan(2.4);
    expect(hbBand(2, { waveH: 2 })).toEqual({ lo: 1.6, hi: 2.4, spread: 0 });
  });
  it('disagreeing wave models lower the confidence', () => {
    const maj = SEED_SPOTS.find((x) => x.id === 'fv-majanicho')!;
    const d = deriveHour(maj, hour('t'));
    const calm = sureness(maj, { ...d, hsSpread: 0.05 }, 0, 0);
    const split = sureness(maj, { ...d, hsSpread: 0.25 }, 0, 0);
    expect(split.level).not.toBe(calm.level);
    expect(split.reasons).toContain('the wave models disagree on the size');
  });
  it('a sheltered inside peak sees smaller waves than the spot estimate', () => {
    const d = deriveHour(spot, hour('t'));
    const p = peakDerived(d, { id: 'in', name: 'Inside', sizeFactor: 0.8 });
    expect(p.hb).toBeCloseTo(d.hb! * 0.8, 6);
    expect(p.hbLo).toBeCloseTo(d.hbLo! * 0.8, 6);
    expect(peakDerived(d, null)).toBe(d);
  });
  it('one session with an observed size already moves the gain halfway', () => {
    const s1 = session('2026-02-01', 7, { fields: { observedSize: 'waist' } });
    const { gain, n } = calibratedGain(spot, [s1]);
    expect(n).toBe(1);
    expect(gain).toBeLessThan(spot.gain);
    expect(gain).toBeGreaterThan(calibratedGain(spot, [s1, session('2026-02-02', 7, { fields: { observedSize: 'waist' } })]).gain);
  });
});

describe('lining a session up against another day (Sessions tab)', () => {
  // Session 08:00–10:00 on 1 Feb in a 2 m swell; on 1 Mar the swell is that size only from 14:00,
  // and the tide is 6 hours later.
  const sess = session('2026-02-01', 7, {}, day('2026-02-01', () => ({ swell: [2, 12, 320] })));
  const surfed = buildHistory(spot, [sess], settings, '2026-03-01')[0];
  const surfedHours = surfed.hours.map((i) => surfed.derived[i]);
  const target = deriveSeries(spot, day('2026-03-01', (h) => ({ swell: h >= 14 ? [2, 12, 320] : [0.6, 8, 320], seaLevel: Math.sin(((h - 6) / 12.4) * 2 * Math.PI) })));
  const dayHours = target.map((d, h) => ({ d, daylight: h >= 7 && h < 19 }));

  it('keeps the session within the given part of the day, to the minute (or in larger steps)', () => {
    expect(shiftRange(480, 600, 420, 1140)).toEqual([-60, 540]); // 07:00–09:00 … 17:00–19:00
    expect(shiftRange(485, 600, 420, 1140)).toEqual([-65, 540]);
    expect(shiftRange(485, 600, 420, 1140, 15)).toEqual([-60, 540]);
  });
  it('the best match keeps at least an hour in daylight; night hours may be part of it', () => {
    // Sunrise 07:00, sunset 19:00; the session (08:00–10:00) lines up best with 14:00–16:00.
    const best = bestMatch(spot, surfedHours, dayHours, 480, 600, 420, 1140)!;
    expect(best.best!.dayMin).toBeGreaterThanOrEqual(14 * 60);
    // The same conditions at 02:00 (night) never win on their own...
    const same = deriveSeries(spot, day('2026-02-01', () => ({ swell: [2, 12, 320] })));
    const flat = deriveSeries(spot, day('2026-03-01', () => ({ swell: [0.6, 8, 320] })));
    const at = (hr: number) => flat.map((d, h) => (h === hr ? { d: { ...same[8], time: d.time }, daylight: false } : { d, daylight: h >= 7 && h < 19 }));
    expect(bestMatch(spot, surfedHours, at(2), 480, 600, 420, 1140)!.best!.dayMin).not.toBe(120);
    // ...nor at 05:00 (the 2-hour session would end at sunrise)...
    expect(bestMatch(spot, surfedHours, at(5), 480, 600, 420, 1140)!.best!.dayMin).not.toBe(300);
    // ...but at 06:00 they can: 06:00–08:00 has an hour in daylight.
    const m = bestMatch(spot, surfedHours, at(6), 480, 600, 420, 1140)!;
    expect(m.best!.dayMin).toBe(360);
    expect(daylightOverlap(480 + m.shift, 600 + m.shift, 420, 1140)).toBeGreaterThanOrEqual(60);
    expect(daylightOverlap(0, 60, 420, 1140)).toBe(0);
  });
  it('finds the best match to the minute', () => {
    // The session's swell sits 20 minutes into the 14:00–15:00 change: best at 13:40-ish, not on a 15-minute mark.
    const ramp = deriveSeries(spot, day('2026-03-01', (h) => ({ swell: h >= 14 ? [3, 12, 320] : [0.6, 12, 320], seaLevel: Math.sin(((h - 6) / 12.4) * 2 * Math.PI) })));
    const dh = ramp.map((d, h) => ({ d, daylight: h >= 7 && h < 19 }));
    const m = bestMatch(spot, surfedHours, dh, 480, 600, 420, 1140)!;
    expect(m.shift % 15).not.toBe(0);
  });
  it('lines each surfed hour up with the day at the exact minute, between hours interpolated', () => {
    const early = align(spot, surfedHours, dayHours, 0);
    expect(early.pairs.map((p) => p.dayMin)).toEqual([480, 540]);
    expect(align(spot, surfedHours, dayHours, 15).pairs.map((p) => p.dayMin)).toEqual([495, 555]);
    // Halfway between 13:00 (small swell) and 14:00 (the session's swell): in between.
    const at13 = align(spot, surfedHours, dayHours, 5 * 60).best!.pct;
    const at1330 = align(spot, surfedHours, dayHours, 5 * 60 + 30).best!.pct;
    const at14 = align(spot, surfedHours, dayHours, 6 * 60).best!.pct;
    expect(at1330).toBeGreaterThan(at13);
    expect(at14).toBeGreaterThan(at1330);
    const dm = new Map(dayHours.map((h) => [isoToMin(h.d.time)!, h]));
    const mid = dayAt(dm, 13 * 60 + 30)!.d;
    expect(mid.hIn!).toBeCloseTo((dayHours[13].d.hIn! + dayHours[14].d.hIn!) / 2, 6);
    const late = align(spot, surfedHours, dayHours, 6 * 60);
    expect(late.mean!).toBeGreaterThan(early.mean!);
  });
  it('explains each condition as a closeness from 0 to 100', () => {
    const a = align(spot, surfedHours, dayHours, 0);
    expect(featureCloseness('size', a.best!.parts)!).toBeLessThan(40);
    expect(featureCloseness('swellDir', a.best!.parts)).toBe(100);
    expect(featureCloseness('nope', a.best!.parts)).toBeNull();
  });
});
