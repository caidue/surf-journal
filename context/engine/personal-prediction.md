---
type: "Reference"
title: "Personal prediction (For you)"
description: "Blending the rule-based score with your fun ratings in similar past conditions."
resource: "src/lib/recommend.ts"
tags: ["engine", "prediction", "personalisation"]
sources:
  - resource: "context/research/surf-journal-app-feasibility.md"
    id: "feas"
    title: "Research: surf journal app feasibility (2026-11)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Personal prediction (For you)

# Computation
`ŷ = (n0 · μ0 + Σ wᵢ · yᵢ) / (n0 + Σ wᵢ)` with n0 = 2 (`PRIOR_N0`), μ0 = rule score (spot rating × suitability factor of the best peak for you), yᵢ = your fun rating of past session i at this spot, wᵢ = similarity kernel of its best-matching hour × session weight. Unsuitable hours score 0.

**Session weight** (`sessionWeight`): 0 if marked not relevant or before the cut-off date; time decay `0.5^(age / half-life)` (default 24 months); stage gap factor 1 / ¾ / ½ / ¼ for 0 / 1 / 2 / 3+ stages between the session's snapshot and your current stage.

**Confidence label:** no history (Σw < 0.25), low (< 1.2), medium (< 3.5), high.

`explain()` lists how many similar sessions there were and what you rated them, the closest match and what differed, and what holds the spot back (size, period under 8 s peak, wind, tide). Suitability reasons are shown separately (`SuitReasons`). See [Similarity](/engine/similarity.md).
