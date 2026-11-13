---
type: "Reference"
title: "Suitability rules"
description: "Rule-based check of an hour at a spot against your skill profile, with reasons."
resource: "src/lib/rating.ts"
tags: ["engine", "skill", "safety"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
  - resource: "https://journals.sagepub.com/doi/full/10.1177/0363546506293702"
    id: "nathanson"
    title: "Nathanson et al. 2007 (injury risk: overhead 2.4×, reef 2.6×)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T23:35:00+00:00"
---
# Suitability rules

`suitability(spot, derived, profile, unit)` in `src/lib/rating.ts`. Each rule yields a status and a reason; **the worst status wins**. Factors: good 1 · ok 0.85 · **stretch 0.7** · challenging 0.5 · unsuitable 0. H = estimated face height `hb` (already gain-calibrated), **rounded to the shown precision** (0.1 m, or 1 ft) before every comparison, so a reason never reads "~2.2 m vs 2.2 m"; C = comfortable size; M = max(biggest caught, C).

| Rule | Condition → status |
|---|---|
| Spot level | required stage (beginner/all 1, intermediate 4, advanced 6, expert 7) more than one above yours → unsuitable; exactly one above → challenging ("A step up…") |
| Size | H ≤ 0.8C good (positive reason); ≤ C ok; ≤ M challenging, or **stretch** with "I want to push my limits"; ≤ 1.15M challenging at stage ≥ 6 else unsuitable; above → unsuitable. Every size reason names both sizes |
| Overhead floor | H > 2.0 m at stage ≤ 5 → challenging |
| Too small | H below the board's minimum (soft-top 0.3 … step-up 1.5 m) → ok, suggests more volume |
| Period | Tp ≥ 13 s, H > 0.7C, stage ≤ 5 → ok (challenging if H > C) |
| Spot max | H > 1.15 × maxSize → unsuitable (challenging at stage ≥ 7) |
| Bottom | reef/rock with no reef experience → challenging (unsuitable at stage ≤ 3 or H > C); mixed → ok; sand at stage ≤ 3 → positive |
| Shape | hollow/slab with "prefer mellow" → challenging (unsuitable if H > C); fast/sectiony peel at stage ≤ 3 → challenging; mellow at stage ≤ 4 → positive |
| Wind | > 45 km/h → challenging at stage ≥ 6 else unsuitable; > 30 km/h at stage ≤ 3 → challenging; offshore > 25 km/h with "prefer mellow" → ok |
| Paddle-out | rip/current hazard with paddle-out ≤ 1 → challenging if H > 0.8C else ok; H > C with paddle-out ≤ 1 → challenging |
| Water | not sure / not confident out of depth, stage ≤ 3, no lifeguard → ok / challenging |

## Reasons shown
At most three, worst first, plus one positive when the hour is good. When size is fine but the hour is challenging or worse because of other things, the first reason says so: "Size is fine; it's the reef and the wind." Size reasons link to "Edit comfort size" (`#/surfing?step=comfort`).

Fun ratings never change these floors. Thresholds are design proposals from the research ([pending: tuning](/decisions/pending/threshold-tuning.md)); several challenging causes don't compound ([pending](/decisions/pending/compounding-challenges.md)).
