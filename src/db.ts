import Dexie, { type Table } from 'dexie';
import type { ConditionsSeries, Session, Settings, Spot, UserPhoto } from './types';
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
  photos!: Table<UserPhoto, string>;

  constructor() {
    super('surf-journal');
    // One schema; its number is 2 only because test browsers already hold a version-2 database.
    this.version(2).stores({
      spots: 'id, region, name',
      sessions: 'id, spotId, date',
      forecasts: 'key, fetchedAt',
      geocache: 'q',
      settings: 'id',
      photos: 'id, spotId',
    });
  }
}

export const db = new SurfDB();

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  level: 'intermediate',
  categories: [
    { id: 'fun', name: 'Fun', color: '#0ea5e9' },
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
  const settings = await db.settings.get('settings');
  if (!settings) await db.settings.put(DEFAULT_SETTINGS);
  else if (settings.categories.some((c) => c.id === 'waves')) await db.settings.put(withCurrentCategories(settings));
}

/**
 * Devices set up with the earlier default categories (Fun, Wave quality, Exertion) get today's
 * defaults: "Wave quality" is dropped and "Confidence" added. Your own categories stay.
 */
export function withCurrentCategories(settings: Settings): Settings {
  const cats = settings.categories.filter((c) => c.id !== 'waves');
  for (const d of DEFAULT_SETTINGS.categories) if (!cats.some((c) => c.id === d.id)) cats.push(d);
  return { ...settings, categories: cats };
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
  /** Your spot photos as data URLs. */
  photos: (Omit<UserPhoto, 'blob'> & { dataUrl: string })[];
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });

export async function exportAll(): Promise<Backup> {
  return {
    app: 'surf-journal',
    version: 1,
    exportedAt: new Date().toISOString(),
    spots: await db.spots.toArray(),
    sessions: await db.sessions.toArray(),
    settings: await db.settings.get('settings'),
    photos: await Promise.all((await db.photos.toArray()).map(async ({ blob, ...p }) => ({ ...p, dataUrl: await blobToDataUrl(blob) }))),
  };
}

export async function importAll(b: Backup): Promise<{ spots: number; sessions: number }> {
  if (b?.app !== 'surf-journal' || !Array.isArray(b.spots) || !Array.isArray(b.sessions)) {
    throw new Error('This is not a Surf Journal backup file.');
  }
  const photos = await Promise.all(
    (b.photos ?? []).map(async ({ dataUrl, ...p }) => ({ ...p, blob: await (await fetch(dataUrl)).blob() }) as UserPhoto),
  );
  await db.transaction('rw', [db.spots, db.sessions, db.settings, db.photos], async () => {
    await db.spots.bulkPut(b.spots);
    await db.sessions.bulkPut(b.sessions);
    if (photos.length) await db.photos.bulkPut(photos);
    if (b.settings) await db.settings.put({ ...DEFAULT_SETTINGS, ...b.settings, id: 'settings' });
  });
  return { spots: b.spots.length, sessions: b.sessions.length };
}
