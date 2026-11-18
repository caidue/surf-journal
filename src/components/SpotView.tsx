import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, Settings, Spot } from '../types';
import { useConditions, useRating } from '../hooks';
import { deriveSeries, tideExtremes, tideLabel, WIND_LABEL, type WindKind } from '../lib/conditions';
import { buildHistory, calibratedGain, insights, recommendSpotDay, sessionOverall } from '../lib/recommend';
import { KNOWLEDGE_LABEL, spotKnowledge } from '../lib/confidence';
import { addDays, fmtDate, fmtMin, isoToMin, nowMinutesAt, todayAt } from '../lib/time';
import { compass, haversineKm } from '../lib/geo';
import { surfForecastUrl, surflineUrl } from '../lib/links';
import { gridKey } from '../lib/openMeteo';
import { bestMatch } from '../lib/compare';
import ForecastTable from './ForecastTable';
import { Icon, type IconName } from './icons';
import MapView from './MapView';
import SpotGuide from './SpotGuide';
import SessionCompare from './SessionCompare';
import { sessionSummary } from './Journal';
import { CondBadges, ConditionsStatus, Empty, PickDetails, ScoreBadge, Segmented } from './ui';

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
  /** Chosen time on the initial day (minutes after midnight): the forecast opens scrolled to it. */
  focusMin?: number;
  /** Extra buttons for the header (close / open as page). */
  headerActions?: ReactNode;
  titleId?: string;
}

/**
 * Everything about one spot, in tabs: Forecast (hourly table, tides), Guide (peaks, season,
 * access, warnings, parking, photos), Info (how it works, what the app knows, map, size factor),
 * Best time (the recommendation for you, with the forecast for just those hours) and Sessions
 * (with how similar each was to the chosen day, and what your ratings say).
 */
export default function SpotView({ spot, spots, sessions, settings, go, mode, initialDay = 0, focusMin, headerActions, titleId }: Props) {
  const today = todayAt();
  const [dayOffset, setDayOffset] = useState(initialDay);
  const [tab, setTabState] = useState<SpotTab>(loadTab);
  /** The session shown next to the chosen day in the Sessions tab (null = the list). */
  const [compareId, setCompareIdState] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsAnchor = useRef<HTMLDivElement>(null);
  const setCompareId = (id: string | null) => {
    setCompareIdState(id);
    toTop();
  };
  const setTab = (t: SpotTab) => {
    setTabState(t);
    toTop();
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {
      /* per-viewer convenience only */
    }
  };
  // A new tab (or view) starts at its top, not at the previous one's scroll position: in the popup its
  // own scroll area goes back up; on the page the window goes back to where the tabs stick, if past it.
  const toTop = () => {
    if (mode === 'sheet') {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else if (tabsAnchor.current) {
      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-actual')) || 56;
      const y = tabsAnchor.current.getBoundingClientRect().top + window.scrollY - bar;
      if (window.scrollY > y) window.scrollTo(0, y);
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

  // Rated for you, or for the level chosen under "Rate for" on Explore (a friend).
  const rating = useRating(settings);
  const who = rating.forLevel ?? 'you';
  const rec = useMemo(() => {
    if (!series) return null;
    const nowMin = dayOffset === 0 ? nowMinutesAt(series.utcOffsetSeconds) : null;
    return recommendSpotDay(spot, series.hours, series.days, sessions, settings, rating.profile, date, today, nowMin, { history: rating.history });
  }, [series, spot, sessions, settings, date, today, dayOffset, rating]);
  const tides = useMemo(() => (series ? tideExtremes(series.hours, date) : []), [series, date]);

  const mySessions = useMemo(() => sessions.filter((s) => s.spotId === spot.id), [sessions, spot.id]);
  const dayInfo = series?.days.find((d) => d.date === date);
  // "% like today": the session's best match on the day (the same one the comparison opens on),
  // which keeps at least an hour of the session in daylight.
  const matched = useMemo(() => {
    if (!rec) return mySessions.map((s) => ({ s, pct: null as number | null, when: null as number | null }));
    const hist = buildHistory(spot, mySessions, settings, today, rec.gain);
    const day = rec.hours.map((h) => ({ d: h.derived, daylight: h.daylight }));
    const rise = isoToMin(dayInfo?.sunrise) ?? 420;
    const set = isoToMin(dayInfo?.sunset) ?? 1170;
    return hist
      .map((h) => {
        const m = bestMatch(spot, h.hours.map((i) => h.derived[i]).filter(Boolean), day, h.session.startMin, h.session.endMin, rise, set);
        return { s: h.session, pct: m?.best?.pct ?? null, when: m?.best?.dayMin ?? null };
      })
      .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  }, [rec, mySessions, spot, settings, today, dayInfo]);
  const ins = useMemo(() => insights(spot, sessions), [spot, sessions]);
  const compared = compareId ? mySessions.find((s) => s.id === compareId) ?? null : null;
  const comparedDerived = useMemo(() => (compared && rec ? deriveSeries(spot, compared.conditions, rec.gain) : []), [compared, rec, spot]);
  const calib = useMemo(() => calibratedGain(spot, sessions), [spot, sessions]);

  const dayOptions = [0, 1, 2].map((o) => ({ id: String(o), label: o === 0 ? 'Today' : o === 1 ? 'Tomorrow' : fmtDate(addDays(today, o), { weekday: 'long' }) }));
  const dayWord = dayOffset === 0 ? 'today' : dayOffset === 1 ? 'tomorrow' : 'that day';
  const best = rec?.best ?? null;
  const goodWindow = !!(rec?.bestWindow && best && best.score > 0.5);

  const tabs: { id: SpotTab; label: string; icon: IconName; short?: string }[] = [
    { id: 'forecast', label: 'Forecast', icon: 'forecast' },
    { id: 'guide', label: 'Guide', icon: 'guide' },
    { id: 'info', label: 'Info', icon: 'info' },
    { id: 'sessions', label: `Sessions${mySessions.length ? ` (${mySessions.length})` : ''}`, icon: 'sessions', short: 'Sessions' },
  ];

  // In the popup the tabs sit in a fixed row between the header and the scrolling content (they never
  // scroll); on the page they stick under the top bar.
  const tabBar = (
    <div className="sv-tabs" role="tablist" aria-label="Spot details">
            {tabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                <Icon name={t.icon} size={18} />
                <span className={t.short ? 'tab-long' : undefined}>{t.label}</span>
                {t.short && <span className="tab-short">{t.short}</span>}
              </button>
            ))}
          </div>
  );

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
            {spot.region} · {spot.breakType} break{spot.bottom !== spot.breakType ? ` · ${spot.bottom} bottom` : ''} · {spot.level === 'all' ? 'all levels' : spot.level}
            {spot.peaks.length > 1 ? ` · ${spot.peaks.length} peaks` : ''}
          </div>
          {!!spot.aliases?.length && <div className="muted tiny">Also called {spot.aliases.join(', ')}</div>}
        </div>
        <div className="row gap">
          {best && <ScoreBadge score={best.score} size="lg" title={`Best predicted score for ${who} ${dayWord}`} />}
          {headerActions}
        </div>
      </header>

      {mode === 'sheet' && tabBar}

      <div className="sv-scroll" ref={scrollRef}>
        <div ref={tabsAnchor} aria-hidden />
        {mode === 'page' && tabBar}

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
              {rec && series ? (
                <ForecastTable
                  spot={spot}
                  rec={rec}
                  series={series}
                  date={date}
                  isToday={date === today}
                  settings={settings}
                  tides={tides}
                  gridMates={gridMates}
                  focusMin={dayOffset === initialDay ? focusMin : undefined}
                  forLevel={rating.forLevel}
                />
              ) : (
                <p className="muted">{loading ? 'Loading forecast…' : 'No forecast available for this spot.'}</p>
              )}
              {best && (
              <div className="sheet-best">
                {/* Same layout as the spot cards on Explore: when (and the tide), the conditions as
                    badges, then the shared details (timing, reasons, bullets, confidence). */}
                <div className="go-line">
                  {goodWindow ? (
                    <>
                      <span className="muted">Go</span>{' '}
                      <strong>
                        {fmtMin(rec!.bestWindow![0])}–{fmtMin(rec!.bestWindow![1])}
                      </strong>
                    </>
                  ) : (
                    <strong>Not much for {who} {dayWord}</strong>
                  )}
                  {best.derived.tideNorm != null && <span className="go-tide"> · tide {tideLabel(best.derived.tideNorm, best.derived.tideTrend)}</span>}
                </div>
                <CondBadges d={best.derived} settings={settings} />
                {rec && <PickDetails rec={rec} hour={best} who={who} forLevel={rating.forLevel} timing={goodWindow} dayWord={dayWord} />}
              </div>
              )}
              {tides.length > 0 && (
                <div className="tide-line" title="Heights relative to mean sea level">
                  <span className="muted small">Tide (vs mean sea level)</span>
                  <div className="tide-chips">
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
                </div>
              )}
            </>
          )}

          {tab === 'guide' && <SpotGuide spot={spot} compact={mode === 'sheet'} />}

          {tab === 'sessions' && compared && (
            rec && series ? (
              <SessionCompare
                key={`${compared.id}|${date}`}
                spot={spot}
                session={compared}
                derived={comparedDerived}
                rec={rec}
                hours={series.hours}
                sunrise={isoToMin(dayInfo?.sunrise) ?? null}
                sunset={isoToMin(dayInfo?.sunset) ?? null}
                dayWord={dayWord}
                nowMin={dayOffset === 0 ? nowMinutesAt(series.utcOffsetSeconds) : null}
                settings={settings}
                onBack={() => setCompareId(null)}
                daySwitch={<Segmented options={dayOptions} value={String(dayOffset)} onChange={(v) => setDayOffset(Number(v))} />}
              />
            ) : (
              <>
                <button type="button" className="link" onClick={() => setCompareId(null)}>
                  ← Back to the sessions
                </button>
                <p className="muted">{loading ? 'Loading forecast…' : 'No forecast to compare with.'}</p>
              </>
            )
          )}

          {tab === 'sessions' && !compared && (
            <>
              {matched.length === 0 ? (
                <Empty>No sessions logged here yet.</Empty>
              ) : (
                <ul className="plain sv-sessions">
                  {matched.map(({ s, pct, when }) => (
                    <li key={s.id} className={s.excluded ? 'excluded' : ''}>
                      <button type="button" className="sv-row row gap" onClick={() => setCompareId(s.id)} title={`Compare with ${dayWord}`}>
                        <ScoreBadge score={sessionOverall(s)} size="sm" />
                        <span>
                          <strong>{fmtDate(s.date)}</strong>{' '}
                          <span className="when">
                            {fmtMin(s.startMin)}–{fmtMin(s.endMin)}
                          </span>
                          <br />
                          <span className="small muted">{sessionSummary(s, spot, settings)}</span>
                        </span>
                        {pct != null && (
                          <span className="pct" title={when != null ? `Closest to ${fmtMin(when)}` : ''}>
                            {pct}% like {dayWord}
                          </span>
                        )}
                        {s.excluded && <span className="badge muted">not relevant</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {matched.length > 0 && <p className="muted tiny">% = how alike its closest hour is to {dayWord} (at least an hour of it in daylight). Tap a session to compare.</p>}
              <h4>What your ratings say</h4>
              <p className="muted small">
                Average fun rating at each tide stage and wind, from your relevant sessions here
                {ins.sessions > 0 && ` (${ins.sessions}; your average ${ins.mean.toFixed(1)})`}.
                {ins.sessions === 1 && ' With one session the bars show that session; they become comparisons as you surf here at other tides and winds.'}
              </p>
              <h5>Tide stage</h5>
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
                  {spot.breakType} · {spot.bottom} bottom · {spot.level === 'all' ? 'all levels' : spot.level}
                  {spot.power ? ` · ${spot.power}` : ''}
                  {spot.peel ? ` · ${spot.peel} peel` : ''}
                </dd>
                {(spot.crowd || spot.localism || spot.lifeguard != null) && (
                  <>
                    <dt>In the water</dt>
                    <dd>
                      {[spot.crowd && `${spot.crowd} crowds`, spot.localism && spot.localism !== 'none' && `${spot.localism} localism`, spot.lifeguard ? 'lifeguard listed' : spot.lifeguard === false ? 'no lifeguard' : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </dd>
                  </>
                )}
                {(spot.externalIds?.surfline || spot.externalIds?.surfForecast) && (
                  <>
                    <dt>Elsewhere</dt>
                    <dd className="ext-links">
                      {spot.externalIds.surfline && (
                        <a href={surflineUrl(spot.externalIds.surfline)} target="_blank" rel="noopener noreferrer">
                          Surfline
                        </a>
                      )}
                      {spot.externalIds.surfForecast && (
                        <a href={surfForecastUrl(spot.externalIds.surfForecast)} target="_blank" rel="noopener noreferrer">
                          surf-forecast.com
                        </a>
                      )}
                    </dd>
                  </>
                )}
                <dt>What the app knows</dt>
                <dd>
                  {(() => {
                    const k = spotKnowledge(spot);
                    return (
                      <>
                        <strong>{KNOWLEDGE_LABEL[k.level]}</strong>: {k.text} {k.rules > 0 && 'See the Guide tab.'}
                        {spot.dataNote && <div className="muted small">{spot.dataNote}</div>}
                      </>
                    );
                  })()}
                </dd>
                <dt>Size factor</dt>
                <dd>
                  {calib.n >= 2
                    ? `${calib.gain.toFixed(2)} (calibrated from ${calib.n} sessions where you noted the size)`
                    : `${spot.gain.toFixed(2)} (default; note the size you saw when logging to calibrate)`}
                </dd>
              </dl>
              {spot.coordsApprox && <div className="alert soft">Location is approximate. Correct it under Settings → Spots.</div>}
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
            {v.mean.toFixed(1)} <span className="muted tiny">({Math.round((v.minutes / 60) * 10) / 10} h)</span>
          </span>
        </div>
      ))}
    </div>
  );
}
