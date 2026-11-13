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
  at: "2026-11-13T21:20:00+00:00"
---
# Similarity of conditions

Weighted, tolerance-scaled distance over spot-relative features (`SPOT_FEATURES`), summed (not averaged) and Gower-scaled for missing features:

| Feature | Weight | Tolerance |
|---|---|---|
| log(hb + 0.2) | 3 | 0.25 |
| peak period tDom | 1.5 | 2 s |
| swell direction | 1.5 | 20° |
| offshore/onshore wind uOff | 2.5 | 9 km/h |
| cross-shore wind uX | 1 | 9 km/h |
| tide height (normalised) | 2 | 0.18 |
| tide trend | 1 | 0.6 |

`d = sqrt(Σ w·(Δ/tol)² · (Σw_all / Σw_present) / 3)`; kernel `exp(−d²/2)` (0 beyond d = 2.5). Sessions count as "in similar conditions" from kernel 0.25 (`SIMILAR_MIN_K`, ≈ one step off in size, wind and tide together). `absFeatures()` compares regional sea states via the strongest train. Shown in Explore ("Your past sessions in conditions like today") and the spot's Sessions tab.
