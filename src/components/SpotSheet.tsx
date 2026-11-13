import { useEffect, useMemo, useRef } from 'react';
import type { ConditionsSeries, Settings, Spot } from '../types';
import { tideExtremes, waveEnergyKJ, windKind, WIND_LABEL } from '../lib/conditions';
import { confidence, daylight, explain, type SpotRec } from '../lib/recommend';
import { scoreColor } from '../lib/rating';
import { compass } from '../lib/geo';
import { fmtDate, fmtMin, isoToMin, nowMinutesAt } from '../lib/time';
import { fmtSurfRange, fmtWind } from '../lib/format';
import { gridOf } from '../lib/openMeteo';
import { WIND_BG } from './Timeline';
import { DirArrow, ScoreBadge, Segmented, SuitBadge } from './ui';
import SpotGuide from './SpotGuide';

const COL_W = 46;

/** Blue ramp for wave energy (kJ per metre of crest). */
function energyStyle(kj: number | null): React.CSSProperties {
  if (kj == null) return {};
  const steps: [number, string, string][] = [
    [100, '#f1f5f9', '#475569'],
    [250, '#e0f2fe', '#0c4a6e'],
    [500, '#bae6fd', '#0c4a6e'],
    [1000, '#7dd3fc', '#0c4a6e'],
    [2000, '#38bdf8', '#082f49'],
    [3500, '#0284c7', '#fff'],
    [Infinity, '#075985', '#fff'],
  ];
  const [, bg, fg] = steps.find(([max]) => kj < max)!;
  return { background: bg, color: fg };
}

interface Props {
  spot: Spot;
  rec: SpotRec | undefined;
  series: ConditionsSeries | undefined;
  date: string;
  today: string;
  dayOptions: { id: string; label: string }[];
  dayOffset: number;
  onDay: (offset: number) => void;
  settings: Settings;
  loading: boolean;
  /** Other spots whose forecast comes from the same Open-Meteo grid cell. */
  gridMates: string[];
  onClose: () => void;
  go: (path: string) => void;
}

/** Spot details + hourly forecast, opened from the map. Bottom sheet on phones, dialog on wider screens. */
export default function SpotSheet({ spot, rec, series, date, today, dayOptions, dayOffset, onDay, settings, loading, gridMates, onClose, go }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // keep the page behind from scrolling
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  const best = rec?.best ?? null;
  const tides = useMemo(() => (series ? tideExtremes(series.hours, date) : []), [series, date]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <header className="sheet-head">
          <div>
            <h2 id="sheet-title">{spot.name}</h2>
            <div className="muted small">
              {spot.region} · {spot.breakType}
              {spot.bottom !== spot.breakType ? ` · ${spot.bottom} bottom` : ''} · level: {spot.level}
            </div>
          </div>
          <div className="row gap">
            {best && <ScoreBadge score={best.score} size="lg" title="Best predicted score for you this day" />}
            <button ref={closeRef} className="sheet-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </header>

        <div className="sheet-body">
          {spot.description && <p className="sheet-desc">{spot.description}</p>}

          <div className="sheet-day">
            <Segmented options={dayOptions} value={String(dayOffset)} onChange={(v) => onDay(Number(v))} />
          </div>

          {best && (
            <div className="sheet-best">
              <div className="row gap wrap">
                <SuitBadge status={best.suit.status} />
                {rec?.bestWindow && best.score > 0.5 && (
                  <strong>
                    Best {fmtMin(rec.bestWindow[0])}–{fmtMin(rec.bestWindow[1])}
                  </strong>
                )}
                <span className="small">
                  {fmtSurfRange(best.derived.hb, settings.heightUnit)} · {WIND_LABEL[windKind(best.derived) ?? 'glassy']} {fmtWind(best.derived.windSpeed, settings.windUnit)}
                </span>
                <span className="muted small">confidence: {confidence(best.pred)}</span>
              </div>
              <ul className="explain">
                {explain(best, (s) => fmtDate(s.date)).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          )}

          {tides.length > 0 && (
            <div className="tide-line">
              <span className="muted small">Tide</span>
              {tides.map((t) => (
                <span key={t.min} className={`tide-chip ${t.type}`}>
                  {t.type === 'high' ? '▲ High' : '▼ Low'} {fmtMin(t.min)} <span className="muted">{t.level >= 0 ? '+' : '−'}{Math.abs(t.level).toFixed(1)} m</span>
                </span>
              ))}
            </div>
          )}

          {rec && series ? (
            <ForecastTable spot={spot} rec={rec} series={series} date={date} isToday={date === today} settings={settings} tides={tides} gridMates={gridMates} />
          ) : (
            <p className="muted">{loading ? 'Loading forecast…' : 'No forecast available for this spot.'}</p>
          )}

          <h4 className="sheet-sub">About the spot</h4>
          <dl className="facts">
            <dt>Faces</dt>
            <dd>
              {compass(spot.facing)} · offshore wind from {compass(spot.facing + 180)}
            </dd>
            <dt>Best swell</dt>
            <dd>
              {compass(spot.idealSwellDir)} (±{spot.swellWindow}°), {spot.minSize}–{spot.maxSize} m breaking
            </dd>
            <dt>Tide</dt>
            <dd>{spot.tide === 'all' ? 'all tides' : spot.tide}</dd>
          </dl>
          {spot.coordsApprox && <p className="muted tiny">Map position is approximate.</p>}
          <SpotGuide spot={spot} compact />

          <div className="sheet-actions">
            <button className="btn" onClick={() => go(`spot/${spot.id}`)}>
              Spot page &amp; your sessions
            </button>
            {date <= today && (
              <button className="btn primary" onClick={() => go(`log?spot=${spot.id}&date=${date}`)}>
                Log a session here
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ForecastTable({
  spot,
  rec,
  series,
  date,
  isToday,
  settings,
  tides,
  gridMates,
}: {
  spot: Spot;
  rec: SpotRec;
  series: ConditionsSeries;
  date: string;
  isToday: boolean;
  settings: Settings;
  tides: ReturnType<typeof tideExtremes>;
  gridMates: string[];
}) {
  const grid = gridOf(series);
  const scroller = useRef<HTMLDivElement>(null);
  const [rise, set] = daylight(series.days, date);
  const h0 = Math.max(0, Math.floor(rise / 60) - 1);
  const h1 = Math.min(23, Math.ceil(set / 60));
  const cols = rec.hours.filter((r) => {
    const h = Math.floor((isoToMin(r.time) ?? 0) / 60);
    return h >= h0 && h <= h1;
  });
  const nowH = isToday ? Math.floor(nowMinutesAt(series.utcOffsetSeconds) / 60) : null;
  const win = rec.bestWindow;
  // An hour column belongs to the best window if any part of that hour does (e.g. 07:00 for 07:17–09:00).
  const inWin = (m: number) => !!win && !!rec.best && rec.best.score > 0.5 && m + 60 > win[0] && m < win[1];

  // Start the table at the current hour (today) or the best window, so the useful part is in view.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const target = nowH ?? (win ? Math.floor(win[0] / 60) : null);
    if (target == null) return;
    el.scrollLeft = Math.max(0, (target - h0 - 1) * COL_W);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, spot.id]);

  if (!cols.length) return <p className="muted">No forecast hours for this day.</p>;

  const raw = cols.map((r) => series.hours[r.idx]);
  const W = cols.length * COL_W;

  // Tide curve across the columns (each column centre = that full hour).
  const lv = raw.map((h) => h.seaLevel);
  const vals = lv.filter((v): v is number => v != null);
  const ext = tides.filter((t) => t.min / 60 >= h0 - 0.5 && t.min / 60 <= h1 + 0.5);
  const all = [...vals, ...ext.map((t) => t.level)];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const TH = 64;
  const ty = (v: number) => 18 + (1 - (v - lo) / Math.max(0.1, hi - lo)) * (TH - 36);
  const tx = (hours: number) => (hours - h0) * COL_W + COL_W / 2;
  const pts = cols.map((c, i) => (lv[i] == null ? null : ([tx(Math.floor((isoToMin(c.time) ?? 0) / 60)), ty(lv[i]!)] as const))).filter(Boolean) as (readonly [number, number])[];
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = pts.length ? `${line} L${pts[pts.length - 1][0]},${TH} L${pts[0][0]},${TH} Z` : '';

  return (
    <div className="fc-wrap">
      <div className="fc-scroll" ref={scroller}>
        <table className="fc" style={{ width: 72 + W }}>
          <tbody>
            <tr className="fc-time">
              <th scope="row">Time</th>
              {cols.map((c) => {
                const m = isoToMin(c.time) ?? 0;
                const h = Math.floor(m / 60);
                return (
                  <td key={c.time} className={`${c.daylight ? '' : 'night'}${h === nowH ? ' now' : ''}${inWin(m) ? ' win' : ''}`}>
                    {String(h).padStart(2, '0')}
                    {h === nowH && <span className="now-tag">now</span>}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" title={`Predicted fun for a ${settings.level} surfer (0–10)`}>
                Rating
              </th>
              {cols.map((c) => {
                const bad = c.suit.status === 'unsuitable';
                return (
                  <td key={c.time} className={c.daylight ? '' : 'night'}>
                    <span className="fc-score" style={{ background: bad ? '#e2e8f0' : scoreColor(c.score), color: bad ? '#64748b' : '#fff' }} title={c.suit.reasons.join('; ') || undefined}>
                      {bad ? '✕' : c.score.toFixed(c.score >= 9.95 ? 0 : 1)}
                    </span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row">
                Surf
                <small>{settings.heightUnit === 'ft' ? 'ft, est.' : 'm, est.'}</small>
              </th>
              {cols.map((c) => {
                const hb = c.derived.hb;
                return (
                  <td key={c.time} className={`fc-surf${c.daylight ? '' : ' night'}`}>
                    <span className="fc-bar" style={{ height: `${Math.min(100, ((hb ?? 0) / 3) * 100)}%`, background: scoreColor(c.score) }} />
                    <span className="fc-val">{hb == null ? '–' : settings.heightUnit === 'ft' ? Math.round(hb * 3.281) : hb.toFixed(1)}</span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row">
                Swell
                <small>{settings.heightUnit === 'ft' ? 'ft' : 'm'} · s</small>
              </th>
              {cols.map((c, i) => {
                const h = raw[i];
                const sh = h.swellH ?? h.waveH;
                const sp = h.swellPer ?? h.wavePer;
                const sd = h.swellDir ?? h.waveDir;
                return (
                  <td key={c.time} className={`fc-swell${c.daylight ? '' : ' night'}`} title={sd != null ? `from ${compass(sd)} (${Math.round(sd)}°)` : undefined}>
                    <div>{sh == null ? '–' : settings.heightUnit === 'ft' ? Math.round(sh * 3.281) : sh.toFixed(1)}</div>
                    <div className="muted">{sp == null ? '' : `${Math.round(sp)}s`}</div>
                    <DirArrow from={sd} size={13} />
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" title="Wave energy of the Open-Meteo grid cell (kJ per metre of wave crest), the same for every spot in that cell. Long-period swell packs much more punch than the same height of wind sea.">
                Energy
                <small>kJ</small>
              </th>
              {cols.map((c, i) => {
                const e = waveEnergyKJ(raw[i]);
                return (
                  <td key={c.time} className={`fc-energy${c.daylight ? '' : ' night'}`}>
                    <span style={energyStyle(e)}>{e == null ? '–' : e >= 1000 ? `${(e / 1000).toFixed(1)}k` : Math.round(e)}</span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row">
                Wind
                <small>{settings.windUnit === 'kn' ? 'kn' : 'km/h'}</small>
              </th>
              {cols.map((c) => {
                const k = windKind(c.derived);
                const sp = c.derived.windSpeed;
                const g = c.derived.windGust;
                const conv = (v: number) => Math.round(settings.windUnit === 'kn' ? v / 1.852 : v);
                return (
                  <td
                    key={c.time}
                    className={`fc-wind${c.daylight ? '' : ' night'}`}
                    style={{ background: k ? WIND_BG[k] : undefined }}
                    title={k ? `${WIND_LABEL[k]}, from ${compass(c.derived.windDir)}` : undefined}
                  >
                    <DirArrow from={c.derived.windDir} size={13} />
                    <div>{sp == null ? '–' : conv(sp)}</div>
                    {g != null && <div className="muted">{conv(g)}</div>}
                  </td>
                );
              })}
            </tr>
            <tr className="fc-tide">
              <th scope="row">
                Tide
                <small>
                  {vals.length ? `${lo >= 0 ? '+' : '−'}${Math.abs(lo).toFixed(1)}…${hi >= 0 ? '+' : '−'}${Math.abs(hi).toFixed(1)} m` : ''}
                </small>
              </th>
              <td colSpan={cols.length}>
                {pts.length > 1 ? (
                  <svg width={W} height={TH} aria-label="Tide curve">
                    <path d={area} className="fc-tide-area" />
                    <path d={line} className="fc-tide-line" />
                    {ext.map((t) => {
                      const x = tx(t.min / 60);
                      const y = ty(t.level);
                      const label = `${t.type === 'high' ? 'H' : 'L'} ${fmtMin(t.min)}`;
                      return (
                        <g key={t.min}>
                          <circle cx={x} cy={y} r={3.5} className={`fc-tide-dot ${t.type}`} />
                          <text x={Math.max(22, Math.min(W - 22, x))} y={t.type === 'high' ? y - 7 : y + 15} textAnchor="middle" className="fc-tide-text">
                            {label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  <span className="muted small">no tide data</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="fc-legend muted tiny">
        <span>
          Rating = predicted fun for {/^[aeiou]/.test(settings.level) ? 'an' : 'a'} {settings.level} surfer{rec.best && rec.best.pred.sumW > 0.05 ? ', from the spot guide and your sessions' : ' from the spot guide'}
        </span>
        <span>Surf = estimated breaking height at the spot · Swell and Energy = Open-Meteo grid cell offshore</span>
        {grid && (
          <span>
            Grid cell {grid.lat.toFixed(2)}, {grid.lon.toFixed(2)}
            {gridMates.length ? ` · same energy at ${gridMates.join(', ')}` : ' · no other spot in this cell'}
          </span>
        )}
        <span>
          Wind colour:{' '}
          {(['glassy', 'offshore', 'cross-off', 'cross', 'cross-on', 'onshore'] as const).map((k) => (
            <span key={k} className="legend-swatch" style={{ background: WIND_BG[k] }}>
              {WIND_LABEL[k]}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
