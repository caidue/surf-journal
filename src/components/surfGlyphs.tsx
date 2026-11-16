import type { HourConditions, Spot } from '../types';
import { exposure, trainsByEnergy, type TrainInfo } from '../lib/conditions';
import { scoreColor } from '../lib/rating';

/**
 * Drawing pieces shared by the forecast table (ForecastTable) and the session chart (Timeline),
 * so the two look the same: the wave-height curve, the swell colours and the swell wave glyph.
 */

/** Swell colours: blue = good direction for the spot, red = poor; 1st / 2nd / 3rd swell by energy dark → light. */
export const SWELL_BLUE = ['#1d4ed8', '#3b82f6', '#93c5fd'];
export const SWELL_RED = ['#b91c1c', '#ef4444', '#fca5a5'];
/** Below this share of a swell reaching the spot (`exposure`), it is red and its wave faces left. */
export const POOR_EXPOSURE = 0.5;
/** Below this share it is practically outside the swell window. */
export const OUTSIDE_EXPOSURE = 0.1;

export const isPoor = (spot: Pick<Spot, 'idealSwellDir' | 'swellWindow'> | undefined, dir: number) => !!spot && exposure(spot, dir) < POOR_EXPOSURE;
export const isOutside = (spot: Pick<Spot, 'idealSwellDir' | 'swellWindow'> | undefined, dir: number) => !!spot && exposure(spot, dir) < OUTSIDE_EXPOSURE;
/** Colour of a swell train: rank 0–2 by energy; null = the wind sea (text colour). */
export const swellColor = (spot: Pick<Spot, 'idealSwellDir' | 'swellWindow'> | undefined, dir: number, rank: number | null) =>
  rank == null ? 'currentColor' : (isPoor(spot, dir) ? SWELL_RED : SWELL_BLUE)[Math.min(2, rank)];

/** A small breaking wave in a 100 × 100 box: a slim back, a rounded crest with a soft lip, the face down. */
export const SWELL_WAVE_PATH = 'M0 100 C26 96 42 66 58 36 C67 18 75 8 84 8 C91 8 95 13 94 18 C90 15 85 16 83 23 C85 52 92 80 100 100 Z';

/**
 * A smooth line through points (monotone cubic: it passes through every point and never
 * overshoots between them, so a flat stretch stays flat and the curve bends softly at each hour).
 */
export function smoothLine(pts: readonly (readonly [number, number])[]): string {
  const n = pts.length;
  if (!n) return '';
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) slope.push((pts[i + 1][1] - pts[i][1]) / Math.max(1e-6, pts[i + 1][0] - pts[i][0]));
  const tan: number[] = pts.map((_, i) => (i === 0 ? slope[0] : i === n - 1 ? slope[n - 2] : slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tan[i] = 0;
      tan[i + 1] = 0;
      continue;
    }
    const a = tan[i] / slope[i];
    const b = tan[i + 1] / slope[i];
    const q = a * a + b * b;
    if (q > 9) {
      const k = 3 / Math.sqrt(q);
      tan[i] = k * a * slope[i];
      tan[i + 1] = k * b * slope[i];
    }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = (x1 - x0) / 3;
    d += ` C${(x0 + h).toFixed(1)},${(y0 + tan[i] * h).toFixed(1)} ${(x1 - h).toFixed(1)},${(y1 - tan[i + 1] * h).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}

/**
 * The wave height across the hours as one continuous, smooth, blue-filled curve: each hour's
 * height at the middle of its column (`points`: x and metres), flat out to `x0` / `x1` at both
 * ends, on a baseline at y = `base`, full height (`maxPx`) at `fullAt` m. Shared by the forecast
 * table and the session chart.
 */
export function HeightCurve({ points, x0, x1, base, maxPx, fullAt = 3 }: { points: { x: number; h: number }[]; x0: number; x1: number; base: number; maxPx: number; fullAt?: number }) {
  if (!points.length) return null;
  const y = (h: number) => base - Math.max(2, Math.min(1, h / fullAt) * maxPx);
  const pts: [number, number][] = [[x0, y(points[0].h)], ...points.map((p) => [p.x, y(p.h)] as [number, number]), [x1, y(points[points.length - 1].h)]];
  const line = smoothLine(pts);
  return (
    <g aria-hidden>
      <path d={`${line} L${x1},${base} L${x0},${base} Z`} className="height-area" />
      <path d={line} className="height-line" />
    </g>
  );
}

/**
 * One swell's wave glyph inside an SVG: `w` wide, as tall as `px`, its baseline at y = `base`,
 * centred on x = `cx` (shifted by `dx`); mirrored (facing left) for a poor direction.
 */
export function SwellWaveGlyph({ cx, base, w, px, color, mirrored, dx = 0 }: { cx: number; base: number; w: number; px: number; color: string; mirrored?: boolean; dx?: number }) {
  const sx = w / 100;
  const sy = px / 100;
  const left = cx + dx - w / 2;
  const t = mirrored ? `translate(${left + w},${base - px}) scale(${-sx},${sy})` : `translate(${left},${base - px}) scale(${sx},${sy})`;
  return <path d={SWELL_WAVE_PATH} transform={t} fill={color} />;
}

/* ------------------------------------------------------------------ */
/* Swells of one hour: which ones, their arrows, their waves           */
/* ------------------------------------------------------------------ */

type SpotDir = Pick<Spot, 'idealSwellDir' | 'swellWindow'> | undefined;

/** A swell train with its rank by energy (0–2), or null for the wind sea. */
export interface RankedSwell {
  t: TrainInfo;
  rank: number | null;
}

/**
 * The hour's swells as the forecast shows them: the strongest swell (or the wind sea when there is
 * no swell) first, then up to two more swells of at least 0.2 m.
 */
export function swellsOf(h: HourConditions): RankedSwell[] {
  const all = trainsByEnergy(h);
  const swells = all.filter((t) => t.kind === 'swell');
  const main = swells[0] ? { t: swells[0], rank: 0 } : all.find((t) => t.kind === 'wind') ? { t: all.find((t) => t.kind === 'wind')!, rank: null } : null;
  if (!main) return [];
  return [main, ...swells.slice(1, 3).filter((t) => t.h >= 0.2).map((t, k) => ({ t, rank: k + 1 }))];
}

/** "(almost) outside the swell window" / "poor direction for this spot" / "". */
export const swellDirNote = (spot: SpotDir, dir: number) => (isOutside(spot, dir) ? ' · (almost) outside the swell window' : isPoor(spot, dir) ? ' · poor direction for this spot' : '');

/** Tooltip lines for the swells of one hour; `line` formats one train (height, period, direction, energy). */
export const swellTooltip = (swells: RankedSwell[], spot: SpotDir, line: (t: TrainInfo) => string) =>
  swells.map(({ t }, k) => `${k === 0 ? '' : `${k === 1 ? '2nd' : '3rd'} swell: `}${line(t)}${swellDirNote(spot, t.dir)}`).join('\n');

/**
 * The swells' direction arrows side by side, centred on (cx, cy), pointing where the swell goes:
 * the main one a little larger, coloured like the waves (blue = good direction, red = poor).
 */
export function SwellArrows({ swells, spot, cx, cy, size = 13, step = 12 }: { swells: RankedSwell[]; spot: SpotDir; cx: number; cy: number; size?: number; step?: number }) {
  return (
    <g aria-hidden>
      {swells.map(({ t, rank }, k) => (
        <path
          key={k}
          d="M0 -8 L5 4 L0 1 L-5 4 Z"
          transform={`translate(${cx + (k - (swells.length - 1) / 2) * step},${cy}) rotate(${t.dir + 180}) scale(${(size / 20) * (k === 0 && swells.length > 1 ? 1.15 : 0.95)})`}
          fill={swellColor(spot, t.dir, rank)}
        />
      ))}
    </g>
  );
}

/**
 * The swells as small surf waves on one baseline (y = base), as tall as their height (full at
 * `fullAt` m, `maxPx` high), the 2nd and 3rd set `shift` px further left each, like the next
 * waves of a set. Stacked by height: the tallest at the back, the smallest in front. A swell from
 * a poor direction is red and faces left.
 */
export function SwellWaves({ swells, spot, cx, base, w, maxPx, fullAt = 1.6, shift = 8 }: { swells: RankedSwell[]; spot: SpotDir; cx: number; base: number; w: number; maxPx: number; fullAt?: number; shift?: number }) {
  return (
    <g aria-hidden>
      {swells
        .map((s, k) => ({ ...s, k }))
        .sort((a, b) => b.t.h - a.t.h)
        .map(({ t, rank, k }) => (
          <SwellWaveGlyph
            key={k}
            cx={cx}
            dx={-shift * k}
            base={base}
            w={w}
            px={Math.max(4, Math.min(1, t.h / fullAt) * maxPx)}
            color={swellColor(spot, t.dir, rank)}
            mirrored={isPoor(spot, t.dir)}
          />
        ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Rating and period                                                    */
/* ------------------------------------------------------------------ */

/** Fill of a rating pill: the score colour, or light grey when the hour is not for you. */
export const ratingFill = (score: number, unsuitable?: boolean) => (unsuitable ? '#e2e8f0' : scoreColor(score));
/** Text of a rating pill: the score (whole 10 without decimals), or ✕ when not for you. */
export const ratingText = (score: number, unsuitable?: boolean) => (unsuitable ? '✕' : score.toFixed(score >= 9.95 ? 0 : 1));
/** Period emphasis: bold from 12 s (powerful), grey under 8 s (weak). */
export const periodTone = (t: number) => (t >= 12 ? 'strong' : t < 8 ? 'weak' : '');
