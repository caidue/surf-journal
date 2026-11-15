import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Session, Settings, Spot, Trip } from '../types';
import { db, deleteTrip, saveTrip } from '../db';
import { useTrips } from '../hooks';
import { deriveSeries, windKind, WIND_LABEL } from '../lib/conditions';
import { sessionOverall, surfedHourIdx } from '../lib/recommend';
import { fmtDate, fmtDuration, fmtMin, uid } from '../lib/time';
import { fmtSurfRange, fmtWind } from '../lib/format';
import { FEEL_OPTIONS } from '../lib/skill';
import { Card, Empty, ScoreBadge } from './ui';
import { Icon } from './icons';

export function sessionSummary(s: Session, spot: Spot | undefined, settings: Settings): string {
  if (!spot) return '';
  const der = deriveSeries(spot, s.conditions);
  const idx = surfedHourIdx(s);
  const hbs = idx.map((i) => der[i]?.hb).filter((v): v is number => v != null);
  const mid = der[idx[Math.floor(idx.length / 2)]];
  if (!mid) return '';
  const hb = hbs.length ? hbs.reduce((a, b) => a + b, 0) / hbs.length : null;
  const wk = windKind(mid);
  const feel = FEEL_OPTIONS.find((f) => f.id === s.fields.feel)?.label.toLowerCase();
  return `${fmtSurfRange(hb, settings.heightUnit)} · ${mid.tDom ? Math.round(mid.tDom) + ' s' : '–'} · ${wk ? WIND_LABEL[wk] : '–'} ${fmtWind(mid.windSpeed, settings.windUnit)}${feel ? ` · felt ${feel}` : ''}`;
}

const TRIP_KEY = 'surf-journal.trip';
/** Journal filter by trip: '' = all sessions, 'none' = not in a trip, else a trip id. */
function loadTripSel(): string {
  try {
    return localStorage.getItem(TRIP_KEY) ?? '';
  } catch {
    return '';
  }
}

/** "Nov 3 – Nov 17, 2026" from the trip's dates, else from its sessions' first and last day. */
function tripSpan(t: Trip, items: Session[]): string {
  const days = items.map((s) => s.date).sort();
  const from = t.from ?? days[0];
  const to = t.to ?? days[days.length - 1];
  if (!from || !to) return '';
  const full: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  if (from === to) return fmtDate(from, full);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${fmtDate(from, sameYear ? { day: 'numeric', month: 'short' } : full)} – ${fmtDate(to, full)}`;
}

export default function Journal({ spots, sessions, settings, go }: { spots: Spot[]; sessions: Session[]; settings: Settings; go: (p: string) => void }) {
  const trips = useTrips();
  const [tripSel, setTripSelState] = useState(loadTripSel);
  const setTripSel = (v: string) => {
    setTripSelState(v);
    try {
      localStorage.setItem(TRIP_KEY, v);
    } catch {
      /* per-viewer convenience only */
    }
  };
  // A deleted (or unknown) trip falls back to all sessions.
  const tripFilter = tripSel === 'none' || trips.some((t) => t.id === tripSel) ? tripSel : '';
  const trip = trips.find((t) => t.id === tripFilter) ?? null;
  /** The new/rename trip form: null = closed, 'new' or the trip being renamed. */
  const [editing, setEditing] = useState<'new' | Trip | null>(null);
  const onTripDone = useCallback((saved: Trip | null) => {
    setEditing(null);
    if (saved) setTripSelState(saved.id);
    try {
      if (saved) localStorage.setItem(TRIP_KEY, saved.id);
    } catch {
      /* per-viewer convenience only */
    }
  }, []);
  const [spotFilter, setSpotFilter] = useState('');
  const [hideExcluded, setHideExcluded] = useState(false);
  const [page, setPage] = useState(0);
  const spotById = useMemo(() => new Map(spots.map((s) => [s.id, s])), [spots]);

  const tripById = useMemo(() => new Map(trips.map((t) => [t.id, t])), [trips]);
  const inTrip = (s: Session) => (tripFilter === '' ? true : tripFilter === 'none' ? !s.tripId || !tripById.has(s.tripId) : s.tripId === tripFilter);
  // The trip's (or all) sessions: the stats and the spot filter follow the selected trip.
  const scope = useMemo(() => sessions.filter(inTrip), [sessions, tripFilter, tripById]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = useMemo(
    () =>
      scope
        .filter((s) => !spotFilter || s.spotId === spotFilter)
        .filter((s) => !hideExcluded || !s.excluded)
        .sort((a, b) => (b.date + String(b.startMin).padStart(4, '0')).localeCompare(a.date + String(a.startMin).padStart(4, '0'))),
    [scope, spotFilter, hideExcluded],
  );

  // 10 sessions per page, newest first; back to the first page whenever the filters change.
  const PAGE = 10;
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  useEffect(() => setPage(0), [spotFilter, hideExcluded, tripFilter]);
  const current = Math.min(page, pages - 1);
  const shown = list.slice(current * PAGE, current * PAGE + PAGE);
  const goPage = (p: number) => {
    setPage(p);
    document.querySelector('.session-list')?.closest('section')?.scrollIntoView({ block: 'start' });
  };

  const groups = useMemo(() => {
    const m = new Map<string, Session[]>();
    for (const s of shown) {
      const k = s.date.slice(0, 7);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return [...m.entries()];
  }, [shown]);

  const relevant = scope.filter((s) => !s.excluded);
  const minutes = relevant.reduce((a, s) => a + (s.endMin - s.startMin), 0);
  const funs = relevant.map(sessionOverall).filter((v): v is number => v != null);

  const toggle = (s: Session) => db.sessions.update(s.id, { excluded: !s.excluded, updatedAt: Date.now() });

  const usedSpots = spots.filter((sp) => scope.some((s) => s.spotId === sp.id));
  const count = (id: string) => sessions.filter((s) => (id === 'none' ? !s.tripId || !tripById.has(s.tripId) : s.tripId === id)).length;
  const noTrip = trips.length ? count('none') : 0;

  return (
    <div className="page">
      {/* The title is the trip filter: a dropdown with All sessions, each trip (edit / delete),
          Not in a trip and New trip. "+" logs a session (into the selected trip). */}
      <div className="page-head">
        <TripMenu
          title={trip ? trip.name : tripFilter === 'none' ? 'Not in a trip' : 'All sessions'}
          trips={trips}
          selected={tripFilter}
          total={sessions.length}
          count={count}
          noTrip={noTrip}
          onSelect={setTripSel}
          onNew={() => setEditing('new')}
          onEdit={(t) => setEditing(t)}
          onDelete={(t) => {
            const n = count(t.id);
            if (window.confirm(`Delete the trip “${t.name}”? Its ${n} session${n === 1 ? '' : 's'} stay in your journal.`)) {
              deleteTrip(t.id);
              if (tripFilter === t.id) setTripSel('');
            }
          }}
        />
        <button
          className="btn primary icon-btn"
          onClick={() => go(trip ? `log?trip=${encodeURIComponent(trip.id)}` : 'log')}
          aria-label={trip ? `Log a session in ${trip.name}` : 'Log a session'}
          title={trip ? `Log a session in ${trip.name}` : 'Log a session'}
        >
          <Icon name="plus" size={22} />
        </button>
      </div>
      {trip && editing === null && (
        <p className="trip-sub small muted">
          {[tripSpan(trip, scope), `${scope.length} session${scope.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
          {trip.from && trip.to ? ' · sessions on these days join automatically' : ''}
        </p>
      )}

      {editing && <TripForm trip={editing === 'new' ? null : editing} onDone={onTripDone} />}

      <div className="stats">
        <div>
          <strong>{relevant.length}</strong>
          <span>relevant sessions</span>
        </div>
        <div>
          <strong>{Math.floor(minutes / 60)}h {String(minutes % 60).padStart(2, "0")}m</strong>
          <span>in water</span>
        </div>
        <div>
          <strong>{new Set(relevant.map((s) => s.spotId)).size}</strong>
          <span>spots</span>
        </div>
        <div>
          <strong>{funs.length ? (funs.reduce((a, b) => a + b, 0) / funs.length).toFixed(1) : '–'}</strong>
          <span>avg. fun</span>
        </div>
      </div>

      <Card className="filters">
        <div className="filter-row">
          <select value={spotFilter} onChange={(e) => setSpotFilter(e.target.value)} aria-label="Filter by spot">
            <option value="">All spots</option>
            {usedSpots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <label className="check small">
            <input type="checkbox" checked={hideExcluded} onChange={(e) => setHideExcluded(e.target.checked)} /> hide not relevant
          </label>
        </div>
      </Card>

      {list.length === 0 ? (
        <Empty>
          {trip && scope.length === 0
            ? 'No sessions in this trip yet. Pick the trip when you log or edit a session, or give the trip dates to collect the sessions on those days.'
            : sessions.length
              ? 'No sessions match the filters.'
              : 'No sessions yet. Log your first one, or load demo sessions in Settings to try the recommendations.'}
        </Empty>
      ) : (
        <>
        {groups.map(([month, items]) => (
          <section key={month}>
            <h3 className="month">{fmtDate(month + '-15', { month: 'long', year: 'numeric' })}</h3>
            <div className="session-list">
              {items.map((s) => {
                const spot = spotById.get(s.spotId);
                const summary = sessionSummary(s, spot, settings);
                const others = settings.categories.filter((c) => c.id !== 'fun' && s.ratings?.[c.id] != null);
                return (
                  <Card key={s.id} className={`session-item${s.excluded ? ' excluded' : ''}`}>
                    <a href={`#/session/${s.id}`} className="session-main">
                      <ScoreBadge score={sessionOverall(s)} />
                      <div>
                        <div>
                          <strong>{spot?.name ?? 'Unknown spot'}</strong> <span className="muted small">{fmtDate(s.date)}</span>
                          {s.demo && <span className="badge muted">demo</span>}
                          {tripFilter === '' && s.tripId && tripById.has(s.tripId) && (
                            <span className="badge trip-badge">
                              <Icon name="folder" size={12} /> {tripById.get(s.tripId)!.name}
                            </span>
                          )}
                          {(s.conditionsPending || !s.conditions.length) && (
                            <span className="badge pending" title="Logged offline: the conditions are added automatically the next time the app is online.">
                              conditions pending
                            </span>
                          )}
                        </div>
                        <div className="small">
                          {fmtMin(s.startMin)}–{fmtMin(s.endMin)} ({fmtDuration(s.endMin - s.startMin)})
                          {summary && ` · ${summary}`}
                        </div>
                        {others.length > 0 && <div className="small muted">{others.map((c) => `${c.name} ${s.ratings?.[c.id]}`).join(' · ')}</div>}
                        {s.tags.length > 0 && <div className="small muted">{s.tags.join(', ')}</div>}
                        {s.notes && <div className="small session-notes">{s.notes}</div>}
                      </div>
                    </a>
                    <label className="check small relevance" title="Not relevant sessions stay in your journal but are ignored for predictions">
                      <input type="checkbox" checked={!s.excluded} onChange={() => toggle(s)} /> relevant
                    </label>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
        {pages > 1 && (
          <nav className="pager" aria-label="Journal pages">
            <button className="btn" disabled={current === 0} onClick={() => goPage(current - 1)}>
              ← Newer
            </button>
            <span className="small muted">
              {current * PAGE + 1}–{current * PAGE + shown.length} of {list.length}
            </span>
            <button className="btn" disabled={current >= pages - 1} onClick={() => goPage(current + 1)}>
              Older →
            </button>
          </nav>
        )}
        </>
      )}
    </div>
  );
}

/** Create or edit a trip: a name and, optionally, the days it covers. */
function TripForm({ trip, onDone }: { trip: Trip | null; onDone: (saved: Trip | null) => void }) {
  const [name, setName] = useState(trip?.name ?? '');
  const [from, setFrom] = useState(trip?.from ?? '');
  const [to, setTo] = useState(trip?.to ?? '');
  const [busy, setBusy] = useState(false);
  const datesOk = (!from && !to) || (!!from && !!to && from <= to);
  const ok = name.trim().length > 0 && datesOk;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true);
    const now = Date.now();
    const t: Trip = { id: trip?.id ?? uid(), name: name.trim(), createdAt: trip?.createdAt ?? now, updatedAt: now };
    if (from && to) Object.assign(t, { from, to });
    await saveTrip(t);
    onDone(t);
  };
  // Its own window over the journal: Esc or a tap outside cancels.
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onDone(null);
    document.addEventListener('keydown', esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = overflow;
    };
  }, [onDone]);
  return createPortal(
    <div className="dialog-backdrop" onClick={() => onDone(null)}>
    <div className="dialog trip-form" role="dialog" aria-modal="true" aria-labelledby="trip-form-title" onClick={(e) => e.stopPropagation()}>
      <form onSubmit={submit}>
        <h3 id="trip-form-title">{trip ? 'Edit trip' : 'New trip'}</h3>
        <label className="field first">
          Name
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fuerteventura, November 2026" maxLength={60} />
        </label>
        <div className="trip-dates">
          <label className="field">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="field">
            To
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <p className="muted tiny">
          Optional. With dates, your sessions on those days that aren't in another trip join it, and sessions you log on those days start in this trip.
        </p>
        {!datesOk && <p className="small warn">Set both dates (the end on or after the start), or neither.</p>}
        <div className="row gap dialog-actions">
          <button type="button" className="btn" onClick={() => onDone(null)}>
            Cancel
          </button>
          <button className="btn primary" disabled={!ok || busy}>
            {trip ? 'Save trip' : 'Create trip'}
          </button>
        </div>
      </form>
    </div>
    </div>,
    document.body,
  );
}

/**
 * The journal title as a dropdown: All sessions, each trip (with its count, edit and delete),
 * Not in a trip (when there are trips) and New trip. Closes on a choice, a tap outside or Esc.
 */
function TripMenu({
  title,
  trips,
  selected,
  total,
  count,
  noTrip,
  onSelect,
  onNew,
  onEdit,
  onDelete,
}: {
  title: string;
  trips: Trip[];
  selected: string;
  total: number;
  count: (id: string) => number;
  noTrip: number;
  onSelect: (id: string) => void;
  onNew: () => void;
  onEdit: (t: Trip) => void;
  onDelete: (t: Trip) => void;
}) {
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
  const act = (f: () => void) => {
    setOpen(false);
    f();
  };
  return (
    <div className="trip-menu" ref={ref}>
      <h1>
        <button type="button" className="trip-title" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="trip-title-text">{title}</span>
          <svg className="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </h1>
      {open && (
        <div className="trip-pop" role="menu" aria-label="Show sessions">
          <div className={`trip-item${selected === '' ? ' on' : ''}`}>
            <button type="button" role="menuitemradio" aria-checked={selected === ''} className="trip-pick" onClick={() => act(() => onSelect(''))}>
              <span>All sessions</span>
              <span className="n">{total}</span>
            </button>
          </div>
          {trips.length > 0 && <div className="trip-pop-sep">Trips</div>}
          {trips.map((t) => (
            <div key={t.id} className={`trip-item${selected === t.id ? ' on' : ''}`}>
              <button type="button" role="menuitemradio" aria-checked={selected === t.id} className="trip-pick" onClick={() => act(() => onSelect(t.id))}>
                <Icon name="folder" size={15} />
                <span className="trip-name">{t.name}</span>
                <span className="n">{count(t.id)}</span>
              </button>
              <button type="button" className="trip-act" onClick={() => act(() => onEdit(t))} aria-label={`Edit ${t.name}`} title="Edit trip">
                <Icon name="edit" size={16} />
              </button>
              <button type="button" className="trip-act danger" onClick={() => act(() => onDelete(t))} aria-label={`Delete ${t.name}`} title="Delete trip">
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
          {noTrip > 0 && (
            <div className={`trip-item${selected === 'none' ? ' on' : ''}`}>
              <button type="button" role="menuitemradio" aria-checked={selected === 'none'} className="trip-pick" onClick={() => act(() => onSelect('none'))}>
                <span className="muted">Not in a trip</span>
                <span className="n">{noTrip}</span>
              </button>
            </div>
          )}
          <button type="button" className="trip-new" onClick={() => act(onNew)}>
            <Icon name="plus" size={16} /> New trip
          </button>
        </div>
      )}
    </div>
  );
}
