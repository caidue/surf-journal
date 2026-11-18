---
type: "Reference"
title: "Similarity of conditions"
description: "Analog matching of hours at the same spot."
resource: "src/lib/similarity.ts"
tags: ["engine", "similarity"]
sources:
  - resource: "context/research/surf-journal-app-feasibility.md"
    id: "feas"
    title: "Research: surf journal app feasibility (2026-11)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-18T21:00:00+00:00"
---
# Similarity of conditions

Weighted, tolerance-scaled distance over spot-relative features (`SPOT_FEATURES`), summed (not averaged) and Gower-scaled for missing features:

| Feature | Weight | Tolerance |
|---|---|---|
| log(hIn + 0.2): swell height reaching the spot (`Derived.hIn` = √Σ exposure × weight × H² of the offshore trains), not the face height `hb` ([decision 0025](/decisions/0025-similarity-on-raw-swell.md)) | 3 | 0.25 |
| peak period tDom | 1.5 | 2 s |
| swell direction | 1.5 | 20° |
| offshore/onshore wind uOff | 2.5 | 9 km/h |
| cross-shore wind uX | 1 | 9 km/h |
| tide height (normalised) | 2 | 0.18 |
| tide trend | 1 | 0.6 |

`d = sqrt(Σ w·(Δ/tol)² · (Σw_all / Σw_present) / 3)`; kernel `exp(−d²/2)` (0 beyond d = 2.5). The Sessions tab's "% like today" is `similarityPct(d)` of the closest pair of a surfed hour and any hour of the chosen day (night included); the [session comparison](/features/session-comparison.md) shows that pair and each condition's closeness `exp(−(Δ/tol)²/2)` (`lib/compare.ts`). Tide is compared as a position, not a word: `tideNorm` 0–1 between the bracketing low and high (mid-hour) and `tideTrend` −1…1 (rising/falling speed); "low", "mid-high" etc. are only labels. Because it is relative to that tide's own range, a spring and a neap high tide both count as 1. Sessions count as "in similar conditions" from kernel 0.25 (`SIMILAR_MIN_K`, ≈ one step off in size, wind and tide together). `absFeatures()` compares regional sea states via the strongest train. Shown in Explore ("Your past sessions in conditions like today") and the spot's Sessions tab.
