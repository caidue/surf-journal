---
type: "Feature"
title: "Session comparison"
description: "A logged session on today's (or another forecast day's) chart in the spot's Sessions tab: drag it along the day, see what the % similarity is made of."
resource: "src/components/SessionCompare.tsx"
tags: ["feature", "sessions", "similarity"]
sources:
  - resource: "src/lib/compare.ts"
    id: "logic"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-18T20:00:00+00:00"
---
# Session comparison

Opens when you tap a session in a spot's **Sessions** tab ([Spot view](/features/spot-view.md)); it replaces the list in the same tab. Header: "Your session on <date>", time, your rating, an "Edit session" link, and a **back arrow button at the top right**. The day switch (Today / Tomorrow / …) is shared with the Forecast tab.

* **One line on the %:** "6% like today: your 11:00 hour best matches today 07:00 (swell, wind, tide). Drag your session to compare other times." The % is the closest pair of a surfed hour and a **daylight** hour of the day ([Similarity](/engine/similarity.md)).
* **One chart:** the day's forecast ([Conditions timeline](/features/timeline.md)) with your session as the accent band ("Your session · 07:00–08:15 ↔"). **Drag anywhere on the chart** to move it in 15-minute steps (vertical scrolling still works), or use **−30 / −15 / +15 / +30** (arrow keys = 15 min when focused); **Best match** goes back to the closest pair. It only moves within the day's daylight hours (the hours the ratings count as daylight), never into the night.
* **Below it, the exact values:** "5% alike at 07:00–08:15 · closest hour 6%: your 11:00 vs 07:00", then each condition then and on the day, with a closeness bar (green from 60, yellow from 30, red below). Size is the raw swell reaching the spot, not the estimated face height.

Logic in `src/lib/compare.ts`: `closestPair` (daylight hours only, = the list's %), `align` (each surfed hour against the day's hour it lands on, nearest whole hour), `shiftRange` (15-minute steps keeping the whole session within daylight), `featureCloseness`. Decisions: [0024](/decisions/0024-handles-and-session-comparison.md), [0025](/decisions/0025-similarity-on-raw-swell.md).
