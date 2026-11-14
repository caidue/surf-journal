---
type: "Feature"
title: "Spot view"
description: "Everything about one spot in tabs, as a sheet over Explore or as its own page."
resource: "src/components/SpotView.tsx"
tags: ["feature", "spot"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T23:10:00+00:00"
---
# Spot view

`SpotView` is shared by `SpotSheet` (bottom sheet on phones, dialog on desktop, Esc closes, focus returns; a **fixed height** — 90 % of the window up to 920 px, almost full height on phones — so it doesn't change size between tabs) and `SpotPage` (`#/spot/:id`).

Header: name, region · break · level · peaks, **"Also called …"** (aliases), best score for you. Tabs (last one remembered): Forecast · Guide · Info · Best time · Sessions.
* **Forecast:** day selector, the [forecast table](/features/forecast-table.md) for the whole day (no recommendation in it), then tide chips (high/low with heights vs mean sea level) and the data source line.
* **Guide:** the [spot guide](/features/spot-guide.md), opening with the spot's description ("About this spot"; it used to sit in the header).
* **Info:** **What the app knows** (knowledge level, rule count, `dataNote`), faces / offshore wind, best swell and size range, tide, break with power and peel, crowds / localism / lifeguard, **Elsewhere: Surfline · surf-forecast.com** links, size factor (default or calibrated), approximate-location warning, small map, source.
* **Best time** (phones: "Best"): day selector, the recommendation card (best window with suitability badge, confidence badge, surf range with body words, peak period and wind, "Best for you: <peak>", timing notes, suitability reasons, explanation; "Not much for you …" on days without a window), then **the forecast for just those hours** (the table with `only` = the best window, or the least bad hour, without the legend, its frame fitted to the columns) and "See the whole day in Forecast".
* **Sessions** (phones: "Sessions", without the count): your sessions here with % similarity to the chosen day, and the [insights](/engine/insights.md) bars.

Spots sharing the Open-Meteo grid cell are listed in the table legend (loaded together with neighbours within 25 km).
