---
type: "Metric"
title: "Spot rating (wave quality)"
description: "How good the waves are at a spot in one hour, 0–10, for anyone."
resource: "src/lib/rating.ts"
tags: ["engine", "rating", "metric"]
sources:
  - resource: "context/research/surf-journal-app-feasibility.md"
    id: "feas"
    title: "Research: surf journal app feasibility (2026-11)"
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Spot rating (wave quality)

# Computation
`q = 10 × fSize × fPeriod × fWind × fTide` (`quality()` in `src/lib/rating.ts`); multiplicative so one fatal flaw sinks it. `potential` = q without the wind factor (shown as the faded part of the bar).

* **fSize(hb, minSize, maxSize):** 0 below half the minimum; ramps to 0.6 at the minimum; 0.65–1 inside the range peaking at the geometric mean; fades to 0 at 1.5 × maxSize.
* **fPeriod(Tp)** on the **peak** period: 0.25 below 6 s → 0.75 at 9 s → 1.0 from 12 s.
* **fWind:** 1 when glassy (< 6 km/h); minus up to 0.85 for onshore (full at 22 km/h) and up to 0.5 for cross-shore (35 km/h); strong offshore over 30 km/h and any wind over 45 km/h cut further.
* **fTide:** 1 inside the spot's (or peak's) tide range, −2.2 per unit outside, floor 0.3.

## Word ladder
`scoreLabel()`: Poor < 2, Poor–Fair < 3.5, Fair < 5, Fair–Good < 6.5, Good ≤ 9, **Epic only above 9**. `scoreColor()` uses the same steps.

The rating shown per hour in the table's "Spot" row is the best peak's q ([Per-peak rating](/engine/per-peak-rating.md)). The personal score is separate: see [Personal prediction](/engine/personal-prediction.md).
