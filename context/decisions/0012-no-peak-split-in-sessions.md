---
type: "Decision"
title: "0012: No peak split in session logs"
description: "Sessions are per spot, not per peak."
tags: ["decision", "journal"]
sources:
  - resource: "context/research/surf-journal-app-feasibility.md"
    id: "feas"
decision_status: "accepted"
decided: "2026-11-12"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# No peak split in session logs

## Context
The feasibility research highlighted per-peak time segments; in practice it made logging slower. The user asked to simplify the journal entry: one value per category via slider, no peak differentiation.

## Decision
A session records one time range and one rating per category at the spot level. Peaks remain in the guide and the forecast.

## Consequences
Personal predictions are per spot; per-peak ratings come from the rules only. See [Session logging](/features/session-logging.md).
