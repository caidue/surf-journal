export const toRad = (d: number) => (d * Math.PI) / 180;
export const toDeg = (r: number) => (r * 180) / Math.PI;

/** Signed smallest difference a - b in degrees, in [-180, 180). */
export function angdiff(a: number, b: number): number {
  return ((((a - b + 540) % 360) + 360) % 360) - 180;
}

export function norm360(d: number): number {
  return ((d % 360) + 360) % 360;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Point reached travelling distKm from (lat, lon) along bearingDeg. */
export function destination(lat: number, lon: number, bearingDeg: number, distKm: number): [number, number] {
  const R = 6371;
  const d = distKm / R;
  const b = toRad(bearingDeg);
  const p1 = toRad(lat);
  const l1 = toRad(lon);
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b));
  const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return [toDeg(p2), ((toDeg(l2) + 540) % 360) - 180];
}

const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
export function compass(deg: number | null | undefined): string {
  if (deg == null || Number.isNaN(deg)) return '–';
  return POINTS[Math.round(norm360(deg) / 22.5) % 16];
}

export interface BBox {
  south: number;
  north: number;
  west: number;
  east: number;
}

export function inBBox(lat: number, lon: number, b: BBox, bufferKm = 0): boolean {
  const dLat = bufferKm / 111;
  const dLon = bufferKm / (111 * Math.cos(toRad(lat)));
  return lat >= b.south - dLat && lat <= b.north + dLat && lon >= b.west - dLon && lon <= b.east + dLon;
}

export function bboxAround(lat: number, lon: number, km: number): BBox {
  const dLat = km / 111;
  const dLon = km / (111 * Math.cos(toRad(lat)));
  return { south: lat - dLat, north: lat + dLat, west: lon - dLon, east: lon + dLon };
}

export function bboxOf(points: { lat: number; lon: number }[]): BBox | null {
  if (!points.length) return null;
  return points.reduce<BBox>(
    (b, p) => ({
      south: Math.min(b.south, p.lat),
      north: Math.max(b.north, p.lat),
      west: Math.min(b.west, p.lon),
      east: Math.max(b.east, p.lon),
    }),
    { south: 90, north: -90, west: 180, east: -180 },
  );
}

/** Point a few km out to sea in front of the spot: wave models mask cells that touch land. */
export function samplePoint(spot: { lat: number; lon: number; facing: number }, km = 2.5): { lat: number; lon: number } {
  const [lat, lon] = destination(spot.lat, spot.lon, spot.facing, km);
  return { lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 };
}
