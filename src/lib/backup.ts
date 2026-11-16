import { exportAll } from '../db';

/**
 * Backup through the system share sheet: the phone offers "Save to Files" (iCloud Drive),
 * Drive, Dropbox, mail… so the journal can be kept in the user's own cloud without the app
 * signing in anywhere. The app never learns where the file went.
 */

const LAST_KEY = 'surf-journal.lastBackupAt';
/** One fixed name, so saving into the same folder again offers "Replace" instead of piling up copies. */
const NAME = 'surf-journal-backup';
/** A backup older than this (with sessions in the journal) is called out in Settings. */
export const BACKUP_DUE_DAYS = 30;

type ShareNavigator = { canShare?: (data: { files: File[] }) => boolean; share?: (data: { files: File[] }) => Promise<void> };
const nav = (): ShareNavigator => (typeof navigator === 'undefined' ? {} : (navigator as ShareNavigator));

/**
 * The backup as a file the share sheet accepts, or null when this browser can't share files.
 * Chrome only shares a fixed list of file types and JSON isn't on it, so the same content goes
 * out as a `.txt` there (import reads both).
 */
export function shareableFile(json: string): File | null {
  const n = nav();
  if (typeof File === 'undefined' || !n.share || !n.canShare) return null;
  const candidates = [new File([json], `${NAME}.json`, { type: 'application/json' }), new File([json], `${NAME}.txt`, { type: 'text/plain' })];
  for (const f of candidates) {
    try {
      if (n.canShare({ files: [f] })) return f;
    } catch {
      // try the next type
    }
  }
  return null;
}

/**
 * Whether to offer the share sheet: only on touch devices, where it leads to the phone's cloud
 * apps. Desktop share dialogs have no "save to my cloud" target; the download is better there.
 */
export function offersShareBackup(): boolean {
  const touch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
  return touch && shareableFile('{}') !== null;
}

export async function backupJson(): Promise<string> {
  return JSON.stringify(await exportAll(), null, 1);
}

export type ShareResult =
  | { status: 'shared' }
  /** The user closed the share sheet. */
  | { status: 'cancelled' }
  /**
   * The browser refused because building the backup took longer than a tap stays valid (large
   * journals with photos on Safari). Pass `file` back in on the next tap: it then opens at once.
   */
  | { status: 'retry'; file: File }
  | { status: 'unsupported' };

/**
 * Opens the share sheet with the backup. Only `files` is passed: iOS saves a `title` or `text`
 * as an extra text file next to the backup.
 */
export async function shareBackup(prepared?: File | null): Promise<ShareResult> {
  const file = prepared ?? shareableFile(await backupJson());
  if (!file) return { status: 'unsupported' };
  try {
    await nav().share!({ files: [file] });
  } catch (e) {
    const name = (e as { name?: string } | null)?.name;
    if (name === 'AbortError') return { status: 'cancelled' };
    if (name === 'NotAllowedError' && !prepared) return { status: 'retry', file };
    throw e;
  }
  markBackedUp();
  return { status: 'shared' };
}

/** When this device last made a backup (shared or downloaded); kept outside the backup itself. */
export function lastBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

export function markBackedUp(now: Date = new Date()): void {
  try {
    localStorage.setItem(LAST_KEY, now.toISOString());
  } catch {
    // private mode: the backup itself still worked
  }
}

const daysSince = (iso: string, now: Date) => Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));

/** "today", "yesterday", "12 days ago"; null when there is no backup yet. */
export function backupAge(last: string | null, now: Date = new Date()): string | null {
  if (!last || Number.isNaN(new Date(last).getTime())) return null;
  const d = daysSince(last, now);
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
}

/** True when there are sessions to lose and no backup from the last `BACKUP_DUE_DAYS` days. */
export function backupDue(last: string | null, sessions: number, now: Date = new Date()): boolean {
  if (!sessions) return false;
  if (!last || Number.isNaN(new Date(last).getTime())) return true;
  return daysSince(last, now) >= BACKUP_DUE_DAYS;
}
