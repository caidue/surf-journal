import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { importAll, type Backup } from '../db';
import { backupAge, backupDue, backupJson, lastBackupAt, markBackedUp, offersShareBackup, shareableFile, shareBackup } from './backup';

const error = (name: string) => Object.assign(new Error(name), { name });

/** A browser that shares the given file extensions. */
function stubShare(extensions: string[], share: (d: { files: File[] }) => Promise<void> = async () => {}) {
  const fn = vi.fn(share);
  vi.stubGlobal('navigator', {
    canShare: (d: { files: File[] }) => d.files.every((f) => extensions.some((x) => f.name.endsWith(x))),
    share: fn,
  });
  return fn;
}

describe('backup through the share sheet', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shares JSON where the browser takes it, a .txt where it only takes text', () => {
    stubShare(['.json', '.txt']);
    expect(shareableFile('{}')?.name).toBe('surf-journal-backup.json');
    stubShare(['.txt']);
    const txt = shareableFile('{}');
    expect(txt?.name).toBe('surf-journal-backup.txt');
    expect(txt?.type).toBe('text/plain');
  });

  it('offers nothing where files cannot be shared', async () => {
    stubShare([]);
    expect(shareableFile('{}')).toBeNull();
    vi.stubGlobal('navigator', {});
    expect(shareableFile('{}')).toBeNull();
    expect(await shareBackup()).toEqual({ status: 'unsupported' });
  });

  it('is offered on touch devices only', () => {
    stubShare(['.json']);
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    expect(offersShareBackup()).toBe(false);
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    expect(offersShareBackup()).toBe(true);
    stubShare([]);
    expect(offersShareBackup()).toBe(false);
  });

  it('shares only the file, which imports again, and notes the time', async () => {
    const share = stubShare(['.txt']);
    expect(await shareBackup()).toEqual({ status: 'shared' });
    const data = share.mock.calls[0][0];
    expect(Object.keys(data)).toEqual(['files']);
    const backup = JSON.parse(await data.files[0].text()) as Backup;
    expect(backup.app).toBe('surf-journal');
    expect(await importAll(backup)).toEqual({ spots: backup.spots.length, sessions: backup.sessions.length });
    expect(backupAge(lastBackupAt())).toBe('today');
  });

  it('a closed share sheet is not a backup', async () => {
    stubShare(['.json'], async () => Promise.reject(error('AbortError')));
    expect(await shareBackup()).toEqual({ status: 'cancelled' });
    expect(lastBackupAt()).toBeNull();
  });

  it('hands the file back when the tap expired, and shares it on the next tap', async () => {
    let calls = 0;
    const share = stubShare(['.json'], async () => (calls++ ? undefined : Promise.reject(error('NotAllowedError'))));
    const first = await shareBackup();
    expect(first.status).toBe('retry');
    expect(lastBackupAt()).toBeNull();
    const file = (first as { file: File }).file;
    expect(await shareBackup(file)).toEqual({ status: 'shared' });
    expect(share.mock.calls[1][0].files[0]).toBe(file);
  });

  it('passes other errors on, also a second refusal', async () => {
    stubShare(['.json'], async () => Promise.reject(error('NotAllowedError')));
    const file = new File([await backupJson()], 'surf-journal-backup.json');
    await expect(shareBackup(file)).rejects.toThrow('NotAllowedError');
    stubShare(['.json'], async () => Promise.reject(error('DataError')));
    await expect(shareBackup()).rejects.toThrow('DataError');
  });

  it('says how old the last backup is and when one is due', () => {
    const now = new Date('2026-11-16T12:00:00Z');
    expect(backupAge(null, now)).toBeNull();
    expect(backupAge('nonsense', now)).toBeNull();
    expect(backupAge('2026-11-16T08:00:00Z', now)).toBe('today');
    expect(backupAge('2026-11-15T11:00:00Z', now)).toBe('yesterday');
    expect(backupAge('2026-11-04T12:00:00Z', now)).toBe('12 days ago');

    expect(backupDue(null, 0, now)).toBe(false);
    expect(backupDue(null, 3, now)).toBe(true);
    expect(backupDue('2026-11-04T12:00:00Z', 3, now)).toBe(false);
    expect(backupDue('2026-10-17T12:00:00Z', 3, now)).toBe(true);
    expect(backupDue('2026-10-01T12:00:00Z', 0, now)).toBe(false);

    markBackedUp(now);
    expect(lastBackupAt()).toBe('2026-11-16T12:00:00.000Z');
  });
});
