---
type: "Feature"
title: "Session comparison"
description: "A logged session next to today (or another forecast day) in the spot's Sessions tab: stacked charts, drag to line up, and what the % similarity is made of."
resource: "src/components/SessionCompare.tsx"
tags: ["feature", "sessions", "similarity"]
sources:
  - resource: "src/lib/compare.ts"
    id: "logic"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-18T18:00:00+00:00"
---
# Session comparison

Opens when you tap a session in a spot's **Sessions** tab ([Spot view](/features/spot-view.md)); it replaces the list in the same tab. Header: "Your session on <date>", time, your rating, an "Edit session" link, and a **back arrow button at the top right** to return to the list. The day switch (Today / Tomorrow / …) is shared with the Forecast tab.

* **What "27% like today" means:** a box names the closest single hour (the hour of your session and the hour of the day it matches) and what is compared: wave size, swell period and direction, wind and tide, each against its tolerance; 100% = the same, ~60% = each off by its tolerance ([Similarity](/engine/similarity.md)).
* **Two stacked charts on one time scale** (both [Conditions timeline](/features/timeline.md)): the day's forecast on top (rating for you, wave, swell, period, energy, wind, tide; a dashed box where your session is lined up), your surfed hours below (your fun rating, the same rows, the session band labelled with its real date and time).
* **Line it up:** drag the lower chart sideways (whole hours; vertical scrolling still works), or use **← 1 h / 1 h →** (arrow keys when focused), or **Best match** to go back. It starts at the closest pair (the list's %). The readout says which hours it lines up with, the average similarity of the lined-up hours and the closest one.
* **Condition table** for the closest lined-up hour: each condition then and on the day, with a closeness bar (green from 60, yellow from 30, red below).

Logic in `src/lib/compare.ts`: `shiftRange` (shifts that keep at least one surfed hour on the chart, so every pair behind the list's % is reachable), `align` (pairs and their similarity at a shift), `bestAlignment` (closest pair on daylight hours, better average on ties), `featureCloseness`. Decision: [0024](/decisions/0024-handles-and-session-comparison.md).
