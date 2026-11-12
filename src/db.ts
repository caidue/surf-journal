import Dexie, { type Table } from 'dexie';
import type { ConditionsSeries, Session, Settings, Spot } from './types';
import type { GeoResult } from './lib/geocode';
import { SEED_SPOTS } from './data/seedSpots';

export interface GeoCache {
  q: string;
  result: GeoResult | null;
  at: number;
}

/**
 * Local-first storage (IndexedDB). Everything stays in this browser; use
 * Settings → Export to back up or move to another device.
 */
class SurfDB extends Dexie {
  spots!: Table<Spot, string>;
  sessions!: Table<Session, string>;
  forecasts!: Table<ConditionsSeries, string>;
  geocache!: Table<GeoCache, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('surf-journal');
    this.version(1).stores({
      spots: 'id, region, name',
      sessions: 'id, spotId, date',
      forecasts: 'key, fetchedAt',
      geocache: 'q',
      settings: 'id',
    });
  }
}

export const db = new SurfDB();

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  level: 'intermediate',
  categories: [
    { id: 'fun', name: 'Fun', color: '#0ea5e9' },
    { id: 'waves', name: 'Wave quality', color: '#16a34a' },
    { id: 'exertion', name: 'Exertion', color: '#f97316' },
    { id: 'confidence', name: 'Confidence', color: '#a855f7' },
  ],
  halfLifeMonths: 24,
  ignoreBefore: null,
  boards: [],
  heightUnit: 'm',
  windUnit: 'kmh',
};

export async function initDb(): Promise<void> {
  if ((await db.spots.count()) === 0) await db.spots.bulkPut(SEED_SPOTS);
  if (!(await db.settings.get('settings'))) await db.settings.put(DEFAULT_SETTINGS);
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = (await db.settings.get('settings')) ?? DEFAULT_SETTINGS;
  await db.settings.put({ ...cur, ...patch, id: 'settings' });
}

export interface Backup {
  app: 'surf-journal';
  version: 1;
  exportedAt: string;
  spots: Spot[];
  sessions: Session[];
  settings: Settings | undefined;
}

export async function exportAll(): Promise<Backup> {
  return {
    app: 'surf-journal',
    version: 1,
    exportedAt: new Date().toISOString(),
    spots: await db.spots.toArray(),
    sessions: await db.sessions.toArray(),
    settings: await db.settings.get('settings'),
  };
}

export async function importAll(b: Backup): Promise<{ spots: number; sessions: number }> {
  if (b?.app !== 'surf-journal' || !Array.isArray(b.spots) || !Array.isArray(b.sessions)) {
    throw new Error('This is not a Surf Journal backup file.');
  }
  await db.transaction('rw', db.spots, db.sessions, db.settings, async () => {
    await db.spots.bulkPut(b.spots);
    await db.sessions.bulkPut(b.sessions);
    if (b.settings) await db.settings.put({ ...DEFAULT_SETTINGS, ...b.settings, id: 'settings' });
  });
  return { spots: b.spots.length, sessions: b.sessions.length };
}
