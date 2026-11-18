---
type: "Decision"
title: "0025: Similarity compares the raw swell, not the estimated face height"
description: "The size feature of the similarity is the swell height reaching the spot from the offshore trains, independent of the breaking formula and the size factor."
resource: "src/lib/similarity.ts"
tags: ["decision", "similarity", "waves"]
decision_status: accepted
decided: "2026-11-18"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-18T20:00:00+00:00"
---
# 0025: Similarity compares the raw swell, not the estimated face height

## Context
The similarity ("% like today", the personal prediction from similar sessions, the session comparison) used the estimated face height `hb` as its size. That number depends on the breaking-height formula, the wave-model choice ([decision 0023](/decisions/0023-size-uncertainty.md)) and the size factor calibrated from your observed sizes, so a new calibration or formula change slightly changed how alike two days looked, although nothing about the swell had changed.

## Decision
The size feature is `Derived.hIn`: the swell height reaching the spot, √Σ a·H² over the offshore trains with a = exposure to the spot's swell window × the wind-sea weight (0.7). Same weight (3) and tolerance (0.25 on log(h + 0.2)). Shown as "Swell size at the spot" in the comparison and in "Differs most in …".

## Consequences
* Calibration and formula changes no longer move similarities; only the forecast data and the spot's swell window do.
* The face height `hb` still drives the ratings and size suitability.
* On the log scale the tolerance is relative, so it means about the same for swell as it did for face heights.
