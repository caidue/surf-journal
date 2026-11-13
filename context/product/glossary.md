---
type: "Glossary"
title: "Glossary"
description: "Surf and app terms used in code, UI and this knowledge base."
tags: ["glossary", "domain"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T00:30:00+00:00"
---
# Glossary

* **Hs (significant wave height):** mean height of the highest third of waves, offshore. `HourConditions.waveH` (MFWAM). See [Swell trains](/domain/swell-trains.md).
* **Train / partition:** one swell system (primary, secondary, tertiary) or the local wind sea. `WaveTrain` in `src/types.ts`.
* **Tp (peak period):** period of the most energetic waves; what surf sites show. **Tm01**: mean period (≈ Tp / 1.3). **Te / Tm-1,0**: energy period. See [Wave periods](/domain/wave-periods.md).
* **hb (breaking height):** estimated face height at the spot, `Derived.hb`. See [Breaking height](/domain/breaking-height.md).
* **Face height:** trough-to-lip height as you'd describe it on the beach (not Hawaiian feet). See [Body scale](/domain/body-scale.md).
* **Swell window:** directions a spot is open to (`idealSwellDir ± swellWindow`); trains outside it are greyed out.
* **Gain / size factor:** per-spot multiplier from modelled to observed breaking height. See [Size calibration](/engine/size-calibration.md).
* **Spot rating (q):** how good the waves are, 0–10, for anyone. See [Spot rating](/engine/spot-rating.md).
* **For you:** your predicted fun, 0–10: spot rating × suitability, blended with your history. See [Personal prediction](/engine/personal-prediction.md).
* **Suitability:** good / ok / stretch / challenging / unsuitable, from [the rules](/engine/suitability-rules.md).
* **Stage (1–8):** surfing ability step in the [skill profile](/engine/skill-profile.md). **C** = comfortable face height, **M** = biggest caught.
* **Peak:** a wave within a spot (e.g. the inside left at Suicides). Peaks with overrides are [rated on their own](/engine/per-peak-rating.md).
* **Grid cell:** the Open-Meteo model cell a spot's forecast comes from; spots in one cell share swell and energy.
* **Seed spots:** the built-in spots in `src/data/seedSpots.ts`, versioned by `SEED_VERSION`.
* **Conditions snapshot:** the hourly conditions stored with a session, versioned by `CONDITIONS_VERSION`.
