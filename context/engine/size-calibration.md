---
type: "Reference"
title: "Size calibration"
description: "Per-spot gain from the sizes you noted."
resource: "src/lib/recommend.ts"
tags: ["engine", "calibration"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-18T15:00:00+00:00"
---
# Size calibration

`calibratedGain(spot, sessions)`: for each session at the spot with an observed size (not flat), ratio = observed face height ÷ mean modelled hb (gain 1) over the surfed hours; the gain is the median ratio shrunk toward the spot's default, (default + n × median) ÷ (n + 1), clamped 0.3–2.5: one session moves it halfway, two by two thirds ([decision 0023](/decisions/0023-size-uncertainty.md); before, it needed two sessions and then jumped to the median). Shown in the spot's Info tab ("Size factor"). Default gains: beach 0.72, reef/point 0.77 ([decision 0011](/decisions/0011-gain-recalibration.md)); Majanicho 0.68 (more sheltered than the open North Shore reefs), and its inside peaks `sizeFactor` 0.8 ([Per-peak rating](/engine/per-peak-rating.md)). Observed sizes use the [body scale](/domain/body-scale.md).
