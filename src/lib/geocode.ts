import { db } from '../db';
import type { BBox } from './geo';

/**
 * Free-text region search: "northern part of Fuerteventura", "Norden von Fuerteventura",
 * "norte de Fuerteventura" → place + part → Nominatim bounding box → sub-box.
 * Nominatim policy: max 1 request/s, no autocomplete, cache results (done here).
 */

export type Part = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest' | 'center';

const DIR_WORDS: [RegExp, Part][] = [
  [/\b(north[- ]?east(ern)?|nord[- ]?ost(en)?|nordöstlich\w*|noreste|nordeste)\b/i, 'northeast'],
  [/\b(north[- ]?west(ern)?|nord[- ]?west(en)?|nordwestlich\w*|noroeste)\b/i, 'northwest'],
  [/\b(south[- ]?east(ern)?|süd[- ]?ost(en)?|südöstlich\w*|sureste|sudeste)\b/i, 'southeast'],
  [/\b(south[- ]?west(ern)?|süd[- ]?west(en)?|südwestlich\w*|suroeste|sudoeste)\b/i, 'southwest'],
  [/\b(north(ern)?|nord(en)?|nördlich\w*|norte)\b/i, 'north'],
  [/\b(south(ern)?|süd(en)?|südlich\w*|sur)\b/i, 'south'],
  [/\b(east(ern)?|ost(en)?|östlich\w*|este)\b/i, 'east'],
  [/\b(west(ern)?|westen|westlich\w*|oeste)\b/i, 'west'],
  [/\b(central|centre|center|middle|mitte|zentral\w*|centro)\b/i, 'center'],
];

const FILLER = /\b(the|part|parts|of|side|coast|shore|area|region|in|im|von|vom|der|die|das|des|teil|seite|küste|parte|zona|costa)\b/gi;

export function parseRegionQuery(q: string): { place: string; part: Part | null } {
  let s = ` ${q} `;
  let part: Part | null = null;
  for (const [re, p] of DIR_WORDS) {
    if (re.test(s)) {
      part = p;
      s = s.replace(re, ' ');
      break;
    }
  }
  if (part) {
    s = s.replace(FILLER, ' ').replace(/^\s*(de|del|of)\s+/i, ' ');
  }
  s = s.replace(/[,;]+/g, ' ').replace(/\s+/g, ' ').trim();
  return { place: s || q.trim(), part };
}

export function subBox(b: BBox, part: Part | null): BBox {
  if (!part) return b;
  const h = b.north - b.south;
  const w = b.east - b.west;
  const f = 0.5; // keep half of the extent in the requested direction
  const r = { ...b };
  if (part.includes('north')) r.south = b.north - h * f;
  if (part.includes('south')) r.north = b.south + h * f;
  if (part.includes('east')) r.west = b.east - w * f;
  if (part.includes('west')) r.east = b.west + w * f;
  if (part === 'center') {
    r.south = b.south + h * 0.25;
    r.north = b.north - h * 0.25;
    r.west = b.west + w * 0.25;
    r.east = b.east - w * 0.25;
  }
  return r;
}

export interface GeoResult {
  name: string;
  lat: number;
  lon: number;
  bbox: BBox;
}

let lastCall = 0;

export async function geocode(place: string): Promise<GeoResult | null> {
  const q = place.trim().toLowerCase();
  if (!q) return null;
  const cached = await db.geocache.get(q);
  if (cached && Date.now() - cached.at < 30 * 24 * 3600 * 1000) return cached.result;
  const wait = 1100 - (Date.now() - lastCall);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(place)}`, {
    headers: { 'Accept-Language': navigator.language || 'en' },
  });
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const arr = (await res.json()) as any[];
  const hit = arr[0];
  const result: GeoResult | null = hit
    ? {
        name: hit.display_name,
        lat: Number(hit.lat),
        lon: Number(hit.lon),
        bbox: {
          south: Number(hit.boundingbox[0]),
          north: Number(hit.boundingbox[1]),
          west: Number(hit.boundingbox[2]),
          east: Number(hit.boundingbox[3]),
        },
      }
    : null;
  await db.geocache.put({ q, result, at: Date.now() });
  return result;
}

export const PART_LABEL: Record<Part, string> = {
  north: 'north',
  south: 'south',
  east: 'east',
  west: 'west',
  northeast: 'north-east',
  northwest: 'north-west',
  southeast: 'south-east',
  southwest: 'south-west',
  center: 'centre',
};
