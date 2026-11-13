import Dexie, { type Table } from 'dexie';
import type { ConditionsSeries, Peak, Session, Settings, Spot, UserPhoto } from './types';
import type { GeoResult } from './lib/geocode';
import { SEED_SPOTS, SEED_VERSION } from './data/seedSpots';

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
    this.version(1).stores({
      spots: 'id, region, name',
      sessions: 'id, spotId, date',
      forecasts: 'key, fetchedAt',
      geocache: 'q',
      settings: 'id',
    });
    // v2: your own spot photos.
    this.version(2).stores({ photos: 'id, spotId' });
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
  let settings = await db.settings.get('settings');
  if (!settings) {
    settings = { ...DEFAULT_SETTINGS, seedVersion: SEED_VERSION };
    await db.settings.put(settings);
  }
  if ((settings.seedVersion ?? 1) < SEED_VERSION) {
    await mergeSeedSpots();
    await db.settings.put({ ...settings, seedVersion: SEED_VERSION });
  }
}

/**
 * Brings newer built-in spot data (guides, peak details) to spots already stored on this device.
 * Spots you never edited take the new built-in version (incl. corrected positions); spots you edited
 * keep your text and marker and only gain the guide and the details of matching peaks.
 */
export async function mergeSeedSpots(): Promise<void> {
  const stored = new Map((await db.spots.toArray()).map((s) => [s.id, s]));
  const updates: Spot[] = [];
  for (const seed of SEED_SPOTS) {
    const cur = stored.get(seed.id);
    if (!cur) continue;
    if (!cur.updatedAt) {
      updates.push({ ...seed }); // never edited: take the corrected built-in spot as a whole (incl. position)
    } else {
      const byId = new Map(seed.peaks.map((p) => [p.id, p]));
      const peaks: Peak[] = cur.peaks.map((p) => ({ ...byId.get(p.id), ...p }));
      updates.push({ ...cur, peaks, guide: cur.guide ?? seed.guide });
    }
  }
  if (updates.length) await db.spots.bulkPut(updates);
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
  /** Your spot photos as data URLs (added in later versions; optional). */
  photos?: (Omit<UserPhoto, 'blob'> & { dataUrl: string })[];
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
