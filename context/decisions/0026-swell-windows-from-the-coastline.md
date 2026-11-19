---
type: "Decision"
title: "0026: Swell windows from the coastline, softened by the forecast's direction uncertainty"
description: "Built-in spots get their swell window from the OpenStreetMap coastline; every window is averaged over a direction spread that grows with the swell period."
resource: "src/lib/conditions.ts"
tags: ["decision", "waves", "swell", "spots"]
sources:
  - resource: "scripts/swell-windows.ts"
    id: "generator"
decision_status: accepted
decided: "2026-11-19"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-19T14:30:00+00:00"
---
# 0026: Swell windows from the coastline, softened by the forecast's direction uncertainty

## Context
Each spot had a hand-set window (`idealSwellDir ± swellWindow`) with a hard edge. On 2026-11-19 La Caleta's ±40° window shut out the day's main swell from 311° completely, so the forecast showed it red and facing the wrong way although it got into the bay. Model swell directions are uncertain by about 10°, long-period swell wraps further into bays than short-period swell, and what really decides a window (open sea, headlands, Lanzarote's shadow) is geography, not a number per spot.

## Decision
* **General rule for all spots:** the window is averaged over a direction spread of 10° + 1.5° per second of peak period above 10 s (up to 22°). `exposure()` takes the period.
* **Built-in spots: openness from the coastline.** `scripts/swell-windows.ts` casts rays every 2° from 1 km off each break over the OpenStreetMap coastline; land within 3 km blocks a direction, 40 km or more is open, linear in between (shadows fill in with distance). Times a shore-angle factor from the spot's facing. Stored as `Spot.openness` (seed 11).
* **Local sources on top** where the map is too coarse: La Caleta keeps its hand-set window as an extra limit (`windowFromSources`).
* Your own spots keep the hand-set window (with the general rule).
* The Info tab shows the resulting directions ("Gets swell from …").

## Consequences
* Lanzarote's shadow is now part of every north-coast spot: NE swell counts only partly on the north shore; at Rocky Point and Lobos due N counts less than NW–NNW; the east-coast beaches get NE–E, N only partly and NW hardly, as the local sources say.
* Sizes, ratings and the swell colours change at several spots; similarity uses the swell reaching the spot and changes with them.
* Moving a spot or changing its facing needs a re-run of the script.
