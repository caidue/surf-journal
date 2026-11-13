---
type: "Reference"
title: "Tides"
description: "Sea level, normalised tide stage, and high/low times."
resource: "src/lib/conditions.ts"
tags: ["domain", "tide"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Tides

* Sea level (m relative to mean sea level, including tide) from Météo-France currents via Open-Meteo.
* `tideInfo()`: per calendar day, normalised 0 (lowest) – 1 (highest) and trend −1…1 (falling/rising, relative to the max slope of a semi-diurnal tide). Needs ≥ 6 values and ≥ 5 cm range.
* `tideExtremes()`: high/low times to the minute by fitting a parabola through three hourly values; shown as chips with heights "vs mean sea level" and on the table's tide curve.
* Spot tide preference (`low` … `high`, `all`) → `fTide` in the [spot rating](/engine/spot-rating.md). Peaks can override it.
