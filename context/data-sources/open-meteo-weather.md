---
type: "API Endpoint"
title: "Open-Meteo weather APIs"
description: "Wind, gusts, air temperature, sunrise and sunset for each session date."
resource: "https://api.open-meteo.com/v1/forecast"
tags: ["data-source", "open-meteo", "wind"]
sources:
  - resource: "https://open-meteo.com/en/docs"
    id: "om"
  - resource: "src/lib/openMeteo.ts"
    id: "code"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T14:30:00+00:00"
---
# Open-Meteo weather APIs

`weatherEndpoint(start, today)` picks:
* **Forecast API** (`api.open-meteo.com/v1/forecast`) when the start date is at most 80 days ago (covers forecast and recent past);
* **Historical Forecast API** for dates from 2022;
* **ERA5 archive** before that.

Variables: `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`, `temperature_2m`, daily `sunrise`, `sunset`; `timezone=auto` so all times are local to the spot. Merged with the marine data by hour in `merge()` / `windHour()`. Wind is classified per spot in [Wind](/domain/wind.md).

**Wind over the sea, four models** (since `CONDITIONS_VERSION` 3, [decision 0016](/decisions/0016-sea-wind-multi-model.md)):
* `cell_selection=sea` on every endpoint. The default (`land`) deliberately picks a land cell: for the north coast it returned 28.69, −13.94, about 9 km inland near Lajares, which kept the wind NE on 14 Nov 2026 while sea cells turned it N–NNE (onshore at La Caleta) in the early afternoon.
* `models=ecmwf_ifs,icon_seamless,meteofrance_arpege_europe,gfs_seamless` (`WIND_MODELS`) on the Forecast and Historical Forecast APIs; keys come back suffixed `_<model>`, daily sunrise/sunset too (identical; the first is used). ERA5 has one model and no suffix.
* The hour's wind is the models' **mean**: speed and gust averaged, direction averaged as unit vectors. Each model is kept (`windModels`) and `windSpread` = the largest direction difference from the mean among models with ≥ 5 km/h. The forecast table marks ≥ 45° with "?" and lists every model in the tooltip.
* No model finer than ~7–10 km reaches the Canaries through Open-Meteo (AROME, ICON-D2, HARMONIE: "no data"); UKMO was left out because its "sea" cell for the north coast lies over the island. The Marine API returns no wind.
* The response's grid cell is shown in the data source line ("grid 28.79, −13.89").
