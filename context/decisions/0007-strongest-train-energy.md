---
type: "Decision"
title: "0007: Headline energy = strongest train"
description: "Match surf-forecast's energy number."
resource: "src/lib/conditions.ts"
tags: ["decision", "energy"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
decision_status: "accepted"
decided: "2026-11-13"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Headline energy = strongest train

## Context
The app summed all trains with mean periods, so its kJ differed from surf-forecast's.

## Decision
Headline energy = the most energetic train's 1.96 · H² · Tp²; the total is shown in the tooltip; per-train kJ in the expanded table rows.

## Consequences
Numbers comparable with surf-forecast. See [Wave energy](/domain/wave-energy.md).
