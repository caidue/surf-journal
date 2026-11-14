---
type: "Decision"
title: "0018: Rules engine with confidence-limited effects, size fit and no cliffs"
description: "Executable local rules change the rating within limits set by how well their sources agree; small waves count less for progressing surfers; no 0-score cliffs."
resource: "src/lib/rules.ts"
tags: ["decision", "engine", "rules"]
sources:
  - resource: "context/research/local-surf-school-spot-knowledge.md"
    id: "report"
  - resource: "context/research/rating-errors-at-la-caleta.md"
    id: "caleta"
decision_status: "accepted"
decided: "2026-11-14"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T19:30:00+00:00"
---
# Rules engine with confidence-limited effects, size fit and no cliffs

## Context
Local knowledge is conditional (tide by swell size, "only when the North Shore is big", wind vetoes, "low tide is for experts"); a single attribute per spot can't hold it. On 14 Nov 2026 a weak one-word tide label cut La Caleta's best hour to ×0.34. Thigh-high waves read "Right in your range" for a surfer comfortable to head high, a rip hazard halved scores, and a 5 cm change could drop For you to 0.

## Decision
* Rules get an executable form (`apply`: tideBySize, gate, windCap, levelWhen) evaluated per hour by `lib/rules.ts`. Rules only take quality away or raise the level; they never add quality.
* **Confidence limits effects**: tide floors 0.3 / 0.45 / 0.65 and cap softness 0 / 15 % / 35 % for high / medium / low. A disputed rule can't sink an hour.
* Tide position = mid-hour, between the bracketing low and high.
* `sizeFit`: for stages 3+, waves under 0.7 × comfortable size count less (0.65 at 0.55 C, 0.3 at 0.35 C), labelled "Small for progressing"; stages 1–2 unaffected.
* No cliffs: M ≥ 1.2 × C; rips alone are advice (ok).
* The day recommendation says when the wind turns onshore after the window starts, when the day is fairly even, and when the wind models disagree; a day verdict sits next to the best picks.

## Consequences
* La Caleta's 14 Nov morning now beats the afternoon push (regression test); Flag Beach's thigh-high waves no longer rank as ideal for an intermediate.
* All thresholds are priors to be tuned against archives and the user's checks ([pending: tuning](/decisions/pending/threshold-tuning.md)).
