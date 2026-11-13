---
type: "Playbook"
title: "Testing"
description: "What the unit tests cover and how to verify UI changes."
resource: "src/lib/engine.test.ts"
tags: ["operations", "testing"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T00:30:00+00:00"
---
# Testing

* `src/lib/engine.test.ts`: geo helpers, breaking height, exposure, wind, tide extremes, energy (strongest train vs total), fPeriod and the word ladder, suitability rules (ranges, stretch, mixed causes, long period, stage gaps), skill profile summary and learning (quarter steps, cap, lowering, stage prompt, undo), seed spots (Surfline names, the El Hierro split into three spots, the added spots, per-peak rating at Suicides), similarity, prediction, session weights, calibration, day recommendation, insights, region parsing, season, categories.
* `src/lib/offline.test.ts` (fake-indexeddb, stubbed fetch): offline fallback, caching, four-model parsing (`marineHour`: scaling, zeros, estimated periods), sync of pending and old-version sessions, grid keys.
* UI changes: run the dev server and check in the browser at phone width (375 px) and desktop; check the console for errors. Coordinates in the browser pane can be off; click by element reference.
* CI runs `npm test` before every deploy ([Deployment](/operations/deployment.md)).
