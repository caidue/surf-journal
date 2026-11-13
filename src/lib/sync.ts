import { db } from '../db';
import { CONDITIONS_VERSION } from '../types';
import { samplePoint } from './geo';
import { fetchOne, isOfflineError } from './openMeteo';

let running: Promise<number> | null = null;

/**
 * Fills in the conditions of sessions logged offline, and re-fetches snapshots stored with an
 * older CONDITIONS_VERSION (e.g. mean periods before v2). Runs on start-up and whenever the
 * browser comes back online. Stops when the network is down (and tries again next time);
 * a session the API can't serve is skipped so it doesn't block the others.
 * Returns the number of sessions updated.
 */
export function syncPendingSessions(): Promise<number> {
  if (running) return running;
  running = (async () => {
    const pending = (await db.sessions.toArray()).filter((s) => s.conditionsPending || !s.conditions?.length || s.conditionsVersion !== CONDITIONS_VERSION);
    let done = 0;
    for (const s of pending) {
      const spot = await db.spots.get(s.spotId);
      if (!spot) continue;
      try {
        const series = await fetchOne(samplePoint(spot), s.date, s.date, { force: true });
        if (series.stale) break; // still offline
        const hours = series.hours.filter((h) => h.time.startsWith(s.date));
        if (!hours.length) continue;
        // Only the conditions change: the surfer's time, ratings and notes stay as logged.
        await db.sessions.update(s.id, {
          conditions: hours,
          days: series.days.filter((d) => d.date === s.date),
          conditionsSource: series.source,
          conditionsVersion: CONDITIONS_VERSION,
          conditionsPending: false,
        });
        done++;
      } catch (e) {
        if (isOfflineError(e)) break;
        console.warn('Could not fill in conditions for session', s.id, e);
      }
    }
    return done;
  })().finally(() => {
    running = null;
  });
  return running;
}
