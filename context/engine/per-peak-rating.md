---
type: "Reference"
title: "Per-peak rating"
description: "Rating each peak of a spot on its own and naming the best one for you."
resource: "src/lib/rating.ts"
tags: ["engine", "rating", "peaks"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T00:30:00+00:00"
---
# Per-peak rating

* `ratedPeaks(spot)`: peaks that override at least one of `level`, `minSize`, `maxSize`, `tide`, `power`, `peel`, and only when there are **two or more** of them; otherwise the spot is rated as a whole.
* `peakSpot(spot, peak)`: the spot with the peak's overrides (also `bottom`, `breakType`).
* `rateSpot(spot, derived, profile)`: rates every rated peak; **For you** = the peak with the highest score for you; **Spot rating** = the best peak's quality. The peak is named ("Best for you: La Izquierda") only when the peaks really differ for you that hour.
* Used by `recommendSpotDay`, the session editor timeline and demo data.

Built-in overrides: Rocky Point (inside/outside), Majanicho (three peaks), Suicides (main reef / inside left), Punta Blanca, Los Lobos, Cotillo (Castillo / Piedra Playa). El Hierro was rated this way in seeds 4–5; since seed 6 its three waves are separate spots ([El Hierro area](/spots/el-hierro.md)). Exposure (swell window) is still per spot.
