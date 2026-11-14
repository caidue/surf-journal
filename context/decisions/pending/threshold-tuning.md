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
  at: "2026-11-14T14:30:00+00:00"
---
# Tune the skill thresholds

The 0.8C / C / M / 1.15M size bands, the 2.0 m overhead floor, board minimums, the 13 s period rule, wind limits and stage defaults come from the research's proposals, not from data. Revisit once there are logged sessions with "How did it feel?" (compare feel with the predicted status).

The local-knowledge research (2026-11-14) found no source that gives a wind speed in knots or a swell-period threshold for any spot, so those numbers stay tuning parameters ([Local knowledge](/spots/local-knowledge.md)); a backtest harness on Open-Meteo archives is planned with the rules engine.
