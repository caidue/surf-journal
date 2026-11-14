import { useEffect, useRef, useState } from 'react';
import type { ConditionsSeries, HourConditions, Settings, Spot } from '../types';
import { exposure, totalEnergyKJ, trainsByEnergy, windKind, WIND_LABEL, type TideExtreme, type TrainInfo } from '../lib/conditions';
import { daylight, type SpotRec } from '../lib/recommend';
import { reasonsText, scoreColor, scoreLabel, SUIT_LABEL } from '../lib/rating';
import { bodyRange } from '../lib/skill';
import { fmtMin, isoToMin, nowMinutesAt } from '../lib/time';
import { energyColors, fmtDir, fmtEnergy, fmtSurfRange, WIND_UNIT_LABEL, windIn } from '../lib/format';
import { WIND_MODEL_LABEL } from '../lib/openMeteo';
import { WIND_BG } from './Timeline';

/** Mark the wind when the models' directions differ by this much (deg). */
const WIND_SPREAD_WARN = 45;
/** Show the gusts in the table only when they are this much stronger than the average wind (km/h). */
const GUST_SHOW_KMH = 15;
import { DirArrow } from './ui';

const COL_W = 50;
const OPEN_KEY = 'surf-journal.trainsOpen';

function energyStyle(kj: number | null): React.CSSProperties {
  const c = energyColors(kj);
  return c ? { background: c.bg, color: c.fg } : {};
}

/** Swells by energy (1st, 2nd, 3rd) and the wind sea, for the expanded train rows. */
function slots(h: HourConditions): { swell: TrainInfo[]; wind: TrainInfo | null } {
  const all = trainsByEnergy(h);
  return { swell: all.filter((t) => t.kind === 'swell'), wind: all.find((t) => t.kind === 'wind') ?? null };
}

/**
 * Hourly forecast table (surf-forecast style). Spot rating = how good the waves are (word ladder),
 * For you = your predicted fun with your skill profile. Surf = one face height per hour at the spot
 * (the middle of the ±20 % estimate, like surf-forecast's single number; hover for the range and body
 * words). Swell = the most energetic train (peak period), expandable into every train;
 * trains outside the spot's swell window are greyed out. Energy = the strongest train's kJ.
 */
export default function ForecastTable({
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
  tides: TideExtreme[];
  gridMates: string[];
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [open, setOpenState] = useState(() => {
    try {
      return localStorage.getItem(OPEN_KEY) === '1';
    } catch {
      return false;
    }
  });
  const setOpen = (v: boolean) => {
    setOpenState(v);
    try {
      localStorage.setItem(OPEN_KEY, v ? '1' : '0');
    } catch {
      /* per-viewer convenience only */
    }
  };
  const [rise, set] = daylight(series.days, date);
  // One hour before sunrise to sunset.
  const h0 = Math.max(0, Math.floor(rise / 60) - 1);
  const h1 = Math.min(23, Math.ceil(set / 60));
  // The legend is folded away by default (it takes a lot of room); a toggle under the table opens it.
  const [legendOpen, setLegendOpen] = useState(false);
  const cols = rec.hours.filter((r) => {
    const h = Math.floor((isoToMin(r.time) ?? 0) / 60);
    return h >= h0 && h <= h1;
  });
  // Re-render every minute so the "now" marker moves along.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isToday) return;
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, [isToday]);
  const nowMin = isToday ? nowMinutesAt(series.utcOffsetSeconds) : null;
  const nowH = nowMin == null ? null : Math.floor(nowMin / 60);
  const win = rec.bestWindow;

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

  // The current time as a marker at the top of the table (and a faint line down), to the minute.
  const firstH = Math.floor((isoToMin(cols[0].time) ?? 0) / 60);
  const nowOff = nowMin == null ? null : (nowMin / 60 - firstH) * COL_W;
  const nowX = nowOff != null && nowOff >= 0 && nowOff <= cols.length * COL_W ? 84 + nowOff : null;

  const raw = cols.map((r) => series.hours[r.idx]);
  const trains = raw.map(slots);
  const nSwell = Math.min(3, Math.max(0, ...trains.map((t) => t.swell.length)));
  const anyWind = trains.some((t) => t.wind);
  const W = cols.length * COL_W;
  const ft = settings.heightUnit === 'ft';
  const hgt = (m: number) => (ft ? `${Math.round(m * 3.281)}` : m.toFixed(1));
  const estimated = raw.some((h) => h.tpEstimated);

  // Tide curve across the columns (each column centre = that full hour).
  const lv = raw.map((h) => h.seaLevel);
  const vals = lv.filter((v): v is number => v != null);
  const ext = tides.filter((t) => t.min / 60 >= h0 - 0.5 && t.min / 60 <= h1 + 0.5);
  // Each value sits in the middle of its hour column; the curve is extended to both edges of the
  // table with the level half an hour before the first and after the last hour (neighbouring hours).
  const edge = (inside: number | null, outside: number | null | undefined) => (inside == null ? null : outside == null ? inside : (inside + outside) / 2);
  const leftLv = edge(lv[0], series.hours[cols[0].idx - 1]?.seaLevel);
  const rightLv = edge(lv[lv.length - 1], series.hours[cols[cols.length - 1].idx + 1]?.seaLevel);
  const all = [...vals, ...ext.map((t) => t.level), ...[leftLv, rightLv].filter((v): v is number => v != null)];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const TH = 64;
  const ty = (v: number) => 18 + (1 - (v - lo) / Math.max(0.1, hi - lo)) * (TH - 36);
  const tx = (hours: number) => (hours - h0) * COL_W + COL_W / 2;
  const inner = cols.map((c, i) => (lv[i] == null ? null : ([tx(Math.floor((isoToMin(c.time) ?? 0) / 60)), ty(lv[i]!)] as const))).filter(Boolean) as (readonly [number, number])[];
  const pts = inner.length
    ? ([...(leftLv != null ? [[0, ty(leftLv)] as const] : []), ...inner, ...(rightLv != null ? [[W, ty(rightLv)] as const] : [])] as (readonly [number, number])[])
    : inner;
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = pts.length ? `${line} L${pts[pts.length - 1][0]},${TH} L${pts[0][0]},${TH} Z` : '';

  const night = (c: (typeof cols)[number]) => (c.daylight ? '' : ' night');

  /** One train cell: height, peak period, arrow; greyed out when the spot's swell window blocks it. */
  const trainCell = (t: TrainInfo | null | undefined, key: string, extraClass = '') => {
    if (!t) return <td key={key} className={`fc-swell empty${extraClass}`} />;
    const blocked = exposure(spot, t.dir) === 0;
    return (
      <td
        key={key}
        className={`fc-swell${blocked ? ' blocked' : ''}${extraClass}`}
        title={`${fmtDir(t.dir)} · ${hgt(t.h)} ${ft ? 'ft' : 'm'} @ ${Math.round(t.t)} s peak · ${Math.round(t.kj)} kJ${blocked ? ' · outside this spot’s swell window' : ''}`}
      >
        <div>{hgt(t.h)}</div>
        <div className="muted">{Math.round(t.t)}s</div>
        <DirArrow from={t.dir} size={13} />
      </td>
    );
  };

  return (
    <div className="fc-wrap">
      <div className="fc-scroll" ref={scroller}>
        {nowX != null && <div className="fc-now" style={{ left: nowX }} title={`Now, ${fmtMin(nowMin!)}`} aria-label={`Now, ${fmtMin(nowMin!)}`} />}
        <table className="fc" style={{ width: 84 + W }}>
          <tbody>
            <tr className="fc-time">
              <th scope="row">Time</th>
              {cols.map((c) => {
                const m = isoToMin(c.time) ?? 0;
                const h = Math.floor(m / 60);
                return (
                  <td key={c.time} className={`${c.daylight ? '' : 'night'}${h === nowH ? ' now' : ''}`}>
                    {String(h).padStart(2, '0')}
                    {h === nowH && <span className="now-tag">now</span>}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" title="How good the waves are at this spot, whoever you are (0–10): size, period, wind and tide. Hover a score to see what the wind costs.">
                Spot
                <small>rating</small>
              </th>
              {cols.map((c) => {
                const q = c.quality.q;
                const pot = c.quality.potential;
                if (c.sure.withheld)
                  return (
                    <td key={c.time} className={`fc-rating${night(c)}`} title={c.sure.withheld}>
                      <span className="fc-score withheld">?</span>
                    </td>
                  );
                return (
                  <td key={c.time} className={`fc-rating${night(c)}`} title={`${scoreLabel(q)} · ${q.toFixed(1)}/10${pot - q > 0.3 ? ` · ${pot.toFixed(1)} without the wind` : ''}`}>
                    {/* The same score pill as the For you row. */}
                    <span className="fc-score" style={{ background: scoreColor(q), color: '#fff' }}>
                      {q.toFixed(q >= 9.95 ? 0 : 1)}
                    </span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" title="Predicted fun for you (0–10), from the spot rating, your surfing profile and your past sessions here">
                For you
              </th>
              {cols.map((c) => {
                const bad = c.suit.status === 'unsuitable';
                const why = reasonsText(c.suit);
                // "Not for you" stays certain at any tide; only an otherwise possible hour turns into "?".
                if (c.sure.withheld && !bad)
                  return (
                    <td key={c.time} className={night(c).trim()}>
                      <span className="fc-score withheld" title={c.sure.withheld}>
                        ?
                      </span>
                    </td>
                  );
                return (
                  <td key={c.time} className={night(c).trim()}>
                    <span
                      className={`fc-score s-${c.suit.status}`}
                      style={{ background: bad ? '#e2e8f0' : scoreColor(c.score), color: bad ? '#64748b' : '#fff' }}
                      title={`${SUIT_LABEL[c.suit.status]}${c.peak ? ` · best peak: ${c.peak.name}` : ''}${why ? ` – ${why}` : ''}`}
                    >
                      {bad ? '✕' : c.score.toFixed(c.score >= 9.95 ? 0 : 1)}
                    </span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" title="Estimated wave height at the spot: the face of the waves, from trough to crest">
                Wave
                <small>{ft ? 'ft' : 'm'}</small>
              </th>
              {cols.map((c) => {
                const hb = c.derived.hb;
                const val = hb == null ? '–' : ft ? String(Math.round(hb * 3.281)) : hb.toFixed(1);
                return (
                  <td key={c.time} className={`fc-surf${night(c)}`} title={hb == null ? undefined : `${fmtSurfRange(hb, settings.heightUnit)} · ${bodyRange(hb * 0.8, hb * 1.2)}`}>
                    <span className="fc-val">{val}</span>
                    {hb != null && <WaveFigure h={hb} />}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row">
                <button className="fc-toggle" onClick={() => setOpen(!open)} aria-expanded={open} title={open ? 'Hide the swell trains' : 'Show every swell train'}>
                  {open ? '▾' : '▸'} Swell
                </button>
                <small>{ft ? 'ft' : 'm'} · s peak</small>
              </th>
              {cols.map((c, i) => trainCell(trains[i].swell[0] ?? trains[i].wind, c.time, night(c)))}
            </tr>
            {open && (
              <>
                {Array.from({ length: nSwell }, (_, k) => (
                  <tr key={`sw${k}`} className="fc-train">
                    <th scope="row">
                      Swell {k + 1}
                      <small>{k === 0 ? 'strongest' : 'by energy'}</small>
                    </th>
                    {cols.map((c, i) => trainCell(trains[i].swell[k], c.time, night(c)))}
                  </tr>
                ))}
                {anyWind && (
                  <tr className="fc-train">
                    <th scope="row">
                      Wind sea
                      <small>local chop</small>
                    </th>
                    {cols.map((c, i) => trainCell(trains[i].wind, c.time, night(c)))}
                  </tr>
                )}
                <tr className="fc-train">
                  <th scope="row" title="All trains together: significant wave height (Météo-France MFWAM) and peak period">
                    Total sea
                    <small>Hs · Tp</small>
                  </th>
                  {cols.map((c, i) => {
                    const h = raw[i];
                    return (
                      <td key={c.time} className={`fc-swell${night(c)}`} title={h.waveTe != null ? `Energy period Tm-1,0 ${h.waveTe.toFixed(1)} s` : undefined}>
                        <div>{h.waveH == null ? '–' : hgt(h.waveH)}</div>
                        <div className="muted">{h.waveTp == null ? '' : `${Math.round(h.waveTp)}s`}</div>
                        <DirArrow from={h.waveDir} size={13} />
                      </td>
                    );
                  })}
                </tr>
              </>
            )}
            <tr>
              <th
                scope="row"
                title="Wave energy of the strongest swell train in the Open-Meteo grid cell (kJ per metre of crest), as surf-forecast.com shows it. Roughly: ~100 kJ barely surfable, 200–1,000 increasingly punchy, 1,000–5,000+ heavy."
              >
                Energy
                <small>kJ</small>
              </th>
              {cols.map((c, i) => {
                const e = trains[i].swell[0]?.kj ?? trains[i].wind?.kj ?? null;
                const tot = totalEnergyKJ(raw[i]);
                return (
                  <td key={c.time} className={`fc-energy${night(c)}`} title={e == null ? undefined : `Strongest train ${Math.round(e)} kJ · all trains ${Math.round(tot ?? e)} kJ`}>
                    <span style={energyStyle(e)}>{fmtEnergy(e)}</span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row">
                Wind
                <small>{WIND_UNIT_LABEL[settings.windUnit]}</small>
              </th>
              {cols.map((c) => {
                const k = windKind(c.derived);
                const sp = c.derived.windSpeed;
                const g = c.derived.windGust;
                const h = series.hours[c.idx];
                const spread = h?.windSpread ?? 0;
                const unsure = spread >= WIND_SPREAD_WARN;
                const models = h?.windModels?.map((x) => `${WIND_MODEL_LABEL[x.model] ?? x.model} ${fmtDir(x.dir)}, ${windIn(x.speed, settings.windUnit)} ${WIND_UNIT_LABEL[settings.windUnit]}`).join(' · ');
                return (
                  <td
                    key={c.time}
                    className={`fc-wind${night(c)}${unsure ? ' unsure' : ''}`}
                    style={{ background: k ? WIND_BG[k] : undefined }}
                    title={
                      k
                        ? `${sp == null ? '' : `${windIn(sp, settings.windUnit)} ${WIND_UNIT_LABEL[settings.windUnit]} on average`}${g != null ? `, gusts up to ${windIn(g, settings.windUnit)} ${WIND_UNIT_LABEL[settings.windUnit]}` : ''} · ${WIND_LABEL[k]}, from ${fmtDir(c.derived.windDir)}${models ? ` (mean of the models: ${models})` : ''}${unsure ? ` – the models disagree on the direction by up to ${spread}°` : ''}`
                        : undefined
                    }
                  >
                    {unsure && <span className="wind-unsure" aria-label="models disagree">?</span>}
                    <DirArrow from={c.derived.windDir} size={13} />
                    <div>{sp == null ? '–' : windIn(sp, settings.windUnit)}</div>
                    {/* Gusts only when they matter: at least 15 km/h above the average wind. */}
                    {g != null && sp != null && g - sp >= GUST_SHOW_KMH && <div className="fc-gust">{windIn(g, settings.windUnit)}</div>}
                  </td>
                );
              })}
            </tr>
            <tr className="fc-tide">
              <th scope="row">
                Tide
                <small>{vals.length ? `${lo >= 0 ? '+' : '−'}${Math.abs(lo).toFixed(1)}…${hi >= 0 ? '+' : '−'}${Math.abs(hi).toFixed(1)} m` : ''}</small>
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
      <button type="button" className={`fc-legend-toggle${legendOpen ? ' open' : ''}`} aria-expanded={legendOpen} onClick={() => setLegendOpen(!legendOpen)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
        Legend &amp; sources
      </button>
      {legendOpen && (
      <div className="fc-legend muted tiny">
        <span>Spot = how good the waves are (Poor, Poor–Fair, Fair, Fair–Good, Good, Epic above 9) · For you = predicted fun with your surfing profile{rec.best && rec.best.pred.sumW > 0.05 ? ' and your sessions here' : ''}</span>
        <span>Wave = estimated face height at the spot (the middle of a ±20 % range; hover for the range and body words); the wave figure grows with it, from light blue (small) to blue to green (2.6 m+) · Swell = strongest train offshore, peak period (as surf sites show it){estimated ? ' · some periods estimated from mean periods' : ''}</span>
        <span>Energy = strongest train, kJ per metre of crest; hover for the total</span>
        <span>{gridMates.length ? `Same swell and energy (same wave-model cell) at ${gridMates.join(', ')}` : 'No other spot shares this wave-model cell'}</span>
        <span>Wind = average speed over the hour; strong gusts (bursts at least 15 km/h above it) in grey below, all gusts on hover; over the sea, mean of four models (ECMWF, ICON, ARPEGE, GFS), hover for each · ? = the models disagree on the direction</span>
        <span>
          Wind colour:{' '}
          {(['glassy', 'offshore', 'cross-off', 'cross', 'cross-on', 'onshore'] as const).map((k) => (
            <span key={k} className="legend-swatch" style={{ background: WIND_BG[k] }}>
              {WIND_LABEL[k]}
            </span>
          ))}
        </span>
        <span>Data: {series.source}. Weather and marine data by Open-Meteo.com (CC BY 4.0).</span>
      </div>
      )}
    </div>
  );
}

/** Colour of a surf height: light blue (small) → sky blue → blue → green (2.6 m and up). */
const WAVE_STOPS: [number, [number, number, number]][] = [
  [0, [186, 230, 253]],
  [1.0, [56, 189, 248]],
  [1.8, [37, 99, 235]],
  [2.6, [22, 163, 74]],
];
export function waveColor(h: number): string {
  const x = Math.max(0, h);
  for (let i = 1; i < WAVE_STOPS.length; i++) {
    const [h1, c1] = WAVE_STOPS[i];
    if (x <= h1) {
      const [h0, c0] = WAVE_STOPS[i - 1];
      const t = (x - h0) / (h1 - h0);
      return `rgb(${c0.map((v, k) => Math.round(v + (c1[k] - v) * t)).join(',')})`;
    }
  }
  return `rgb(${WAVE_STOPS[WAVE_STOPS.length - 1][1].join(',')})`;
}

/** A small breaking wave, as tall as the surf (full height at 3 m), coloured by size. */
function WaveFigure({ h }: { h: number }) {
  const px = Math.max(6, Math.min(1, h / 3) * 40);
  // A slim back rising to a pointed peak, a small lip, then the face down to the right.
  return (
    <svg className="fc-wave" width={34} height={px} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <path d="M0 100 C22 94 38 58 58 26 C66 12 74 4 84 2 L91 11 C85 11 81 15 79 22 C83 50 92 80 100 100 Z" fill={waveColor(h)} />
    </svg>
  );
}

