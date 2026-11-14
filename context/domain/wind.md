---
type: "Reference"
title: "Wind relative to a spot"
description: "Offshore/onshore components and the six wind kinds."
resource: "src/lib/conditions.ts"
tags: ["domain", "wind"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T14:30:00+00:00"
---
# Wind relative to a spot

The wind is read over the sea and averaged over four models ([Open-Meteo weather](/data-sources/open-meteo-weather.md)); where the models disagree by 45° or more, the forecast table marks the hour with "?".


`uOff = speed · cos(angle to offshore direction)` (offshore = facing + 180°), `uX = speed · |sin|`. `windKind()`: glassy below 6 km/h, then by angle: offshore < 35°, cross-off < 70°, cross < 110°, cross-on < 145°, onshore. Colours `WIND_BG` (Timeline.tsx). Units km/h, knots or mph (`windIn`, Settings → Units). Wind feeds `fWind` in the [spot rating](/engine/spot-rating.md) and the wind rules in [suitability](/engine/suitability-rules.md).
