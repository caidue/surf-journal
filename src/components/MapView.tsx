import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { BBox } from '../lib/geo';

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  color: string;
  label: string;
  title: string;
  muted?: boolean;
  draggable?: boolean;
}

interface Props {
  markers: MapMarker[];
  fit?: BBox | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMapClick?: (lat: number, lon: number) => void;
  onMarkerDrag?: (id: string, lat: number, lon: number) => void;
  height?: number | string;
  area?: BBox | null;
  /**
   * For maps inside a scrolling page: one finger scrolls the page, two fingers move the map
   * (ctrl/⌘ + wheel to zoom on desktop). Leave off for a full-screen map.
   */
  cooperative?: boolean;
}

// OpenFreeMap: free vector tiles, no API key (© OpenStreetMap contributors).
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export default function MapView({ markers, fit, selectedId, onSelect, onMapClick, onMarkerDrag, height = 420, area, cooperative }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const mk = useRef(new Map<string, maplibregl.Marker>());
  const cb = useRef({ onSelect, onMapClick, onMarkerDrag });
  cb.current = { onSelect, onMapClick, onMarkerDrag };

  useEffect(() => {
    if (!el.current) return;
    const m = new maplibregl.Map({
      container: el.current,
      style: MAP_STYLE,
      center: [-13.92, 28.73],
      zoom: 10.5,
      ...(fit
        ? {
            bounds: [
              [fit.west, fit.south],
              [fit.east, fit.north],
            ] as [[number, number], [number, number]],
            fitBoundsOptions: { padding: 40, maxZoom: 13 },
          }
        : {}),
      attributionControl: { compact: true },
      cooperativeGestures: !!cooperative,
    });
    // Redraw when the container changes size (e.g. switching Explore between map and list on a phone).
    const ro = new ResizeObserver(() => m.resize());
    ro.observe(el.current);
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    m.on('click', (e) => cb.current.onMapClick?.(e.lngLat.lat, e.lngLat.lng));
    m.on('load', () => {
      m.addSource('area', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'area-line', type: 'line', source: 'area', paint: { 'line-color': '#0b6e99', 'line-width': 1.5, 'line-dasharray': [3, 2] } });
    });
    map.current = m;
    const markersMap = mk.current;
    return () => {
      ro.disconnect();
      markersMap.forEach((x) => x.remove());
      markersMap.clear();
      m.remove();
      map.current = null;
    };
    // The initial fit is applied above; later changes go through the fit effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const seen = new Set<string>();
    for (const d of markers) {
      seen.add(d.id);
      let marker = mk.current.get(d.id);
      if (!marker) {
        const node = document.createElement('button');
        node.type = 'button';
        node.className = 'map-marker';
        node.addEventListener('click', (ev) => {
          ev.stopPropagation();
          cb.current.onSelect?.(d.id);
        });
        marker = new maplibregl.Marker({ element: node, draggable: !!d.draggable }).setLngLat([d.lon, d.lat]).addTo(m);
        marker.on('dragend', () => {
          const ll = marker!.getLngLat();
          cb.current.onMarkerDrag?.(d.id, ll.lat, ll.lng);
        });
        mk.current.set(d.id, marker);
      }
      marker.setLngLat([d.lon, d.lat]);
      marker.setDraggable(!!d.draggable);
      const node = marker.getElement();
      node.textContent = d.label;
      node.title = d.title;
      node.setAttribute('aria-label', d.title);
      node.style.background = d.color;
      node.classList.toggle('muted', !!d.muted);
      node.classList.toggle('selected', d.id === selectedId);
      node.style.zIndex = d.id === selectedId ? '5' : '1';
    }
    for (const [id, marker] of mk.current) {
      if (!seen.has(id)) {
        marker.remove();
        mk.current.delete(id);
      }
    }
  }, [markers, selectedId]);

  // Fit to region.
  const fitKey = fit ? [fit.south, fit.north, fit.west, fit.east].map((v) => v.toFixed(3)).join(',') : '';
  const firstFit = useRef(true);
  useEffect(() => {
    const m = map.current;
    if (firstFit.current) {
      firstFit.current = false; // handled by the constructor's `bounds`
      return;
    }
    if (!m || !fit) return;
    // Camera moves don't need the style to be loaded.
    m.fitBounds(
      [
        [fit.west, fit.south],
        [fit.east, fit.north],
      ],
      { padding: 40, maxZoom: 13, duration: 600 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  // Draw searched area outline.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const apply = () => {
      const src = m.getSource('area') as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData(
        area
          ? {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [area.west, area.south],
                  [area.east, area.south],
                  [area.east, area.north],
                  [area.west, area.north],
                  [area.west, area.south],
                ],
              },
            }
          : { type: 'FeatureCollection', features: [] },
      );
    };
    if (m.getSource('area')) apply();
    else m.once('load', apply);
  }, [area]);

  return <div ref={el} className="map" style={{ height }} />;
}
