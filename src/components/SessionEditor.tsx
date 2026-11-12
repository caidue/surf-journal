import { useEffect, useMemo, useState } from 'react';
import type { DayInfo, HourConditions, Level, Session, SessionFields, Settings, Spot } from '../types';
import { SLOT_MIN, SLOTS } from '../types';
import { db, saveSettings } from '../db';
import { fetchOne, isOfflineError } from '../lib/openMeteo';
import { requestPersistence } from '../lib/pwa';
import { syncPendingSessions } from '../lib/sync';
import { samplePoint } from '../lib/geo';
import { deriveSeries, tideLabel, windKind, WIND_LABEL } from '../lib/conditions';
import { recommendability } from '../lib/rating';
import { calibratedGain, curveMean, OBSERVED_SIZES } from '../lib/recommend';
import { fmtDate, fmtDuration, fmtMin, isoToMin, todayAt, uid } from '../lib/time';
import { fmtSurfRange, fmtWind } from '../lib/format';
import Timeline, { PEAK_COLORS, type HourScore, type Range } from './Timeline';
import { Card, Chips, Segmented } from './ui';
import { LEVEL_OPTIONS } from './Explore';

const WETSUITS = ['Boardshorts', 'Shorty / top', '3/2', '4/3', '5/4+'].map((x) => ({ id: x, label: x }));
const CROWD = ['Empty', 'Few', 'Moderate', 'Crowded', 'Packed'].map((x) => ({ id: x, label: x }));
const VS_FORECAST = ['Worse', 'As forecast', 'Better'].map((x) => ({ id: x, label: x }));
export const TAGS = ['Glassy', 'Choppy', 'Closeouts', 'Barrels', 'Long rides', 'Strong current', 'Crowded peak', 'Sea life', 'Progress made', 'New board'].map((x) => ({ id: x, label: x }));

const emptySlots = <T,>() => Array<T | null>(SLOTS).fill(null);

const roundHalf = (v: number | null | undefined) => (v == null ? null : Math.round(v * 2) / 2);

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
  const [zones, setZones] = useState<(string | null)[]>(existing?.zones ?? emptySlots<string>());
  // One 1–10 value per category. Older sessions with drawn curves start at the curve's average.
  const [ratings, setRatings] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(settings.categories.map((c) => [c.id, existing ? roundHalf(curveMean(existing, c.id) ?? (c.id === 'fun' ? existing.overall : null)) : null])),
  );
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const setRating = (id: string, v: number | null) => {
    setRatings((r) => ({ ...r, [id]: v }));
    setTouched((t) => new Set(t).add(id));
  };
  const [fields, setFields] = useState<SessionFields>(existing?.fields ?? {});
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [excluded, setExcluded] = useState(existing?.excluded ?? false);
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

  // Peaks belong to the spot: clear zone painting when switching spots.
  useEffect(() => {
    if (!spot) return;
    const valid = new Set(spot.peaks.map((p) => p.id));
    if (zones.some((z) => z && !valid.has(z))) setZones(emptySlots<string>());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotId]);

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

  const zoneMinutes = spot?.peaks.map((p) => ({ p, min: range ? zones.filter((z, s) => z === p.id && s * SLOT_MIN >= range.startMin && s * SLOT_MIN < range.endMin).length * SLOT_MIN : 0 }));
  const lo = range ? Math.floor(range.startMin / SLOT_MIN) : 0;
  const hi = range ? Math.ceil(range.endMin / SLOT_MIN) - 1 : -1;

  // Conditions aren't required: without a connection the session is saved and filled in later.
  const canSave = !!(spot && range && !condState.loading);
  const pending = !conditions?.length || !!stale;

  const save = async () => {
    if (!spot || !range) return;
    setSaving(true);
    const clip = <T,>(arr: (T | null)[]) => arr.map((v, s) => (s >= lo && s <= hi ? v : null));
    // Ratings are stored as a flat value over the session's 5-minute slots, so everything that reads
    // per-hour ratings (matching, insights) keeps working. A drawn curve from an older session is kept
    // as it was unless you move its slider or change the session's time.
    const sameRange = existing && existing.startMin === range.startMin && existing.endMin === range.endMin;
    const buildCurves = () => {
      const out: Record<string, (number | null)[]> = {};
      for (const [k, v] of Object.entries(existing?.curves ?? {})) out[k] = clip(v);
      for (const c of settings.categories) {
        const old = existing?.curves[c.id];
        if (sameRange && !touched.has(c.id) && old?.some((v) => v != null)) continue;
        const r = ratings[c.id];
        if (r == null) delete out[c.id];
        else out[c.id] = emptySlots<number>().map((_, s) => (s >= lo && s <= hi ? r : null));
      }
      return out;
    };
    const now = Date.now();
    const sess: Session = {
      id: existing?.id ?? uid(),
      spotId: spot.id,
      date,
      startMin: range.startMin,
      endMin: range.endMin,
      zones: clip(zones),
      curves: buildCurves(),
      conditions: conditions ?? [],
      conditionsSource: conditions ? source : '',
      conditionsPending: pending,
      days: days.filter((d) => d.date === date),
      fields,
      tags,
      notes,
      // The fun slider is the session's rating; an old separate "overall" only survives if fun wasn't changed.
      overall: touched.has('fun') ? null : existing?.overall ?? null,
      excluded,
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

  const regions = Array.from(new Set(spots.map((s) => s.region))).sort();

  return (
    <div className="page narrow">
      <div className="row between wrap">
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
          <label>
            Spot
            <select value={spotId} onChange={(e) => setSpotId(e.target.value)}>
              <option value="">Choose a spot…</option>
              {regions.map((r) => (
                <optgroup key={r} label={r}>
                  {spots
                    .filter((s) => s.region === r)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            Date
            <input type="date" value={date} max={today} min="2021-11-01" onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Your level that day
            <Segmented options={LEVEL_OPTIONS} value={skill} onChange={setSkill} />
          </label>
        </div>
      </Card>

      {spot && (
        <Card>
          <div className="row between wrap">
            <h3>
              Conditions at {spot.name} · {fmtDate(date)}
            </h3>
            <div className="row gap wrap">
              <Segmented
                options={[
                  { id: 'session', label: 'Session' },
                  { id: 'daylight', label: 'Daylight' },
                  { id: 'full', label: 'Full day' },
                ]}
                value={zoom === 'session' && !range ? 'daylight' : zoom}
                onChange={chooseZoom}
              />
              <button className="btn small" onClick={() => load(true)} disabled={condState.loading}>
                {condState.loading ? 'Loading…' : 'Re-import conditions'}
              </button>
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
              <p className="muted small">
                1. Drag across the chart to mark when you were in the water (drag the edges to adjust).
                {spot.peaks.length > 0 && ' 2. Paint the lanes to show when you were at each peak.'} Then rate the session below.
              </p>
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
                peaks={spot.peaks}
                zones={zones}
                onZonesChange={setZones}
              />
              {spot.peaks.length > 0 && range && (
                <div className="row gap wrap tools">
                  <span className="muted small">Quick fill:</span>
                  {spot.peaks.map((p, k) => (
                    <button
                      key={p.id}
                      className="btn small"
                      style={{ borderColor: PEAK_COLORS[k % PEAK_COLORS.length] }}
                      onClick={() => {
                        const z = zones.slice();
                        for (let s = lo; s <= hi; s++) z[s] = p.id;
                        setZones(z);
                      }}
                    >
                      All at {p.name}
                    </button>
                  ))}
                  <button className="btn small" onClick={() => setZones(emptySlots<string>())}>
                    Clear peaks
                  </button>
                  <span className="small">
                    {zoneMinutes!
                      .filter((z) => z.min)
                      .map((z) => `${z.p.name}: ${fmtDuration(z.min)}`)
                      .join(' · ')}
                  </span>
                </div>
              )}
              {summary && range && (
                <div className="summary">
                  <strong>
                    {fmtMin(range.startMin)}–{fmtMin(range.endMin)}
                  </strong>{' '}
                  ({fmtDuration(range.endMin - range.startMin)}) · surf {summary.size} · {summary.period} · {summary.wind} · tide {summary.tide}
                </div>
              )}
              {conditions && <p className="muted tiny">
                Data: {source || 'Open-Meteo'} · Surf height is an estimate from the offshore model (Komar–Gaughan breaker formula × spot factor {gain.toFixed(2)}).
              </p>}
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
          <p className="muted tiny">1 = very low, 10 = very high. Fun drives your recommendations; add or rename categories in Settings.</p>
        </Card>
      )}

      {spot && (
        <Card>
          <h3>Details</h3>
          <div className="form-grid">
            <label>
              Board
              <input list="boards" value={fields.board ?? ''} onChange={(e) => setFields({ ...fields, board: e.target.value })} placeholder="e.g. 6'2 shortboard" />
              <datalist id="boards">
                {settings.boards.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </label>
            <label>
              Waves caught
              <input type="number" min={0} value={fields.waves ?? ''} onChange={(e) => setFields({ ...fields, waves: e.target.value === '' ? null : Number(e.target.value) })} />
            </label>
          </div>
          <div className="field">
            <span>Size you actually saw</span>
            <Chips small options={OBSERVED_SIZES.map((o) => ({ id: o.id, label: o.label }))} value={fields.observedSize} onChange={(v) => setFields({ ...fields, observedSize: v ?? undefined })} />
            <span className="muted tiny">Used to calibrate this spot's surf-height estimate.</span>
          </div>
          <div className="field">
            <span>Compared with the forecast</span>
            <Chips small options={VS_FORECAST} value={fields.vsForecast} onChange={(v) => setFields({ ...fields, vsForecast: v ?? undefined })} />
          </div>
          <div className="field">
            <span>Crowd</span>
            <Chips small options={CROWD} value={fields.crowd} onChange={(v) => setFields({ ...fields, crowd: v ?? undefined })} />
          </div>
          <div className="field">
            <span>Wetsuit</span>
            <Chips small options={WETSUITS} value={fields.wetsuit} onChange={(v) => setFields({ ...fields, wetsuit: v ?? undefined })} />
          </div>
          <div className="field">
            <span>Tags</span>
            <Chips small multi options={TAGS} value={tags} onChange={setTags} />
          </div>
          <label className="field">
            Notes
            <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What worked, what didn't, where you sat, what to try next time…" />
          </label>
          <label className="check">
            <input type="checkbox" checked={excluded} onChange={(e) => setExcluded(e.target.checked)} /> Not relevant anymore (keep in journal, ignore for predictions)
          </label>
        </Card>
      )}

      <div className="row between sticky-actions">
        <div>
          {existing && (
            <button className="btn danger" onClick={remove}>
              Delete
            </button>
          )}
        </div>
        <div className="row gap">
          <button className="btn" onClick={() => go('journal')}>
            Cancel
          </button>
          <button className="btn primary" disabled={!canSave || saving} onClick={save} title={canSave ? (pending ? 'Conditions are added when you are back online' : '') : 'Choose a spot, date and mark your session on the chart'}>
            {saving ? 'Saving…' : existing ? 'Save changes' : pending ? 'Save (conditions later)' : 'Save session'}
          </button>
        </div>
      </div>
    </div>
  );
}
