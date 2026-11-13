---
type: "Decision"
title: "0005: Four wave models in one Open-Meteo request"
description: "MFWAM height, ECMWF peak period, GFS-Wave trains, Météo-France currents."
resource: "src/lib/openMeteo.ts"
tags: ["decision", "data", "waves"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
decision_status: "accepted"
decided: "2026-11-13"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Four wave models in one Open-Meteo request

## Context
Open-Meteo's default `best_match` (MFWAM) reports MEAN periods per train; surf sites show PEAK periods. GFS-Wave 0.16° has per-train peak periods; ECMWF WAM has the total-sea peak period; MFWAM models island sheltering best.

## Decision
Request `models=meteofrance_wave,ecmwf_wam,ncep_gfswave016,meteofrance_currents`; take height/direction from MFWAM, trains from GFS scaled to MFWAM Hs, Tp from ECMWF; estimate Tp = 1.3 × mean when no peak data exists (flagged). Version the snapshot (`CONDITIONS_VERSION = 2`) and re-fetch older sessions.

## Consequences
Periods match surf sites; more variables per call (still well within free limits); history for peak periods starts 2024-10 (GFS) / 2025-10 (ECMWF). See [Open-Meteo marine](/data-sources/open-meteo-marine.md).
