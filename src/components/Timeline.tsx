import { useEffect, useMemo, useRef, useState } from 'react';
import type { Category, HourConditions, Peak, Settings } from '../types';
import { SLOT_MIN, SLOTS } from '../types';
import { windKind, type Derived, type WindKind } from '../lib/conditions';
import { scoreColor } from '../lib/rating';
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
  derived: Derived[];
  scores?: (HourScore | null)[];
  scoreLabel?: string;
  sunrise?: number | null;
  sunset?: number | null;
  heightUnit: Settings['heightUnit'];
  windUnit: Settings['windUnit'];
  view?: [number, number];
  nowMin?: number | null;
  highlight?: Range | null;
  session?: Range | null;
  onSessionChange?: (r: Range) => void;
  peaks?: Peak[];
  zones?: (string | null)[];
  /** Receives an updater so that fast pointer moves never paint over a stale array. */
  onZonesChange?: (u: (prev: (string | null)[]) => (string | null)[]) => void;
  categories?: Category[];
  curves?: Record<string, (number | null)[]>;
  activeCategory?: string;
  onCurvesChange?: (u: (prev: Record<string, (number | null)[]>) => Record<string, (number | null)[]>) => void;
  /** Shown across the conditions rows when there are no hourly conditions (e.g. logged offline). */
  emptyText?: string;
}

const LABEL_W = 64;
const PAD_R = 8;
export const PEAK_COLORS = ['#0ea5e9', '#f97316', '#8b5cf6', '#10b981', '#e11d48', '#eab308'];
export const WIND_BG: Record<WindKind, string> = {
  glassy: '#e0f2fe',
  offshore: '#bbf7d0',
  'cross-off': '#d9f99d',
  cross: '#fef08a',
  'cross-on': '#fed7aa',
  onshore: '#fecaca',
};

type Drag =
  | { kind: 'brush'; mode: 'new' | 'start' | 'end' | 'move'; anchor: number; offset: number; moved: boolean }
  | { kind: 'zone'; peakId: string; erase: boolean; last: number }
  | { kind: 'curve'; cat: string; lastSlot: number; lastVal: number };

const snap = (m: number, step = SLOT_MIN) => Math.round(m / step) * step;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function Timeline(p: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const drag = useRef<Drag | null>(null);
  /** Peak whose full name is shown (tap a lane label: names are cut off in the narrow label column). */
  const [peakTip, setPeakTip] = useState<string | null>(null);
  useEffect(() => {
    if (!peakTip) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.('.peak-tip, .lane-label')) setPeakTip(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [peakTip]);
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
  const showZones = !!(p.peaks?.length && p.zones);
  const showCurves = !!(p.curves && p.categories);

  // Row layout.
  let y = 0;
  const row = (h: number, gap = 4) => {
    const r = { y, h };
    y += h + gap;
    return r;
  };
  const scoreRow = p.scores ? row(16) : null;
  const surf = row(104, 0);
  const swell = row(24, 2);
  const wind = row(28, 2);
  const tide = row(42, 6);
  const condBottom = y - 6;
  const lanes = showZones ? p.peaks!.map(() => row(24, 3)) : [];
  if (showZones) y += 4;
  const curvesRow = showCurves ? row(150, 6) : null;
  const axis = row(18, 0);
  const H = y;

  const maxH = Math.max(1.2, ...hours.map((r) => Math.max(r.d?.hb ?? 0, r.h.swellH ?? 0, r.h.waveH ?? 0))) * 1.12;
  const surfY = (m: number) => surf.y + surf.h - (m / maxH) * (surf.h - 14);
  const tideVals = hours.map((r) => r.h.seaLevel).filter((v): v is number => v != null);
  const tLo = tideVals.length ? Math.min(...tideVals) : 0;
  const tHi = tideVals.length ? Math.max(...tideVals) : 1;
  const tideY = (v: number) => tide.y + tide.h - 4 - ((v - tLo) / Math.max(0.05, tHi - tLo)) * (tide.h - 12);
  const curveY = (v: number) => (curvesRow ? curvesRow.y + curvesRow.h - 8 - ((v - 1) / 9) * (curvesRow.h - 16) : 0);
  const fmtH = (m: number) => (p.heightUnit === 'ft' ? `${Math.round(m * 3.281)}` : m.toFixed(1));
  const fmtW = (k: number) => (p.windUnit === 'kn' ? Math.round(k / 1.852) : Math.round(k));

  /* ---------------- interaction ---------------- */
  const local = (e: React.PointerEvent) => {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement ?? (e.currentTarget as SVGSVGElement);
    const r = svg.getBoundingClientRect();
    return { px: e.clientX - r.left, py: e.clientY - r.top };
  };
  const toMin = (px: number) => clamp(v0 + (px - LABEL_W) / pxPerMin, v0, v1);
  const sess = p.session;

  const paintZones = (a: number, b: number, peakId: string, erase: boolean) => {
    if (!p.zones || !p.onZonesChange || !sess) return;
    const lo = Math.max(Math.min(a, b), Math.floor(sess.startMin / SLOT_MIN));
    const hi = Math.min(Math.max(a, b), Math.ceil(sess.endMin / SLOT_MIN) - 1);
    p.onZonesChange((prev) => {
      const z = prev.slice();
      for (let s = lo; s <= hi; s++) z[s] = erase ? (z[s] === peakId ? null : z[s]) : peakId;
      return z;
    });
  };
  const paintCurve = (cat: string, s0: number, v0_: number, s1: number, v1_: number) => {
    if (!p.curves || !p.onCurvesChange || !sess) return;
    const lo = Math.floor(sess.startMin / SLOT_MIN);
    const hi = Math.ceil(sess.endMin / SLOT_MIN) - 1;
    const n = Math.abs(s1 - s0);
    p.onCurvesChange((prev) => {
      const arr = (prev[cat] ?? Array<number | null>(SLOTS).fill(null)).slice();
      for (let k = 0; k <= n; k++) {
        const s = s0 + Math.sign(s1 - s0) * k;
        if (s < lo || s > hi) continue;
        const t = n ? k / n : 1;
        arr[s] = Math.round((v0_ + (v1_ - v0_) * t) * 10) / 10;
      }
      return { ...prev, [cat]: arr };
    });
  };
  const valAt = (py: number) => (curvesRow ? clamp(1 + ((curvesRow.y + curvesRow.h - 8 - py) / (curvesRow.h - 16)) * 9, 1, 10) : 5);

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

  const onLaneDown = (peakId: string) => (e: React.PointerEvent) => {
    if (!sess || !p.zones) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const slot = Math.floor(toMin(local(e).px) / SLOT_MIN);
    const erase = p.zones[slot] === peakId;
    drag.current = { kind: 'zone', peakId, erase, last: slot };
    paintZones(slot, slot, peakId, erase);
  };
  const onLaneMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.kind !== 'zone') return;
    const slot = Math.floor(toMin(local(e).px) / SLOT_MIN);
    if (slot === d.last) return;
    paintZones(d.last, slot, d.peakId, d.erase);
    d.last = slot;
  };

  const onCurveDown = (e: React.PointerEvent) => {
    if (!sess || !p.activeCategory) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const { px, py } = local(e);
    const slot = Math.floor(toMin(px) / SLOT_MIN);
    const val = valAt(py);
    drag.current = { kind: 'curve', cat: p.activeCategory, lastSlot: slot, lastVal: val };
    paintCurve(p.activeCategory, slot, val, slot, val);
  };
  const onCurveMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.kind !== 'curve') return;
    const { px, py } = local(e);
    const slot = Math.floor(toMin(px) / SLOT_MIN);
    const val = valAt(py);
    paintCurve(d.cat, d.lastSlot, d.lastVal, slot, val);
    d.lastSlot = slot;
    d.lastVal = val;
  };
  /** Pointer-up also paints up to the release point: fast strokes can skip the last move event. */
  const end = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.kind === 'curve') onCurveMove(e);
    else if (d.kind === 'zone') onLaneMove(e);
    else if (d.kind === 'brush') {
      onBrushMove(e);
      onBrushUp();
      return;
    }
    drag.current = null;
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

  const curvePaths = (cat: string) => {
    const arr = p.curves?.[cat];
    if (!arr || !sess) return [];
    const lo = Math.floor(sess.startMin / SLOT_MIN);
    const hi = Math.ceil(sess.endMin / SLOT_MIN) - 1;
    const segs: string[] = [];
    let cur: string[] = [];
    for (let s = lo; s <= hi; s++) {
      const v = arr[s];
      if (v == null) {
        if (cur.length > 1) segs.push(cur.join(' '));
        cur = [];
        continue;
      }
      cur.push(`${x(s * SLOT_MIN + SLOT_MIN / 2).toFixed(1)},${curveY(v).toFixed(1)}`);
    }
    if (cur.length > 1) segs.push(cur.join(' '));
    else if (cur.length === 1) segs.push(`${cur[0]} ${cur[0]}`);
    return segs;
  };

  const zoneRuns = (peakId: string) => {
    const runs: [number, number][] = [];
    if (!p.zones) return runs;
    let start = -1;
    for (let s = 0; s <= SLOTS; s++) {
      const on = s < SLOTS && p.zones[s] === peakId && (!sess || (s * SLOT_MIN >= sess.startMin && s * SLOT_MIN < sess.endMin));
      if (on && start < 0) start = s;
      if (!on && start >= 0) {
        runs.push([start * SLOT_MIN, s * SLOT_MIN]);
        start = -1;
      }
    }
    return runs;
  };

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

  const tipIdx = peakTip && showZones ? p.peaks!.findIndex((pk) => pk.id === peakTip) : -1;
  const tipPeak = tipIdx >= 0 ? p.peaks![tipIdx] : null;
  const tipMinutes =
    tipPeak && sess && p.zones
      ? p.zones.filter((z, s) => z === tipPeak.id && s * SLOT_MIN >= sess.startMin && s * SLOT_MIN < sess.endMin).length * SLOT_MIN
      : 0;

  return (
    <div ref={ref} className="timeline">
      {tipPeak && (
        <div className="peak-tip" role="tooltip" style={{ top: lanes[tipIdx].y + lanes[tipIdx].h + 4, left: 4 }}>
          <div className="row gap">
            <span className="dot" style={{ background: PEAK_COLORS[tipIdx % PEAK_COLORS.length] }} />
            <strong>{tipPeak.name}</strong>
          </div>
          {tipPeak.description && <div className="small">{tipPeak.description}</div>}
          <div className="small muted">
            {tipMinutes ? `${fmtDuration(tipMinutes)} here this session · ` : ''}
            {p.onZonesChange ? 'Drag along the lane to mark your time here.' : ''}
          </div>
        </div>
      )}
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

          {/* score strip */}
          {scoreRow && (
            <g>
              {label(scoreRow, p.scoreLabel ?? 'Score')}
              {hours.map((r) => (
                <g key={r.m}>
                  <rect x={x(r.m) + 1} y={scoreRow.y} width={Math.max(1, pxPerHour - 2)} height={scoreRow.h} rx={3} fill={r.s ? (r.s.unsuitable ? '#e2e8f0' : scoreColor(r.s.score)) : '#f1f5f9'}>
                    {r.s?.title && <title>{r.s.title}</title>}
                  </rect>
                  {r.s && pxPerHour >= 22 && (
                    <text x={x(r.m) + pxPerHour / 2} y={scoreRow.y + 12} textAnchor="middle" className={`tl-score${r.s.unsuitable ? ' muted' : ''}`}>
                      {r.s.unsuitable ? '✕' : r.s.score.toFixed(r.s.score >= 9.95 ? 0 : 1)}
                    </text>
                  )}
                </g>
              ))}
            </g>
          )}

          {p.hours.length === 0 && p.emptyText && (
            <g className="tl-empty">
              <rect x={LABEL_W} y={surf.y + 8} width={plotW} height={condBottom - surf.y - 16} rx={8} />
              <text x={LABEL_W + plotW / 2} y={(surf.y + condBottom) / 2 + 4} textAnchor="middle">
                {p.emptyText}
              </text>
            </g>
          )}

          {/* surf height */}
          {label(surf, 'Surf', p.heightUnit === 'ft' ? 'ft (est.)' : 'm (est.)')}
          {hours.map((r) => {
            const hb = r.d?.hb;
            if (hb == null) return null;
            const top = surfY(hb);
            return (
              <g key={r.m}>
                <rect x={x(r.m) + 1.5} y={top} width={Math.max(1, pxPerHour - 3)} height={surf.y + surf.h - top} rx={2} fill={r.s && !r.s.unsuitable ? scoreColor(r.s.score) : '#7dd3fc'} opacity={0.85} />
                {(r.m / 60) % every === 0 && (
                  <text x={x(r.m) + pxPerHour / 2} y={top - 3} textAnchor="middle" className="tl-val">
                    {fmtH(hb)}
                  </text>
                )}
              </g>
            );
          })}
          {(() => {
            const pts = hours.filter((r) => (r.h.swellH ?? r.h.waveH) != null).map((r) => `${(x(r.m) + pxPerHour / 2).toFixed(1)},${surfY((r.h.swellH ?? r.h.waveH)!).toFixed(1)}`);
            return pts.length > 1 ? <polyline points={pts.join(' ')} className="swell-line" /> : null;
          })()}

          {/* swell period & direction */}
          {label(swell, 'Swell', 'period/dir')}
          {hours.map((r) =>
            (r.m / 60) % every === 0 && r.d?.tDom != null ? (
              <g key={r.m} transform={`translate(${x(r.m) + pxPerHour / 2},${swell.y + 12})`}>
                {r.d.dirDom != null && <path d="M0 -7 L4 3 L0 1 L-4 3 Z" transform={`translate(-9,0) rotate(${r.d.dirDom + 180})`} fill="#0b6e99" />}
                <text x={3} y={4} textAnchor="middle" className="tl-val">
                  {Math.round(r.d.tDom)}s
                </text>
              </g>
            ) : null,
          )}

          {/* wind */}
          {label(wind, 'Wind', p.windUnit === 'kn' ? 'kn' : 'km/h')}
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

          {/* session overlay */}
          {sess && (
            <g pointerEvents="none">
              <rect x={x(sess.startMin)} y={0} width={Math.max(2, x(sess.endMin) - x(sess.startMin))} height={(curvesRow ? curvesRow.y + curvesRow.h : condBottom)} className="session" />
              {interactive && (
                <>
                  <rect x={x(sess.startMin) - 4} y={surf.y + 30} width={8} height={44} rx={4} className="handle" />
                  <rect x={x(sess.endMin) - 4} y={surf.y + 30} width={8} height={44} rx={4} className="handle" />
                </>
              )}
              <text x={(x(sess.startMin) + x(sess.endMin)) / 2} y={surf.y + 12} textAnchor="middle" className="session-label">
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
            <text x={LABEL_W + plotW / 2} y={surf.y + surf.h / 2} textAnchor="middle" className="hint" pointerEvents="none">
              {plotW < 380 ? "Drag to mark your time in the water" : "Drag across the chart to mark when you were in the water"}
            </text>
          )}

          {/* zone lanes */}
          {showZones &&
            p.peaks!.map((pk, k) => {
              const r = lanes[k];
              const color = PEAK_COLORS[k % PEAK_COLORS.length];
              return (
                <g key={pk.id}>
                  <g
                    className="lane-label"
                    role="button"
                    tabIndex={0}
                    aria-label={`${pk.name}${pk.description ? ` – ${pk.description}` : ''}`}
                    onClick={() => setPeakTip((cur) => (cur === pk.id ? null : pk.id))}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setPeakTip((cur) => (cur === pk.id ? null : pk.id))}
                  >
                    <rect x={0} y={r.y} width={LABEL_W - 2} height={r.h} fill="transparent" />
                    <text x={LABEL_W - 8} y={r.y + 16} textAnchor="end" className="tl-label" fill={color}>
                      {pk.name.length > 10 ? pk.name.slice(0, 8) + '…' : pk.name}
                    </text>
                    <title>{pk.name}</title>
                  </g>
                  <rect x={LABEL_W} y={r.y} width={plotW} height={r.h} rx={4} className="lane" />
                  {zoneRuns(pk.id).map(([a, b]) => (
                    <rect key={a} x={x(a)} y={r.y + 2} width={x(b) - x(a)} height={r.h - 4} rx={3} fill={color} opacity={0.85} />
                  ))}
                  {p.onZonesChange && (
                    <rect
                      x={LABEL_W}
                      y={r.y}
                      width={plotW}
                      height={r.h}
                      fill="transparent"
                      style={{ cursor: sess ? 'crosshair' : 'not-allowed', touchAction: 'pan-y' }}
                      onPointerDown={onLaneDown(pk.id)}
                      onPointerMove={onLaneMove}
                    />
                  )}
                </g>
              );
            })}

          {/* curves */}
          {curvesRow && (
            <g>
              <rect x={LABEL_W} y={curvesRow.y} width={plotW} height={curvesRow.h} rx={6} className="curve-bg" />
              {[1, 5, 10].map((v) => (
                <g key={v}>
                  <line x1={LABEL_W} x2={LABEL_W + plotW} y1={curveY(v)} y2={curveY(v)} className="grid" />
                  <text x={LABEL_W - 8} y={curveY(v) + 4} textAnchor="end" className="tl-sub">
                    {v}
                  </text>
                </g>
              ))}
              <text x={LABEL_W - 8} y={curvesRow.y + curvesRow.h / 2 - 10} textAnchor="end" className="tl-label">
                Feeling
              </text>
              {p.categories!.map((c) =>
                c.id === p.activeCategory
                  ? null
                  : curvePaths(c.id).map((pts, i) => <polyline key={c.id + i} points={pts} fill="none" stroke={c.color} strokeWidth={1.6} opacity={0.45} strokeLinejoin="round" />),
              )}
              {p.activeCategory &&
                curvePaths(p.activeCategory).map((pts, i) => (
                  <polyline key={'a' + i} points={pts} fill="none" stroke={p.categories!.find((c) => c.id === p.activeCategory)?.color ?? '#0ea5e9'} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
                ))}
              {sess && p.onCurvesChange && (p.curves?.[p.activeCategory ?? ''] ?? []).every((v) => v == null) && (
                <text x={(x(sess.startMin) + x(sess.endMin)) / 2} y={curvesRow.y + curvesRow.h / 2} textAnchor="middle" className="hint" pointerEvents="none">
                  Draw here
                </text>
              )}
              {!sess && p.onCurvesChange && (
                <text x={LABEL_W + plotW / 2} y={curvesRow.y + curvesRow.h / 2} textAnchor="middle" className="hint" pointerEvents="none">
                  Mark your session above first
                </text>
              )}
              {p.onCurvesChange && (
                <rect
                  x={LABEL_W}
                  y={curvesRow.y}
                  width={plotW}
                  height={curvesRow.h}
                  fill="transparent"
                  style={{ cursor: sess ? 'crosshair' : 'not-allowed', touchAction: 'none' }}
                  onPointerDown={onCurveDown}
                  onPointerMove={onCurveMove}
                />
              )}
            </g>
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
