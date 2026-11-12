import { SLOT_MIN } from '../types';

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Today's date (YYYY-MM-DD) at a location with the given UTC offset (defaults to the browser's). */
export function todayAt(utcOffsetSeconds?: number): string {
  const d = new Date();
  if (utcOffsetSeconds == null) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const local = new Date(d.getTime() + utcOffsetSeconds * 1000);
  return local.toISOString().slice(0, 10);
}

/** Minutes after local midnight right now at the location. */
export function nowMinutesAt(utcOffsetSeconds?: number): number {
  const d = new Date();
  if (utcOffsetSeconds == null) return d.getHours() * 60 + d.getMinutes();
  const local = new Date(d.getTime() + utcOffsetSeconds * 1000);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
}

export function fmtMin(min: number): string {
  const m = Math.max(0, Math.min(24 * 60, Math.round(min)));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** "2026-11-12T07:41" -> 461 */
export function isoToMin(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = iso.split('T')[1];
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function fmtDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }): string {
  return new Date(date + 'T12:00:00Z').toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' });
}

export const slotOf = (min: number) => Math.floor(min / SLOT_MIN);
export const minOfSlot = (slot: number) => slot * SLOT_MIN;

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
