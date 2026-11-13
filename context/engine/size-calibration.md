---
type: "Reference"
title: "Size calibration"
description: "Per-spot gain from the sizes you noted."
resource: "src/lib/recommend.ts"
tags: ["engine", "calibration"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Size calibration

`calibratedGain(spot, sessions)`: for each session at the spot with an observed size (not flat), ratio = observed face height ÷ mean modelled hb (gain 1) over the surfed hours; with two or more ratios the median (clamped 0.3–2.5) replaces the spot's default gain. Shown in the spot's Info tab ("Size factor"). Default gains: beach 0.72, reef/point 0.77 ([decision 0011](/decisions/0011-gain-recalibration.md)). Observed sizes use the [body scale](/domain/body-scale.md).
