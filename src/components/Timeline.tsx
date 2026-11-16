import { useMemo, useRef } from 'react';
import type { HourConditions, Settings, Spot } from '../types';
import { SLOT_MIN } from '../types';
import { waveEnergyKJ, windKind, type Derived, type WindKind } from '../lib/conditions';
import { periodTone, ratingFill, ratingText, stackPx, SwellArrows, swellsOf, SwellWaves, WaveStack } from './surfGlyphs';
import { energyColors, fmtEnergy, WIND_UNIT_LABEL, windIn } from '../lib/format';
import { fmtDuration, fmtMin, isoToMin } from '../lib/time';
import { useElementWidth } from '../hooks';

export interface HourScore {
  score: number;
  unsuitable?: boolean;
  title?: string;
}

export interface Range {
  startMin: number;
  endMin: number;
}

interface Props {
  hours: HourConditions[];
  /** For the swell colours (blue = good direction for this spot, red = poor), as in the forecast. */
  spot?: Pick<Spot, 'idealSwellDir' | 'swellWindow'>;
  derived: Derived[];
  scores?: (HourScore | null)[];
  scoreLabel?: string;
  /** Small grey line under the rating label ("for you"). */
  scoreSub?: string;
  sunrise?: number | null;
  sunset?: number | null;
  heightUnit: Settings['heightUnit'];
  windUnit: Settings['windUnit'];
  view?: [number, number];
  nowMin?: number | null;
  highlight?: Range | null;
  session?: Range | null;
  onSessionChange?: (r: Range) => void;
  /** Shown across the conditions rows when there are no hourly conditions (e.g. logged offline). */
  emptyText?: string;
}

const LABEL_W = 64;
const PAD_R = 8;
export const WIND_BG: Record<WindKind, string> = {
  glassy: '#e0f2fe',
  offshore: '#bbf7d0',
  'cross-off': '#d9f99d',
  cross: '#fef08a',
  'cross-on': '#fed7aa',
  onshore: '#fecaca',
};

type Drag = { kind: 'brush'; mode: 'new' | 'start' | 'end' | 'move'; anchor: number; offset: number; moved: boolean };

const snap = (m: number, step = SLOT_MIN) => Math.round(m / step) * step;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function Timeline(p: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const drag = useRef<Drag | null>(null);
  const [v0, v1] = p.view ?? [0, 24 * 60];
  const plotW = Math.max(100, width - LABEL_W - PAD_R);
  const pxPerMin = plotW / (v1 - v0);
  const x = (min: number) => LABEL_W + (min - v0) * pxPerMin;
  const pxPerHour = pxPerMin * 60;
  const every = pxPerHour >= 34 ? 1 : pxPerHour >= 17 ? 2 : 3;

  const hours = useMemo(
    () =>
      p.hours
        .map((h, i) => ({ h, d: p.derived[i], s: p.scores?.[i] ?? null, m: isoToMin(h.time) ?? i * 60 }))
        .filter((r) => r.m + 60 > v0 && r.m < v1),
    [p.hours, p.derived, p.scores, v0, v1],
  );

  const interactive = !!p.onSessionChange;

  // Row layout: the same rows, order and names as the forecast table (ForecastTable).
  let y = 0;
  const row = (h: number, gap = 4) => {
    const r = { y, h };
    y += h + gap;
    return r;
  };
  const sessLane = interactive ? row(16, 2) : null; // "11:15–12:45 · 1 h 30 min" above the rows
  const scoreRow = p.scores ? row(20, 4) : null;
  const wave = row(66, 2);
  const swell = row(46, 2);
  const period = row(16, 4);
  const energy = row(20, 2);
  const wind = row(28, 2);
  const tide = row(42, 6);
  const rowsTop = scoreRow?.y ?? wave.y;
  const condBottom = y - 6;
  const axis = row(18, 0);
  const H = y;

  const STACK_MAX = 48; // wave stack full height (3 m)
  const tideVals = hours.map((r) => r.h.seaLevel).filter((v): v is number => v != null);
  const tLo = tideVals.length ? Math.min(...tideVals) : 0;
  const tHi = tideVals.length ? Math.max(...tideVals) : 1;
  const tideY = (v: number) => tide.y + tide.h - 4 - ((v - tLo) / Math.max(0.05, tHi - tLo)) * (tide.h - 12);
  const fmtH = (m: number) => (p.heightUnit === 'ft' ? `${Math.round(m * 3.281)}` : m.toFixed(1));
  const fmtW = (k: number) => windIn(k, p.windUnit);
  const colW = Math.max(4, pxPerHour - 4);
  const showVal = (m: number) => (m / 60) % every === 0;

  /* ---------------- interaction ---------------- */
  const local = (e: React.PointerEvent) => {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement ?? (e.currentTarget as SVGSVGElement);
    const r = svg.getBoundingClientRect();
    return { px: e.clientX - r.left, py: e.clientY - r.top };
  };
  const toMin = (px: number) => clamp(v0 + (px - LABEL_W) / pxPerMin, v0, v1);
  const sess = p.session;

  const onBrushDown = (e: React.PointerEvent) => {
    if (!p.onSessionChange) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const m = toMin(local(e).px);
    const tol = Math.max(10, 14 / pxPerMin);
    let mode: 'new' | 'start' | 'end' | 'move' = 'new';
    if (sess) {
      if (Math.abs(m - sess.startMin) <= tol) mode = 'start';
      else if (Math.abs(m - sess.endMin) <= tol) mode = 'end';
      else if (m > sess.startMin && m < sess.endMin) mode = 'move';
    }
    drag.current = { kind: 'brush', mode, anchor: snap(m), offset: sess ? m - sess.startMin : 0, moved: false };
  };
  const onBrushMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.kind !== 'brush' || !p.onSessionChange) return;
    const m = snap(toMin(local(e).px));
    if (d.mode === 'new') {
      if (m === d.anchor) return;
      d.moved = true;
      p.onSessionChange({ startMin: Math.min(m, d.anchor), endMin: Math.max(m, d.anchor) });
    } else if (sess && d.mode === 'start') {
      p.onSessionChange({ startMin: Math.min(m, sess.endMin - 10), endMin: sess.endMin });
    } else if (sess && d.mode === 'end') {
      p.onSessionChange({ startMin: sess.startMin, endMin: Math.max(m, sess.startMin + 10) });
    } else if (sess && d.mode === 'move') {
      const len = sess.endMin - sess.startMin;
      const start = clamp(snap(toMin(local(e).px) - d.offset), 0, 24 * 60 - len);
      p.onSessionChange({ startMin: start, endMin: start + len });
    }
  };
  const onBrushUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.kind !== 'brush' || !p.onSessionChange) return;
    // A simple tap creates a 90-minute session starting there.
    if (d.mode === 'new' && !d.moved) {
      const start = clamp(d.anchor, 0, 24 * 60 - 90);
      p.onSessionChange({ startMin: start, endMin: start + 90 });
    }
  };

  /** Pointer-up also applies the release point: fast drags can skip the last move event. */
  const end = (e: React.PointerEvent) => {
    if (!drag.current) return;
    onBrushMove(e);
    onBrushUp();
  };

  /* ---------------- render helpers ---------------- */
  const ticks: number[] = [];
  for (let m = Math.ceil(v0 / 60) * 60; m <= v1; m += 60 * every) ticks.push(m);

  const tidePath = (() => {
    const pts = hours.filter((r) => r.h.seaLevel != null).map((r) => [x(r.m), tideY(r.h.seaLevel!)] as const);
    if (pts.length < 2) return null;
    const line = pts.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
    return { line, area: `${line} L${pts[pts.length - 1][0]},${tide.y + tide.h} L${pts[0][0]},${tide.y + tide.h} Z` };
  })();
  const tideMarks = hours
    .map((r, i) => {
      const v = r.h.seaLevel;
      const a = hours[i - 1]?.h.seaLevel;
      const b = hours[i + 1]?.h.seaLevel;
      if (v == null || a == null || b == null) return null;
      if (v >= a && v > b) return { m: r.m, v, hi: true };
      if (v <= a && v < b) return { m: r.m, v, hi: false };
      return null;
    })
    .filter(Boolean) as { m: number; v: number; hi: boolean }[];

  const label = (r: { y: number; h: number }, text: string, sub?: string) => (
    <g>
      <text x={LABEL_W - 8} y={r.y + r.h / 2 + (sub ? -2 : 4)} textAnchor="end" className="tl-label">
        {text}
      </text>
      {sub && (
        <text x={LABEL_W - 8} y={r.y + r.h / 2 + 10} textAnchor="end" className="tl-sub">
          {sub}
        </text>
      )}
    </g>
  );

  return (
    <div ref={ref} className="timeline">
      {width > 0 && (
        <svg width={width} height={H} className={interactive ? 'interactive' : ''} onPointerUp={end} onPointerCancel={() => (drag.current = null)}>
          {/* night */}
          {p.sunrise != null && p.sunrise > v0 && <rect x={x(v0)} y={0} width={x(p.sunrise) - x(v0)} height={condBottom} className="night" />}
          {p.sunset != null && p.sunset < v1 && <rect x={x(p.sunset)} y={0} width={x(v1) - x(p.sunset)} height={condBottom} className="night" />}

          {/* grid */}
          {ticks.map((m) => (
            <line key={m} x1={x(m)} x2={x(m)} y1={0} y2={axis.y} className="grid" />
          ))}

          {p.highlight && (
            <rect x={x(p.highlight.startMin)} y={1} width={x(p.highlight.endMin) - x(p.highlight.startMin)} height={condBottom - 2} className="highlight" rx={4} />
          )}

          {/* rating: the same score pills as the forecast */}
          {scoreRow && (
            <g>
              {label(scoreRow, p.scoreLabel ?? 'Rating', p.scoreSub)}
              {hours.map((r) => (
                <g key={r.m}>
                  {r.s && (
                    <rect
                      x={x(r.m) + Math.min(3, pxPerHour * 0.12)}
                      y={scoreRow.y}
                      width={Math.max(1, pxPerHour - 2 * Math.min(3, pxPerHour * 0.12))}
                      height={scoreRow.h}
                      rx={5}
                      fill={ratingFill(r.s.score, r.s.unsuitable)}
                    >
                      {r.s.title && <title>{r.s.title}</title>}
                    </rect>
                  )}
                  {r.s && pxPerHour >= 22 && (
                    <text x={x(r.m) + pxPerHour / 2} y={scoreRow.y + 14} textAnchor="middle" className={`tl-score${r.s.unsuitable ? ' muted' : ''}`}>
                      {ratingText(r.s.score, r.s.unsuitable)}
                    </text>
                  )}
                </g>
              ))}
            </g>
          )}

          {p.hours.length === 0 && p.emptyText && (
            <g className="tl-empty">
              <rect x={LABEL_W} y={wave.y + 8} width={plotW} height={condBottom - wave.y - 16} rx={8} />
              <text x={LABEL_W + plotW / 2} y={(wave.y + condBottom) / 2 + 4} textAnchor="middle">
                {p.emptyText}
              </text>
            </g>
          )}

          {/* wave: the height as a number over the stacked Japanese-style waves (full at 3 m) */}
          {label(wave, 'Wave', p.heightUnit === 'ft' ? 'ft' : 'm')}
          {hours.map((r) => {
            const hb = r.d?.hb;
            if (hb == null) return null;
            const top = wave.y + wave.h - stackPx(hb, STACK_MAX);
            return (
              <g key={r.m}>
                <WaveStack h={hb} w={colW} max={STACK_MAX} x={x(r.m) + (pxPerHour - colW) / 2} y={wave.y + wave.h - STACK_MAX} />
                {showVal(r.m) && (
                  <text x={x(r.m) + pxPerHour / 2} y={Math.min(wave.y + 11, top - 3)} textAnchor="middle" className="tl-val">
                    {fmtH(hb)}
                  </text>
                )}
              </g>
            );
          })}

          {/* swell: height, the swells' arrows side by side and their waves (blue = good direction
              for the spot, red = poor and facing left; dark → light by energy), as in the forecast */}
          {label(swell, 'Swell', p.heightUnit === 'ft' ? 'ft · dir.' : 'm · dir.')}
          {hours.map((r) => {
            const swells = swellsOf(r.h);
            if (!swells.length) return null;
            const cx = x(r.m) + pxPerHour / 2;
            return (
              <g key={r.m}>
                {showVal(r.m) && (
                  <text x={cx} y={swell.y + 10} textAnchor="middle" className="tl-val">
                    {fmtH(swells[0].t.h)}
                  </text>
                )}
                {(showVal(r.m) || pxPerHour >= 30) && <SwellArrows swells={pxPerHour >= 30 ? swells : swells.slice(0, 1)} spot={p.spot} cx={cx} cy={swell.y + 19} size={11} step={11} />}
                <SwellWaves swells={swells} spot={p.spot} cx={cx} base={swell.y + swell.h} w={Math.min(26, pxPerHour - 2)} maxPx={18} shift={Math.min(8, pxPerHour * 0.2)} />
              </g>
            );
          })}

          {/* period of the main swell */}
          {label(period, 'Period', 's')}
          {hours.map((r) => {
            const main = swellsOf(r.h)[0]?.t;
            return main && showVal(r.m) ? (
              <text key={r.m} x={x(r.m) + pxPerHour / 2} y={period.y + 12} textAnchor="middle" className={`tl-val ${periodTone(main.t)}`}>
                {Math.round(main.t)}
              </text>
            ) : null;
          })}

          {/* wave energy of the model grid cell */}
          {label(energy, 'Energy', 'kJ')}
          {hours.map((r) => {
            const e = waveEnergyKJ(r.h);
            const c = energyColors(e);
            return (
              <g key={r.m}>
                <rect x={x(r.m) + 1} y={energy.y} width={Math.max(1, pxPerHour - 2)} height={energy.h} rx={3} fill={c?.bg ?? '#f1f5f9'}>
                  <title>{e == null ? 'no wave data' : `${Math.round(e)} kJ (strongest swell train in the grid cell)`}</title>
                </rect>
                {(r.m / 60) % every === 0 && e != null && pxPerHour * every >= 26 && (
                  <text x={x(r.m) + pxPerHour / 2} y={energy.y + 14} textAnchor="middle" className="tl-val" fill={c?.fg} style={{ fill: c?.fg }}>
                    {fmtEnergy(e)}
                  </text>
                )}
              </g>
            );
          })}

          {/* wind */}
          {label(wind, 'Wind', WIND_UNIT_LABEL[p.windUnit])}
          {hours.map((r) => {
            const k = r.d ? windKind(r.d) : null;
            return (
              <g key={r.m}>
                <rect x={x(r.m) + 1} y={wind.y} width={Math.max(1, pxPerHour - 2)} height={wind.h} rx={3} fill={k ? WIND_BG[k] : '#f1f5f9'}>
                  {k && <title>{k}</title>}
                </rect>
                {(r.m / 60) % every === 0 && r.h.windSpeed != null && (
                  <g transform={`translate(${x(r.m) + pxPerHour / 2},${wind.y + wind.h / 2})`}>
                    {r.h.windDir != null && <path d="M0 -7 L4 3 L0 1 L-4 3 Z" transform={`translate(-9,0) rotate(${r.h.windDir + 180})`} fill="#334155" />}
                    <text x={4} y={4} textAnchor="middle" className="tl-val">
                      {fmtW(r.h.windSpeed)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* tide */}
          {label(tide, 'Tide')}
          {tidePath ? (
            <g>
              <path d={tidePath.area} className="tide-area" />
              <path d={tidePath.line} className="tide-line" />
              {tideMarks.map((t) => (
                <text key={t.m} x={x(t.m) + pxPerHour / 2} y={t.hi ? tideY(t.v) - 3 : tideY(t.v) + 11} textAnchor="middle" className="tl-sub">
                  {t.hi ? 'high' : 'low'}
                </text>
              ))}
            </g>
          ) : (
            <text x={LABEL_W + 6} y={tide.y + 24} className="tl-sub">
              no tide data
            </text>
          )}

          {/* your session: a soft band across all rows, handles on its edges, the time above */}
          {sess && (
            <g pointerEvents="none">
              <rect x={x(sess.startMin)} y={rowsTop - 2} width={Math.max(2, x(sess.endMin) - x(sess.startMin))} height={condBottom - rowsTop + 2} className="session" rx={4} />
              {interactive && (
                <>
                  <rect x={x(sess.startMin) - 4} y={wave.y + 16} width={8} height={36} rx={4} className="handle" />
                  <rect x={x(sess.endMin) - 4} y={wave.y + 16} width={8} height={36} rx={4} className="handle" />
                </>
              )}
              <text x={clamp((x(sess.startMin) + x(sess.endMin)) / 2, LABEL_W + 60, LABEL_W + plotW - 60)} y={(sessLane?.y ?? rowsTop - 14) + 12} textAnchor="middle" className="session-label">
                {fmtMin(sess.startMin)}–{fmtMin(sess.endMin)} · {fmtDuration(sess.endMin - sess.startMin)}
              </text>
            </g>
          )}

          {p.nowMin != null && p.nowMin >= v0 && p.nowMin <= v1 && <line x1={x(p.nowMin)} x2={x(p.nowMin)} y1={0} y2={condBottom} className="now" />}

          {/* brush hit area */}
          {interactive && (
            <rect
              x={LABEL_W}
              y={0}
              width={plotW}
              height={condBottom}
              fill="transparent"
              style={{ cursor: 'ew-resize', touchAction: 'pan-y' }}
              onPointerDown={onBrushDown}
              onPointerMove={onBrushMove}
            />
          )}
          {interactive && !sess && (
            <text x={LABEL_W + plotW / 2} y={wave.y + 22} textAnchor="middle" className="hint" pointerEvents="none">
              {plotW < 380 ? "Drag to mark your time in the water" : "Drag across the chart to mark when you were in the water"}
            </text>
          )}

          {/* axis */}
          {ticks.map((m) => (
            <text key={m} x={x(m)} y={axis.y + 13} textAnchor="middle" className="tl-axis">
              {fmtMin(m)}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}
