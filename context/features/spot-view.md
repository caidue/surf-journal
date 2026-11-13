---
type: "Feature"
title: "Spot view"
description: "Everything about one spot in tabs, as a sheet over Explore or as its own page."
resource: "src/components/SpotView.tsx"
tags: ["feature", "spot"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Spot view

`SpotView` is shared by `SpotSheet` (bottom sheet on phones, dialog on desktop, Esc closes, focus returns) and `SpotPage` (`#/spot/:id`).

Header: name, region · break · level · peaks, **"Also called …"** (aliases), best score for you. Tabs (last one remembered):
* **Forecast:** day selector, best window with suitability badge, surf range with body words, peak period and wind, "Best for you: <peak>", suitability reasons, explanation, tide chips (high/low with heights vs mean sea level), the [forecast table](/features/forecast-table.md), data source line.
* **Guide:** the [spot guide](/features/spot-guide.md).
* **Info:** faces / offshore wind, best swell and size range, tide, break with power and peel, crowds / localism / lifeguard, **Elsewhere: Surfline · surf-forecast.com** links, size factor (default or calibrated), approximate-location warning, small map, source.
* **Sessions:** your sessions here with % similarity to the chosen day, and the [insights](/engine/insights.md) bars.

Spots sharing the Open-Meteo grid cell are listed in the table legend (loaded together with neighbours within 25 km).
