import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Session, Settings, SkillProfile, Spot, Stage } from '../types';
import { saveSettings } from '../db';
import { setRateFor, useConditions, useMediaQuery, useRating } from '../hooks';
import { bboxAround, bboxOf, inBBox, type BBox } from '../lib/geo';
import { geocode, parseRegionQuery, PART_LABEL, subBox } from '../lib/geocode';
import { buildHistory, matchSession, recommendSpotDay, sessionOverall, type HourRec, type Neighbour, type SpotRec } from '../lib/recommend';
import { scoreColor } from '../lib/rating';
import { bodyWord, levelName, stageBand, STAGES } from '../lib/skill';
import { addDays, fmtDate, fmtMin, isoToMin, nowMinutesAt, todayAt } from '../lib/time';
import { fmtFeature } from '../lib/format';
import { tideLabel, type Derived } from '../lib/conditions';
import { SIMILAR_MIN_K, similarityPct } from '../lib/similarity';
import MapView, { type MapMarker } from './MapView';
import SpotSheet from './SpotSheet';
import SpotThumb from './SpotThumb';
import { Icon } from './icons';
import { Card, CondBadges, ConditionsStatus, Empty, PickDetails, ScoreBadge, Segmented } from './ui';

interface Region {
  label: string;
  bbox: BBox;
}

/** "North of Fuerteventura" → ["Fuerteventura", "North"]; other labels stay one crumb. */
function crumbsOf(label: string): string[] {
  const m = /^(.+?) of (.+)$/.exec(label);
  return m ? [m[2], m[1]] : [label];
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
  /** The location picker (search + near me), opened from the breadcrumb. */
  const [locOpen, setLocOpen] = useState(false);
  const [dayOffset, setDayOffsetState] = useState(0);
  /** Time filter on the selected day: none (the whole day), now (today only) or an hour (minutes). */
  const [timeSel, setTimeSel] = useState<'now' | number | null>(null);
  const setDayOffset = (d: number) => {
    setDayOffsetState(d);
    if (d !== 0) setTimeSel((t) => (t === 'now' ? null : t));
  };
  const [selected, setSelected] = useState<string | null>(null);
  /** Spot whose details sheet is open (from a map marker or a list card). */
  const [sheet, setSheet] = useState<string | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);
  const openSheet = (id: string) => {
    setSelected(id);
    setSheet(id);
  };
  const phone = useMediaQuery(PHONE_QUERY);
  // A map marker: on phones it opens the spot; on wide screens map and list sit side by side, so it
  // highlights the spot and scrolls the list to its card (tap the card to open it).
  const onMarker = (id: string) => {
    if (phone) return openSheet(id);
    setSelected(id);
    // Scroll only the list (not the page), so the card lands at its top.
    const card = document.getElementById(`spot-${id}`);
    const list = card?.closest('.list-col');
    if (!card || !list) return;
    const top = list.scrollTop + card.getBoundingClientRect().top - list.getBoundingClientRect().top - 8;
    list.scrollTo({ top, behavior: 'smooth' });
  };
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
      setLocOpen(false);
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
        setLocOpen(false);
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

  // Rated for you, or for a typical surfer of another level ("Rate for", e.g. a friend).
  const rating = useRating(settings);
  const who = rating.forLevel ?? 'you';
  const recs: SpotRec[] = useMemo(() => {
    const out: SpotRec[] = [];
    for (const spot of regionSpots) {
      const s = bySpot.get(spot.id);
      if (!s) continue;
      const nowMin = dayOffset === 0 ? nowMinutesAt(s.utcOffsetSeconds) : null;
      out.push(recommendSpotDay(spot, s.hours, s.days, sessions, settings, rating.profile, date, today, nowMin, { history: rating.history }));
    }
    return out.sort((a, b) => (b.best?.score ?? -1) - (a.best?.score ?? -1));
  }, [regionSpots, bySpot, sessions, settings, date, today, dayOffset, rating]);


  // Every spot is ranked for you by the Day and Time filters: its best time window of the day, this
  // hour (Now, today only) or the chosen hour of the selected day.
  // Daylight hours of the selected day (today: from the current hour on), as minutes after midnight.
  const pickHours = useMemo(() => {
    const nowH = recs[0]?.now ? isoToMin(recs[0].now.time) ?? 0 : 0;
    const set = new Set<number>();
    for (const r of recs) for (const h of r.hours) if (h.daylight) set.add(isoToMin(h.time) ?? -1);
    return [...set].filter((m) => m >= 0 && (dayOffset !== 0 || m >= nowH)).sort((a, b) => a - b);
  }, [recs, dayOffset]);
  const dayOverEarly = dayOffset === 0 && recs.length > 0 && recs.every((r) => r.dayOver);
  // An hour that isn't on the selected day (e.g. already past today) counts as no time filter.
  const mode: 'day' | 'now' | 'time' =
    timeSel === 'now' ? (dayOffset === 0 && !dayOverEarly ? 'now' : 'day') : timeSel != null && pickHours.includes(timeSel) ? 'time' : 'day';
  const time = mode === 'time' ? (timeSel as number) : null;
  const ranked = useMemo(() => {
    const hourOf = (r: SpotRec): HourRec | null =>
      mode === 'now' ? (r.now?.daylight ? r.now : null) : mode === 'time' ? r.hours.find((h) => h.daylight && isoToMin(h.time) === time) ?? null : r.best;
    // On close scores, a spot the app knows well beats one rated by the general model only.
    const sureBonus = { high: 0.4, medium: 0.2, low: 0 } as const;
    // Spots that aren't for you (or have no rating) go after the rest; no hour at all goes last.
    const rank = (x: { hour: HourRec | null }) =>
      !x.hour ? -2 : x.hour.suit.status === 'unsuitable' || x.hour.sure.withheld ? -1 + x.hour.quality.q / 100 : x.hour.score + sureBonus[x.hour.sure.level];
    return recs.map((rec) => ({ rec, hour: hourOf(rec) })).sort((a, b) => rank(b) - rank(a));
  }, [recs, mode, time]);
  const anyGood = ranked.some((x) => x.hour && x.hour.score > 0.5);
  const darkNow = mode === 'now' && recs.length > 0 && !recs.some((r) => r.now?.daylight);
  const dayOver = dayOverEarly;

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

  // Markers show the same score for you as the list: for the day, now or the chosen hour.
  const hourBySpot = useMemo(() => new Map(ranked.map((x) => [x.rec.spot.id, x.hour])), [ranked]);
  const markers: MapMarker[] = spots.map((s) => {
    const inRegion = hourBySpot.has(s.id);
    const hour = hourBySpot.get(s.id) ?? null;
    const unsuitable = hour?.suit.status === 'unsuitable';
    const withheld = !!hour?.sure.withheld;
    return {
      id: s.id,
      lat: s.lat,
      lon: s.lon,
      color: !inRegion ? '#cbd5e1' : unsuitable || withheld ? '#94a3b8' : scoreColor(hour?.score ?? null),
      label: !inRegion || !hour ? '·' : unsuitable ? '✕' : withheld ? '?' : Math.round(hour.score).toString(),
      title: `${s.name}${hour && !unsuitable && !withheld ? ` – ${hour.score.toFixed(1)}/10 for ${who}` : ''}${unsuitable ? ` (not for ${who})` : ''}${withheld ? ' (no rating)' : ''}`,
      muted: !inRegion || unsuitable,
    };
  });

  const dayOptions = [0, 1, 2].map((o) => ({ id: String(o), label: o === 0 ? 'Today' : o === 1 ? 'Tomorrow' : fmtDate(addDays(today, o), { weekday: phone ? 'short' : 'long' }) }));
  const forWhen = `${mode === 'now' ? 'right now' : dayOffset === 0 ? 'today' : dayOffset === 1 ? 'tomorrow' : dayOptions[dayOffset].label}${mode === 'time' && time != null ? ` at ${fmtMin(time)}` : ''}`;

  return (
    <div className={`page explore view-${view}`}>
      <div className="explore-controls">
        {/* One panel for everything the list depends on: area and level, then day and time. */}
        <div className="filter-panel">
        <div className="explore-top">
          <button
            type="button"
            className="crumbs"
            aria-expanded={locOpen}
            aria-controls="loc-picker"
            onClick={() => setLocOpen(!locOpen)}
            title="Change the area"
          >
            <Icon name="pin" size={16} />
            <span className="crumb-list">
              {(region ? crumbsOf(region.label) : ['All spots']).map((c, i) => (
                <span key={i} className="crumb">
                  {i > 0 && <span className="crumb-sep" aria-hidden>›</span>}
                  {c}
                </span>
              ))}
            </span>
            <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {settings.profile && <LevelMenu mine={settings.profile} rateFor={rating.stage} go={go} />}
        </div>
        {locOpen && (
          <form
            id="loc-picker"
            className="searchbar"
            onSubmit={(e) => {
              e.preventDefault();
              search(query);
            }}
            onKeyDown={(e) => e.key === 'Escape' && setLocOpen(false)}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where are you? e.g. northern Fuerteventura"
              aria-label="Area"
              enterKeyHint="search"
            />
            <button className="btn primary" disabled={searching} aria-label="Show spots">
              <Icon name="search" size={18} />
              <span className="btn-text">{searching ? 'Searching…' : 'Show spots'}</span>
            </button>
            <button type="button" className="btn" onClick={nearMe} aria-label="Spots near me">
              <Icon name="locate" size={18} />
              <span className="btn-text">Near me</span>
            </button>
          </form>
        )}
        <div className="toolbar">
          <div className="tb-item tb-day">
            <span className="visually-hidden">Day</span>
            <Segmented options={dayOptions} value={String(dayOffset)} onChange={(v) => setDayOffset(Number(v))} />
          </div>
          <label className={`segmented tb-time${mode === 'day' ? '' : ' set'}`}>
            <Icon name="clock" size={15} />
            <select
              className="time-filter"
              aria-label="Time"
              value={mode === 'now' ? 'now' : mode === 'time' ? String(time) : ''}
              onChange={(e) => setTimeSel(e.target.value === '' ? null : e.target.value === 'now' ? 'now' : Number(e.target.value))}
            >
              <option value="">Any time</option>
              {dayOffset === 0 && !dayOver && <option value="now">Now</option>}
              {pickHours.map((m) => (
                <option key={m} value={m}>
                  {fmtMin(m)}
                </option>
              ))}
            </select>
          </label>
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
            onSelect={onMarker}
            // Desktop: the map fills its column (the page fits the window; only the list scrolls).
            height={fullMap ? `calc(100dvh - ${Math.round(mapTop)}px - 2.25rem - var(--switch-h) - env(safe-area-inset-bottom))` : phone ? 'min(62vh, 560px)' : '100%'}
          />
          <div className="map-foot">
            <span className="muted small">
              {region ? region.label : 'All spots'} · {regionSpots.length} spot{regionSpots.length === 1 ? '' : 's'}
              {loading ? ' · loading conditions…' : ''}
            </span>
          </div>
        </div>

        <div className="list-col">
          {!loading && regionSpots.length > 0 && recs.length > 0 && !anyGood && (
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
              ) : darkNow ? (
                <>
                  <strong>It's dark at the spots right now.</strong>
                  <p className="muted small">Set the time to Any time for today's best windows, or look at tomorrow.</p>
                </>
              ) : (
                <>
                  <strong>Nothing really works for {who} {forWhen}.</strong>
                  <p className="muted small">{mode === 'day' ? 'Check the spots below for details, or try another day.' : 'Try another time, or Any time for the best of the day.'}</p>
                </>
              )}
            </Card>
          )}

          {regionSpots.length === 0 && (
            <Empty>
              No spots known in this area yet. You can add your own under <strong>Settings → Spots</strong>.
            </Empty>
          )}

          {regionSpots.length > 0 && (
            <div className="list-head">
              {regionSpots.length} spot{regionSpots.length === 1 ? '' : 's'}
              {recs.length ? ` · best for ${who} ${forWhen} first` : ''}
            </div>
          )}
          <div className="spot-list">
            {(recs.length ? ranked : regionSpots.map((spot) => ({ rec: null, hour: null, spot }))).map((x) => {
              const rec = x.rec;
              const spot = rec ? rec.spot : (x as { spot: Spot }).spot;
              const hour = x.hour;
              return (
                <Card
                  key={spot.id}
                  id={`spot-${spot.id}`}
                  className={`spot-item${selected === spot.id ? ' selected' : ''}${hour && hour.score <= 0.5 ? ' dim' : ''}`}
                  onClick={(e: React.MouseEvent) => {
                    if (!(e.target as Element).closest('a, button')) openSheet(spot.id);
                  }}
                >
                  <SpotHead
                    spot={spot}
                    score={hour && !hour.sure.withheld ? hour.score : null}
                    scoreTitle={hour?.sure.withheld ? 'No rating: ' + hour.sure.withheld : `Predicted fun for ${who} (0–10)`}
                    onOpen={() => openSheet(spot.id)}
                  />
                  {rec && hour ? (
                    <>
                      {/* When, then the tide; the conditions of that hour as badges; then the details. */}
                      <div className="go-line">
                        {mode === 'now' ? (
                          <span className="muted">Now</span>
                        ) : mode === 'time' ? (
                          <>
                            <span className="muted">At</span> <strong>{fmtMin(time ?? 0)}</strong>
                          </>
                        ) : rec.bestWindow && hour.score > 0.5 ? (
                          <>
                            <span className="muted">Go</span>{' '}
                            <strong>
                              {fmtMin(rec.bestWindow[0])}–{fmtMin(rec.bestWindow[1])}
                            </strong>
                          </>
                        ) : (
                          <>
                            <span className="muted">Best at</span> <strong>{fmtMin(isoToMin(hour.time) ?? 0)}</strong>
                          </>
                        )}
                        {hour.derived.tideNorm != null && <span className="go-tide"> · tide {tideLabel(hour.derived.tideNorm, hour.derived.tideTrend)}</span>}
                      </div>
                      <CondBadges d={hour.derived} settings={settings} />
                      <PickDetails rec={rec} hour={hour} who={who} forLevel={rating.forLevel} timing={mode === 'day'} dayWord={dayWord} />
                    </>
                  ) : (
                    <div className="muted small cond-line">
                      {loading || (!rec && !error) ? 'Loading conditions…' : !rec ? 'No conditions available' : mode === 'now' ? "It's dark at the spot right now." : 'No daylight hours left on this day.'}
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
            <SpotSheet spot={spot} spots={spots} sessions={sessions} settings={settings} initialDay={dayOffset} focusMin={mode === 'time' ? time ?? undefined : undefined} onClose={closeSheet} go={go} />
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

/**
 * The level chip on Explore. Shows your level; tap it for the "Rate for" menu: you, or any level
 * (a typical surfer of that level, e.g. a friend), plus a link to your surfing profile. While
 * rating for another level the chip turns accent-coloured, reads "Rating for: Advanced" and gets
 * an × to go back to you. Not saved: reopening the app rates for you again.
 */
function LevelMenu({ mine, rateFor, go }: { mine: SkillProfile; rateFor: Stage | null; go: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const pick = (s: Stage | null) => {
    setRateFor(s);
    setOpen(false);
  };
  const other = rateFor != null;
  return (
    <div className="level-menu" ref={ref}>
      <div className={`level-chip-row${other ? ' other' : ''}`}>
        <button
          type="button"
          className={`tb-you level-badge band-${stageBand(other ? rateFor : mine.stage).toLowerCase()}${other ? ' rating-other' : ''}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          title={
            other
              ? `Spots are rated for a typical ${levelName(rateFor)} surfer, without your sessions. Tap to change.`
              : `Your level: ${levelName(mine.stage)} (stage ${mine.stage} of 8), comfortable to ${bodyWord(mine.comfort)}. Tap to rate spots for another level.`
          }
        >
          {other ? (
            <>
              <span className="for">
                <span className="long">Rating for</span>
                <span className="short">For</span>
              </span>{' '}
              {levelName(rateFor)}
            </>
          ) : (
            levelName(mine.stage)
          )}
        </button>
        {other && (
          <button type="button" className="rating-reset" onClick={() => setRateFor(null)} aria-label="Rate for you again" title="Rate for you again">
            <Icon name="close" size={14} />
          </button>
        )}
      </div>
      {open && (
        <div className="level-pop" role="menu" aria-label="Rate spots for">
          <div className="level-pop-head">Rate spots for</div>
          <button type="button" role="menuitemradio" aria-checked={!other} className={!other ? 'on' : ''} onClick={() => pick(null)}>
            <span>
              <strong>Me</strong> · {levelName(mine.stage)}
            </span>
            <span className="muted tiny">your profile and sessions</span>
          </button>
          <div className="level-pop-sep">Someone else</div>
          {STAGES.map((s) => (
            <button
              key={s.stage}
              type="button"
              role="menuitemradio"
              aria-checked={rateFor === s.stage}
              className={rateFor === s.stage ? 'on' : ''}
              onClick={() => pick(s.stage)}
              title={`${s.title}. Comfortable to ${bodyWord(s.comfort)}.`}
            >
              <span>
                <span className={`band-dot band-${stageBand(s.stage).toLowerCase()}`} aria-hidden /> {s.level}
              </span>
              <span className="muted tiny">
                {s.short} · to {bodyWord(s.comfort)}
              </span>
            </button>
          ))}
          <button
            type="button"
            className="level-pop-link"
            onClick={() => {
              setOpen(false);
              go('settings');
            }}
          >
            Edit your surfing profile →
          </button>
        </div>
      )}
    </div>
  );
}
