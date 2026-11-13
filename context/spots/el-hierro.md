---
type: "Reference"
title: "El Hierro area (three spots)"
description: "Izquierda del Hierro, Derecha de los Alemanes and The Bubble: how sources split and place them, and how the app models them."
resource: "src/data/seedSpots.ts"
tags: ["spots", "el-hierro"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
  - resource: "https://www.surfline.com/surf-report/the-bubble-hierro-right-/5842041f4e65fad6a7708cbf"
    id: "surfline-bubble"
  - resource: "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/hierro_left/index.html"
    id: "wannasurf-left"
  - resource: "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/derecha_de_los_alemanes/index.html"
    id: "wannasurf-derecha"
  - resource: "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/the_bubble/index.html"
    id: "wannasurf-bubble"
  - resource: "https://www.openstreetmap.org/way/684879298"
    id: "osm-la-derecha"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T00:30:00+00:00"
---
# El Hierro area (three spots)

West of Majanicho on the North Shore track. Since seed 6 the app has **three spots**, as Wannasurf and most guides list them ([decision 0015](/decisions/0015-split-el-hierro.md)); seeds 4–5 had one spot with three rated peaks ([decision 0009](/decisions/0009-el-hierro-single-spot.md), superseded).

## Layout
From the El Hierro beach (OSM "El Hierro", 28.7389, −13.9517) facing the sea: the **left** breaks off the west side of the bay and peels east, the **right** breaks off the east side and peels west, and you paddle out in the middle; the current pulls into the small cove on the west (OSM "Caleta de la Seba"). **The Bubble** is a separate reef further east, off the beach OSM calls "La Derecha" (28.7415, −13.9479), between the bay and Majanicho. Surfline's text agrees: "Hierro Left, also known as El Hierro", and "just to the east" Hierro Right / The Bubble.

## Spots

| id | Name | Level | Tide | Size (m, face) | Shape | Pin |
|---|---|---|---|---|---|---|
| `fv-el-hierro` | Izquierda del Hierro | advanced | all | 1.0–3.5 | punchy, fast | Wannasurf 28.7404, −13.9547 (approximate) |
| `fv-derecha-alemanes` | Derecha de los Alemanes | advanced | all | 1.2–3.0 | punchy, sectiony | 28.7403, −13.9519, east side of the bay (Windguru user pin; approximate) |
| `fv-the-bubble` | The Bubble | expert | mid–high | 1.4–3.5 | hollow, fast | Surfline 28.7442, −13.9481 |

All three link to Surfline's single spot "The Bubble (Hierro Right)" and to their own surf-forecast entry (Izquierda, Los-Alemanes, The-Bubble). They share one forecast grid cell, so they differ through level, size range, tide, exposure and shape, not through the forecast itself.

## Where sources disagree
* **Names:** "Hierro Right" means The Bubble on Surfline and Derecha de los Alemanes on Wannasurf, so it is only an alias (of both). "El Hierro" is Surfline's name for the left and an alias of both bay waves.
* **Pins** differ by up to 1 km: Wannasurf puts the right slightly *west* of the left, against its own access note; surf-forecast puts "Derecha de los Alemanes" 1 km west and has extra entries "Hierro" and "Yarro" (treated as duplicates; Yarro is an alias of the right). See [pending: spot pins](/decisions/pending/verify-spot-pins.md).
* **Tide for the right:** Wannasurf, surf-forecast and fuerteventuraplayas say all tides; vvanat.fr says low tide is best. The app uses all tides and mentions the low-tide preference in the guide.
* **Level for the left:** Wannasurf "all surfers", fuerteventuraplayas "expert", vvanat "advanced"; the app uses advanced.

Guides are in `src/data/spotGuides.ts` under the same ids. Sessions that seeds 4–5 moved from The Bubble to El Hierro stay with Izquierda del Hierro (no peak is stored per session).
