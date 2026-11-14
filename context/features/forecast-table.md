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
  at: "2026-11-15T11:30:00+00:00"
---
# Hourly forecast table

Columns: daylight hours (one before sunrise to sunset), 50 px each, scrolled to now or the best window. The best window is not marked in the table; the recommendation card sits below it ([Spot view](/features/spot-view.md)). The legend is folded away behind a "Legend" toggle under the table (closed by default).

| Row | Content |
|---|---|
| Time | hour, "now" tag; on today a small marker at the top shows the current time to the minute, with a faint line down the table (updates every minute) |
| Withheld hours | "?" in Spot and For you with the reason on hover (For you keeps ✕ when the spot isn't for you anyway) |
| Wind | mean of four models over the sea: arrow, average speed over the hour and, smaller and grey below, the gusts (the row label says "grey = gusts"); colour by kind; tooltip "15 km/h on average, gusts up to 23 km/h · cross-shore, from NE …" plus every model; "?" when they disagree by ≥ 45° |
| **Spot** rating | q (coloured number) with a bar: solid = q, faded = potential without wind; tooltip with the word (Poor … Epic) |
| **For you** | predicted fun, ✕ when unsuitable; tooltip with status, best peak and reasons |
| Surf (m, face) | one value per hour: the middle of the ±20 % estimate (e.g. 2.4; whole feet with ft), like surf-forecast's single "Height" number; the range and body words (e.g. "1.9–2.9 m · head high to overhead") are in the tooltip. The bar behind it shows the size, coloured by the spot rating |
| Swell (▸ expandable) | strongest train: height, peak period, arrow; expands into Swell 1–3 by energy, Wind sea and Total sea (Hs · Tp, Te in the tooltip). Trains outside the swell window are greyed out |
| Energy (kJ) | strongest train; tooltip: strongest and total |
| Wind | speed and gusts in km/h, kn or mph, background by wind kind |
| Tide | curve with H/L times across the full width: each hourly value sits in the middle of its column, and the curve is extended to both edges with the level half an hour before the first and after the last hour |

Legend explains each row, lists the grid cell and the spots sharing it, and notes when periods were estimated. Expanded state is remembered per viewer. See [Wave energy](/domain/wave-energy.md), [Swell trains](/domain/swell-trains.md), [Spot rating](/engine/spot-rating.md).
