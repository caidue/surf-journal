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
  at: "2026-11-13T21:20:00+00:00"
---
# Open-Meteo weather APIs

`weatherEndpoint(start, today)` picks:
* **Forecast API** (`api.open-meteo.com/v1/forecast`) when the start date is at most 80 days ago (covers forecast and recent past);
* **Historical Forecast API** for dates from 2022;
* **ERA5 archive** before that.

Variables: `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`, `temperature_2m`, daily `sunrise`, `sunset`; `timezone=auto` so all times are local to the spot. Merged with the marine data by hour in `merge()`. Wind is classified per spot in [Wind](/domain/wind.md).
