import { useEffect, useState } from 'react';
import type { Session, Settings, SkillProfile, Spot } from '../types';
import { CONDITIONS_VERSION } from '../types';
import { db, exportAll, importAll, refreshSeedSpots, saveSettings, type Backup } from '../db';
import { SEED_SPOTS } from '../data/seedSpots';
import { addDemoSessions, removeDemoSessions } from '../lib/demo';
import { todayAt, uid } from '../lib/time';
import { boardInfo, bodyWord, PADDLE_OPTIONS, profileCheck, REEF_OPTIONS, rustyOffer, STEEP_OPTIONS, stageInfo, undoLastChange, WATER_OPTIONS } from '../lib/skill';
import { Card, Segmented } from './ui';
import StageCard from './StageCard';
import { isIOS, promptInstall, requestPersistence, storageStatus, usePwa } from '../lib/pwa';
import { syncPendingSessions } from '../lib/sync';
import { useDebounced } from './SpotPicker';

const mb = (b: number) => (b < 1e6 ? `${Math.max(1, Math.round(b / 1e3))} kB` : `${(b / 1e6).toFixed(b < 1e7 ? 1 : 0)} MB`);

function PhoneCard({ sessions }: { sessions: Session[] }) {
  const pwa = usePwa();
  const [store, setStore] = useState<Awaited<ReturnType<typeof storageStatus>> | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  useEffect(() => {
    storageStatus().then(setStore);
  }, [sessions.length]);
  const pending = sessions.filter((s) => s.conditionsPending || !s.conditions.length || s.conditionsVersion !== CONDITIONS_VERSION).length;

  return (
    <Card>
      <h3>On your phone</h3>
      {pwa.standalone ? (
        <p className="small">✓ Installed. Surf Journal opens from your home screen, full screen, and works without a connection.</p>
      ) : pwa.canInstall ? (
        <div className="btn-group">
          <button className="btn primary" onClick={promptInstall}>
            Install Surf Journal
          </button>
          <span className="small muted">Adds it to your home screen and app list. It works offline.</span>
        </div>
      ) : isIOS() ? (
        <p className="small">
          In Safari, tap <strong>Share</strong> <span aria-hidden>⬆︎</span>, then <strong>Add to Home Screen</strong>. It then opens full screen and works offline.
        </p>
      ) : (
        <p className="small">
          To install: open this page on your phone and choose <strong>Install app</strong> or <strong>Add to Home screen</strong> in the browser menu (Chrome, Edge, Samsung Internet), or{' '}
          <strong>Share → Add to Home Screen</strong> in Safari on iPhone.
        </p>
      )}
      <p className="small">
        <strong>Offline at the beach:</strong> your journal, spots and the app itself always work. Forecasts you've looked at (Explore keeps today and the next two days) and map areas
        you've viewed are saved. Log a session without a connection and its conditions are added automatically when you're back online.
      </p>
      <div className="row gap wrap small">
        <span>
          {pending ? `${pending} session${pending === 1 ? '' : 's'} waiting for conditions` : 'No sessions waiting for conditions'}
          {pending > 0 && pwa.online && (
            <>
              {' · '}
              <button
                className="link"
                onClick={async () => {
                  setSyncMsg('Fetching…');
                  const n = await syncPendingSessions().catch(() => 0);
                  setSyncMsg(n ? `Added conditions to ${n}.` : 'Nothing could be fetched yet.');
                }}
              >
                Fetch now
              </button>
            </>
          )}
          {syncMsg && ` · ${syncMsg}`}
        </span>
      </div>
      {store && (
        <div className="row gap wrap small muted">
          {store.usage != null && <span>Using {mb(store.usage)} on this device.</span>}
          {store.persisted ? (
            <span>✓ Protected from automatic clean-up.</span>
          ) : store.persisted === false ? (
            <span>
              The browser may clear this data when space runs low.{' '}
              <button className="link" onClick={async () => (await requestPersistence(), setStore(await storageStatus()))}>
                Ask to keep it
              </button>{' '}
              (and export backups).
            </span>
          ) : null}
        </div>
      )}
    </Card>
  );
}

/** Your surfing: the skill profile every recommendation is checked against. */
function ProfileCard({ settings, sessions, go }: { settings: Settings; sessions: Session[]; go: (p: string) => void }) {
  const p = settings.profile;
  if (!p)
    return (
      <Card>
        <h3>Your surfing</h3>
        <p className="small">Answer a few questions so the app knows which waves suit you.</p>
        <button className="btn primary" onClick={() => go('surfing')}>
          Set up your surfing
        </button>
      </Card>
    );
  const unit = settings.heightUnit;
  const h = (m: number) => (unit === 'ft' ? `${Math.round(m * 3.281)} ft` : `${m.toFixed(1)} m`);
  const check = profileCheck(p);
  const rusty = rustyOffer(p, sessions, todayAt());
  const save = (patch: Partial<SkillProfile>) => saveSettings({ profile: { ...p, ...patch, updatedAt: Date.now() } });
  const edit = (step: string) => (
    <a href={`#/surfing?step=${step}`} className="small">
      Edit
    </a>
  );
  return (
    <Card className="profile-card" id="your-surfing">
      <div className="section-head">
        <h3>Your surfing</h3>
        <button className="btn small" onClick={() => go('surfing')}>
          Edit all
        </button>
      </div>
      <StageCard profile={p} unit={unit} />
      <dl className="profile-facts">
        <dt>Stage</dt>
        <dd>
          {p.stage}: {stageInfo(p.stage).title} {edit('stage')}
        </dd>
        <dt>Comfortable in</dt>
        <dd>
          {bodyWord(p.comfort)} ({h(p.comfort)}) {edit('comfort')}
        </dd>
        <dt>Biggest caught</dt>
        <dd>
          {bodyWord(Math.max(p.max, p.comfort))} ({h(Math.max(p.max, p.comfort))}) {edit('max')}
        </dd>
        <dt>Board</dt>
        <dd>
          {boardInfo(p.board).label} {edit('board')}
        </dd>
        <dt>Reef</dt>
        <dd>
          {REEF_OPTIONS[p.reefExp].label} {edit('reef')}
        </dd>
        <dt>Getting out</dt>
        <dd>
          {PADDLE_OPTIONS[p.paddleOut].label} {edit('paddle')}
        </dd>
        <dt>Steep waves</dt>
        <dd>
          {p.steepExp != null ? STEEP_OPTIONS[p.steepExp].label : 'not answered'} {edit('steep')}
        </dd>
        <dt>Out of your depth</dt>
        <dd>
          {p.waterConfidence ? WATER_OPTIONS.find((o) => o.v === p.waterConfidence)?.label : 'not answered'} {edit('water')}
        </dd>
      </dl>
      <label className="row gap" style={{ alignItems: 'flex-start' }}>
        <input type="checkbox" checked={!!p.wantsChallenge} onChange={(e) => save({ wantsChallenge: e.target.checked })} />
        <span className="small">
          I want to push my limits: waves between your comfortable size and the biggest you've caught show as “Stretch session”.
        </span>
      </label>
      {check && <div className="alert soft">{check}</div>}
      {rusty != null && (
        <div className="alert info">
          It's been more than six months since your last session. Lower your comfortable size to {bodyWord(rusty)} ({h(rusty)}) for now?{' '}
          <button className="link" onClick={() => save({ comfort: rusty })}>
            Lower it
          </button>{' '}
          ·{' '}
          <button className="link" onClick={() => save({})}>
            Keep {h(p.comfort)}
          </button>
        </div>
      )}
      {p.lastChange && (
        <div className="small muted">
          Last change from a session ({new Date(p.lastChange.at).toLocaleDateString()}): {p.lastChange.reasons.join(' ')}{' '}
          <button className="link" onClick={() => saveSettings({ profile: undoLastChange(p) })}>
            Undo
          </button>
        </div>
      )}
      <p className="muted tiny">
        Sessions you log with “How did it feel?” nudge your comfortable size and biggest wave in small steps. Your stage only changes when you change it.
      </p>
    </Card>
  );
}

/** Add, edit and restore spots (the spot editor opens from here). */
function SpotsCard({ spots, sessions, go, run }: { spots: Spot[]; sessions: Session[]; go: (p: string) => void; run: (label: string, fn: () => Promise<string>) => void }) {
  const [q, setQ] = useState('');
  const query = useDebounced(q);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const list = spots
    .filter((s) => words.every((w) => `${s.name} ${(s.aliases ?? []).join(' ')} ${s.region}`.toLowerCase().includes(w)))
    .sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));
  const count = (id: string) => sessions.filter((s) => s.spotId === id).length;
  return (
    <Card>
      <div className="section-head">
        <h3>Spots</h3>
        <button className="btn small primary" onClick={() => go('spot-new')}>
          + Add a spot
        </button>
      </div>
      <p className="muted small">Edit a spot's position, how it works and its guide, or add your own. {spots.length} spots on this device.</p>
      {spots.length > 6 && <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search spots…" aria-label="Search spots" className="full-width" />}
      <ul className="spot-rows">
        {list.map((s) => (
          <li key={s.id}>
            <div>
              <strong>{s.name}</strong>
              <div className="muted small">
                {s.region} · {s.breakType} · {s.level}
                {count(s.id) ? ` · ${count(s.id)} session${count(s.id) === 1 ? '' : 's'}` : ''}
                {s.coordsApprox && <span className="badge muted">approx. position</span>}
              </div>
            </div>
            <button className="btn small" onClick={() => go(`spot-edit/${s.id}`)} aria-label={`Edit ${s.name}`}>
              Edit
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="muted small">No spot matches “{query}”.</li>}
      </ul>
      <button
        className="btn small"
        onClick={() =>
          run('seed', async () => {
            await refreshSeedSpots();
            return `Restored ${SEED_SPOTS.length} built-in Fuerteventura spots (your own spots are kept).`;
          })
        }
      >
        Restore built-in spots
      </button>
    </Card>
  );
}

export default function SettingsPage({ settings, spots, sessions, go }: { settings: Settings; spots: Spot[]; sessions: Session[]; go: (p: string) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const demoCount = sessions.filter((s) => s.demo).length;

  const run = async (label: string, fn: () => Promise<string>) => {
    setBusy(label);
    setMsg(null);
    try {
      setMsg(await fn());
    } catch (e: any) {
      setMsg(`Error: ${e?.message ?? e}`);
    } finally {
      setBusy(null);
    }
  };

  const download = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `surf-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const setCat = (i: number, patch: Partial<Settings['categories'][number]>) =>
    saveSettings({ categories: settings.categories.map((c, k) => (k === i ? { ...c, ...patch } : c)) });

  return (
    <div className="page narrow">
      <h1>Settings</h1>

      <ProfileCard settings={settings} sessions={sessions} go={go} />

      <Card>
        <h3>Units</h3>
        <div className="form-grid">
          <label>
            Wave height
            <Segmented options={[{ id: 'm', label: 'metres' }, { id: 'ft', label: 'feet' }]} value={settings.heightUnit} onChange={(v) => saveSettings({ heightUnit: v })} />
          </label>
          <label>
            Wind
            <Segmented
              options={[
                { id: 'kmh', label: 'km/h' },
                { id: 'kn', label: 'knots' },
                { id: 'mph', label: 'mph' },
              ]}
              value={settings.windUnit}
              onChange={(v) => saveSettings({ windUnit: v })}
            />
          </label>
        </div>
      </Card>

      <SpotsCard spots={spots} sessions={sessions} go={go} run={run} />

      <Card>
        <h3>How old sessions count</h3>
        <div className="form-grid">
          <label>
            Half-life of a session (months)
            <input type="number" min={1} max={120} value={settings.halfLifeMonths} onChange={(e) => saveSettings({ halfLifeMonths: Math.max(1, Number(e.target.value) || 24) })} />
            <span className="muted tiny">A session this old counts half as much in recommendations.</span>
          </label>
          <label>
            Ignore all sessions before
            <div className="row gap">
              <input type="date" value={settings.ignoreBefore ?? ''} onChange={(e) => saveSettings({ ignoreBefore: e.target.value || null })} />
              {settings.ignoreBefore && (
                <button className="link small" onClick={() => saveSettings({ ignoreBefore: null })}>
                  clear
                </button>
              )}
            </div>
            <span className="muted tiny">Use after a big jump in skill. Individual sessions can also be marked “not relevant” in the journal.</span>
          </label>
        </div>
        <p className="muted small">Sessions logged at a different surfing stage automatically count less (¾ one stage apart, ½ two, ¼ more).</p>
      </Card>

      <Card>
        <h3>Feeling categories</h3>
        <p className="muted small">What you rate after each session, 1–10 with a slider. “Fun” drives the recommendations.</p>
        {settings.categories.map((c, i) => (
          <div key={c.id} className="row gap peak-row">
            <input type="color" value={c.color} onChange={(e) => setCat(i, { color: e.target.value })} aria-label={`${c.name} colour`} />
            <input value={c.name} onChange={(e) => setCat(i, { name: e.target.value })} />
            {c.id !== 'fun' && (
              <button className="btn small" onClick={() => saveSettings({ categories: settings.categories.filter((_, k) => k !== i) })}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button className="btn small" onClick={() => saveSettings({ categories: [...settings.categories, { id: uid(), name: 'New category', color: '#64748b' }] })}>
          + Add category
        </button>
      </Card>

      <PhoneCard sessions={sessions} />

      <Card>
        <h3>Your data</h3>
        <p className="small">
          Everything is stored only in this browser ({spots.length} spots, {sessions.length} sessions). Export a backup regularly, or to move to another device.
        </p>
        <div className="btn-group">
          <button className="btn" onClick={download}>
            Export backup (JSON)
          </button>
          <label className="btn">
            Import backup…
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                run('import', async () => {
                  const r = await importAll(JSON.parse(await f.text()) as Backup);
                  return `Imported ${r.spots} spots and ${r.sessions} sessions.`;
                });
                e.target.value = '';
              }}
            />
          </label>
          <button className="btn" onClick={() => run('cache', async () => (await db.forecasts.clear(), 'Forecast cache cleared.'))}>
            Clear forecast cache
          </button>
        </div>
      </Card>

      <Card>
        <h3>Try it with demo sessions</h3>
        <p className="small">
          Adds 12–16 random sessions at your spots over the last two months with <strong>real conditions</strong> from Open-Meteo and <strong>invented ratings</strong>, so you can see
          similar-session matching and personal recommendations in action. Each time you add them you get a new random set (it replaces the previous one). Remove them in one click.
        </p>
        <div className="btn-group">
          <button className="btn primary" disabled={!!busy} onClick={() => run('demo', async () => `Added ${await addDemoSessions(spots, settings)} random demo sessions.`)}>
            {busy === 'demo' ? 'Importing conditions…' : demoCount ? 'New random demo sessions' : 'Add demo sessions'}
          </button>
          <button className="btn" disabled={!demoCount || !!busy} onClick={() => run('undemo', async () => `Removed ${await removeDemoSessions()} demo sessions.`)}>
            Remove demo sessions ({demoCount})
          </button>
        </div>
      </Card>
      {/* Result of an action (import, restore, demo…): shown where you are, not at the end of the page. */}
      {msg && (
        <div className="toasts" role="status">
          <div className="toast">
            {msg}
            <button className="btn small" onClick={() => setMsg(null)}>
              OK
            </button>
          </div>
        </div>
      )}

      <Card>
        <h3>About the data</h3>
        <ul className="small">
          <li>
            Wave, swell, tide (sea level) and wind data: <a href="https://open-meteo.com/">Open-Meteo.com</a>, CC BY 4.0 (free for non-commercial use). Wave height from Météo-France
            MFWAM, peak period from ECMWF WAM, swell trains from NOAA GFS-Wave. Periods are peak periods, the ones surf sites show.
          </li>
          <li>
            Map: <a href="https://openfreemap.org/">OpenFreeMap</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Place search:{' '}
            <a href="https://nominatim.org/">Nominatim</a>.
          </li>
          <li>Surf height at a spot is an estimate from offshore model data (Komar–Gaughan breaker formula, swell window, spot factor). Calibrate it by noting the size you saw.</li>
          <li>
            Spot names follow Surfline where Surfline has the spot (other names are searchable). Spot details were compiled from public spot guides; several locations are
            approximate. Check local conditions and your own limits before paddling out.
          </li>
        </ul>
      </Card>
    </div>
  );
}
