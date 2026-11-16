import { describe, expect, it } from 'vitest';
import type { HourConditions } from '../types';
import { isPoor, periodTone, ratingText, smoothLine, swellColor, swellsOf, SWELL_BLUE, SWELL_RED } from './surfGlyphs';

const hour = (trains: HourConditions['trains']): HourConditions => ({ time: '2026-11-16T10:00', trains }) as HourConditions;
const spot = { idealSwellDir: 300, swellWindow: 75 };

describe('shared forecast pieces', () => {
  it('picks the main swell and up to two more of at least 0.2 m, ranked by energy', () => {
    const s = swellsOf(
      hour([
        { kind: 'swell', h: 0.5, tp: 8, dir: 300 },
        { kind: 'swell', h: 1.0, tp: 12, dir: 310 },
        { kind: 'swell', h: 0.1, tp: 14, dir: 290 },
        { kind: 'wind', h: 0.6, tp: 5, dir: 20 },
        { kind: 'swell', h: 0.4, tp: 9, dir: 0 },
      ]),
    );
    expect(s.map((x) => [x.t.h, x.rank])).toEqual([
      [1.0, 0],
      [0.5, 1],
      [0.4, 2],
    ]);
  });

  it('falls back to the wind sea when there is no swell', () => {
    const s = swellsOf(hour([{ kind: 'wind', h: 0.6, tp: 5, dir: 20 }]));
    expect(s).toHaveLength(1);
    expect(s[0].rank).toBeNull();
  });

  it('colours by direction: blue when good, red when poor, dark to light by rank', () => {
    expect(isPoor(spot, 300)).toBe(false);
    expect(isPoor(spot, 10)).toBe(true);
    expect(swellColor(spot, 300, 0)).toBe(SWELL_BLUE[0]);
    expect(swellColor(spot, 10, 2)).toBe(SWELL_RED[2]);
    expect(swellColor(spot, 300, null)).toBe('currentColor');
  });

  it('formats ratings and period emphasis', () => {
    expect(ratingText(9.97)).toBe('10');
    expect(ratingText(6.44)).toBe('6.4');
    expect(ratingText(3, true)).toBe('✕');
    expect(periodTone(13)).toBe('strong');
    expect(periodTone(7)).toBe('weak');
    expect(periodTone(10)).toBe('');
  });

  it('the height curve passes through every hour and stays flat on a flat stretch', () => {
    const d = smoothLine([
      [0, 50],
      [50, 50],
      [100, 20],
      [150, 20],
    ]);
    expect(d.startsWith('M0.0,50.0')).toBe(true);
    // Each segment ends on the next point; the flat first segment keeps its control points at y = 50.
    expect(d).toContain('C16.7,50.0 33.3,50.0 50.0,50.0');
    expect(d).toContain(' 100.0,20.0');
    expect(d.endsWith(' 150.0,20.0')).toBe(true);
  });
});
