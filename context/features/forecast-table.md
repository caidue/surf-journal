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
  at: "2026-11-17T12:00:00+00:00"
---
# Hourly forecast table

Columns: daylight hours (one before sunrise to sunset), 50 px each, scrolled to the time chosen in Explore's Time filter (one hour before it when at least four columns fit), else to now or the best window. The best window is not marked in the table; the recommendation card sits below it ([Spot view](/features/spot-view.md)). The legend and the data sources are folded away behind a "Legend & sources" toggle under the table (closed by default): what each row means, which spots share the wave-model cell, wind colours, and the data line (models and grid cells, Open-Meteo CC BY 4.0).

| Row | Content |
|---|---|
| Time | hour (the current hour in the accent colour, no label); on today a small arrow at the top marks the current time to the minute, with a faint line down the table (updates every minute) |
| Withheld hours | "?" in Rating with the reason on hover (✕ stays when the spot isn't for you anyway) |
| Wind | mean of four models over the sea: arrow, average speed over the hour and, only when they are at least 15 km/h stronger, the gusts in small grey below (km/h, kn or mph; background by wind kind) (explained in the tooltip and legend; surf-forecast shows no gusts, Surfline lists them next to the wind); colour by kind; tooltip "15 km/h on average, gusts up to 23 km/h · cross-shore, from NE …" plus every model; "?" when they disagree by ≥ 45° |
| **Rating** ("for me", or "for advanced" etc. under Rate for on Explore) | the one rating row: predicted fun for you (your profile and sessions here) or for a typical surfer of the chosen level (your sessions left out); ✕ when unsuitable. The separate Spot rating row was removed (2026-11-16): the tooltip gives the status, best peak and reasons, then how good the waves are for anyone ("Waves fair–good (6.4/10, 7.5 without the wind)", the [spot rating](/engine/spot-rating.md)) |
| **Wave** (m or ft) | one value per hour: the middle of the ±20 % estimate of the face height at the spot (e.g. 2.4; whole feet with ft), like surf-forecast's single "Height" number; no figure (the wave figures moved to the Swell row, 2026-11-16); the range and body words are in the tooltip |
| Swell (▸ expandable) | strongest train: height and direction arrow (label "m · direction"; the period has its own row below); expands into Swell 1–3 by energy, Wind sea and Total sea (Hs · Tp, Te in the tooltip). Trains outside the swell window are greyed out. Swells are coloured by energy, 1st **blue** (`#2563eb`), 2nd **red** (`#dc2626`), 3rd **purple** (`#7c3aed`), grey when practically outside the spot's swell window, under 10 % of it getting in (`OUTSIDE_EXPOSURE` 0.1; not only at exactly 0, so a swell wobbling across the window edge, e.g. 358° / 2° at Cotillo, doesn't flip between colour and grey from hour to hour) (arrows and waves, also in the expanded Swell 1–3 rows; the wind sea stays in the text colour). The arrows of the main, 2nd and 3rd swell (≥ 0.2 m) sit **side by side**, folded and unfolded: the main one **solid and larger** (16 px), the 2nd / 3rd small **hollow** arrows (11 px, `DirArrow outline`), so the main swell stands out. The tooltip lists each swell's height, period, direction and energy. Under the numbers each hour shows the swells as small surf waves on one baseline (`SwellWave`, as tall as the train's height, full at 1.6 m): the main swell in front, the main swell solid, the 2nd and 3rd (folded and unfolded) as coloured **outlines** with a faint fill (`SwellWave outline`), set a little to the left behind it, like the next waves of a set. A wave **faces left (mirrored)** when its swell comes from a poor direction for the spot, less than half of it getting in (`exposure` < 0.5, `POOR_EXPOSURE`), as surf-forecast does; the tooltip then says "poor direction for this spot" (or "outside the swell window" at 0) |
| **Period** (s · peak) | the main swell's peak period (the wind sea's when there is no swell), bold from 12 s, grey under 8 s; the tooltip explains it (under 8 s weak, 10 s+ good, 13 s+ powerful). The expanded Swell 1–3 rows keep their own period. It sits under the whole swell block, also below the unfolded Swell 1–3, Wind sea and Total sea rows |
| Energy (kJ) | strongest train; tooltip: strongest and total |
| Tide | curve with H/L times across the full width: each hourly value sits in the middle of its column, and the curve is extended to both edges with the level half an hour before the first and after the last hour |

Legend explains each row, lists the grid cell and the spots sharing it, and notes when periods were estimated. Expanded state is remembered per viewer. See [Wave energy](/domain/wave-energy.md), [Swell trains](/domain/swell-trains.md), [Spot rating](/engine/spot-rating.md).
