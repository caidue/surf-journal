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
import { isOutside, periodTone, ratingFill, ratingText, SwellArrows, swellsOf, swellTooltip, SwellWaves, WaveStackSvg, type RankedSwell } from './surfGlyphs';

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
 * Hourly forecast table (surf-forecast style). Rating = your predicted fun with your skill profile
 * (or a typical surfer of the Rate-for level); how good the waves are for anyone is in its tooltip. Surf = one face height per hour at the spot
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
  focusMin,
  forLevel,
}: {
  spot: Spot;
  rec: SpotRec;
  series: ConditionsSeries;
  date: string;
  isToday: boolean;
  settings: Settings;
  tides: TideExtreme[];
  gridMates: string[];
  /** A chosen time (minutes after midnight): open with it and the next hours in view. */
  focusMin?: number;
  /** Rating for another level ("Rate for" on Explore): the For you row is named after it. */
  forLevel?: string;
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

  // Start the table at the chosen time, else the current hour (today) or the best window, so the
  // useful part is in view. A chosen time keeps one hour before it in view when there's room for it
  // and the next two or three hours.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const focusH = focusMin != null ? Math.floor(focusMin / 60) : null;
    const target = focusH ?? nowH ?? (win ? Math.floor(win[0] / 60) : null);
    if (target == null) return;
    const fits = Math.floor((el.clientWidth - 84) / COL_W);
    const before = focusH != null && fits < 4 ? 0 : 1;
    el.scrollLeft = Math.max(0, (target - h0 - before) * COL_W);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, spot.id, focusMin]);

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

  /**
   * One swell cell (shared pieces in surfGlyphs.tsx): the height and the swells' arrows; the main
   * Swell row (`main`) also draws their small waves and leaves the period to the Period row; the
   * unfolded per-train rows show the period. Greyed out when the swell barely reaches the spot.
   */
  const trainCell = (swells: RankedSwell[], key: string, extraClass = '', main = false) => {
    const first = swells[0];
    if (!first) return <td key={key} className={`fc-swell empty${extraClass}`} />;
    const t = first.t;
    const line = (x: TrainInfo) => `${fmtDir(x.dir)} · ${hgt(x.h)} ${ft ? 'ft' : 'm'} @ ${Math.round(x.t)} s peak · ${Math.round(x.kj)} kJ`;
    const w = COL_W - 4;
    return (
      <td key={key} className={`fc-swell${isOutside(spot, t.dir) ? ' blocked' : ''}${extraClass}`} title={swellTooltip(swells, spot, line)}>
        <div>{hgt(t.h)}</div>
        {!main && <div className="muted">{Math.round(t.t)}s</div>}
        <svg className="fc-swell-svg" width={w} height={main ? 48 : 16}>
          <SwellArrows swells={swells} spot={spot} cx={w / 2} cy={8} />
          {main && <SwellWaves swells={swells} spot={spot} cx={w / 2} base={47} w={30} maxPx={28} />}
        </svg>
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
                  </td>
                );
              })}
            </tr>
            <tr>
              {/* One rating row: predicted fun for you, or for the level chosen under Rate for. How
                  good the waves are for anyone (and what the wind costs) is in each cell's tooltip. */}
              <th
                scope="row"
                title={
                  forLevel
                    ? `Predicted fun for a typical ${forLevel} surfer (0–10), from the spot's conditions; your sessions are left out`
                    : 'Predicted fun for you (0–10), from the spot\'s conditions, your surfing profile and your past sessions here'
                }
              >
                Rating
                <small>for {forLevel ? forLevel.toLowerCase() : 'me'}</small>
              </th>
              {cols.map((c) => {
                const bad = c.suit.status === 'unsuitable';
                const why = reasonsText(c.suit);
                const q = c.quality.q;
                const pot = c.quality.potential;
                const spotWord = `Waves ${scoreLabel(q).toLowerCase()} (${q.toFixed(1)}/10${pot - q > 0.3 ? `, ${pot.toFixed(1)} without the wind` : ''})`;
                // "Not for you" stays certain at any tide; only an otherwise possible hour turns into "?".
                if (c.sure.withheld && !bad)
                  return (
                    <td key={c.time} className={`fc-rating${night(c)}`}>
                      <span className="fc-score withheld" title={c.sure.withheld}>
                        ?
                      </span>
                    </td>
                  );
                return (
                  <td key={c.time} className={`fc-rating${night(c)}`}>
                    <span
                      className={`fc-score s-${c.suit.status}`}
                      style={{ background: ratingFill(c.score, bad), color: bad ? '#64748b' : '#fff' }}
                      title={`${forLevel ? SUIT_LABEL[c.suit.status].replace(/for you$/, `for ${forLevel}`) : SUIT_LABEL[c.suit.status]}${c.peak ? ` · best peak: ${c.peak.name}` : ''}${why ? ` – ${why}` : ''} · ${spotWord}`}
                    >
                      {ratingText(c.score, bad)}
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
                    {/* The height as stacked Japanese-style waves (full at 3 m). */}
                    {hb != null && <WaveStackSvg className="fc-stack" h={hb} w={34} max={40} />}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row">
                <button className="fc-toggle" onClick={() => setOpen(!open)} aria-expanded={open} title={open ? 'Hide the swell trains' : 'Show every swell train'}>
                  {open ? '▾' : '▸'} Swell
                </button>
                <small>{ft ? 'ft' : 'm'} · direction</small>
              </th>
              {/* All swells' arrows side by side and their waves, folded or unfolded. */}
              {cols.map((c, i) => trainCell(swellsOf(raw[i]), c.time, night(c), true))}
            </tr>
            {open && (
              <>
                {Array.from({ length: nSwell }, (_, k) => (
                  <tr key={`sw${k}`} className="fc-train">
                    <th scope="row">
                      Swell {k + 1}
                      <small>{k === 0 ? 'strongest' : 'by energy'}</small>
                    </th>
                    {cols.map((c, i) => trainCell(trains[i].swell[k] ? [{ t: trains[i].swell[k], rank: k }] : [], c.time, night(c)))}
                  </tr>
                ))}
                {anyWind && (
                  <tr className="fc-train">
                    <th scope="row">
                      Wind sea
                      <small>local chop</small>
                    </th>
                    {cols.map((c, i) => trainCell(trains[i].wind ? [{ t: trains[i].wind!, rank: null }] : [], c.time, night(c)))}
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
            {/* Under the whole swell block (also below the unfolded Swell 1–3 rows). */}
            <tr>
              <th scope="row" title="Peak period of the main swell: the time between two waves. Longer = more power and longer rides (under 8 s weak, 10 s+ good, 13 s+ powerful).">
                Period
                <small>s · peak</small>
              </th>
              {cols.map((c, i) => {
                const t = trains[i].swell[0] ?? trains[i].wind;
                return (
                  <td key={c.time} className={`fc-period${night(c)}${t ? ` ${periodTone(t.t)}` : ''}`} title={t ? `${Math.round(t.t)} s peak period${t.kind === 'wind' ? ' (wind sea)' : ''}` : undefined}>
                    {t ? Math.round(t.t) : '–'}
                  </td>
                );
              })}
            </tr>
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
        <span>{forLevel ? `Rating = predicted fun for a typical ${forLevel} surfer (your sessions left out)` : `Rating = predicted fun for you, from your surfing profile${rec.best && rec.best.pred.sumW > 0.05 ? ' and your sessions here' : ''}`}; hover a score for how good the waves are for anyone (Poor … Epic) and what the wind costs</span>
        <span>Wave = estimated face height at the spot (the middle of a ±20 % range; hover for the range and body words); Swell = strongest train offshore (height and direction) · Period = its peak period, as surf sites show it (bold from 12 s, grey under 8 s); a small wave per swell, as tall as its height; blue = the swell comes from a good direction for this spot, red (and the wave facing left, as on surf-forecast) = a poor direction, less than half of it gets in; the 1st, 2nd and 3rd swell by energy go from dark to light, and the main one has the larger arrow and the front wave{estimated ? ' · some periods estimated from mean periods' : ''}</span>
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
