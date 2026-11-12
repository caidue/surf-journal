import { useMemo, useState } from 'react';
import type { Session, Settings, Spot } from '../types';
import { useConditions } from '../hooks';
import { deriveSeries, WIND_LABEL, type WindKind } from '../lib/conditions';
import { buildHistory, calibratedGain, confidence, explain, insights, matchSession, recommendSpotDay, sessionOverall } from '../lib/recommend';
import { addDays, fmtDate, fmtMin, isoToMin, nowMinutesAt, todayAt } from '../lib/time';
import { compass } from '../lib/geo';
import { similarityPct } from '../lib/similarity';
import Timeline, { type HourScore } from './Timeline';
import MapView from './MapView';
import { Card, ConditionsStatus, Empty, ScoreBadge, Segmented, SuitBadge } from './ui';
import SpotGuide from './SpotGuide';
import { sessionSummary } from './Journal';

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
            {Math.abs(v.mean) < 0.05 ? '0.0' : v.mean.toFixed(1)} <span className="muted tiny">({Math.round(v.minutes / 60 * 10) / 10} h)</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SpotPage({ spot, sessions, settings, go }: { spot: Spot; sessions: Session[]; settings: Settings; go: (p: string) => void }) {
  const today = todayAt();
  const [dayOffset, setDayOffset] = useState(0);
  const spots = useMemo(() => [spot], [spot]);
  const { bySpot, loading, error, offline, savedAt, reload } = useConditions(spots, today, addDays(today, 2));
  const series = bySpot.get(spot.id);
  const date = addDays(today, dayOffset);

  const rec = useMemo(() => {
    if (!series) return null;
    const nowMin = dayOffset === 0 ? nowMinutesAt(series.utcOffsetSeconds) : null;
    return recommendSpotDay(spot, series.hours, series.days, sessions, settings, settings.level, date, today, nowMin);
  }, [series, spot, sessions, settings, date, today, dayOffset]);

  const dayHours = useMemo(() => series?.hours.filter((h) => h.time.startsWith(date)) ?? [], [series, date]);
  const derived = useMemo(() => deriveSeries(spot, dayHours, rec?.gain ?? spot.gain), [spot, dayHours, rec?.gain]);
  const scores: (HourScore | null)[] = dayHours.map((h) => {
    const r = rec?.hours.find((x) => x.time === h.time);
    return r && r.daylight ? { score: r.score, unsuitable: r.suit.status === 'unsuitable', title: `${r.score.toFixed(1)} for you (guide ${r.rule.toFixed(1)})${r.suit.reasons.length ? ' – ' + r.suit.reasons.join('; ') : ''}` } : null;
  });
  const dayInfo = series?.days.find((d) => d.date === date);

  const mySessions = sessions.filter((s) => s.spotId === spot.id);
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
  const peakNames = Object.fromEntries(spot.peaks.map((p) => [p.id, p.name]));
  const windNames = Object.fromEntries(Object.entries(WIND_LABEL)) as Record<WindKind, string>;

  const dayOptions = [0, 1, 2].map((o) => ({ id: String(o), label: o === 0 ? 'Today' : o === 1 ? 'Tomorrow' : fmtDate(addDays(today, o), { weekday: 'long' }) }));

  return (
    <div className="page">
      <div className="row between wrap">
        <div>
          <a className="small" href="#/explore">
            ← Explore
          </a>
          <h1>{spot.name}</h1>
          <div className="muted">
            {spot.region} · {spot.breakType} break · {spot.bottom} bottom · level: <strong>{spot.level}</strong>
          </div>
        </div>
        <div className="row gap">
          <button className="btn" onClick={() => go(`spot-edit/${spot.id}`)}>
            Edit spot
          </button>
          <button className="btn primary" onClick={() => go(`log?spot=${spot.id}`)}>
            + Log a session here
          </button>
        </div>
      </div>

      <div className="spot-grid">
        <Card>
          <p>{spot.description}</p>
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
            <dd>{spot.tide}</dd>
            <dt>Size factor</dt>
            <dd>
              {calib.n >= 2 ? `${calib.gain.toFixed(2)} (calibrated from ${calib.n} sessions where you noted the size)` : `${spot.gain.toFixed(2)} (default; note the size you saw when logging to calibrate)`}
            </dd>
          </dl>
          {spot.coordsApprox && <div className="alert soft">Location is approximate. Use “Edit spot” to drag the marker to the exact break.</div>}
          {spot.source && <p className="muted tiny">Source: {spot.source}</p>}
        </Card>
        <MapView markers={[{ id: spot.id, lat: spot.lat, lon: spot.lon, color: '#0b6e99', label: '●', title: spot.name }]} fit={{ south: spot.lat - 0.02, north: spot.lat + 0.02, west: spot.lon - 0.03, east: spot.lon + 0.03 }} height={260} />
      </div>

      <Card>
        <h3>Spot guide</h3>
        <SpotGuide spot={spot} />
      </Card>

      <Card>
        <div className="row between wrap">
          <h3>Forecast for you</h3>
          <Segmented options={dayOptions} value={String(dayOffset)} onChange={(v) => setDayOffset(Number(v))} />
        </div>
        <ConditionsStatus error={error} offline={offline} savedAt={savedAt} onRetry={reload} />
        {loading && !series && <div className="muted">Loading forecast…</div>}
        {series && dayHours.length > 0 && (
          <>
            <Timeline
              hours={dayHours}
              derived={derived}
              scores={scores}
              scoreLabel="For you"
              sunrise={isoToMin(dayInfo?.sunrise)}
              sunset={isoToMin(dayInfo?.sunset)}
              heightUnit={settings.heightUnit}
              windUnit={settings.windUnit}
              view={[Math.max(0, Math.floor(((isoToMin(dayInfo?.sunrise) ?? 420) - 60) / 60) * 60), Math.min(1440, Math.ceil(((isoToMin(dayInfo?.sunset) ?? 1170) + 60) / 60) * 60)]}
              nowMin={dayOffset === 0 ? nowMinutesAt(series.utcOffsetSeconds) : null}
              highlight={rec?.bestWindow && rec.best && rec.best.score > 0.5 ? { startMin: rec.bestWindow[0], endMin: rec.bestWindow[1] } : null}
            />
            {rec?.dayOver && (
              <div className="alert soft">
                No daylight left today.{' '}
                <button className="link" onClick={() => setDayOffset(1)}>
                  Show tomorrow
                </button>
              </div>
            )}
            {rec?.best && (
              <div className="best-line">
                <ScoreBadge score={rec.best.score} />
                <div>
                  {rec.best.score > 0.5 && rec.bestWindow ? (
                    <strong>
                      Best window {fmtMin(rec.bestWindow[0])}–{fmtMin(rec.bestWindow[1])}
                    </strong>
                  ) : (
                    <strong>Not much for your level this day</strong>
                  )}{' '}
                  <SuitBadge status={rec.best.suit.status} /> <span className="muted small">confidence: {confidence(rec.best.pred)}</span>
                  <ul className="explain">
                    {explain(rec.best, (s) => fmtDate(s.date)).map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <p className="muted tiny">
              Scores: rule-based spot guide for your level, blended with your own sessions in similar conditions. Data: {series.source}. Weather data by Open-Meteo.com (CC BY 4.0).
            </p>
          </>
        )}
      </Card>

      <div className="spot-grid">
        <Card>
          <h3>Your sessions here ({mySessions.length})</h3>
          {matched.length === 0 ? (
            <Empty>No sessions logged here yet.</Empty>
          ) : (
            <ul className="plain">
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
                        {pct}% like {dayOffset === 0 ? 'today' : 'this day'}
                      </span>
                    )}
                    {s.excluded && <span className="badge muted">not relevant</span>}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h3>What your ratings say</h3>
          <p className="muted small">From the fun ratings of your relevant sessions here.</p>
          <h4>Tide stage (vs. your average here)</h4>
          <Bars data={ins.byTide} />
          {spot.peaks.length > 0 && Object.keys(ins.byZone).length > 0 && (
            <>
              <h4>Where you were happiest</h4>
              <Bars data={ins.byZone} labels={peakNames} />
              <p className="muted tiny">Descriptive, not causal: you may have moved peaks because conditions changed.</p>
            </>
          )}
          <h4>Wind</h4>
          <Bars data={ins.byWind} labels={windNames} />
        </Card>
      </div>
    </div>
  );
}
