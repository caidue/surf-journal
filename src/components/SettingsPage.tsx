import { useEffect, useState } from 'react';
import type { Session, Settings, Spot } from '../types';
import { db, exportAll, importAll, saveSettings, type Backup } from '../db';
import { SEED_SPOTS } from '../data/seedSpots';
import { addDemoSessions, removeDemoSessions } from '../lib/demo';
import { uid } from '../lib/time';
import { Card, Segmented } from './ui';
import { LEVEL_OPTIONS } from './Explore';
import { isIOS, promptInstall, requestPersistence, storageStatus, usePwa } from '../lib/pwa';
import { syncPendingSessions } from '../lib/sync';

const mb = (b: number) => (b < 1e6 ? `${Math.max(1, Math.round(b / 1e3))} kB` : `${(b / 1e6).toFixed(b < 1e7 ? 1 : 0)} MB`);

function PhoneCard({ sessions }: { sessions: Session[] }) {
  const pwa = usePwa();
  const [store, setStore] = useState<Awaited<ReturnType<typeof storageStatus>> | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  useEffect(() => {
    storageStatus().then(setStore);
  }, [sessions.length]);
  const pending = sessions.filter((s) => s.conditionsPending || !s.conditions.length).length;

  return (
    <Card>
      <h3>On your phone</h3>
      {pwa.standalone ? (
        <p className="small">✓ Installed. Surf Journal opens from your home screen, full screen, and works without a connection.</p>
      ) : pwa.canInstall ? (
        <div className="row gap wrap">
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

export default function SettingsPage({ settings, spots, sessions }: { settings: Settings; spots: Spot[]; sessions: Session[] }) {
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

      <Card>
        <h3>You</h3>
        <div className="field">
          <span>Surf level</span>
          <Segmented options={LEVEL_OPTIONS} value={settings.level} onChange={(l) => saveSettings({ level: l })} />
        </div>
        <div className="form-grid">
          <label>
            Wave height
            <Segmented options={[{ id: 'm', label: 'metres' }, { id: 'ft', label: 'feet' }]} value={settings.heightUnit} onChange={(v) => saveSettings({ heightUnit: v })} />
          </label>
          <label>
            Wind
            <Segmented options={[{ id: 'kmh', label: 'km/h' }, { id: 'kn', label: 'knots' }]} value={settings.windUnit} onChange={(v) => saveSettings({ windUnit: v })} />
          </label>
        </div>
      </Card>

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
        <p className="muted small">Sessions logged at a different skill level automatically count less (½ for one level apart).</p>
      </Card>

      <Card>
        <h3>Feeling categories</h3>
        <p className="muted small">The curves you draw for each session. “Fun” drives the recommendations.</p>
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
        <div className="row gap wrap">
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
          <button
            className="btn"
            onClick={() =>
              run('seed', async () => {
                await db.spots.bulkPut(SEED_SPOTS);
                return `Restored ${SEED_SPOTS.length} built-in Fuerteventura spots (your own spots are kept).`;
              })
            }
          >
            Restore built-in spots
          </button>
          <button className="btn" onClick={() => run('cache', async () => (await db.forecasts.clear(), 'Forecast cache cleared.'))}>
            Clear forecast cache
          </button>
        </div>
      </Card>

      <Card>
        <h3>Try it with demo sessions</h3>
        <p className="small">
          Adds 14 sessions in northern Fuerteventura over the last two months with <strong>real conditions</strong> from Open-Meteo and <strong>invented ratings</strong>, so you can see
          similar-session matching and personal recommendations in action. Remove them in one click.
        </p>
        <div className="row gap">
          <button className="btn primary" disabled={!!busy} onClick={() => run('demo', async () => `Added ${await addDemoSessions(spots, settings)} demo sessions.`)}>
            {busy === 'demo' ? 'Importing conditions…' : 'Add demo sessions'}
          </button>
          <button className="btn" disabled={!demoCount || !!busy} onClick={() => run('undemo', async () => `Removed ${await removeDemoSessions()} demo sessions.`)}>
            Remove demo sessions ({demoCount})
          </button>
        </div>
      </Card>
      {msg && <div className="alert soft">{msg}</div>}

      <Card>
        <h3>About the data</h3>
        <ul className="small">
          <li>
            Wave, swell, tide (sea level) and wind data: <a href="https://open-meteo.com/">Open-Meteo.com</a>, CC BY 4.0 (free for non-commercial use).
          </li>
          <li>
            Map: <a href="https://openfreemap.org/">OpenFreeMap</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Place search:{' '}
            <a href="https://nominatim.org/">Nominatim</a>.
          </li>
          <li>Surf height at a spot is an estimate from offshore model data (Komar–Gaughan breaker formula, swell window, spot factor). Calibrate it by noting the size you saw.</li>
          <li>Spot details for Fuerteventura were compiled from public spot guides; several locations are approximate. Check local conditions and your own limits before paddling out.</li>
        </ul>
      </Card>
    </div>
  );
}
