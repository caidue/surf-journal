import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS } from './db';
import type { ConditionsSeries, Session, Settings, SkillProfile, Spot, Stage, Trip } from './types';
import { levelName, profileForStage } from './lib/skill';
import { cellKey, fetchSeries, isOfflineError } from './lib/openMeteo';
import { samplePoint } from './lib/geo';

export function useSettings(): Settings {
  return useLiveQuery(() => db.settings.get('settings'), []) ?? DEFAULT_SETTINGS;
}

/** The stored settings, or undefined while they are still loading (to tell "no profile yet" from "not loaded"). */
export function useStoredSettings(): Settings | undefined {
  return useLiveQuery(async () => (await db.settings.get('settings')) ?? DEFAULT_SETTINGS, []);
}

export function useSpots(): Spot[] | undefined {
  return useLiveQuery(() => db.spots.toArray(), []);
}

export function useSessions(): Session[] | undefined {
  return useLiveQuery(() => db.sessions.toArray(), []);
}

/** Your trips (folders of sessions), newest first. */
export function useTrips(): Trip[] {
  return useLiveQuery(() => db.trips.toArray().then((t) => t.sort((a, b) => b.createdAt - a.createdAt)), []) ?? [];
}

/** Minimal hash router: "#/spot/abc" -> ["spot", "abc"]. */
export function useRoute(): [string[], (path: string) => void] {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean).map(decodeURIComponent);
  const [parts, setParts] = useState<string[]>(read);
  useEffect(() => {
    const on = () => {
      setParts(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = useCallback((path: string) => {
    window.location.hash = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`;
  }, []);
  return [parts, go];
}

export function queryParam(name: string): string | null {
  const q = window.location.hash.split('?')[1];
  return q ? new URLSearchParams(q).get(name) : null;
}

/** Conditions for a set of spots over a date range, de-duplicated per model cell. */
export function useConditions(spots: Spot[], start: string, end: string) {
  const [bySpot, setBySpot] = useState<Map<string, ConditionsSeries>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [tick, setTick] = useState(0);
  const key = useMemo(() => spots.map((s) => `${s.id}:${s.lat.toFixed(3)},${s.lon.toFixed(3)},${s.facing}`).sort().join('|'), [spots]);

  useEffect(() => {
    let cancelled = false;
    if (!spots.length) {
      setBySpot(new Map());
      return;
    }
    setLoading(true);
    setError(null);
    setOffline(false);
    const pts = spots.map((s) => ({ spot: s, p: samplePoint(s) }));
    fetchSeries(pts.map((x) => x.p), start, end, { force: tick > 0 })
      .then((cells) => {
        if (cancelled) return;
        const m = new Map<string, ConditionsSeries>();
        for (const { spot, p } of pts) {
          const s = cells.get(cellKey(p));
          if (s) m.set(spot.id, s);
        }
        setBySpot(m);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e?.message || e));
        setOffline(isOfflineError(e));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, start, end, tick]);

  // Offline: when the oldest saved copy shown was loaded (null when everything is fresh).
  const savedAt = useMemo(() => {
    const stale = [...bySpot.values()].filter((s) => s.stale);
    return stale.length ? Math.min(...stale.map((s) => s.fetchedAt)) : null;
  }, [bySpot]);

  return { bySpot, loading, error, offline, savedAt, reload: () => setTick((t) => t + 1) };
}

export function useElementWidth<T extends HTMLElement>(): [(el: T | null) => void, number] {
  const [el, setEl] = useState<T | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver((entries) => setW(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, w];
}

/** True while the media query matches (e.g. phone layout). */
export function useMediaQuery(query: string): boolean {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

/* ------------------------------------------------------------------ */
/* "Rate for": rate spots for another level than yours (a friend).      */
/* Kept in memory only, so it resets when the app is reopened.          */
/* ------------------------------------------------------------------ */

let rateForStage: Stage | null = null;
const rateForListeners = new Set<() => void>();

export function setRateFor(stage: Stage | null): void {
  rateForStage = stage;
  rateForListeners.forEach((f) => f());
}

/** The level spots are rated for: null = you (your profile and sessions), else a stage. */
export function useRateFor(): Stage | null {
  return useSyncExternalStore(
    (f) => {
      rateForListeners.add(f);
      return () => rateForListeners.delete(f);
    },
    () => rateForStage,
  );
}

/**
 * The profile and options to rate with: yours, or a typical surfer of the chosen level
 * (profileForStage) without your session history. `forLevel` names that level for the texts.
 */
export function useRating(settings: Settings): { profile: SkillProfile | null; history: boolean; forLevel?: string; stage: Stage | null } {
  const stage = useRateFor();
  return useMemo(
    () => (stage == null ? { profile: settings.profile, history: true, stage } : { profile: profileForStage(stage), history: false, forLevel: levelName(stage), stage }),
    [stage, settings.profile],
  );
}
