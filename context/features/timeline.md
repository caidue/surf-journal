---
type: "Feature"
title: "Conditions timeline"
description: "The SVG day chart used to mark a session, in the forecast table's look: rating, wave, swell, period, energy, wind, tide."
resource: "src/components/Timeline.tsx"
tags: ["feature", "chart"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-16T19:10:00+00:00"
---
# Conditions timeline

SVG chart with the **same rows, order and look as the [forecast table](/features/forecast-table.md)** (aligned 2026-11-16; both are drawn with the same small pieces from `surfGlyphs.tsx`: `swellsOf`, `SwellArrows`, `SwellWaves`, `WaveStack`, `ratingFill` / `ratingText`, `periodTone`):

* **Rating** ("for you" then): the same rounded score pills (✕ on grey when not for you; numbers from 22 px per hour).
* **Wave**: the height as a number over the stacked Japanese-style waves (`WaveStack`, full at 3 m, 48 px).
* **Swell**: the main swell's height, the arrows of the main and up to two more swells side by side (from 30 px per hour; else the main one) and their small waves stacked by height, coloured like the forecast (blue = good direction for the spot, red = poor and facing left; dark → light by energy; needs the `spot` prop).
* **Period** of the main swell (bold from 12 s, grey under 8 s), **Energy** (strongest train, the same colour pills), **Wind** (speed, arrow, wind colours), **Tide** curve with high/low labels.

Night shading, a "now" line, and your **session as a soft accent band across all rows** with drag handles on its edges and "11:15–12:45 · 1 h 30 min" in a lane above the rows. The brush marks the session (drag across, drag the edges or move it; 15-minute snapping; a tap = 90 min). Columns are narrower than the forecast's so a whole day fits on a phone; labels thin out. Used in the [session editor](/features/session-logging.md).
