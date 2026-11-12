// Draws the app icons (PNG + SVG) into public/ with plain Node: no native image tools needed.
// Run: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
mkdirSync(OUT, { recursive: true });

// Brand colours (match the top bar gradient).
const TOP = [0x0e, 0x7f, 0xae];
const BOTTOM = [0x0b, 0x4f, 0x6c];
const SUN = [0xfb, 0xbf, 0x24];

// The wave mark from the favicon, in a 32×32 box, as absolute cubic Béziers.
const START = [5, 20];
const CURVES = [
  [[9, 12], [15, 10], [19, 14]],
  [[16, 14], [14, 16], [15, 19]],
  [[17, 22], [22, 21], [27, 18]],
  [[24, 24], [18, 27], [12, 26]],
  [[8, 26], [6, 24], [5, 20]],
];
const WAVE_BOX = { x0: 5, x1: 27, y0: 10.4, y1: 26.8 };
const SUN_C = [22.5, 10.5];
const SUN_R = 3.4;

function wavePolygon(map) {
  const pts = [map(START)];
  let p0 = START;
  for (const [c1, c2, p3] of CURVES) {
    for (let i = 1; i <= 24; i++) {
      const t = i / 24;
      const u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1];
      pts.push(map([x, y]));
    }
    p0 = p3;
  }
  return pts;
}

/** Coverage (0..1) per pixel of a polygon: 8 sub-scanlines per pixel, exact horizontal coverage. */
function polygonCoverage(size, poly) {
  const cov = new Float32Array(size * size);
  const SS = 8;
  for (let y = 0; y < size; y++) {
    for (let s = 0; s < SS; s++) {
      const yy = y + (s + 0.5) / SS;
      const xs = [];
      for (let i = 0; i < poly.length; i++) {
        const [ax, ay] = poly[i];
        const [bx, by] = poly[(i + 1) % poly.length];
        if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + ((yy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const a = Math.max(0, xs[k]);
        const b = Math.min(size, xs[k + 1]);
        for (let x = Math.floor(a); x < Math.ceil(b); x++) {
          const overlap = Math.min(b, x + 1) - Math.max(a, x);
          if (overlap > 0) cov[y * size + x] += overlap / SS;
        }
      }
    }
  }
  return cov;
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Signed distance to a rounded square [0,size]² with corner radius r (negative inside). */
function roundedSquareDist(px, py, size, r) {
  const h = size / 2;
  const qx = Math.abs(px - h) - (h - r);
  const qy = Math.abs(py - h) - (h - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function render(size, { rounded, waveWidth }) {
  const scale = (waveWidth * size) / (WAVE_BOX.x1 - WAVE_BOX.x0);
  const cx = (WAVE_BOX.x0 + WAVE_BOX.x1) / 2;
  const cy = (Math.min(WAVE_BOX.y0, SUN_C[1] - SUN_R) + WAVE_BOX.y1) / 2;
  const map = ([x, y]) => [size / 2 + (x - cx) * scale, size / 2 + (y - cy) * scale];
  const wave = polygonCoverage(size, wavePolygon(map));
  const [sx, sy] = map(SUN_C);
  const sr = SUN_R * scale;
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const bg = TOP.map((c, i) => c + (BOTTOM[i] - c) * t);
    for (let x = 0; x < size; x++) {
      const alpha = rounded ? clamp01(0.5 - roundedSquareDist(x + 0.5, y + 0.5, size, size * 0.22)) : 1;
      let col = bg;
      const sun = clamp01(sr + 0.5 - Math.hypot(x + 0.5 - sx, y + 0.5 - sy));
      col = col.map((c, i) => c + (SUN[i] - c) * sun);
      const w = clamp01(wave[y * size + x]);
      col = col.map((c) => c + (255 - c) * w);
      const o = (y * size + x) * 4;
      px[o] = Math.round(col[0]);
      px[o + 1] = Math.round(col[1]);
      px[o + 2] = Math.round(col[2]);
      px[o + 3] = Math.round(alpha * 255);
    }
  }
  return encodePng(size, px);
}

/* ---------- minimal PNG encoder ---------- */
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- outputs ---------- */
const files = {
  'icon-192.png': render(192, { rounded: true, waveWidth: 0.6 }),
  'icon-512.png': render(512, { rounded: true, waveWidth: 0.6 }),
  // Maskable: full bleed, artwork inside the central safe circle (80 % diameter).
  'icon-maskable-512.png': render(512, { rounded: false, waveWidth: 0.5 }),
  // iOS adds its own rounded corners and turns transparency black, so this one is full bleed.
  'apple-touch-icon.png': render(180, { rounded: false, waveWidth: 0.6 }),
};
for (const [name, buf] of Object.entries(files)) writeFileSync(resolve(OUT, name), buf);

const d =
  `M${START.join(' ')}` + CURVES.map(([a, b, c]) => `C${a.join(' ')} ${b.join(' ')} ${c.join(' ')}`).join('') + 'Z';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e7fae"/><stop offset="1" stop-color="#0b4f6c"/></linearGradient></defs>
  <rect width="32" height="32" rx="7" fill="url(#g)"/>
  <g transform="translate(16 16) scale(0.87) translate(-16 -18.6)">
    <circle cx="${SUN_C[0]}" cy="${SUN_C[1]}" r="${SUN_R}" fill="#fbbf24"/>
    <path d="${d}" fill="#fff"/>
  </g>
</svg>
`;
writeFileSync(resolve(OUT, 'icon.svg'), svg);
console.log('Wrote', [...Object.keys(files), 'icon.svg'].join(', '));
