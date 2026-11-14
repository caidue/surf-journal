---
type: "Decision"
title: "0016: Wind over the sea from four models"
description: "Request wind with cell_selection=sea from ECMWF IFS, ICON, ARPEGE and GFS; use their mean and show where they disagree."
resource: "src/lib/openMeteo.ts"
tags: ["decision", "wind", "open-meteo"]
sources:
  - resource: "context/research/local-surf-school-spot-knowledge.md"
    id: "report"
  - resource: "context/research/rating-errors-at-la-caleta.md"
    id: "caleta"
  - resource: "https://open-meteo.com/en/docs"
    id: "docs"
decision_status: "accepted"
decided: "2026-11-14"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T14:30:00+00:00"
---
# Wind over the sea from four models

## Context
On 14 Nov 2026 the app rated La Caleta best at 13:00; local schools surfed it at 11:00 and the afternoon was nearly flat. The app's wind came from Open-Meteo's default `land` cell, 28.69, −13.94, about 9 km inland near Lajares, where the NE wind eased at 13:00. Sea cells in most models turned it N–NNE (onshore at La Caleta) between 13:00 and 14:00, as surf-forecast.com showed. One model alone was fragile too: on the same hour ECMWF IFS said 39°, ICON and ARPEGE 12°, GFS 27°.

## Decision
Every weather request uses `cell_selection=sea`; the Forecast and Historical Forecast APIs also ask for `ecmwf_ifs,icon_seamless,meteofrance_arpege_europe,gfs_seamless`. The hour's wind is their mean (direction as a vector mean); each model and the direction spread are stored. The forecast table marks a spread ≥ 45° with "?" and lists every model in the tooltip. ERA5 (oldest dates) stays a single model. UKMO is left out (its "sea" cell lies over the island). `CONDITIONS_VERSION` 3 re-fetches stored sessions.

## Consequences
* Wind and timing rules can be checked against wind that represents the coast, not an inland valley.
* The spread is the basis for "the models disagree on when the wind turns" in the planned rules engine.
* No Open-Meteo model is finer than ~7–10 km here: island effects (Lobos, the Bocaina strait) still need per-spot corrections from observations.
