---
type: "Decision"
title: "0015: Split El Hierro into three spots"
description: "Izquierda del Hierro, Derecha de los Alemanes and The Bubble are separate spots again (seed 6), as most guides list them."
resource: "src/data/seedSpots.ts"
tags: ["decision", "spots", "el-hierro"]
sources:
  - resource: "https://www.surfline.com/surf-report/the-bubble-hierro-right-/5842041f4e65fad6a7708cbf"
    id: "surfline"
  - resource: "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/derecha_de_los_alemanes/index.html"
    id: "wannasurf-derecha"
  - resource: "https://www.surf-forecast.com/breaks/Izquierda"
    id: "sf-izquierda"
  - resource: "https://vvanat.fr/blog/carte-spot-surf-corralejo/"
    id: "vvanat"
  - resource: "https://www.openstreetmap.org/way/684879298"
    id: "osm-la-derecha"
decision_status: "accepted"
decided: "2026-11-14"
supersedes: "context/decisions/0009-el-hierro-single-spot.md"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T00:30:00+00:00"
---
# Split El Hierro into three spots

## Context
[Decision 0009](/decisions/0009-el-hierro-single-spot.md) followed Surfline and made El Hierro one spot with three rated peaks. The user asked for the peaks to be separate spots, as well-known sites list them. Checked on 2026-11-14:

| Site | How it lists the El Hierro waves |
|---|---|
| Surfline | One spot, "The Bubble (Hierro Right)"; its text describes Hierro Left ("also known as El Hierro") and, just east, Hierro Right / The Bubble |
| Wannasurf | Three spots: Hierro (left) / Izquierda, Derecha de los Alemanes ("Hierro right"), The Bubble ("Derecha") |
| surf-forecast.com | Five: Izquierda, Derecha de los Alemanes, Hierro (Derecha de los Alemanes), Yarro, The Bubble |
| fuerteventuraplayas.com | Izquierda del Hierro and Derecha de los Alemanes (The Bubble not listed) |
| vvanat.fr | "El Hierro" with two waves (Derecha de los Alemanes, La Izquierda); The Bubble its own spot |
| Windguru (user spots) | El Hierro, Derecha de los Alemanes, Bubble |

## Decision
Three spots, as Wannasurf and most guides have them, each linking to Surfline's one spot:

* **Izquierda del Hierro** (`fv-el-hierro`, the id the old spot had, because Surfline calls the left "El Hierro"): advanced, all tides, west side of the bay.
* **Derecha de los Alemanes** (`fv-derecha-alemanes`): advanced, all tides, needs more swell than the left, east side of the bay. Wannasurf's access note puts it there ("the right on your right, the left on your left" seen from the beach), although its own pin is slightly west.
* **The Bubble** (`fv-the-bubble`, back from retirement): expert, mid–high tide, at Surfline's point off OSM's "La Derecha" beach, east of the bay.

"El Hierro" stays searchable as an alias of both bay waves; "Hierro Right" is an alias of the right and of The Bubble. surf-forecast's "Hierro" and "Yarro" entries are treated as duplicates (Yarro is an alias of the right).

## Consequences
* Each wave has its own forecast row, rating, guide and session history; no per-peak rating at El Hierro.
* Devices that ran seeds 4–5 already moved The Bubble's sessions to El Hierro; that cannot be undone automatically (no peak is stored per session, [decision 0012](/decisions/0012-no-peak-split-in-sessions.md)). Such sessions now belong to Izquierda del Hierro and can be moved by editing the session.
* Pins disagree between sources by up to 1 km ([pending: spot pins](/decisions/pending/verify-spot-pins.md)).
