---
type: "Decision"
title: "0009: El Hierro as one spot with three peaks"
description: "Merge The Bubble into El Hierro, rate per peak."
resource: "src/data/seedSpots.ts"
tags: ["decision", "spots", "peaks"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
decision_status: "superseded"
superseded_by: "context/decisions/0015-split-el-hierro.md"
decided: "2026-11-13"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T00:30:00+00:00"
---
# El Hierro as one spot with three peaks

> **Superseded** by [decision 0015](/decisions/0015-split-el-hierro.md) (seed 6): the three waves are separate spots again.

## Context
Surfline has one spot for the area; locals and other guides name three waves; the research listed both options (strict Surfline parity vs three spots).

## Decision
Follow Surfline (one spot at its point) but keep the three waves as peaks with their own level, size range, tide and shape, rated per peak with "Best for you: <peak>". Retire `fv-the-bubble` (sessions move).

## Consequences
One forecast point for the bay (as it would be anyway); per-peak differences stay visible. See [El Hierro](/spots/el-hierro.md).
