---
type: "Decision"
title: "0013: Add the spots other services list"
description: "Corralejo Beach and Playa los Matos (Surfline) and Suicides (surf-forecast, Wannasurf) became built-in spots in seed 5."
resource: "src/data/seedSpots.ts"
tags: ["decision", "spots"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
  - resource: "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/suicidios/index.html"
    id: "wannasurf-suicidios"
  - resource: "https://www.surf-forecast.com/breaks/Suicides_2"
    id: "sf-suicides"
  - resource: "https://hellocanaryislands.com/beaches/fuerteventura/corralejo-beach"
    id: "hello-corralejo"
decision_status: "accepted"
decided: "2026-11-13"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T23:35:00+00:00"
---
# Add the spots other services list

## Context
The research found three spots that established services list and we didn't: Surfline's Corralejo Beach and Playa los Matos, and surf-forecast's and Wannasurf's Suicides. The user asked to add them.

## Decision
Seed 5 adds them, with guides in `src/data/spotGuides.ts`:

* **Suicides** (`fv-suicides`): lava reef between Generosa and Mejillones, expert, mid–high tide, NW–NNW swell, S–SE wind. Two rated peaks: the main reef (expert) and the less risky inside left (advanced), so an advanced surfer sees "Best for you: Inside left". Pin from Wannasurf; surf-forecast's point is 1.7 km out to sea.
* **Playa los Matos** (`fv-playa-los-matos`) and **Corralejo Beach** (`fv-corralejo-beach`): sand beach breaks in the Corralejo dunes, all levels, N–NE swell, facing ENE. Pins use Surfline's latitudes, snapped to the OSM shoreline (Surfline's own pins are 180 m and 420 m out to sea).
* **Mejillones** moves to surf-forecast's longitude (28.7485, −13.9106), so the North Shore order matches both forecast sites: Generosa, Suicides, Mejillones, La Caleta.

## Consequences
* The two dune beaches are 200 m apart and share their settings, because no source tells them apart; they rate alike. Merging them would break the Surfline parity of [decision 0008](/decisions/0008-surfline-naming-and-aliases.md).
* All 13 Surfline spots in the area are now built in.
* Pins stay flagged as approximate ([pending: spot pins](/decisions/pending/verify-spot-pins.md)).
