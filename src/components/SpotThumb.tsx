import { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_STYLE } from './MapView';

/**
 * Small map thumbnails for spot cards. One hidden MapLibre map renders them one at a time from
 * the same vector tiles as the big map (no labels or icons), and each finished image is kept in
 * memory and in localStorage, so a spot's thumbnail is drawn only once. Running a live map per
 * card would mean a WebGL context per card, and browsers allow only about 16.
 */

const SIZE = 64; // CSS px of the hidden map (rendered at 2× for sharp thumbnails)
const ZOOM = 10.4;
const VERSION = 1;
const memory = new Map<string, string>();

const key = (lat: number, lon: number) => `surf-journal.mini.v${VERSION}:${lat.toFixed(4)},${lon.toFixed(4)}`;
const load = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const store = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage full or blocked: the memory copy still works for this visit */
  }
};

let ready: Promise<maplibregl.Map> | null = null;
let disposeTimer: ReturnType<typeof setTimeout> | undefined;
let queue: Promise<unknown> = Promise.resolve();

function getMap(): Promise<maplibregl.Map> {
  if (ready) return ready;
  ready = new Promise((resolve, reject) => {
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = `position:fixed;left:-10000px;top:0;width:${SIZE}px;height:${SIZE}px;pointer-events:none;`;
    document.body.appendChild(el);
    const m = new maplibregl.Map({
      container: el,
      style: MAP_STYLE,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      pixelRatio: 2,
      fadeDuration: 0,
      center: [-13.9, 28.7],
      zoom: ZOOM,
    });
    m.once('load', () => {
      // A thumbnail shows land, sea and roads only.
      for (const l of m.getStyle().layers ?? []) if (l.type === 'symbol') m.setLayoutProperty(l.id, 'visibility', 'none');
      resolve(m);
    });
    m.once('error', (e) => reject(e.error));
  });
  return ready;
}

/** Free the hidden map (its WebGL context) once no thumbnails have been needed for a while. */
function scheduleDispose() {
  clearTimeout(disposeTimer);
  disposeTimer = setTimeout(async () => {
    const r = ready;
    ready = null;
    const m = await r?.catch(() => null);
    const el = m?.getContainer();
    m?.remove();
    el?.remove();
  }, 15_000);
}

/** The cached thumbnail for a position, if it has been drawn before. */
export function cachedThumb(lat: number, lon: number): string | null {
  const k = key(lat, lon);
  const hit = memory.get(k) ?? load(k);
  if (hit) memory.set(k, hit);
  return hit;
}

/** Draws the thumbnail for a position (queued, one at a time). Resolves to a data URL, or null. */
export function thumbFor(lat: number, lon: number): Promise<string | null> {
  const hit = cachedThumb(lat, lon);
  if (hit) return Promise.resolve(hit);
  const k = key(lat, lon);
  const job = queue.then(async () => {
    clearTimeout(disposeTimer);
    const again = memory.get(k);
    if (again) return again;
    const m = await getMap();
    m.jumpTo({ center: [lon, lat], zoom: ZOOM });
    await Promise.race([new Promise<void>((r) => m.once('idle', () => r())), new Promise<void>((r) => setTimeout(r, 8000))]);
    const url = m.getCanvas().toDataURL('image/jpeg', 0.82);
    memory.set(k, url);
    // Keep it for next time only if the tiles were really there (not an empty offline render).
    if (navigator.onLine && m.areTilesLoaded()) store(k, url);
    scheduleDispose();
    return url;
  });
  const safe = job.catch(() => null);
  queue = safe;
  return safe;
}

/** Square map thumbnail with the spot as a blue dot in the middle. Sized by its container. */
export default function SpotThumb({ lat, lon }: { lat: number; lon: number }) {
  const [url, setUrl] = useState<string | null>(() => cachedThumb(lat, lon));
  useEffect(() => {
    let alive = true;
    setUrl(cachedThumb(lat, lon));
    if (!cachedThumb(lat, lon)) thumbFor(lat, lon).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [lat, lon]);
  return (
    <span className="spot-thumb" aria-hidden>
      {url && <img src={url} alt="" />}
      <span className="thumb-dot" />
    </span>
  );
}
