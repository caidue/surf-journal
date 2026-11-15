import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, deleteTrip, saveTrip, tripForDate } from '../db';
import type { Session, Trip } from '../types';

const session = (id: string, date: string, tripId?: string) =>
  ({ id, spotId: 'x', date, startMin: 600, endMin: 660, ratings: { fun: 7 }, conditions: [], conditionsSource: '', fields: {}, tags: [], notes: '', excluded: false, tripId, skillAtTime: { stage: 4, comfort: 1.5, max: 2 }, createdAt: 0, updatedAt: 0 }) as Session;
const trip = (id: string, extra: Partial<Trip> = {}): Trip => ({ id, name: id, createdAt: 1, updatedAt: 1, ...extra });

describe('trips', () => {
  beforeEach(async () => {
    await db.sessions.clear();
    await db.trips.clear();
    await db.sessions.bulkPut([session('a', '2026-11-02'), session('b', '2026-11-09'), session('c', '2026-11-20'), session('d', '2026-11-05', 'other')]);
  });

  it('collects the sessions on its days that are not in another trip', async () => {
    expect(await saveTrip(trip('fv', { from: '2026-11-01', to: '2026-11-10' }))).toBe(2);
    const ids = (await db.sessions.where('tripId').equals('fv').toArray()).map((s) => s.id).sort();
    expect(ids).toEqual(['a', 'b']);
    expect((await db.sessions.get('d'))?.tripId).toBe('other');
  });

  it('without dates adds no sessions', async () => {
    expect(await saveTrip(trip('plain'))).toBe(0);
  });

  it('deleting a trip keeps its sessions', async () => {
    await saveTrip(trip('fv', { from: '2026-11-01', to: '2026-11-10' }));
    await deleteTrip('fv');
    expect(await db.trips.count()).toBe(0);
    expect(await db.sessions.count()).toBe(4);
    expect((await db.sessions.get('a'))?.tripId).toBeUndefined();
  });

  it('finds the trip for a day, the newest when trips overlap', () => {
    const trips = [trip('long', { from: '2026-11-01', to: '2026-11-30', createdAt: 1 }), trip('weekend', { from: '2026-11-14', to: '2026-11-15', createdAt: 2 }), trip('nodates')];
    expect(tripForDate(trips, '2026-11-14')?.id).toBe('weekend');
    expect(tripForDate(trips, '2026-11-20')?.id).toBe('long');
    expect(tripForDate(trips, '2026-12-01')).toBeUndefined();
  });
});
