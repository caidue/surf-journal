---
type: "Reference"
title: "Influence: analog forecasting and kNN"
description: "Matching today's conditions with past sessions."
tags: ["influence", "similarity"]
sources:
  - resource: "context/research/surf-journal-app-feasibility.md"
    id: "feas"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Influence: analog forecasting and kNN

The personal score treats past sessions as analogs: a weighted, tolerance-scaled distance (Gower-style for missing values), a Gaussian kernel, and a shrinkage prior towards the rule score (kernel regression with n0 = 2). Chosen for transparency with few data points: every number can be explained by the closest sessions. See [Similarity](/engine/similarity.md) and [Personal prediction](/engine/personal-prediction.md). Learned per-user weights (e.g. a Gaussian process) are left for when there are enough sessions.
