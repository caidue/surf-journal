import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Session, Settings, Spot } from '../types';
import { saveSettings } from '../db';
import { useConditions, useMediaQuery } from '../hooks';
import { bboxAround, bboxOf, inBBox, type BBox } from '../lib/geo';
import { geocode, parseRegionQuery, PART_LABEL, subBox } from '../lib/geocode';
import { buildHistory, confidence, explain, matchSession, recommendSpotDay, sessionOverall, type HourRec, type Neighbour, type SpotRec, dayVerdict } from '../lib/recommend';
import { scoreColor } from '../lib/rating';
import { bodyRange, bodyWord, levelName, stageBand } from '../lib/skill';
import { addDays, fmtDate, fmtMin, isoToMin, nowMinutesAt, todayAt } from '../lib/time';
import { fmtFeature, fmtSurfRange, fmtWind } from '../lib/format';
import { tideLabel, windKind, WIND_LABEL, type Derived } from '../lib/conditions';
import { SIMILAR_MIN_K, similarityPct } from '../lib/similarity';
import MapView, { type MapMarker } from './MapView';
import SpotSheet from './SpotSheet';
import SpotThumb from './SpotThumb';
import { Icon } from './icons';
import { Card, ConditionsStatus, DirArrow, Empty, ScoreBadge, Segmented, SuitBadge, SuitReasons, TimingNotes, SureBadge } from './ui';

interface Region {
  label: string;
  bbox: BBox;
}

const REGION_KEY = 'surf-journal.region';
/** Below this width Explore shows either the map or the list, never the map with content below it. */
export const PHONE_QUERY = '(max-width: 899px)';
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
  const phone = useMediaQuery(PHONE_QUERY);
  // Phones start with the list; the Map | List bar at the bottom switches.
  const [view, setViewState] = useState<'map' | 'list'>('list');
  const setView = (v: 'map' | 'list') => {
    setViewState(v);
    window.scrollTo({ top: 0 });
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
      out.push(recommendSpotDay(spot, s.hours, s.days, sessions, settings, settings.profile, date, today, nowMin));
    }
    return out.sort((a, b) => (b.best?.score ?? -1) - (a.best?.score ?? -1));
  }, [regionSpots, bySpot, sessions, settings, date, today, dayOffset]);

  const recBySpot = useMemo(() => new Map(recs.map((r) => [r.spot.id, r])), [recs]);
  const top = recs.find((r) => r.best && r.best.score > 0.5) ?? null;

  // Best picks: the top three spots for the day (best time window), right now (this hour, today
  // only) or at a time you pick on the selected day.
  const [pickMode, setPickMode] = useState<'day' | 'now' | 'time'>('day');
  const mode = dayOffset !== 0 && pickMode === 'now' ? 'day' : pickMode;
  // Daylight hours of the selected day (today: from the current hour on), as minutes after midnight.
  const pickHours = useMemo(() => {
    const nowH = recs[0]?.now ? isoToMin(recs[0].now.time) ?? 0 : 0;
    const set = new Set<number>();
    for (const r of recs) for (const h of r.hours) if (h.daylight) set.add(isoToMin(h.time) ?? -1);
    return [...set].filter((m) => m >= 0 && (dayOffset !== 0 || m >= nowH)).sort((a, b) => a - b);
  }, [recs, dayOffset]);
  const [pickTime, setPickTime] = useState<number | null>(null);
  // Keep the picked time on the selected day: default to the top pick's best hour, else the first hour.
  const time =
    pickTime != null && pickHours.includes(pickTime)
      ? pickTime
      : (() => {
          const b = top?.best ? isoToMin(top.best.time) : null;
          return b != null && pickHours.includes(b) ? b : pickHours[0] ?? null;
        })();
  const picks = useMemo(() => {
    const ranked: { rec: SpotRec; hour: HourRec }[] =
      mode === 'now'
        ? recs.filter((r) => r.now?.daylight).map((r) => ({ rec: r, hour: r.now! }))
        : mode === 'time'
          ? recs.flatMap((r) => {
              const hour = r.hours.find((h) => h.daylight && isoToMin(h.time) === time);
              return hour ? [{ rec: r, hour }] : [];
            })
          : recs.filter((r) => r.best).map((r) => ({ rec: r, hour: r.best! }));
    // On close scores, a spot the app knows well beats one rated by the general model only.
    const sureBonus = { high: 0.4, medium: 0.2, low: 0 } as const;
    return ranked
      .filter((x) => x.hour.score > 0.5)
      .sort((a, b) => b.hour.score + sureBonus[b.hour.sure.level] - (a.hour.score + sureBonus[a.hour.sure.level]))
      .slice(0, 3);
  }, [recs, mode, time]);
  const darkNow = mode === 'now' && recs.length > 0 && !recs.some((r) => r.now?.daylight);
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
      title: `${s.name}${best ? ` – best ${best.score.toFixed(1)}/10` : ''}${unsuitable ? ' (not for you)' : ''}`,
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
          {settings.profile && (
            <div className="tb-item">
              <span className="tb-label">Your level</span>
              <button
                className={`tb-you level-badge band-${stageBand(settings.profile.stage).toLowerCase()}`}
                onClick={() => go('settings')}
                title={`${levelName(settings.profile.stage)} (stage ${settings.profile.stage} of 8), comfortable to ${bodyWord(settings.profile.comfort)}. Tap to see or change it in Settings → Your surfing.`}
              >
                {levelName(settings.profile.stage)}
              </button>
            </div>
          )}
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
            height={fullMap ? `calc(100dvh - ${Math.round(mapTop)}px - 2.25rem - var(--switch-h) - env(safe-area-inset-bottom))` : 'min(62vh, 560px)'}
          />
          <div className="map-foot">
            <span className="muted small">
              {region ? region.label : 'All spots'} · {regionSpots.length} spot{regionSpots.length === 1 ? '' : 's'}
              {loading ? ' · loading conditions…' : ''}
            </span>
          </div>
        </div>

        <div className="list-col">
          {recs.length > 0 && (top || mode !== 'day') && (
            <Card className="best-pick">
              <div className="section-head">
                <div className="eyebrow">
                  Best picks for you {mode === 'now' ? 'right now' : dayOffset === 0 ? 'today' : dayOptions[dayOffset].label.toLowerCase()}
                  {mode === 'time' && time != null ? ` at ${fmtMin(time)}` : ''}
                  {picks.length > 0 && (() => {
                    const v = dayVerdict(picks[0].hour.score);
                    return <span className={`verdict ${v.tone}`}>{v.label}</span>;
                  })()}
                </div>
                <div className="pick-controls">
                  <Segmented
                    options={[
                      { id: 'day' as const, label: dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : dayOptions[dayOffset].label, title: 'The best time window at each spot' },
                      ...(dayOffset === 0 ? [{ id: 'now' as const, label: 'Now', title: 'This hour' }] : []),
                      { id: 'time' as const, label: 'At…', title: 'Pick a time on this day' },
                    ]}
                    value={mode}
                    onChange={setPickMode}
                  />
                  {mode === 'time' && pickHours.length > 0 && (
                    <select className="pick-time" aria-label="Time" value={time ?? ''} onChange={(e) => setPickTime(Number(e.target.value))}>
                      {pickHours.map((m) => (
                        <option key={m} value={m}>
                          {fmtMin(m)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              {picks.length === 0 ? (
                <p className="muted small">
                  {darkNow
                    ? "It's dark at the spots right now. Switch to Today, or look at tomorrow."
                    : mode === 'time'
                      ? pickHours.length
                        ? `Nothing really works for you at ${fmtMin(time ?? 0)}. Try another time, or the whole day.`
                        : 'No daylight hours left on this day.'
                      : 'Nothing really works for you right now. Switch to Today to see the best times later.'}
                </p>
              ) : (
                <ol className="pick-list">
                  {picks.map(({ rec, hour }) => (
                    <li
                      key={rec.spot.id}
                      onClick={(e) => {
                        if (!(e.target as Element).closest('a, button')) openSheet(rec.spot.id);
                      }}
                    >
                      <SpotHead spot={rec.spot} score={hour.score} scoreTitle="Predicted fun for you (0–10)" onOpen={() => openSheet(rec.spot.id)} />
                      <div className="cond-line go-line">
                        {mode === 'now' ? (
                          <span className="muted small">Now</span>
                        ) : mode === 'time' ? (
                          <>
                            <span className="muted small">At</span>
                            <strong>{fmtMin(time ?? 0)}</strong>
                          </>
                        ) : (
                          rec.bestWindow && (
                            <>
                              <span className="muted small">Go</span>
                              <strong>
                                {fmtMin(rec.bestWindow[0])}–{fmtMin(rec.bestWindow[1])}
                              </strong>
                            </>
                          )
                        )}
                        <span title={hour.derived.hb != null ? bodyRange(hour.derived.hb * 0.8, hour.derived.hb * 1.2) : undefined}>
                          <strong>{fmtSurfRange(hour.derived.hb, settings.heightUnit)}</strong>
                          {hour.derived.tDom ? ` · ${Math.round(hour.derived.tDom)} s` : ''}
                        </span>
                        <span>
                          {WIND_LABEL[windKind(hour.derived) ?? 'glassy']} {fmtWind(hour.derived.windSpeed, settings.windUnit)}
                        </span>
                        <span>tide {tideLabel(hour.derived.tideNorm, hour.derived.tideTrend)}</span>
                      </div>
                      {hour.peak && (
                        <div className="peak-pick">
                          Best for you: <strong>{hour.peak.name}</strong>
                        </div>
                      )}
                      {mode === 'day' && <TimingNotes rec={rec} />}
                      <ul className="explain">
                          {explain(hour, (s) => fmtDate(s.date)).map((l) => (
                            <li key={l}>{l}</li>
                          ))}
                      </ul>
                      <div className="row gap wrap">
                        <SuitBadge status={hour.suit.status} />
                        <SureBadge sure={hour.sure} />
                      </div>
                      <SuitReasons suit={hour.suit} />
                    </li>
                  ))}
                </ol>
              )}
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
                  <strong>Nothing really works for you {dayOffset === 0 ? 'today' : 'that day'}.</strong>
                  <p className="muted small">Check the spots below for details, or try another day.</p>
                </>
              )}
            </Card>
          )}

          {regionSpots.length === 0 && (
            <Empty>
              No spots known in this area yet. You can add your own under <strong>Settings → Spots</strong>.
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
                  <SpotHead spot={spot} score={r?.best?.score} scoreTitle="Best predicted score for you this day" onOpen={() => openSheet(spot.id)} />
                  <p className="desc">{spot.description}</p>
                  {show ? (
                    <div className="cond-line">
                      <span className="muted small">{r?.now && dayOffset === 0 ? 'Now' : `At ${fmtMin(isoToMin(show.time) ?? 0)}`}:</span>
                      <span title={show.derived.hb != null ? bodyRange(show.derived.hb * 0.8, show.derived.hb * 1.2) : undefined}>
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
                      {r.best.peak && <span className="small">best for you: {r.best.peak.name}</span>}
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
          <button role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>
            <Icon name="list" size={20} />
            List · {regionSpots.length}
          </button>
          <button role="tab" aria-selected={view === 'map'} className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>
            <Icon name="map" size={20} />
            Map
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

/** Card header shared by the best pick and the spot list: map thumbnail, name, details, score. */
function SpotHead({ spot, score, scoreTitle, onOpen }: { spot: Spot; score: number | null | undefined; scoreTitle: string; onOpen: () => void }) {
  return (
    <div className="spot-head">
      <SpotThumb lat={spot.lat} lon={spot.lon} />
      <div className="spot-head-text">
        <button className="spot-name link" onClick={onOpen}>
          {spot.name}
        </button>
        <div className="muted small">
          {spot.breakType} · {spot.bottom} · {spot.level === 'all' ? 'all levels' : spot.level}
          {spot.peaks.length > 1 ? ` · ${spot.peaks.length} peaks` : ''}
        </div>
      </div>
      <ScoreBadge score={score} title={scoreTitle} />
    </div>
  );
}
