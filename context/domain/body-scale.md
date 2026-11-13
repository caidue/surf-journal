---
type: "Reference"
title: "Body scale (face heights)"
description: "One scale of body words for onboarding, observed sizes and the forecast."
resource: "src/lib/skill.ts"
tags: ["domain", "surf-height", "ux"]
sources:
  - resource: "https://en.wikipedia.org/wiki/Hawaiian_scale"
    id: "hawaiian"
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Body scale (face heights)

`BODY_SCALE` in `src/lib/skill.ts`, face height for an adult (head = 1.8 m):

| id | label | m |
|---|---|---|
| ankle | Ankle | 0.3 |
| knee | Knee | 0.5 |
| thigh | Thigh | 0.7 |
| waist | Waist | 0.9 |
| chest | Chest | 1.2 |
| shoulder | Shoulder | 1.5 |
| head | Head high | 1.8 |
| overhead | Overhead | 2.2 |
| well-overhead | Well overhead | 3.0 |
| double | Double overhead | 3.6 |
| bigger | Bigger | 5.0 |

`OBSERVED_SIZES` = Flat (0.15) + the scale, for "Wave size you actually saw". `nearestStep()` rounds on a log scale; `bodyWord()`/`bodyRange()` give "chest high", "head to overhead". Face height (not Hawaiian back-measured feet, which is about half) is the convention. The same scale is used in [onboarding](/features/onboarding.md), the [session editor](/features/session-logging.md) and the [forecast table](/features/forecast-table.md).
