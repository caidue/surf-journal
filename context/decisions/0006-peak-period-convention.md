---
type: "Decision"
title: "0006: Show and rate peak periods"
description: "Peak period everywhere a period appears."
resource: "src/lib/rating.ts"
tags: ["decision", "waves", "conventions"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
decision_status: "accepted"
decided: "2026-11-13"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Show and rate peak periods

## Context
Users compare with surf-forecast/Surfline, which show peak periods; the app showed ~25 % lower mean periods.

## Decision
All periods in the UI are peak periods (labelled "s peak" where space allows); `fPeriod` re-based (0.25 < 6 s → 0.75 at 9 s → 1 from 12 s).

## Consequences
Breaking heights rose ~11 % (see [0011](/decisions/0011-gain-recalibration.md)); the 13 s long-period rule now works. See [Wave periods](/domain/wave-periods.md).
