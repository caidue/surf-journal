---
type: "Reference"
title: "Breaking height at a spot"
description: "From offshore trains to an estimated face height at the spot."
resource: "src/lib/conditions.ts"
tags: ["domain", "waves", "surf-height"]
sources:
  - resource: "https://doi.org/10.1061/9780872620926.067"
    id: "komar"
    title: "Komar & Gaughan (1972)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-18T15:00:00+00:00"
---
# Breaking height at a spot

# Computation
1. Offshore data is sampled 2.5 km seaward of the spot along its facing (`samplePoint()` in `src/lib/geo.ts`).
2. Per train: Komar–Gaughan `Hb = 0.39 · g^(1/5) · (T · H²)^(2/5)` with T = peak period.
3. Times **exposure** to the spot's swell window: 1 within 55 % of `swellWindow` around `idealSwellDir`, cosine taper to 0 at the edge.
4. Wind sea × 0.7.
5. Combined as the root of the sum of squares, times the spot's **gain** (default beach 0.72, reef/point 0.77; calibrated per spot from your observed sizes, see [Size calibration](/engine/size-calibration.md)).

`Derived.hb` is a face height (like Surfline's surf height; surf-forecast, Windfinder and Windguru show the smaller offshore swell or sea height). It is the central estimate of a likely range `hbLo`–`hbHi`: the three wave models' lowest and highest total height carried over to the breaking height (Hb ∝ H^0.8), at least ±20 % (`HB_BAND`, the usual coastal wave-model error) ([decision 0023](/decisions/0023-size-uncertainty.md)). The UI shows that range plus body words, e.g. "1.8–2.6 m · head high to well overhead" ([Body scale](/domain/body-scale.md)).

`tDom`/`dirDom` are the energy-weighted (a·H²·T) period and direction of what reaches the spot; they feed similarity and the long-period rule.
