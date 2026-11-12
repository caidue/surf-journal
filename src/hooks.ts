import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS } from './db';
import type { ConditionsSeries, Session, Settings, Spot } from './types';
import { cellKey, fetchSeries, isOfflineError } from './lib/openMeteo';
import { samplePoint } from './lib/geo';

export function useSettings(): Settings {
  return useLiveQuery(() => db.settings.get('settings'), []) ?? DEFAULT_SETTINGS;
}

export function useSpots(): Spot[] | undefined {
  return useLiveQuery(() => db.spots.toArray(), []);
}

export function useSessions(): Session[] | undefined {
  return useLiveQuery(() => db.sessions.toArray(), []);
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
