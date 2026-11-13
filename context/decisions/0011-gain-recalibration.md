---
type: "Decision"
title: "0011: Recalibrate default gains for peak periods"
description: "Keep displayed surf heights stable after the period change."
resource: "src/data/seedSpots.ts"
tags: ["decision", "surf-height"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
decision_status: "accepted"
decided: "2026-11-13"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Recalibrate default gains for peak periods

## Context
Komar–Gaughan grows with T^0.4; peak periods are ~1.3× mean, so heights rose ~11 % and every spot's min/max sizes would have shifted.

## Decision
Default gains × 0.9: beach 0.8 → 0.72, reef/point 0.85 → 0.77. Spot size ranges unchanged. Calibration from observed sizes still overrides per spot.

## Consequences
Heights match what users saw before; tune with observed sizes. See [Breaking height](/domain/breaking-height.md).
