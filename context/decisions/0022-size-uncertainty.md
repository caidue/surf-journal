---
type: "Decision"
title: "0022: Size as a range, not a hard cut-off"
description: "Median of the wave models, a likely range carried into the rating, exclusion only when even the low end is too big, wave-model disagreement in the confidence, and a sheltered Majanicho."
resource: "src/lib/rating.ts"
tags: ["decision", "waves", "size", "suitability", "uncertainty"]
sources:
  - resource: "context/research/majanicho-wave-height.md"
    id: "report"
decision_status: accepted
decided: "2026-11-18"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-18T15:00:00+00:00"
---
# 0022: Size as a range, not a hard cut-off

## Context
On 2026-11-19 the app showed Majanicho at ~2.6–2.9 m face height while surf-forecast showed ~1.5 m swell; with "Biggest caught" 2.2 m every hour was "Not for you" (score 0), although a local surf shop sent people there. The [research](/research/majanicho-wave-height.md) found: other sites mostly show the offshore swell height, not a face height (only Surfline does, 1.8–2.4 m for most of the day); the app always scaled the swell to Météo-France MFWAM, which ran 15–20 % above ECMWF WAM and GFS-Wave; Majanicho was treated as a fully exposed reef; and the ±20 % range was display-only, so one central number inside normal coastal model error (~20 % scatter) decided a hard veto. No surf product found hides a spot because the forecast exceeds a user's size.

## Decision
1. **Median wave model.** `waveH` is the median of the MFWAM, ECMWF WAM and GFS-Wave total heights; the GFS trains are scaled to it; each model's height is stored (`waveHModels`, `CONDITIONS_VERSION` 4).
2. **Likely range.** `Derived.hbLo` / `hbHi`: the models' lowest and highest total height carried over to the breaking height (Hb ∝ H^0.8), at least ±20 % (`HB_BAND`); `hsSpread` = (max − min) / median. Shown wherever the range is shown.
3. **Range against the limit.** Size rules exclude only when even the low end is too big (above your biggest, or 1.15 × the spot's or peak's maximum). When only the central estimate is over your biggest, the hour is "challenging" with "May be bigger than you like: ~H (Lo–Hi) …" and the score factor is capped at 0.5 × (1 − 0.5 × share of the range above your biggest).
4. **Confidence.** Wave models disagreeing (`hsSpread` ≥ 0.2) lowers the rating confidence one step.
5. **Majanicho.** Gain 0.68 instead of the reef default 0.77 (too small on 14 % of days vs 2–5 % for open reefs), and `Peak.sizeFactor` 0.8 for the inside peaks (they need ~2 m outside before they work). `SEED_VERSION` 9.
6. **Calibration from one session.** `calibratedGain` shrinks the sessions' median toward the default, (default + n × median) ÷ (n + 1), so one logged size already counts.
7. **Labels.** The legend and Wave row say the value is a face height like Surfline's and that other sites mostly show the offshore swell; "Biggest caught" is a face height.

Not done: rating on raw swell height (it would compare an offshore height with a face-height limit and drop real long-period swell); an energy-based size limit learned from sessions and combining trains by energy (both need more logged sizes to tune); validation against Puertos del Estado buoys.

## Consequences
* With the 19 Nov data Majanicho comes out at ~2.1–2.2 m (1.7–2.7 m) instead of 2.6–2.9 m: "challenging" for a stage-5 surfer whose biggest is 2.2 m, with a score, instead of "Not for you".
* Spots are excluded on size only from ~1.25 × your biggest (the low end of a ±20 % range); between that and your biggest they stay listed with a warning and a lower score.
* Sessions and cached forecasts are re-fetched once (new conditions version).
