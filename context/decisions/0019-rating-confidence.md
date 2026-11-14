---
type: "Decision"
title: "0019: Grade how sure each rating is; withhold where guessing is dangerous"
description: "Ratings carry Reliable / Less certain / Rough guide from local knowledge, model agreement and your sessions; no rating for undocumented expert reefs at low tide."
resource: "src/lib/confidence.ts"
tags: ["decision", "engine", "confidence"]
sources:
  - resource: "context/research/local-surf-school-spot-knowledge.md"
    id: "report"
decision_status: "accepted"
decided: "2026-11-14"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T20:30:00+00:00"
---
# Grade how sure each rating is; withhold where guessing is dangerous

## Context
The local knowledge comes largely from school and travel guides (beginner and intermediate spots) plus a few local and first-hand sources; several expert reefs have one disputed rule or none on tide, and nothing exists outside northern Fuerteventura (your own spots get the general formula). The user asked whether the app should not always rate a spot when too little is known.

## Decision
Keep rating (a missing rating can't be compared, and the general model still says something about swell, wind and tide), but grade it: a knowledge level per spot and a confidence per hour (local knowledge, wind-model agreement, doubtful forecast point or location, your own sessions), shown as a badge with reasons. Withhold the rating only where a key fact is missing and a guess could be dangerous: advanced/expert reefs at low tide that no source describes. Best picks prefer well-known spots on close scores.

## Consequences
* Expert reefs with thin sources show "Less certain" or "Rough guide"; Spew Pits gets no rating at low tide.
* Spots you add anywhere start as "Rough guide" and become surer as your sessions there accumulate.
* Thresholds (45°, 1.2 session weight, tide 0.25, ranking bonus 0.4 / 0.2) are priors ([pending: tuning](/decisions/pending/threshold-tuning.md)).
