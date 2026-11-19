---
type: "Concept"
title: "Swell windows"
description: "Which swell directions reach a spot: openness from the coastline, the shore angle, the forecast's direction uncertainty and long-period wrap."
resource: "src/lib/conditions.ts"
tags: ["domain", "waves", "swell", "spots"]
sources:
  - resource: "scripts/swell-windows.ts"
    id: "generator"
  - resource: "src/data/swellOpen.ts"
    id: "data"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-19T14:30:00+00:00"
---
# Swell windows

`exposure(spot, dir, period)` in `src/lib/conditions.ts` says how much of a swell train reaches a spot (0–1). It scales the train's breaking height and its share of the swell size and energy, and colours the swell in the forecast (blue from 0.5, red below, grey below 0.1). Decision: [0026](/decisions/0026-swell-windows-from-the-coastline.md).

**1. The spot's window** (`windowAt`):
* **Built-in spots: from the coastline.** `scripts/swell-windows.ts` casts a ray every 2° from a point 1 km off the break (where the swell arrives, beyond the small headlands next to it) over the OpenStreetMap coastline of north Fuerteventura, Lobos and Lanzarote (`scripts/data/coastline.json`, simplified to 15 m). The distance to the first land sets how open that direction is: land within 3 km blocks it, 40 km or more (or none) is open, linear in between, because swell bends around an island and fills its shadow in with distance (Lanzarote 12 km away lets about a quarter in). Stored per spot as 180 digits 0–9 (`Spot.openness`, `src/data/swellOpen.ts`). In the app this is multiplied by the **shore angle**: full within 55° of the spot's facing, fading to 0 at 90° (swell running along the shore doesn't reach the break).
* **Local sources can narrow it** (`windowFromSources`): the hand-set `idealSwellDir ± swellWindow` then also applies. Only La Caleta, whose small bay the coastline data can't resolve ("west of NW doesn't wrap in").
* **Your own spots** use the hand-set window: 1 within 55 % of `swellWindow` around `idealSwellDir`, cosine taper to 0 at the edge.

**2. The general rule** for every spot: the window is averaged over the **direction spread**, a Gaussian of σ = 10° + 1.5° per second of peak period above 10 s (up to 22°): model directions are uncertain by about 10°, and long-period swell refracts further around headlands and into bays. So a swell near an edge counts partly instead of flipping between in and out within a few degrees, and a 16 s swell from the edge of a window gets in more than a 9 s one.

**What the coastline shows** (12 s swell, half or more getting in):
* North shore (Majanicho, La Caleta, Generosa, …): WSW to about N; NE swell only partly, Lanzarote shadows it.
* Rocky Point and Lobos: NW to NNW; due N is partly shadowed by Lanzarote's south-west tip.
* Corralejo beaches, Flag Beach, El Burro, Playa del Moro (east coast): NE to E; N only partly, NW hardly (matches "works on N–NE swells; NW mostly misses it").
* West coast (Cotillo, Esquinzo, Punta Blanca): SW to N.

The spot's Info tab shows the result as "Gets swell from NW–NNE (310°–15°)". Re-run the script after changing a spot's position or facing: `node_modules/.bin/vite-node scripts/swell-windows.ts` (`--fetch` downloads the coastline again).

Coastline © OpenStreetMap contributors, ODbL.
