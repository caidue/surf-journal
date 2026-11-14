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
  at: "2026-11-15T14:20:00+00:00"
---
# Hourly forecast table

Columns: daylight hours (one before sunrise to sunset), 50 px each, scrolled to now or the best window. The best window is not marked in the table; the recommendation card sits below it ([Spot view](/features/spot-view.md)). The legend and the data sources are folded away behind a "Legend & sources" toggle under the table (closed by default): what each row means, which spots share the wave-model cell, wind colours, and the data line (models and grid cells, Open-Meteo CC BY 4.0).

| Row | Content |
|---|---|
| Time | hour, "now" tag; on today a small marker at the top shows the current time to the minute, with a faint line down the table (updates every minute) |
| Withheld hours | "?" in Spot and For you with the reason on hover (For you keeps ✕ when the spot isn't for you anyway) |
| Wind | mean of four models over the sea: arrow, average speed over the hour and, only when they are at least 15 km/h stronger, the gusts in small grey below (km/h, kn or mph; background by wind kind) (explained in the tooltip and legend; surf-forecast shows no gusts, Surfline lists them next to the wind); colour by kind; tooltip "15 km/h on average, gusts up to 23 km/h · cross-shore, from NE …" plus every model; "?" when they disagree by ≥ 45° |
| **Spot** rating | the same score pill as For you, coloured by the word ladder; the tooltip gives the word (Poor … Epic) and what the wind costs ("5.8 without the wind") |
| **For you** | predicted fun, ✕ when unsuitable; tooltip with status, best peak and reasons |
| **Wave** (m or ft) | one value per hour: the middle of the ±20 % estimate of the face height (e.g. 2.4; whole feet with ft), like surf-forecast's single "Height" number, above a slim breaking-wave figure (a back rising to a pointed peak with a small lip, then the face; 34 px wide, as tall as the surf: full height at 3 m, at least 6 px) coloured light blue → sky blue → blue → green (2.6 m+) (`waveColor`, `WaveFigure`; our own shape); the range and body words are in the tooltip |
| Swell (▸ expandable) | strongest train: height, peak period, arrow; expands into Swell 1–3 by energy, Wind sea and Total sea (Hs · Tp, Te in the tooltip). Trains outside the swell window are greyed out |
| Energy (kJ) | strongest train; tooltip: strongest and total |
| Tide | curve with H/L times across the full width: each hourly value sits in the middle of its column, and the curve is extended to both edges with the level half an hour before the first and after the last hour |

Legend explains each row, lists the grid cell and the spots sharing it, and notes when periods were estimated. Expanded state is remembered per viewer. See [Wave energy](/domain/wave-energy.md), [Swell trains](/domain/swell-trains.md), [Spot rating](/engine/spot-rating.md).
