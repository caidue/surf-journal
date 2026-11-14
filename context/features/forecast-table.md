---
type: "Feature"
title: "Hourly forecast table"
description: "Surf-forecast-style hourly table: spot rating, For you, surf, swell trains, energy, wind, tide."
resource: "src/components/ForecastTable.tsx"
tags: ["feature", "forecast"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T10:45:00+00:00"
---
# Hourly forecast table

Columns: daylight hours (one before sunrise to sunset), 50 px each, scrolled to now or the best window; the best window is underlined in green, and its first column carries a "Best ▾" tag (props `bestOpen`, `onToggleBest`): tapping it or any best-window column shows or hides the recommendation card above the table.

| Row | Content |
|---|---|
| Time | hour, "now" tag, "Best ▾" toggle on the best window |
| **Spot** rating | q (coloured number) with a bar: solid = q, faded = potential without wind; tooltip with the word (Poor … Epic) |
| **For you** | predicted fun, ✕ when unsuitable; tooltip with status, best peak and reasons |
| Surf (m, face) | range ±20 % (e.g. 1.9–2.9) on one line + body word (chest, head, overhead, 2× OH) |
| Swell (▸ expandable) | strongest train: height, peak period, arrow; expands into Swell 1–3 by energy, Wind sea and Total sea (Hs · Tp, Te in the tooltip). Trains outside the swell window are greyed out |
| Energy (kJ) | strongest train; tooltip: strongest and total |
| Wind | speed and gusts in km/h, kn or mph, background by wind kind |
| Tide | curve with H/L times |

Legend explains each row, lists the grid cell and the spots sharing it, and notes when periods were estimated. Expanded state is remembered per viewer. See [Wave energy](/domain/wave-energy.md), [Swell trains](/domain/swell-trains.md), [Spot rating](/engine/spot-rating.md).
