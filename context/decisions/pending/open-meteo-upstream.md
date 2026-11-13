---
type: "Decision"
title: "Ask Open-Meteo for per-train peak periods in MFWAM"
description: "Upstream improvement, not ours to build."
tags: ["decision", "pending", "data"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
status: "draft"
decision_status: "pending"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Ask Open-Meteo for per-train peak periods in MFWAM

MFWAM (the best height model here) exposes only mean periods per train, so we combine three models. A request to Open-Meteo (or Météo-France) for per-train peak periods would let one model do it all. Also: per-model grid points in multi-model responses. Not started.
