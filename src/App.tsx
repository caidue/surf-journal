import { queryParam, useRoute, useSessions, useSettings, useSpots } from './hooks';
import Explore from './components/Explore';
import SessionEditor from './components/SessionEditor';
import Journal from './components/Journal';
import SpotPage from './components/SpotPage';
import SpotEditor from './components/SpotEditor';
import SettingsPage from './components/SettingsPage';
import { Empty } from './components/ui';
import { Icon, type IconName } from './components/icons';
import { applyUpdate, clearSynced, promptInstall, usePwa } from './lib/pwa';

const NAV: { id: string; label: string; short: string; icon: IconName }[] = [
  { id: 'explore', label: 'Explore', short: 'Explore', icon: 'logo' },
  { id: 'log', label: 'Log session', short: 'Log', icon: 'log' },
  { id: 'journal', label: 'Journal', short: 'Journal', icon: 'journal' },
  { id: 'settings', label: 'Settings', short: 'Settings', icon: 'settings' },
];

export default function App() {
  const [route, go] = useRoute();
  const spots = useSpots();
  const sessions = useSessions();
  const settings = useSettings();
  const page = route[0] ?? 'explore';
  const pwa = usePwa();

  let body: JSX.Element;
  if (!spots || !sessions) body = <div className="page muted">Loading…</div>;
  else if (page === 'log') body = <SessionEditor key={`new-${queryParam('spot')}`} spots={spots} sessions={sessions} settings={settings} preset={{ spotId: queryParam('spot'), date: queryParam('date') }} go={go} />;
  else if (page === 'session') {
    const s = sessions.find((x) => x.id === route[1]);
    body = s ? <SessionEditor key={s.id} id={s.id} spots={spots} sessions={sessions} settings={settings} go={go} /> : <Empty>Session not found.</Empty>;
  } else if (page === 'journal') body = <Journal spots={spots} sessions={sessions} settings={settings} go={go} />;
  else if (page === 'settings') body = <SettingsPage settings={settings} spots={spots} sessions={sessions} go={go} />;
  else if (page === 'spot') {
    const s = spots.find((x) => x.id === route[1]);
    body = s ? <SpotPage key={s.id} spot={s} spots={spots} sessions={sessions} settings={settings} go={go} /> : <Empty>Spot not found.</Empty>;
  } else if (page === 'spot-edit' || page === 'spot-new') {
    const s = spots.find((x) => x.id === route[1]);
    const lat = Number(queryParam('lat'));
    const lon = Number(queryParam('lon'));
    body = (
      <SpotEditor
        key={s?.id ?? `new-${lat},${lon}`}
        spot={s}
        sessions={sessions}
        regions={Array.from(new Set(spots.map((x) => x.region))).sort()}
        go={go}
        at={Number.isFinite(lat) && lat !== 0 ? { lat, lon } : undefined}
      />
    );
  } else body = <Explore spots={spots} sessions={sessions} settings={settings} go={go} />;

  const active = page === 'session' ? 'journal' : page.startsWith('spot') ? 'explore' : page;

  return (
    <div className="app">
      <header className="topbar">
        <nav>
          {NAV.map((n) => (
            <a key={n.id} href={`#/${n.id}`} className={active === n.id ? 'on' : ''} aria-current={active === n.id ? 'page' : undefined} aria-label={n.label} title={n.label}>
              <Icon name={n.icon} size={n.icon === 'logo' ? 22 : 20} />
              <span className="nav-label">{n.label}</span>
              <span className="nav-short" aria-hidden>
                {n.short}
              </span>
            </a>
          ))}
        </nav>
        <div className="topbar-status">
          {!pwa.online && (
            <span className="pill offline" title="No connection. Your journal, the app and saved forecasts still work; new sessions get their conditions when you're back online.">
              Offline
            </span>
          )}
          {pwa.canInstall && (
            <button className="pill install" onClick={promptInstall}>
              Install app
            </button>
          )}
        </div>
      </header>
      <main>{body}</main>
      {(pwa.updateReady || pwa.synced > 0) && (
        <div className="toasts" role="status">
          {pwa.updateReady && (
            <div className="toast">
              A new version of Surf Journal is ready.
              <button className="btn small primary" onClick={applyUpdate}>
                Reload
              </button>
            </div>
          )}
          {pwa.synced > 0 && (
            <div className="toast">
              Back online: conditions added to {pwa.synced} session{pwa.synced === 1 ? '' : 's'} you logged offline.
              <button className="btn small" onClick={clearSynced}>
                OK
              </button>
            </div>
          )}
        </div>
      )}
      <footer className="foot muted tiny">
        Data stays in your browser · Weather &amp; marine data by <a href="https://open-meteo.com/">Open-Meteo.com</a> (CC BY 4.0) · Map © OpenStreetMap contributors, OpenFreeMap
      </footer>
    </div>
  );
}
