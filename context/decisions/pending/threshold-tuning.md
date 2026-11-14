---
type: "Decision"
title: "Tune the skill thresholds"
description: "The rule thresholds are design proposals."
tags: ["decision", "pending", "skill"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
status: "draft"
decision_status: "pending"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T21:40:00+00:00"
---
# Tune the skill thresholds

The 0.8C / C / M / 1.15M size bands, the 2.0 m overhead floor, board minimums, the 13 s period rule, wind limits and stage defaults come from the research's proposals, not from data. Revisit once there are logged sessions with "How did it feel?" (compare feel with the predicted status).

The local-knowledge research (2026-11-14) found no source that gives a wind speed in knots or a swell-period threshold for any spot, so those numbers stay tuning parameters ([Local knowledge](/spots/local-knowledge.md)); a backtest harness on Open-Meteo archives is planned with the rules engine.

Since 1.4.0 also: the rules engine's confidence floors (tide 0.3 / 0.45 / 0.65, cap softness 0 / 0.15 / 0.35), each rule's thresholds (e.g. La Caleta's 1.8 m switch, Derecha's 12 km/h), the size-fit curve (0.7 / 0.55 / 0.35 × C), M ≥ 1.2 C, the wind-turn (0.5, 3 h) and even-day (0.5) thresholds. Also the confidence thresholds: 45° model spread, 1.2 session weight for an upgrade, tide position 0.25 for withholding, ranking bonus 0.4 / 0.2.
