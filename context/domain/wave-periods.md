---
type: "Reference"
title: "Wave periods: peak vs mean"
description: "Which period the app shows and why, and how the models report periods."
tags: ["domain", "waves", "period"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
  - resource: "https://open-meteo.com/en/docs/marine-weather-api"
    id: "om-marine"
    title: "Open-Meteo Marine API docs"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Wave periods: peak vs mean

* **Peak period Tp** is what surf sites (Surfline, surf-forecast, Windy) show next to swell height. The app shows and rates peak periods everywhere (labelled "s peak" in the table).
* **Mean period Tm01** (MFWAM's per-train "period") is about 25 % lower: Tp ≈ 1.29–1.34 × Tm01 for typical swell spectra; the app uses `TP_FROM_MEAN = 1.3` when it has to estimate.
* **Energy period Te = Tm-1,0** (MFWAM `wave_period`) sits in between; shown as a tooltip on "Total sea".

Before v2 (2026-11-13) the app showed MFWAM mean periods, which is why its periods were ~2–3 s below surf-forecast's. Now: train periods from GFS-Wave (peak), total-sea Tp from ECMWF WAM. Sessions stored with mean periods are re-fetched automatically (`CONDITIONS_VERSION`).

Effects on the engine: `fPeriod` was re-based on peak periods ([Spot rating](/engine/spot-rating.md)); breaking heights rise ~11 % with Tp, compensated by recalibrated gains ([decision 0011](/decisions/0011-gain-recalibration.md)); the 13 s "long-period groundswell" rule now fires as intended. See [decision 0006](/decisions/0006-peak-period-convention.md).
