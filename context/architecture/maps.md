---
type: "Reference"
title: "Maps"
description: "MapLibre map, markers, spot thumbnails."
resource: "src/components/MapView.tsx"
tags: ["architecture", "maps"]
sources:
  - resource: "https://openfreemap.org/"
    id: "ofm"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Maps

* `MapView.tsx`: MapLibre GL with the OpenFreeMap style (`MAP_STYLE`), score markers (colour = best score for you; ✕ = unsuitable all day; grey outside the searched region), cooperative gestures on embedded maps, draggable marker in the spot editor. See [OpenFreeMap / OSM](/data-sources/openfreemap-osm.md).
* `SpotThumb.tsx`: one hidden 64 px map renders square thumbnails one at a time (labels off), cached in memory and `localStorage` (only when online and tiles loaded); the hidden map is disposed after 15 s idle. Avoids one WebGL context per card (browsers allow ~16).
* Phone Explore switches between list and a full-height map (Map | List bar), so scrolling never fights the map.
