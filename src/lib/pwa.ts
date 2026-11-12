import { useSyncExternalStore } from 'react';
import { syncPendingSessions } from './sync';

/** Chrome / Edge / Samsung Internet fire this when the app can be installed. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PwaState {
  online: boolean;
  /** Present when the browser offers an install prompt (not on iOS: there it's Share → Add to Home Screen). */
  canInstall: boolean;
  /** Running as an installed app. */
  standalone: boolean;
  /** A new version has been downloaded and is waiting for a reload. */
  updateReady: boolean;
  /** Sessions whose conditions were just filled in after coming back online. */
  synced: number;
}

const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true);

export const isIOS = () =>
  typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

let state: PwaState = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  canInstall: false,
  standalone: isStandalone(),
  updateReady: false,
  synced: 0,
};
const listeners = new Set<() => void>();
const set = (patch: Partial<PwaState>) => {
  state = { ...state, ...patch };
  listeners.forEach((f) => f());
};
const subscribe = (f: () => void) => {
  listeners.add(f);
  return () => listeners.delete(f);
};

export function usePwa(): PwaState {
  return useSyncExternalStore(subscribe, () => state);
}

let installEvent: BeforeInstallPromptEvent | null = null;
let waitingWorker: ServiceWorker | null = null;
let reloadOnChange = false;

// Registered when the module loads: the browser can fire this before the database is ready.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // show our own button instead of the browser's mini-infobar
    installEvent = e as BeforeInstallPromptEvent;
    set({ canInstall: true });
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    set({ canInstall: false, standalone: true });
  });
}

async function sync() {
  const n = await syncPendingSessions().catch(() => 0);
  if (n) set({ synced: state.synced + n });
}

export function initPwa(): void {
  window.addEventListener('online', () => {
    set({ online: true });
    sync();
  });
  window.addEventListener('offline', () => set({ online: false }));
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', () => set({ standalone: isStandalone() }));
  if (navigator.onLine) sync();
  if (import.meta.env.PROD && 'serviceWorker' in navigator) registerServiceWorker();
}

async function registerServiceWorker() {
  try {
    const reg = await navigator.serviceWorker.register('./sw.js');
    const markWaiting = (w: ServiceWorker) => {
      waitingWorker = w;
      set({ updateReady: true });
    };
    // Only an update when a worker already controls the page; the very first install isn't one.
    if (reg.waiting && navigator.serviceWorker.controller) markWaiting(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) markWaiting(w);
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadOnChange) window.location.reload();
    });
    // An installed app can stay open for days: check for a new version when it comes back to the front.
    let lastCheck = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck > 60 * 60 * 1000) {
        lastCheck = Date.now();
        reg.update().catch(() => {});
      }
    });
  } catch (e) {
    console.warn('Service worker registration failed', e);
  }
}

export function applyUpdate(): void {
  if (!waitingWorker) return window.location.reload();
  reloadOnChange = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
}

export async function promptInstall(): Promise<void> {
  const e = installEvent;
  if (!e) return;
  installEvent = null; // the event can only be used once
  set({ canInstall: false });
  await e.prompt();
  const choice = await e.userChoice.catch(() => null);
  if (choice?.outcome === 'accepted') set({ standalone: true });
}

export function clearSynced(): void {
  set({ synced: 0 });
}

/**
 * Asks the browser not to evict the journal under storage pressure. Called when a session is
 * saved (Firefox shows a prompt, so not on page load). Installed apps usually get this anyway.
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function storageStatus(): Promise<{ persisted: boolean | null; usage: number | null; quota: number | null }> {
  try {
    const [persisted, est] = await Promise.all([navigator.storage?.persisted?.() ?? null, navigator.storage?.estimate?.() ?? null]);
    return { persisted, usage: est?.usage ?? null, quota: est?.quota ?? null };
  } catch {
    return { persisted: null, usage: null, quota: null };
  }
}
