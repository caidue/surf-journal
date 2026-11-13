---
type: "Decision"
title: "0014: Link to Surfline and surf-forecast, never fetch from them"
description: "External spot ids are only used to build links; no data is requested from or copied out of those services."
resource: "src/lib/links.ts"
tags: ["decision", "licensing", "spots"]
sources:
  - resource: "https://www.surfline.com/terms-of-use"
    id: "surfline-terms"
    title: "Surfline Terms of Use"
  - resource: "https://surf-forecast.com/pages/terms"
    id: "sf-terms"
    title: "surf-forecast.com terms"
decision_status: "accepted"
decided: "2026-11-13"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T23:35:00+00:00"
---
# Link to Surfline and surf-forecast, never fetch from them

## Context
Spots store `externalIds`: Surfline's `slug/spotId` (the hex id at the end of a spot page's URL) and surf-forecast's break slug. They were open as "check the terms" (pending, now closed). Surfline's Terms of Use (read 2026-11-13) forbid robots, scrapers and any "manual, automated or programmatic method to crawl or extract data", unauthorized API access, and storing "any significant portion of the Content"; content is licensed for personal, non-commercial use only. They say nothing against linking to Surfline pages. The same spot id is the key of Surfline's undocumented forecast API, so storing it makes that API easy to call, which the terms forbid.

## Decision
External ids are used **only to build links** (`surflineUrl()` and `surfForecastUrl()` in `src/lib/links.ts`, shown in a spot's Info tab). The app never requests anything from Surfline or surf-forecast, and copies no forecasts, texts or images from them. Spot names are place names; guide texts are our own words.

## Consequences
* Forecast data stays with Open-Meteo ([decision 0005](/decisions/0005-open-meteo-multi-model.md)).
* A feature that would compare our forecast with Surfline's needs a licence first.
* This is our reading of the terms, not legal advice; re-check before any commercial release.
