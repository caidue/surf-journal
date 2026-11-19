/**
 * Which directions each built-in spot is open to, from the real coastline (OpenStreetMap).
 *
 * For every spot a ray is cast from a point 1 km off the break (along its facing) every 2° over
 * the sea, to the first land (Fuerteventura, Lobos, Lanzarote). How open that direction is depends
 * on how far away the land is: swell bends around an island and fills its shadow in with distance,
 * so land within 3 km blocks it, Lanzarote 12 km away lets about a quarter in, and land 40 km or
 * more away (or none) counts as open. The result goes to src/data/swellOpen.ts (one digit 0–9 per
 * 2°), which lib/conditions.ts → exposure() combines with the spot's facing.
 *
 *   node_modules/.bin/vite-node scripts/swell-windows.ts            # compute from the saved coastline
 *   node_modules/.bin/vite-node scripts/swell-windows.ts --fetch    # download the coastline first
 *
 * Coastline: © OpenStreetMap contributors, ODbL (scripts/data/coastline.json).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { SEED_SPOTS } from '../src/data/seedSpots';
import { destination } from '../src/lib/geo';

const COAST = 'scripts/data/coastline.json';
const OUT = 'src/data/swellOpen.ts';
const BBOX = [28.45, -14.25, 29.45, -13.25]; // S, W, N, E: north Fuerteventura, Lobos, Lanzarote
const STEP = 2; // degrees
const OPEN_KM = 40; // land this far away (or none) = open
const BLOCK_KM = 3; // land this close = blocked
const START_KM = 1; // rays start 1 km off the break, where the swell arrives (beyond the small headlands next to it)
const LAT0 = 28.75;
const KX = 111.32 * Math.cos((LAT0 * Math.PI) / 180);
const KY = 110.57;

type LL = [number, number];

/** Douglas–Peucker in km. */
function simplify(pts: LL[], tolKm: number): LL[] {
  if (pts.length < 3) return pts;
  const xy = pts.map(([la, lo]) => [lo * KX, la * KY]);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = xy[a];
    const [bx, by] = xy[b];
    const L = Math.hypot(bx - ax, by - ay) || 1e-9;
    let best = -1;
    let dmax = 0;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - xy[i][1]) - (ax - xy[i][0]) * (by - ay)) / L;
      if (d > dmax) {
        dmax = d;
        best = i;
      }
    }
    if (best > 0 && dmax > tolKm) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

async function fetchCoast() {
  const q = `[out:json][timeout:90];way["natural"="coastline"](${BBOX.join(',')});out geom;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'User-Agent': 'surf-journal-build/1.0', Accept: 'application/json' },
    body: new URLSearchParams({ data: q }),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const json = (await res.json()) as { elements: { geometry: { lat: number; lon: number }[] }[] };
  const ways = json.elements.map((w) => simplify(w.geometry.map((g) => [Math.round(g.lat * 1e5) / 1e5, Math.round(g.lon * 1e5) / 1e5] as LL), 0.015));
  mkdirSync('scripts/data', { recursive: true });
  writeFileSync(COAST, JSON.stringify({ source: '© OpenStreetMap contributors, ODbL 1.0 (natural=coastline)', fetched: new Date().toISOString().slice(0, 10), bbox: BBOX, ways }));
  console.log(`saved ${ways.length} ways, ${ways.reduce((a, w) => a + w.length, 0)} points`);
}

const toXY = ([la, lo]: LL) => [(lo + 13.9) * KX, (la - LAT0) * KY] as [number, number];

/** Distance (km) along a ray from p in direction `deg` to the first coastline segment, or Infinity. */
function hitKm(p: [number, number], deg: number, segs: [number, number, number, number][], maxKm: number): number {
  const dx = Math.sin((deg * Math.PI) / 180);
  const dy = Math.cos((deg * Math.PI) / 180);
  let best = Infinity;
  for (const [x1, y1, x2, y2] of segs) {
    const ex = x2 - x1;
    const ey = y2 - y1;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = ((x1 - p[0]) * ey - (y1 - p[1]) * ex) / den; // along the ray
    const u = ((x1 - p[0]) * dy - (y1 - p[1]) * dx) / den; // along the segment
    if (t > 0.03 && t < maxKm && u >= 0 && u <= 1 && t < best) best = t;
  }
  return best;
}

/** How open a direction is (0–1) from the distance to the first land. */
const openness = (km: number) => (km >= OPEN_KM ? 1 : km <= BLOCK_KM ? 0 : (km - BLOCK_KM) / (OPEN_KM - BLOCK_KM));

if (process.argv.includes('--fetch') || !existsSync(COAST)) await fetchCoast();
const coast = JSON.parse(readFileSync(COAST, 'utf8')) as { ways: LL[][]; source: string; fetched: string };
const segs: [number, number, number, number][] = [];
for (const w of coast.ways) for (let i = 1; i < w.length; i++) segs.push([...toXY(w[i - 1]), ...toXY(w[i])]);

const result: Record<string, string> = {};
const rows: string[] = [];
const fmtSectors = (o: number[]) => {
  // For the console: where it is at least half open.
  const out: string[] = [];
  let run: number | null = null;
  const n = o.length;
  const start = o.findIndex((v) => v < 0.5);
  if (start < 0) return '0–360';
  for (let k = 1; k <= n; k++) {
    const i = (start + k) % n;
    if (o[i] >= 0.5 && run == null) run = i;
    if (o[i] < 0.5 && run != null) {
      out.push(`${run * STEP}–${((i - 1 + n) % n) * STEP}`);
      run = null;
    }
  }
  return out.join(', ') || 'none';
};
for (const s of SEED_SPOTS) {
  const [la, lo] = destination(s.lat, s.lon, s.facing, START_KM);
  const p = toXY([la, lo]);
  const open = Array.from({ length: 360 / STEP }, (_, i) => openness(hitKm(p, i * STEP, segs, OPEN_KM)));
  result[s.id] = open.map((v) => Math.round(v * 9)).join('');
  rows.push(`${s.name.padEnd(26)} hand ${String(s.idealSwellDir).padStart(3)}° ±${s.swellWindow}° (${(s.idealSwellDir - s.swellWindow + 360) % 360}–${(s.idealSwellDir + s.swellWindow) % 360})  map ≥ half open: ${fmtSectors(open)}`);
}

const body = `// Generated by scripts/swell-windows.ts from the OpenStreetMap coastline (${coast.source}, fetched ${coast.fetched}).
// Do not edit by hand: re-run the script. Per spot, how open the sea is in each direction the swell
// comes FROM: one digit per ${STEP}° starting at 0° (N), 0 = land within ${BLOCK_KM} km … 9 = no land within ${OPEN_KM} km.
// lib/conditions.ts → exposure() combines it with the spot's facing.
export const SWELL_OPEN_STEP = ${STEP};
export const SWELL_OPEN: Record<string, string> = ${JSON.stringify(result, null, 2)};
`;
writeFileSync(OUT, body);
console.log(rows.join('\n'));
console.log(`\nwrote ${OUT}`);
