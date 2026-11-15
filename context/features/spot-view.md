---
type: "Feature"
title: "Spot view"
description: "Everything about one spot in tabs, as a sheet over Explore or as its own page."
resource: "src/components/SpotView.tsx"
tags: ["feature", "spot"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-16T16:00:00+00:00"
---
# Spot view

`SpotView` is shared by `SpotSheet` (bottom sheet on phones, dialog on desktop, Esc closes, focus returns; a **fixed height** — 90 % of the window up to 920 px, almost full height on phones — so it doesn't change size between tabs) and `SpotPage` (`#/spot/:id`).

Header: name, region · break · level · peaks, **"Also called …"** (aliases), best score for you (or for the level chosen under Rate for on Explore: the whole Forecast tab then rates for that level without your sessions). Tabs (last one remembered; switching starts the new tab at its top; the bar scrolls sideways only if needed and never shows a vertical scrollbar; in the popup they are a fixed row between header and content, and the content doesn't bounce past its ends — `overscroll-behavior: none`): Forecast · Guide · Info · Sessions. The tabs stick under the top bar, whose real height is measured (`--topbar-actual`, App.tsx), so on an installed iPhone app they don't slide under the taller bar.
* **Forecast:** day selector, the [forecast table](/features/forecast-table.md) for the whole day (legend folded away behind "Legend"), then the **recommendation card** in the same layout as Explore's spot cards ("Go 07:19–09:00 · tide mid, falling" or "Go any time today" on an even day, "Not much for you …" on days without a window; condition badges; suitability badge with the best peak; timing notes; suitability reasons; explanation; confidence footer), "Tide (vs mean sea level)" with the high/low chips on a row below it. The data source line is inside the table's "Legend & sources".
* **Guide:** the [spot guide](/features/spot-guide.md), opening with the spot's description ("About this spot"; it used to sit in the header).
* **Info:** **What the app knows** (knowledge level, rule count, `dataNote`), faces / offshore wind, best swell and size range, tide, break with power and peel, crowds / localism / lifeguard, **Elsewhere: Surfline · surf-forecast.com** links, size factor (default or calibrated), approximate-location warning, small map, source.
* **Sessions** (phones: "Sessions", without the count; on phones each entry puts the "% like …" badge under the date and conditions so they get the full width): your sessions here with % similarity to the chosen day, and the [insights](/engine/insights.md) bars.

Spots sharing the Open-Meteo grid cell are listed in the table legend (loaded together with neighbours within 25 km).
