---
type: "Reference"
title: "Tides"
description: "Sea level, normalised tide stage, and high/low times."
resource: "src/lib/conditions.ts"
tags: ["domain", "tide"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T19:30:00+00:00"
---
# Tides

* Sea level (m relative to mean sea level, including tide) from Météo-France currents via Open-Meteo.
* `tideInfo()`: the tide position in the **middle of the hour** (hourly values are instantaneous at :00) **between the low and the high that bracket it**: 0 = low, 1 = high, so a higher night tide no longer makes the day's tides look "low"; trend −1…1 across the hour (relative to the max slope of a semi-diurnal tide). Series edges without a bracketing pair fall back to the day's range; needs ≥ 5 cm range.
* `tideExtremes()`: high/low times to the minute by fitting a parabola through three hourly values; shown as chips with heights "vs mean sea level" and on the table's tide curve.
* Spot tide preference (`low` … `high`, `all`) → `fTide` in the [spot rating](/engine/spot-rating.md). Peaks can override it.
