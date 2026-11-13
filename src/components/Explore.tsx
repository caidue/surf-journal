import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Level, Session, Settings, Spot } from '../types';
import { saveSettings } from '../db';
import { useConditions, useMediaQuery } from '../hooks';
import { bboxAround, bboxOf, inBBox, type BBox } from '../lib/geo';
import { geocode, parseRegionQuery, PART_LABEL, subBox } from '../lib/geocode';
import { buildHistory, confidence, explain, matchSession, recommendSpotDay, sessionOverall, type Neighbour, type SpotRec } from '../lib/recommend';
import { LEVELS, scoreColor } from '../lib/rating';
import { addDays, fmtDate, fmtMin, isoToMin, nowMinutesAt, todayAt } from '../lib/time';
import { fmtFeature, fmtSurfRange, fmtWind } from '../lib/format';
import { tideLabel, windKind, WIND_LABEL, type Derived } from '../lib/conditions';
import { SIMILAR_MIN_K, similarityPct } from '../lib/similarity';
import MapView, { type MapMarker } from './MapView';
import SpotSheet from './SpotSheet';
import { Icon } from './icons';
import { Card, ConditionsStatus, DirArrow, Empty, ScoreBadge, Segmented, SuitBadge } from './ui';

interface Region {
  label: string;
  bbox: BBox;
}

const REGION_KEY = 'surf-journal.region';
const VIEW_KEY = 'surf-journal.exploreView';
/** Below this width Explore shows either the map or the list, never the map with content below it. */
export const PHONE_QUERY = '(max-width: 899px)';

function loadView(): 'map' | 'list' {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'map';
  } catch {
    return 'map';
  }
}
const DEFAULT_QUERY = 'northern part of Fuerteventura';

function loadRegion(): Region | null {
  try {
    return JSON.parse(localStorage.getItem(REGION_KEY) || 'null');
  } catch {
    return null;
  }
}
function storeRegion(r: Region | null) {
  try {
    localStorage.setItem(REGION_KEY, JSON.stringify(r));
  } catch {
    /* private mode */
  }
}

export const LEVEL_OPTIONS = LEVELS.map((l) => ({ id: l, label: l[0].toUpperCase() + l.slice(1) }));

export default function Explore({ spots, sessions, settings, go }: { spots: Spot[]; sessions: Session[]; settings: Settings; go: (p: string) => void }) {
  const [query, setQuery] = useState(settings.lastQuery ?? DEFAULT_QUERY);
  const [region, setRegion] = useState<Region | null>(loadRegion);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  /** Spot whose details sheet is open (from a map marker or a list card). */
  const [sheet, setSheet] = useState<string | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);
  const openSheet = (id: string) => {
    setSelected(id);
    setSheet(id);
  };
  const [addMode, setAddMode] = useState(false);
  const phone = useMediaQuery(PHONE_QUERY);
  const [view, setViewState] = useState<'map' | 'list'>(loadView);
  const setView = (v: 'map' | 'list') => {
    setViewState(v);
    window.scrollTo({ top: 0 });
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* per-viewer convenience only */
    }
  };
  const fullMap = phone && view === 'map';

  // Phone map view: the map fills the screen below the controls, so a swipe never has to fight
  // the map to scroll the page. Measure where the map starts.
  const mapColRef = useRef<HTMLDivElement>(null);
  const [mapTop, setMapTop] = useState(0);
  useLayoutEffect(() => {
    if (!fullMap) return;
    const measure = () => {
      const top = (mapColRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
      setMapTop((t) => (Math.abs(t - top) > 1 ? top : t));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });
  useEffect(() => {
    document.body.classList.toggle('full-map', fullMap);
    return () => document.body.classList.remove('full-map');
  }, [fullMap]);

  const today = todayAt();
  const date = addDays(today, dayOffset);

  const search = async (q: string) => {
    const text = q.trim();
    if (!text) return;
    setSearching(true);
    setSearchError(null);
    try {
      const { place, part } = parseRegionQuery(text);
      let bbox: BBox | null = null;
      let name = place;
      try {
        const g = await geocode(place);
        if (g) {
          bbox = subBox(g.bbox, part);
          name = g.name.split(',')[0];
        }
      } catch (e) {
        console.warn(e);
      }
      if (!bbox) {
        // Offline / unknown place: fall back to matching spot names and regions.
        const hits = spots.filter((s) => `${s.name} ${s.region}`.toLowerCase().includes(place.toLowerCase()));
        const b = bboxOf(hits);
        if (b) bbox = subBox(b, part);
      }
      if (!bbox) {
        setSearchError(`Couldn't find “${place}”.`);
        return;
      }
      const r = { label: part ? `${PART_LABEL[part][0].toUpperCase()}${PART_LABEL[part].slice(1)} of ${name}` : name, bbox };
      setRegion(r);
      storeRegion(r);
      saveSettings({ lastQuery: text });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!region) search(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nearMe = () => {
    if (!navigator.geolocation) return setSearchError('Location is not available in this browser.');
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const r = { label: 'Near you (30 km)', bbox: bboxAround(pos.coords.latitude, pos.coords.longitude, 30) };
        setRegion(r);
        storeRegion(r);
        setSearching(false);
      },
      (err) => {
        setSearchError(err.message || 'Could not get your location.');
        setSearching(false);
      },
      { timeout: 10000 },
    );
  };

  const regionSpots = useMemo(() => (region ? spots.filter((s) => inBBox(s.lat, s.lon, region.bbox, 3)) : spots), [spots, region]);
  // Load all three days at once: switching days is instant and they're all kept for offline use.
  const { bySpot, loading, error, offline, savedAt, reload } = useConditions(regionSpots, today, addDays(today, 2));

  const recs: SpotRec[] = useMemo(() => {
    const out: SpotRec[] = [];
    for (const spot of regionSpots) {
      const s = bySpot.get(spot.id);
      if (!s) continue;
      const nowMin = dayOffset === 0 ? nowMinutesAt(s.utcOffsetSeconds) : null;
      out.push(recommendSpotDay(spot, s.hours, s.days, sessions, settings, settings.level, date, today, nowMin));
    }
    return out.sort((a, b) => (b.best?.score ?? -1) - (a.best?.score ?? -1));
  }, [regionSpots, bySpot, sessions, settings, date, today, dayOffset]);

  const recBySpot = useMemo(() => new Map(recs.map((r) => [r.spot.id, r])), [recs]);
  const top = recs.find((r) => r.best && r.best.score > 0.5) ?? null;
  const dayOver = dayOffset === 0 && recs.length > 0 && recs.every((r) => r.dayOver);

  // Opening the app after sunset: jump to tomorrow once.
  const [autoSwitched, setAutoSwitched] = useState(false);
  useEffect(() => {
    if (dayOver && !autoSwitched) {
      setAutoSwitched(true);
      setDayOffset(1);
    }
  }, [dayOver, autoSwitched]);

  // Past sessions at these spots, each matched to its closest daylight hour of the selected day.
  // Close ones are listed; if none is close, the nearest few are shown with what differs.
  const similar = useMemo(() => {
    const all: SimilarMatch[] = [];
    for (const rec of recs) {
      const hist = buildHistory(rec.spot, sessions, settings, today, rec.gain);
      for (const h of hist) {
        let best: SimilarMatch | null = null;
        for (const hr of rec.hours) {
          if (!hr.daylight) continue;
          const nb = matchSession(rec.spot, hr.derived, h);
          if (nb && Number.isFinite(nb.d) && (!best || nb.d < best.nb.d)) best = { rec, nb, when: hr.time, now: hr.derived, then: h.derived[nb.hourIdx] };
        }
        if (best) all.push(best);
      }
    }
    all.sort((a, b) => a.nb.d - b.nb.d);
    // Compare the rounded percentage that's shown, so "25% similar" never lands on the wrong side.
    const close = all.filter((m) => similarityPct(m.nb.d) >= Math.round(SIMILAR_MIN_K * 100)).slice(0, 8);
    return { close, nearest: close.length ? [] : all.slice(0, 3) };
  }, [recs, sessions, settings, today]);
  const dayWord = dayOffset === 0 ? 'today' : dayOffset === 1 ? 'tomorrow' : 'that day';

  const markers: MapMarker[] = spots.map((s) => {
    const r = recBySpot.get(s.id);
    const inRegion = regionSpots.includes(s);
    const best = r?.best;
    const day = r?.hours.filter((h) => h.daylight) ?? [];
    const unsuitable = day.length > 0 && day.every((h) => h.suit.status === 'unsuitable');
    return {
      id: s.id,
      lat: s.lat,
      lon: s.lon,
      color: !inRegion ? '#cbd5e1' : unsuitable ? '#94a3b8' : scoreColor(best?.score ?? null),
      label: !inRegion || !best ? '·' : unsuitable ? '✕' : Math.round(best.score).toString(),
      title: `${s.name}${best ? ` – best ${best.score.toFixed(1)}/10` : ''}${unsuitable ? ' (not for your level)' : ''}`,
      muted: !inRegion || !!unsuitable,
    };
  });

  const dayOptions = [0, 1, 2].map((o) => ({ id: String(o), label: o === 0 ? 'Today' : o === 1 ? 'Tomorrow' : fmtDate(addDays(today, o), { weekday: phone ? 'short' : 'long' }) }));

  return (
    <div className={`page explore view-${view}`}>
      <div className="explore-controls">
        <form
          className="searchbar"
          onSubmit={(e) => {
            e.preventDefault();
            search(query);
          }}
        >
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Where are you? e.g. northern Fuerteventura" aria-label="Region" enterKeyHint="search" />
          <button className="btn primary" disabled={searching} aria-label="Show spots">
            <Icon name="search" size={18} />
            <span className="btn-text">{searching ? 'Searching…' : 'Show spots'}</span>
          </button>
          <button type="button" className="btn" onClick={nearMe} aria-label="Spots near me">
            <Icon name="locate" size={18} />
            <span className="btn-text">Near me</span>
          </button>
        </form>
        <div className="toolbar">
          <div className="tb-item">
            <span className="tb-label">Level</span>
            {phone ? (
              <select value={settings.level} onChange={(e) => saveSettings({ level: e.target.value as Level })} aria-label="Your level">
                {LEVEL_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <Segmented options={LEVEL_OPTIONS} value={settings.level} onChange={(l: Level) => saveSettings({ level: l })} />
            )}
          </div>
          <div className="tb-item">
            <span className="tb-label">Day</span>
            <Segmented options={dayOptions} value={String(dayOffset)} onChange={(v) => setDayOffset(Number(v))} />
          </div>
        </div>
        {searchError && <div className="alert">{searchError}</div>}
        <ConditionsStatus error={error} offline={offline} savedAt={savedAt} onRetry={reload} />
      </div>

      <div className="explore-grid">
        <div className="map-col" ref={mapColRef}>
          <MapView
            markers={markers}
            fit={bboxOf(regionSpots) ?? region?.bbox ?? bboxOf(spots)}
            area={region?.bbox ?? null}
            selectedId={selected}
            onSelect={openSheet}
            onMapClick={(lat, lon) => {
              if (addMode) go(`spot-new?lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}`);
            }}
            height={fullMap ? `calc(100dvh - ${Math.round(mapTop)}px - 3.25rem - var(--switch-h) - env(safe-area-inset-bottom))` : 'min(62vh, 560px)'}
          />
          <div className="map-foot">
            <span className="muted small">
              {region ? region.label : 'All spots'} · {regionSpots.length} spot{regionSpots.length === 1 ? '' : 's'}
              {loading ? ' · loading conditions…' : ''}
            </span>
            <button className={`btn small${addMode ? ' primary' : ''}`} onClick={() => setAddMode((v) => !v)}>
              {addMode ? 'Tap the map to place it…' : '+ Add a spot'}
            </button>
          </div>
        </div>

        <div className="list-col">
          {top && top.best && (
            <Card className="best-pick">
              <div className="eyebrow">Best pick for you {dayOffset === 0 ? 'today' : dayOptions[dayOffset].label.toLowerCase()}</div>
              <div className="row between">
                <h2>
                  <button className="link spot-title" onClick={() => openSheet(top.spot.id)}>
                    {top.spot.name}
                  </button>
                </h2>
                <ScoreBadge score={top.best.score} size="lg" title="Predicted fun for you (0–10)" />
              </div>
              {top.bestWindow && (
                <div className="go-window">
                  Go {fmtMin(top.bestWindow[0])}–{fmtMin(top.bestWindow[1])} · {fmtSurfRange(top.best.derived.hb, settings.heightUnit)} ·{' '}
                  {WIND_LABEL[windKind(top.best.derived) ?? 'glassy']} {fmtWind(top.best.derived.windSpeed, settings.windUnit)} · tide {tideLabel(top.best.derived.tideNorm, top.best.derived.tideTrend)}
                </div>
              )}
              <ul className="explain">
                {explain(top.best, (s) => fmtDate(s.date)).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <div className="row gap">
                <SuitBadge status={top.best.suit.status} />
                <span className="muted small">Confidence: {confidence(top.best.pred)}</span>
              </div>
            </Card>
          )}
          {autoSwitched && dayOffset === 1 && (
            <div className="alert soft">No daylight left today, so you're seeing tomorrow. Current conditions are on each spot's page.</div>
          )}
          {!loading && regionSpots.length > 0 && !top && recs.length > 0 && (
            <Card>
              {dayOver ? (
                <>
                  <strong>No daylight left today.</strong>
                  <p className="muted small">
                    <button className="link" onClick={() => setDayOffset(1)}>
                      See tomorrow's forecast
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <strong>Nothing really works for your level {dayOffset === 0 ? 'today' : 'that day'}.</strong>
                  <p className="muted small">Check the spots below for details, or try another day.</p>
                </>
              )}
            </Card>
          )}

          {regionSpots.length === 0 && (
            <Empty>
              No spots known in this area yet. Use <strong>+ Add a spot</strong> and click on the map to create one.
            </Empty>
          )}

          <div className="spot-list">
            {(recs.length ? recs.map((r) => r.spot) : regionSpots).map((spot) => {
              const r = recBySpot.get(spot.id);
              const show = r?.now ?? r?.best;
              return (
                <Card
                  key={spot.id}
                  id={`spot-${spot.id}`}
                  className={`spot-item${selected === spot.id ? ' selected' : ''}`}
                  onClick={(e: React.MouseEvent) => {
                    if (!(e.target as Element).closest('a, button')) openSheet(spot.id);
                  }}
                >
                  <div className="row between">
                    <div>
                      <button className="spot-name link" onClick={() => openSheet(spot.id)}>
                        {spot.name}
                      </button>
                      <div className="muted small">
                        {spot.breakType} · {spot.bottom} · level: {spot.level}
                        {spot.peaks.length ? ` · ${spot.peaks.length} peaks` : ''}
                      </div>
                    </div>
                    <div className="scores">
                      <ScoreBadge score={r?.best?.score} title="Best predicted score for you this day" />
                    </div>
                  </div>
                  <p className="desc">{spot.description}</p>
                  {show ? (
                    <div className="cond-line">
                      <span className="muted small">{r?.now && dayOffset === 0 ? 'Now' : `At ${fmtMin(isoToMin(show.time) ?? 0)}`}:</span>
                      <span>
                        <strong>{fmtSurfRange(show.derived.hb, settings.heightUnit)}</strong> {show.derived.tDom ? `${Math.round(show.derived.tDom)} s` : ''}{' '}
                        <DirArrow from={show.derived.dirDom} />
                      </span>
                      <span>
                        {WIND_LABEL[windKind(show.derived) ?? 'glassy']} {fmtWind(show.derived.windSpeed, settings.windUnit)} <DirArrow from={show.derived.windDir} />
                      </span>
                      <span>tide {tideLabel(show.derived.tideNorm, show.derived.tideTrend)}</span>
                    </div>
                  ) : (
                    <div className="muted small">{loading ? 'Loading conditions…' : 'No conditions available'}</div>
                  )}
                  {r?.best && (
                    <div className="row gap wrap">
                      <SuitBadge status={r.best.suit.status} />
                      {r.bestWindow && r.best.score > 0.5 && (
                        <span className="small">
                          best {fmtMin(r.bestWindow[0])}–{fmtMin(r.bestWindow[1])}
                        </span>
                      )}
                      <span className="muted small">
                        guide {r.best.rule.toFixed(1)}
                        {r.best.pred.sumW > 0.05 ? ` · your history ${confidence(r.best.pred)}` : ''}
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          <section>
            <h3>Your past sessions in conditions like {dayOffset === 0 ? 'today' : 'this day'}</h3>
            {similar.close.length > 0 ? (
              <div className="similar-grid">
                {similar.close.map((m) => (
                  <SimilarCard key={m.nb.session.id} m={m} dayWord={dayWord} settings={settings} />
                ))}
              </div>
            ) : similar.nearest.length > 0 ? (
              <>
                <p className="small muted">
                  None of your sessions at these spots is close enough ({Math.round(SIMILAR_MIN_K * 100)}% similar or more) to count. The nearest ones, and what differs:
                </p>
                <div className="similar-grid">
                  {similar.nearest.map((m) => (
                    <SimilarCard key={m.nb.session.id} m={m} dayWord={dayWord} settings={settings} faded />
                  ))}
                </div>
              </>
            ) : (
              <Empty>
                {sessions.length === 0
                  ? 'Once you log sessions, the ones recorded in similar conditions to today show up here.'
                  : 'You have no logged sessions at the spots in this area yet.'}
              </Empty>
            )}
            <details className="how small muted">
              <summary>How is this matched?</summary>
              <p>
                Each past session is compared with every daylight hour of this day <strong>at the same spot</strong>, using the hour of your session that fits best. Compared are: the
                estimated wave size at the spot (one step ≈ 25 % bigger or smaller), swell period (± 2 s), swell direction (± 20°), offshore/onshore and cross-shore wind (± 9 km/h),
                tide height (± a fifth of the day's range) and whether the tide is rising or falling. Size, wind and tide count most.
              </p>
              <p>
                A session is listed from {Math.round(SIMILAR_MIN_K * 100)} % similar: roughly one step off in size, wind and tide at the same time. A size difference alone of 1.6 m
                vs 2.6 m) is already too different. Wave size here is the estimate at that spot, so a swell turning out of a spot's window can change it a lot even when the offshore
                forecast looks similar.
              </p>
            </details>
          </section>
        </div>
      </div>

      {phone && (
        <div className="view-switch" role="tablist" aria-label="Show spots as">
          <button role="tab" aria-selected={view === 'map'} className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>
            <Icon name="map" size={20} />
            Map
          </button>
          <button role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>
            <Icon name="list" size={20} />
            List · {regionSpots.length}
          </button>
        </div>
      )}


      {sheet &&
        (() => {
          const spot = spots.find((x) => x.id === sheet);
          if (!spot) return null;
          return (
            <SpotSheet spot={spot} spots={spots} sessions={sessions} settings={settings} initialDay={dayOffset} onClose={closeSheet} go={go} />
          );
        })()}
    </div>
  );
}

interface SimilarMatch {
  rec: SpotRec;
  nb: Neighbour;
  when: string;
  now: Derived;
  then: Derived | undefined;
}

function SimilarCard({ m, dayWord, settings, faded }: { m: SimilarMatch; dayWord: string; settings: Settings; faded?: boolean }) {
  const { rec, nb, when } = m;
  return (
    <a className={`card similar${nb.session.excluded ? ' excluded' : ''}${faded ? ' faded' : ''}`} href={`#/session/${nb.session.id}`}>
      <div className="row between">
        <strong>{rec.spot.name}</strong>
        <span className="pct">{similarityPct(nb.d)}% similar</span>
      </div>
      <div className="small">
        {fmtDate(nb.session.date)} · {fmtMin(nb.session.startMin)}–{fmtMin(nb.session.endMin)}
      </div>
      <div className="small muted">
        closest to {fmtMin(isoToMin(when) ?? 0)} {dayWord}
      </div>
      {nb.differsKey && (
        <div className="small">
          Differs most in {nb.differs}: {fmtFeature(nb.differsKey, m.now, settings)} {dayWord} vs {fmtFeature(nb.differsKey, m.then, settings)} then
        </div>
      )}
      <div className="row gap">
        <ScoreBadge score={nb.y ?? sessionOverall(nb.session)} size="sm" /> <span className="small">fun then</span>
        {nb.session.excluded && <span className="badge muted">not relevant</span>}
      </div>
    </a>
  );
}
