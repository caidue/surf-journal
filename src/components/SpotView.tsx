import { useMemo, useState, type ReactNode } from 'react';
import type { Session, Settings, Spot } from '../types';
import { useConditions } from '../hooks';
import { tideExtremes, windKind, WIND_LABEL, type WindKind } from '../lib/conditions';
import { buildHistory, calibratedGain, confidence, explain, insights, matchSession, recommendSpotDay, sessionOverall } from '../lib/recommend';
import { addDays, fmtDate, fmtMin, isoToMin, nowMinutesAt, todayAt } from '../lib/time';
import { compass, haversineKm } from '../lib/geo';
import { similarityPct } from '../lib/similarity';
import { fmtSurfRange, fmtWind } from '../lib/format';
import { gridKey } from '../lib/openMeteo';
import ForecastTable from './ForecastTable';
import { Icon, type IconName } from './icons';
import MapView from './MapView';
import SpotGuide from './SpotGuide';
import { sessionSummary } from './Journal';
import { ConditionsStatus, Empty, ScoreBadge, Segmented, SuitBadge } from './ui';

export type SpotTab = 'forecast' | 'guide' | 'sessions' | 'info';
const TAB_KEY = 'surf-journal.spotTab';

function loadTab(): SpotTab {
  try {
    const t = localStorage.getItem(TAB_KEY);
    return t === 'guide' || t === 'sessions' || t === 'info' ? t : 'forecast';
  } catch {
    return 'forecast';
  }
}

interface Props {
  spot: Spot;
  spots: Spot[];
  sessions: Session[];
  settings: Settings;
  go: (path: string) => void;
  /** 'sheet' = popup over Explore, 'page' = its own page (#/spot/:id). Same content either way. */
  mode: 'sheet' | 'page';
  initialDay?: number;
  /** Extra buttons for the header (close / open as page). */
  headerActions?: ReactNode;
  titleId?: string;
}

/**
 * Everything about one spot, in tabs: Forecast (best time, tides, hourly table), Guide (peaks,
 * season, access, warnings, parking, photos), Your sessions (with how similar each was to the
 * chosen day, and what your ratings say) and Spot info (how it works, map, size factor).
 */
export default function SpotView({ spot, spots, sessions, settings, go, mode, initialDay = 0, headerActions, titleId }: Props) {
  const today = todayAt();
  const [dayOffset, setDayOffset] = useState(initialDay);
  const [tab, setTabState] = useState<SpotTab>(loadTab);
  const setTab = (t: SpotTab) => {
    setTabState(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {
      /* per-viewer convenience only */
    }
  };
  const date = addDays(today, dayOffset);

  // Load this spot together with its neighbours (mostly cached already), to find which spots share
  // its Open-Meteo grid cell.
  const nearby = useMemo(() => spots.filter((s) => s.id === spot.id || haversineKm(s.lat, s.lon, spot.lat, spot.lon) < 25), [spots, spot]);
  const { bySpot, loading, error, offline, savedAt, reload } = useConditions(nearby, today, addDays(today, 2));
  const series = bySpot.get(spot.id);
  const gridMates = useMemo(() => {
    const k = gridKey(series);
    return k ? nearby.filter((s) => s.id !== spot.id && gridKey(bySpot.get(s.id)) === k).map((s) => s.name) : [];
  }, [series, nearby, bySpot, spot.id]);

  const rec = useMemo(() => {
    if (!series) return null;
    const nowMin = dayOffset === 0 ? nowMinutesAt(series.utcOffsetSeconds) : null;
    return recommendSpotDay(spot, series.hours, series.days, sessions, settings, settings.level, date, today, nowMin);
  }, [series, spot, sessions, settings, date, today, dayOffset]);
  const tides = useMemo(() => (series ? tideExtremes(series.hours, date) : []), [series, date]);

  const mySessions = useMemo(() => sessions.filter((s) => s.spotId === spot.id), [sessions, spot.id]);
  const matched = useMemo(() => {
    if (!rec) return mySessions.map((s) => ({ s, pct: null as number | null, when: null as string | null }));
    const hist = buildHistory(spot, mySessions, settings, today, rec.gain);
    return hist
      .map((h) => {
        let best: { d: number; when: string } | null = null;
        for (const hr of rec.hours) {
          if (!hr.daylight) continue;
          const nb = matchSession(spot, hr.derived, h);
          if (nb && (!best || nb.d < best.d)) best = { d: nb.d, when: hr.time };
        }
        return { s: h.session, pct: best ? similarityPct(best.d) : null, when: best?.when ?? null };
      })
      .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  }, [rec, mySessions, spot, settings, today]);
  const ins = useMemo(() => insights(spot, sessions), [spot, sessions]);
  const calib = useMemo(() => calibratedGain(spot, sessions), [spot, sessions]);

  const dayOptions = [0, 1, 2].map((o) => ({ id: String(o), label: o === 0 ? 'Today' : o === 1 ? 'Tomorrow' : fmtDate(addDays(today, o), { weekday: 'long' }) }));
  const dayWord = dayOffset === 0 ? 'today' : dayOffset === 1 ? 'tomorrow' : 'that day';
  const best = rec?.best ?? null;
  const photoCount = spot.guide?.photos?.length ?? 0;

  const tabs: { id: SpotTab; label: string; icon: IconName }[] = [
    { id: 'forecast', label: 'Forecast', icon: 'forecast' },
    { id: 'guide', label: 'Guide', icon: 'guide' },
    { id: 'sessions', label: `Sessions${mySessions.length ? ` (${mySessions.length})` : ''}`, icon: 'sessions' },
    { id: 'info', label: 'Info', icon: 'info' },
  ];

  return (
    <div className={`spot-view ${mode}`}>
      <header className="sv-head">
        <div className="sv-title">
          {mode === 'page' && (
            <a className="small" href="#/explore">
              ← Explore
            </a>
          )}
          <h2 id={titleId}>{spot.name}</h2>
          <div className="muted small">
            {spot.region} · {spot.breakType} break{spot.bottom !== spot.breakType ? ` · ${spot.bottom} bottom` : ''} · level: {spot.level}
            {spot.peaks.length > 1 ? ` · ${spot.peaks.length} peaks` : ''}
          </div>
        </div>
        <div className="row gap">
          {best && <ScoreBadge score={best.score} size="lg" title={`Best predicted score for you ${dayWord}`} />}
          {headerActions}
        </div>
      </header>

      <div className="sv-scroll">
        {spot.description && <p className="sv-desc">{spot.description}</p>}
        <div className="row gap wrap sv-actions">
          <button className="btn primary small" onClick={() => go(`log?spot=${spot.id}${date <= today ? `&date=${date}` : ''}`)}>
            + Log a session here
          </button>
          <button className="btn small" onClick={() => go(`spot-edit/${spot.id}`)}>
            Edit spot
          </button>
        </div>

        <div className="sv-tabs" role="tablist" aria-label="Spot details">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={18} />
              <span>{t.label}</span>
              {t.id === 'guide' && photoCount > 0 && <span className="tab-dot" aria-hidden />}
            </button>
          ))}
        </div>

        <div className="sv-panel" role="tabpanel">
          {tab === 'forecast' && (
            <>
              <div className="sheet-day">
                <Segmented options={dayOptions} value={String(dayOffset)} onChange={(v) => setDayOffset(Number(v))} />
              </div>
              <ConditionsStatus error={error} offline={offline} savedAt={savedAt} onRetry={reload} />
              {rec?.dayOver && (
                <div className="alert soft">
                  No daylight left today.{' '}
                  <button className="link" onClick={() => setDayOffset(1)}>
                    Show tomorrow
                  </button>
                </div>
              )}
              {best && (
                <div className="sheet-best">
                  <div className="row gap wrap">
                    <SuitBadge status={best.suit.status} />
                    {rec?.bestWindow && best.score > 0.5 ? (
                      <strong>
                        Best {fmtMin(rec.bestWindow[0])}–{fmtMin(rec.bestWindow[1])}
                      </strong>
                    ) : (
                      <strong>Not much for your level {dayWord}</strong>
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
                      {t.type === 'high' ? '▲ High' : '▼ Low'} {fmtMin(t.min)}{' '}
                      <span className="muted">
                        {t.level >= 0 ? '+' : '−'}
                        {Math.abs(t.level).toFixed(1)} m
                      </span>
                    </span>
                  ))}
                </div>
              )}
              {rec && series ? (
                <ForecastTable spot={spot} rec={rec} series={series} date={date} isToday={date === today} settings={settings} tides={tides} gridMates={gridMates} />
              ) : (
                <p className="muted">{loading ? 'Loading forecast…' : 'No forecast available for this spot.'}</p>
              )}
              {series && <p className="muted tiny">Data: {series.source}. Weather and marine data by Open-Meteo.com (CC BY 4.0).</p>}
            </>
          )}

          {tab === 'guide' && <SpotGuide spot={spot} compact={mode === 'sheet'} />}

          {tab === 'sessions' && (
            <>
              {matched.length === 0 ? (
                <Empty>No sessions logged here yet.</Empty>
              ) : (
                <ul className="plain sv-sessions">
                  {matched.map(({ s, pct, when }) => (
                    <li key={s.id} className={s.excluded ? 'excluded' : ''}>
                      <a href={`#/session/${s.id}`} className="row gap">
                        <ScoreBadge score={sessionOverall(s)} size="sm" />
                        <span>
                          <strong>{fmtDate(s.date)}</strong> {fmtMin(s.startMin)}–{fmtMin(s.endMin)}
                          <br />
                          <span className="small muted">{sessionSummary(s, spot, settings)}</span>
                        </span>
                        {pct != null && (
                          <span className="pct" title={when ? `Closest to ${fmtMin(isoToMin(when) ?? 0)}` : ''}>
                            {pct}% like {dayWord}
                          </span>
                        )}
                        {s.excluded && <span className="badge muted">not relevant</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {matched.length > 0 && <p className="muted tiny">The % compares each session with the closest daylight hour {dayWord} (change the day on the Forecast tab).</p>}
              <h4>What your ratings say</h4>
              <p className="muted small">From the fun ratings of your relevant sessions here.</p>
              <h5>Tide stage (vs. your average here)</h5>
              <Bars data={ins.byTide} />
              <h5>Wind</h5>
              <Bars data={ins.byWind} labels={Object.fromEntries(Object.entries(WIND_LABEL)) as Record<WindKind, string>} />
            </>
          )}

          {tab === 'info' && (
            <>
              <dl className="facts">
                <dt>Faces</dt>
                <dd>
                  {compass(spot.facing)} ({Math.round(spot.facing)}°) · offshore wind from {compass(spot.facing + 180)}
                </dd>
                <dt>Best swell</dt>
                <dd>
                  {compass(spot.idealSwellDir)} (±{spot.swellWindow}°), {spot.minSize}–{spot.maxSize} m breaking
                </dd>
                <dt>Tide</dt>
                <dd>{spot.tide === 'all' ? 'all tides' : spot.tide}</dd>
                <dt>Break</dt>
                <dd>
                  {spot.breakType} · {spot.bottom} bottom · level: {spot.level}
                </dd>
                <dt>Size factor</dt>
                <dd>
                  {calib.n >= 2
                    ? `${calib.gain.toFixed(2)} (calibrated from ${calib.n} sessions where you noted the size)`
                    : `${spot.gain.toFixed(2)} (default; note the size you saw when logging to calibrate)`}
                </dd>
              </dl>
              {spot.coordsApprox && <div className="alert soft">Location is approximate. Use “Edit spot” to drag the marker to the exact break.</div>}
              <MapView
                markers={[{ id: spot.id, lat: spot.lat, lon: spot.lon, color: '#0b6e99', label: '●', title: spot.name }]}
                fit={{ south: spot.lat - 0.02, north: spot.lat + 0.02, west: spot.lon - 0.03, east: spot.lon + 0.03 }}
                height={240}
                cooperative
              />
              {spot.source && <p className="muted tiny">Source: {spot.source}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Bars({ data, labels }: { data: Record<string, { mean: number; minutes: number }>; labels?: Record<string, string> }) {
  const entries = Object.entries(data).sort((a, b) => b[1].mean - a[1].mean);
  if (!entries.length) return <span className="muted small">Not enough data yet.</span>;
  const max = Math.max(...entries.map(([, v]) => Math.abs(v.mean)), 0.5);
  return (
    <div className="bars">
      {entries.map(([k, v]) => (
        <div key={k} className="bar-row">
          <span className="bar-label">{labels?.[k] ?? k}</span>
          <span className="bar-track">
            <span className={`bar${v.mean < 0 ? ' neg' : ''}`} style={{ width: `${(Math.abs(v.mean) / max) * 100}%` }} />
          </span>
          <span className="bar-val">
            {v.mean >= 0.05 && labels === undefined ? '+' : ''}
            {Math.abs(v.mean) < 0.05 ? '0.0' : v.mean.toFixed(1)} <span className="muted tiny">({Math.round((v.minutes / 60) * 10) / 10} h)</span>
          </span>
        </div>
      ))}
    </div>
  );
}
