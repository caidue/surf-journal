---
type: "Decision"
title: "0008: Surfline names, aliases and external ids"
description: "Use the best-known app's spot names; keep the rest searchable."
resource: "src/data/seedSpots.ts"
tags: ["decision", "spots", "naming"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
decision_status: "accepted"
decided: "2026-11-13"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T00:30:00+00:00"
---
# Surfline names, aliases and external ids

## Context
The user: "We should use the same spots as the most well known app." Surfline is the best-known; it lacks five of our spots and merges El Hierro (which we first followed, then split again: [decision 0015](/decisions/0015-split-el-hierro.md)).

## Decision
Display Surfline's name where it has the spot; keep internal ids; add `aliases` (searched everywhere) and `externalIds` (Surfline slug/id, surf-forecast slug) for links out. Spots Surfline lacks keep their surf-forecast/Wannasurf names.

## Consequences
Generoso → Generosa, Isla de Lobos → Los Lobos, Glass Beach (El Burro) → El Burro (Glass Beach), El Cotillo – Piedra Playa → Cotillo, Bristol (Shooting Gallery) → Bristol, El Muelle (Harbour Wall) → El Muelle. See [Spot naming](/spots/naming.md).
