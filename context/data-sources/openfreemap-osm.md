---
type: "Reference"
title: "OpenFreeMap and OpenStreetMap"
description: "Map tiles and the base for some spot positions."
resource: "https://openfreemap.org/"
tags: ["data-source", "maps"]
sources:
  - resource: "https://openfreemap.org/"
    id: "ofm"
  - resource: "https://www.openstreetmap.org/copyright"
    id: "osm"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# OpenFreeMap and OpenStreetMap

* Vector tiles and style from OpenFreeMap (free, no key), © OpenStreetMap contributors; attribution in the app footer and map.
* Tiles, fonts and sprites are cached by the service worker as you view them ([Offline and PWA](/architecture/offline-pwa.md)).
* OSM names only a few north-shore breaks reliably (El Muelle, Bristol, Esquinzo, Playa del Moro beaches); some OSM names are misplaced (e.g. a "Playa de El Hierro" node far from El Hierro), so spot pins prefer Surfline/surf-forecast where OSM is wrong ([Spot catalogue](/spots/catalogue.md)).
