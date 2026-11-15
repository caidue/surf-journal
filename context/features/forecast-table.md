---
type: "Feature"
title: "Hourly forecast table"
description: "Surf-forecast-style hourly table: rating for you (or a chosen level), wave, swell trains, energy, wind, tide."
resource: "src/components/ForecastTable.tsx"
tags: ["feature", "forecast"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-16T13:20:00+00:00"
---
# Hourly forecast table

Columns: daylight hours (one before sunrise to sunset), 50 px each, scrolled to the time chosen in Explore's Time filter (one hour before it when at least four columns fit), else to now or the best window. The best window is not marked in the table; the recommendation card sits below it ([Spot view](/features/spot-view.md)). The legend and the data sources are folded away behind a "Legend & sources" toggle under the table (closed by default): what each row means, which spots share the wave-model cell, wind colours, and the data line (models and grid cells, Open-Meteo CC BY 4.0).

| Row | Content |
|---|---|
| Time | hour (the current hour in the accent colour, no label); on today a small arrow at the top marks the current time to the minute, with a faint line down the table (updates every minute) |
| Withheld hours | "?" in Rating with the reason on hover (✕ stays when the spot isn't for you anyway) |
| Wind | mean of four models over the sea: arrow, average speed over the hour and, only when they are at least 15 km/h stronger, the gusts in small grey below (km/h, kn or mph; background by wind kind) (explained in the tooltip and legend; surf-forecast shows no gusts, Surfline lists them next to the wind); colour by kind; tooltip "15 km/h on average, gusts up to 23 km/h · cross-shore, from NE …" plus every model; "?" when they disagree by ≥ 45° |
| **Rating** ("for me", or "for advanced" etc. under Rate for on Explore) | the one rating row: predicted fun for you (your profile and sessions here) or for a typical surfer of the chosen level (your sessions left out); ✕ when unsuitable. The separate Spot rating row was removed (2026-11-16): the tooltip gives the status, best peak and reasons, then how good the waves are for anyone ("Waves fair–good (6.4/10, 7.5 without the wind)", the [spot rating](/engine/spot-rating.md)) |
| **Wave** (m or ft) | one value per hour: the middle of the ±20 % estimate of the face height (e.g. 2.4; whole feet with ft), like surf-forecast's single "Height" number, above a slim breaking-wave figure (a back rising to a pointed peak with a small lip, then the face; 34 px wide, as tall as the surf: full height at 3 m, at least 6 px) coloured light blue → sky blue → blue → green (2.6 m+) (`waveColor`, `WaveFigure`; our own shape); the range and body words are in the tooltip |
| Swell (▸ expandable) | strongest train: height, peak period, arrow; expands into Swell 1–3 by energy, Wind sea and Total sea (Hs · Tp, Te in the tooltip). Trains outside the swell window are greyed out |
| Energy (kJ) | strongest train; tooltip: strongest and total |
| Tide | curve with H/L times across the full width: each hourly value sits in the middle of its column, and the curve is extended to both edges with the level half an hour before the first and after the last hour |

Legend explains each row, lists the grid cell and the spots sharing it, and notes when periods were estimated. Expanded state is remembered per viewer. See [Wave energy](/domain/wave-energy.md), [Swell trains](/domain/swell-trains.md), [Spot rating](/engine/spot-rating.md).
