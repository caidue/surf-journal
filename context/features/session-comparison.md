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
  at: "2026-11-18T23:00:00+00:00"
---
# Session comparison

Opens when you tap a session in a spot's **Sessions** tab ([Spot view](/features/spot-view.md)); it replaces the list in the same tab. Header: "Your session on <date>", time, your rating, an "Edit session" link, and a **back arrow button at the top right**. The day switch (Today / Tomorrow / …) is shared with the Forecast tab.

* **One line on the %:** "6% like today: your 11:00 hour best matches today 07:00 (swell, wind, tide). Drag your session to compare other times." The % is the **best match**: the position of the session (to the minute) with the closest single hour, the better average on ties, among positions that keep **at least 60 minutes of the session in daylight** (all of it for a shorter session). Night hours may be part of it, but it is never all night. The sessions list shows the same % ([Similarity](/engine/similarity.md)).
* **One chart:** daylight (± 1 h), reaching further into the night only as far as the best match needs (night shaded): the day's forecast ([Conditions timeline](/features/timeline.md)) with your session as the accent band ("Your session · 07:00–08:15 ↔"). **Drag anywhere on the chart** to move it to the minute (vertical scrolling still works), or use **−30 / −15 / +15 / +30** (arrow keys: 1 min, with Shift 15); **Best match** goes back to the closest pair. The session can be moved anywhere on the chart. (1.11.0 kept the best match within daylight, 1.12.0 showed the whole day, 1.12.1 allowed a best match fully at night; since 1.12.2 it needs at least an hour of daylight.)
* **Below it, the exact values:** "5% alike at 07:00–08:15 · closest hour 6%: your 11:00 vs 07:15", then each condition then and on the day, with a closeness bar (green from 60, yellow from 30, red below). Each surfed hour (the forecast value at its full hour) is compared with the day **at the exact minute it lands on**: the forecast is hourly, so between two hours the values are interpolated (directions the short way round), and every minute you move it changes the numbers. Size is the raw swell reaching the spot, not the estimated face height; tide shows its position between low (0 %) and high (100 %) with the word.

Logic in `src/lib/compare.ts`: `bestMatch` (best position with ≥ `MIN_DAYLIGHT` = 60 min between sunrise and sunset, = the list's %), `daylightOverlap`, `dayAt` (the day's conditions at any minute, interpolated), `align` (each surfed hour against the day at the minute it lands on), `shiftRange` (whole minutes keeping the session within the chart), `featureCloseness`. Decisions: [0024](/decisions/0024-handles-and-session-comparison.md), [0025](/decisions/0025-similarity-on-raw-swell.md).
