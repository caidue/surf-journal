import { useEffect, useMemo, useState } from 'react';
import type { DayInfo, HourConditions, Level, Session, SessionFields, Settings, Spot } from '../types';
import { db, saveSettings } from '../db';
import { fetchOne, isOfflineError } from '../lib/openMeteo';
import { requestPersistence } from '../lib/pwa';
import { syncPendingSessions } from '../lib/sync';
import { samplePoint } from '../lib/geo';
import { deriveSeries, tideLabel, windKind, WIND_LABEL } from '../lib/conditions';
import { recommendability } from '../lib/rating';
import { calibratedGain, OBSERVED_SIZES } from '../lib/recommend';
import { fmtDate, fmtDuration, fmtMin, isoToMin, todayAt, uid } from '../lib/time';
import { fmtSurfRange, fmtWind } from '../lib/format';
import Timeline, { type HourScore, type Range } from './Timeline';
import { ActionBar, Card, Chips, LevelPicker, Segmented } from './ui';
import SpotPicker from './SpotPicker';

const WETSUITS = ['Boardshorts', 'Shorty / top', '3/2', '4/3', '5/4+'].map((x) => ({ id: x, label: x }));
const CROWD = ['Empty', 'Few', 'Moderate', 'Crowded', 'Packed'].map((x) => ({ id: x, label: x }));
const VS_FORECAST = ['Worse', 'As forecast', 'Better'].map((x) => ({ id: x, label: x }));
export const TAGS = ['Glassy', 'Choppy', 'Closeouts', 'Barrels', 'Long rides', 'Strong current', 'Crowded peak', 'Sea life', 'Progress made', 'New board', 'Injured'].map((x) => ({
  id: x,
  label: x,
}));

export default function SessionEditor({
  spots,
  sessions,
  settings,
  id,
  preset,
  go,
}: {
  spots: Spot[];
  sessions: Session[];
  settings: Settings;
  id?: string;
  preset?: { spotId?: string | null; date?: string | null };
  go: (p: string) => void;
}) {
  const existing = id ? sessions.find((s) => s.id === id) : undefined;
  const today = todayAt();
  const [spotId, setSpotId] = useState(existing?.spotId ?? preset?.spotId ?? '');
  const [date, setDate] = useState(existing?.date ?? preset?.date ?? today);
  const [range, setRange] = useState<Range | null>(existing ? { startMin: existing.startMin, endMin: existing.endMin } : null);
  /** One 1–10 rating per category; unset until you touch the slider. Fun is required. */
  const [ratings, setRatings] = useState<Record<string, number | null>>(() => Object.fromEntries(settings.categories.map((c) => [c.id, existing?.ratings?.[c.id] ?? null])));
  const setRating = (id: string, v: number | null) => setRatings((r) => ({ ...r, [id]: v }));
  const [fields, setFields] = useState<SessionFields>(existing?.fields ?? {});
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [skill, setSkill] = useState<Level>(existing?.skillAtTime ?? settings.level);
  const hasSaved = !!existing?.conditions?.length;
  const [conditions, setConditions] = useState<HourConditions[] | null>(hasSaved ? existing!.conditions : null);
  /** Conditions come from an older saved forecast (offline); replaced when back online. */
  const [stale, setStale] = useState<{ at: number } | null>(existing?.conditionsPending && hasSaved ? { at: existing.updatedAt } : null);
  const [days, setDays] = useState<DayInfo[]>(existing?.days ?? []);
  const [source, setSource] = useState(existing?.conditionsSource ?? '');
  const [condState, setCondState] = useState<{ loading: boolean; error: string | null; offline?: boolean }>({ loading: false, error: null });
  const narrow = typeof window !== 'undefined' && window.innerWidth < 700;
  const [zoom, setZoom] = useState<'session' | 'daylight' | 'full'>(existing && narrow ? 'session' : 'daylight');
  /** spot|date the shown conditions belong to, and the one last imported fresh from the network. */
  const [condKey, setCondKey] = useState(existing && hasSaved ? `${existing.spotId}|${existing.date}` : '');
  const [loadedKey, setLoadedKey] = useState(existing && hasSaved && !existing.conditionsPending ? `${existing.spotId}|${existing.date}` : '');
  const [saving, setSaving] = useState(false);

  const spot = spots.find((s) => s.id === spotId);

  const load = async (force = false) => {
    if (!spot || !date) return;
    setCondState({ loading: true, error: null });
    try {
      const s = await fetchOne(samplePoint(spot), date, date, { force });
      const hours = s.hours.filter((h) => h.time.startsWith(date));
      if (!hours.length) throw new Error('No data for this date');
      // Offline and the session already has conditions: keep them rather than an older forecast.
      if (s.stale && conditions?.length && !stale && condKey === `${spot.id}|${date}`) throw new TypeError('offline');
      setConditions(hours);
      setDays(s.days);
      setSource(s.stale ? `${s.source} · saved ${new Date(s.fetchedAt).toLocaleString()}` : s.source);
      setStale(s.stale ? { at: s.fetchedAt } : null);
      setCondKey(`${spot.id}|${date}`);
      if (!s.stale) setLoadedKey(`${spot.id}|${date}`);
      setCondState({ loading: false, error: null });
    } catch (e: any) {
      setCondState({ loading: false, error: e?.message ?? String(e), offline: isOfflineError(e) });
    }
  };

  useEffect(() => {
    if (!spot || !date) return;
    const key = `${spot.id}|${date}`;
    if (key !== condKey) {
      setConditions(null);
      setStale(null);
    }
    if (key !== loadedKey) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotId, date]);

  // The background sync filled in this session's conditions while it was open: use them.
  useEffect(() => {
    if (existing?.conditions?.length && !existing.conditionsPending && (!conditions?.length || stale) && spotId === existing.spotId && date === existing.date) {
      setConditions(existing.conditions);
      setDays(existing.days ?? []);
      setSource(existing.conditionsSource);
      setStale(null);
      setCondState({ loading: false, error: null });
      setCondKey(`${existing.spotId}|${existing.date}`);
      setLoadedKey(`${existing.spotId}|${existing.date}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.conditions, existing?.conditionsPending]);


  const gain = useMemo(() => (spot ? calibratedGain(spot, sessions.filter((s) => s.id !== id)).gain : 1), [spot, sessions, id]);
  const derived = useMemo(() => (spot && conditions ? deriveSeries(spot, conditions, gain) : []), [spot, conditions, gain]);
  const scores: (HourScore | null)[] = useMemo(
    () =>
      spot
        ? derived.map((d) => {
            const r = recommendability(spot, d, skill);
            return { score: r.score, unsuitable: r.suit.status === 'unsuitable', title: `${r.score.toFixed(1)}/10 for ${skill}${r.suit.reasons.length ? ' – ' + r.suit.reasons.join('; ') : ''}` };
          })
        : [],
    [derived, spot, skill],
  );

  const dayInfo = days.find((d) => d.date === date);
  const rise = isoToMin(dayInfo?.sunrise);
  const set = isoToMin(dayInfo?.sunset);
  // The session zoom is frozen when chosen, so dragging the range doesn't move the axis under the pointer.
  const sessionView = (r: Range): [number, number] => [Math.max(0, Math.floor((r.startMin - 60) / 60) * 60), Math.min(1440, Math.ceil((r.endMin + 60) / 60) * 60)];
  const [frozen, setFrozen] = useState<[number, number] | null>(existing && narrow ? sessionView(existing) : null);
  const chooseZoom = (z: 'session' | 'daylight' | 'full') => {
    if (z === 'session' && range) setFrozen(sessionView(range));
    setZoom(z);
  };
  const view: [number, number] =
    zoom === 'full'
      ? [0, 1440]
      : zoom === 'session' && range && frozen
        ? frozen
        : [Math.max(0, Math.floor(((rise ?? 420) - 60) / 60) * 60), Math.min(1440, Math.ceil(((set ?? 1170) + 60) / 60) * 60)];

  const sessionHours = range && conditions ? derived.filter((d) => {
    const m = isoToMin(d.time) ?? 0;
    return m + 60 > range.startMin && m < range.endMin;
  }) : [];
  const summary = (() => {
    if (!sessionHours.length) return null;
    const hbs = sessionHours.map((d) => d.hb).filter((v): v is number => v != null);
    const first = sessionHours[0];
    const last = sessionHours[sessionHours.length - 1];
    const mid = sessionHours[Math.floor(sessionHours.length / 2)];
    const wk = windKind(mid);
    return {
      size: hbs.length ? `${fmtSurfRange(Math.min(...hbs), settings.heightUnit).split('–')[0]}–${fmtSurfRange(Math.max(...hbs), settings.heightUnit).split('–')[1]}` : '–',
      period: mid.tDom ? `${Math.round(mid.tDom)} s` : '–',
      wind: wk ? `${WIND_LABEL[wk]} ${fmtWind(mid.windSpeed, settings.windUnit)}` : '–',
      tide: `${tideLabel(first.tideNorm, first.tideTrend)} → ${tideLabel(last.tideNorm, last.tideTrend)}`,
    };
  })();

  // What's still missing before the session can be saved (shown next to the Save button).
  // Conditions aren't required: without a connection the session is saved and filled in later.
  const missing = [!spot && 'choose a spot', spot && !range && 'mark your time on the chart', ratings.fun == null && 'rate Fun'].filter(Boolean) as string[];
  const canSave = missing.length === 0 && !condState.loading;
  const pending = !conditions?.length || !!stale;

  const save = async () => {
    if (!spot || !range || ratings.fun == null) return;
    setSaving(true);
    const now = Date.now();
    const sess: Session = {
      id: existing?.id ?? uid(),
      spotId: spot.id,
      date,
      startMin: range.startMin,
      endMin: range.endMin,
      ratings: Object.fromEntries(Object.entries(ratings).filter((e): e is [string, number] => e[1] != null)),
      conditions: conditions ?? [],
      conditionsSource: conditions ? source : '',
      conditionsPending: pending,
      days: days.filter((d) => d.date === date),
      fields,
      tags,
      notes,
      // Relevance is set in the Journal (per session) or Settings (cut-off date), not here.
      excluded: existing?.excluded ?? false,
      skillAtTime: skill,
      demo: existing?.demo,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await db.sessions.put(sess);
    if (fields.board && !settings.boards.includes(fields.board)) await saveSettings({ boards: [...settings.boards, fields.board] });
    requestPersistence();
    if (pending && navigator.onLine) syncPendingSessions().catch(() => {});
    setSaving(false);
    go('journal');
  };

  const remove = async () => {
    if (!existing) return;
    if (!confirm('Delete this session permanently? This cannot be undone.')) return;
    await db.sessions.delete(existing.id);
    go('journal');
  };

  return (
    <div className="page narrow with-action-bar">
      <div className="page-head">
        <h1>{existing ? 'Session' : 'Log a session'}</h1>
        {existing && (
          <span className="muted small">
            {fmtDate(existing.date)} · last edited {new Date(existing.updatedAt).toLocaleDateString()}
            {existing.demo ? ' · demo data' : ''}
          </span>
        )}
      </div>

      <Card>
        <div className="form-grid">
          <div className="field-inline">
            <span className="field-label">Spot</span>
            <SpotPicker spots={spots} value={spotId} onChange={setSpotId} />
          </div>
          <label>
            Date
            <input type="date" value={date} max={today} min="2021-11-01" onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Your level that day
            <LevelPicker value={skill} onChange={setSkill} label="Your level that day" />
          </label>
        </div>
      </Card>

      {spot && (
        <Card>
          <div className="row between wrap">
            <h3>
              When were you at {spot.name} on {fmtDate(date)}?
            </h3>
            <div className="row gap wrap">
              <Segmented
                options={[
                  { id: 'session', label: 'Session', disabled: !range, title: range ? 'Zoom to your session' : 'Mark your time on the chart first' },
                  { id: 'daylight', label: 'Daylight' },
                  { id: 'full', label: 'Full day' },
                ]}
                value={zoom === 'session' && !range ? 'daylight' : zoom}
                onChange={chooseZoom}
              />
            </div>
          </div>
          {condState.error && !condState.offline && <div className="alert">Couldn't import conditions: {condState.error}</div>}
          {condState.offline && !conditions && (
            <div className="alert info">
              You're offline, so the conditions can't be imported right now. Log your session anyway: they're added automatically the next time the app is online.
            </div>
          )}
          {condState.offline && conditions && !stale && <p className="muted small">You're offline: showing the conditions imported earlier.</p>}
          {stale && (
            <div className="alert info">
              Offline: showing the forecast saved {new Date(stale.at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}. It's replaced with the latest data when
              you're back online.
            </div>
          )}
          {conditions || (condState.error && !condState.loading) ? (
            <>
              <p className="muted small">Drag across the chart to mark when you were in the water (drag the edges to adjust).</p>
              <Timeline
                hours={conditions ?? []}
                emptyText="Conditions are added when you're online"
                derived={derived}
                scores={scores}
                scoreLabel="Guide"
                sunrise={rise}
                sunset={set}
                heightUnit={settings.heightUnit}
                windUnit={settings.windUnit}
                view={view}
                session={range}
                onSessionChange={setRange}
              />
              {summary && range && (
                <div className="summary">
                  <strong>
                    {fmtMin(range.startMin)}–{fmtMin(range.endMin)}
                  </strong>{' '}
                  ({fmtDuration(range.endMin - range.startMin)}) · surf {summary.size} · {summary.period} · {summary.wind} · tide {summary.tide}
                </div>
              )}
            </>
          ) : (
            <div className="muted">{condState.loading ? 'Importing conditions…' : 'Choose a spot and date.'}</div>
          )}
        </Card>
      )}

      {spot && (
        <Card>
          <h3>How was it?</h3>
          <div className="ratings">
            {settings.categories.map((c) => {
              const v = ratings[c.id] ?? null;
              return (
                <div key={c.id} className={`rating-row${v == null ? ' unset' : ''}`} style={{ '--c': c.color } as React.CSSProperties}>
                  <span className="rating-name">
                    <span className="dot" /> {c.name}
                    {c.id === 'fun' && <span className="req">required</span>}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={v ?? 5}
                    aria-label={`${c.name}, 1 to 10`}
                    onPointerDown={() => v == null && setRating(c.id, 5)}
                    onKeyDown={() => v == null && setRating(c.id, 5)}
                    onChange={(e) => setRating(c.id, Number(e.target.value))}
                  />
                  <span className="rating-val">{v == null ? '–' : v}</span>
                  <button className="link small rating-clear" style={{ visibility: v == null ? 'hidden' : 'visible' }} onClick={() => setRating(c.id, null)} aria-label={`Clear ${c.name}`}>
                    clear
                  </button>
                </div>
              );
            })}
          </div>
          <p className="muted tiny">1 = very low, 10 = very high</p>
        </Card>
      )}

      {spot && (
        <Card>
          <h3>Details</h3>
          <h4 className="subsection">Waves & conditions</h4>
          <div className="field first">
            <span>Wave size you actually saw</span>
            <Chips small options={OBSERVED_SIZES.map((o) => ({ id: o.id, label: o.label }))} value={fields.observedSize} onChange={(v) => setFields({ ...fields, observedSize: v ?? undefined })} />
            <span className="muted tiny">Used to calibrate this spot's surf-height estimate.</span>
          </div>
          <div className="field">
            <span>Compared with the forecast</span>
            <Chips small options={VS_FORECAST} value={fields.vsForecast} onChange={(v) => setFields({ ...fields, vsForecast: v ?? undefined })} />
          </div>
          <label className="field narrow-field">
            Waves caught
            <input type="number" inputMode="numeric" min={0} value={fields.waves ?? ''} onChange={(e) => setFields({ ...fields, waves: e.target.value === '' ? null : Number(e.target.value) })} />
          </label>

          <h4 className="subsection">Gear</h4>
          <label className="field first">
            Board
            <input list="boards" value={fields.board ?? ''} onChange={(e) => setFields({ ...fields, board: e.target.value })} placeholder="e.g. 6'2 shortboard" />
            <datalist id="boards">
              {settings.boards.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </label>
          <div className="field">
            <span>Wetsuit</span>
            <Chips small options={WETSUITS} value={fields.wetsuit} onChange={(v) => setFields({ ...fields, wetsuit: v ?? undefined })} />
          </div>

          <h4 className="subsection">Crowd & vibe</h4>
          <div className="field first">
            <span>Crowd</span>
            <Chips small options={CROWD} value={fields.crowd} onChange={(v) => setFields({ ...fields, crowd: v ?? undefined })} />
          </div>
          <div className="field">
            <span>Tags</span>
            <Chips small multi options={TAGS} value={tags} onChange={setTags} />
          </div>

          <h4 className="subsection">Notes</h4>
          <label className="field first">
            <span className="visually-hidden">Notes</span>
            <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What worked, what didn't, where you sat, what to try next time…" />
          </label>
        </Card>
      )}

      <ActionBar note={!canSave && missing.length ? `To save: ${missing.join(', ')}` : pending && spot && range ? 'Conditions are added when you are back online' : undefined}>
        {existing && (
          <button className="btn danger" onClick={remove}>
            Delete
          </button>
        )}
        <button className="btn" onClick={() => go('journal')}>
          Cancel
        </button>
        <button className="btn primary" disabled={!canSave || saving} onClick={save}>
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Save session'}
        </button>
      </ActionBar>
    </div>
  );
}
