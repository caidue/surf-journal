---
type: "Decision"
title: "0017: Local knowledge as sourced rules"
description: "Per-spot local rules with sources and confidence; conflicting sources never become a hard preference."
resource: "src/data/spotRules.ts"
tags: ["decision", "spots", "local-knowledge"]
sources:
  - resource: "context/research/local-surf-school-spot-knowledge.md"
    id: "report"
decision_status: "accepted"
decided: "2026-11-14"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T14:30:00+00:00"
---
# Local knowledge as sourced rules

## Context
The user wants the app to behave like a local expert that knows which spot is best and most fun for their level. Local schools decide with wind, swell and tide data plus per-spot rules learned over years; forecast sites don't publish those rules (surf-forecast rated La Caleta 0/10 the day schools surfed it). The app's single-value spot attributes held a one-word tide label that, for La Caleta, came from a weak source and penalised the hours that actually worked.

## Decision
* Every built-in spot gets rules in `src/data/spotRules.ts`: tide (also by swell size or level), swell, size, wind, level, role ("fallback when the North Shore is too big"), timing and logistics. Each rule has sources (with their kind: local, first-hand, portal, school, travel, forecast site, observation), a confidence (high = independent local sources agree; medium; low = conflicting or single source), and whether the rating already follows it.
* A source that states a condition outranks a one-word "best tide" label.
* **Conflicting sources never become a hard preference.** Where sources conflict (La Caleta, Generosa) or are missing (Spew Pits), the spot has no tide preference until the rules engine can apply a size-dependent, softened rule.
* Clear contradictions were corrected in seed 7 (see [Spot catalogue](/spots/catalogue.md)).
* The rules are shown in the spot guide ("Local knowledge"), with sources and agreement, so the user can judge them.

## Consequences
* Conditional rules (tide by size, gates on regional swell, wind vetoes, morning timing) are documented but not yet applied: that is the next step (rules engine, regional context, backtesting).
* No source gives wind speeds in knots or period thresholds: those will be named tuning parameters, never presented as local fact.
* Daily school choices are not publicly readable (Instagram stories, WhatsApp), so validation will rely on the user's sessions and quick checks.
