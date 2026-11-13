---
type: "API Endpoint"
title: "Open-Meteo Marine API (four models)"
description: "How wave, swell, tide and sea temperature data are requested and parsed."
resource: "https://marine-api.open-meteo.com/v1/marine"
tags: ["data-source", "open-meteo", "waves"]
sources:
  - resource: "https://open-meteo.com/en/docs/marine-weather-api"
    id: "om-marine"
    title: "Open-Meteo Marine API docs"
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
  - resource: "src/lib/openMeteo.ts"
    id: "code"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Open-Meteo Marine API (four models)

One request per batch of up to 25 points with `&models=meteofrance_wave,ecmwf_wam,ncep_gfswave016,meteofrance_currents` and 18 hourly variables (`wave_height`, `wave_direction`, `wave_period`, `wave_peak_period`, primary/secondary/tertiary swell and wind-wave height/period/direction, `sea_level_height_msl`, `sea_surface_temperature`). Every key comes back suffixed `_<model>`. Multi-model × multi-location batching was verified live on 2026-11-13.

| Field | From | Note |
|---|---|---|
| `waveH`, `waveDir` | `meteofrance_wave` (MFWAM) | reference total height; falls back to ECMWF, then GFS |
| `waveTe` | MFWAM `wave_period` | energy period Tm-1,0 |
| `waveTp` | `ecmwf_wam` `wave_peak_period` | else GFS `wave_period` (a peak period), else 1.3 × Te (`tpEstimated`) |
| `trains` | `ncep_gfswave016` swell 1–3 + wind wave | PEAK periods; heights × (MFWAM Hs ÷ GFS Hs); **0 m / 0 s means "no train"** |
| trains (fallback) | MFWAM trains | when GFS has no data for the date: Tp = 1.3 × mean period, flagged |
| `seaLevel`, `waterTemp` | `meteofrance_currents` | sea level includes tide, relative to mean sea level |

Parsing lives in `marineHour()` (`src/lib/openMeteo.ts`), unit-tested in `src/lib/offline.test.ts`.

## Archive coverage (history for logged sessions)
* MFWAM from 2021-10 (secondary swell from 2025-04-14).
* GFS-Wave 0.16° from 2024-10-02; secondary/tertiary from 2025-04-29.
* ECMWF WAM peak period from 2025-10-30 (0.25°), 9 km from 2025-11-16.
* Before 2021-10 the explicit models return nothing ([pending](/decisions/pending/pre-2021-history.md)).

## Quirks
* The response's top-level lat/lon is the first model's (MFWAM) cell; other models' cells (5–10 km apart) aren't reported. `gridLat/gridLon` = MFWAM cell.
* `ncep_gfswave025` returns zeros at the 28.75, −14.0 land cell; `dwd_ewam` has no coverage; `dwd_gwam` ignores island sheltering. Not used.
* Calls with more than 10 variables count fractionally more against the free limits (10,000/day, 600/min); one Explore load of ~16 spots is a handful of calls.
* Licence: CC BY 4.0, free for non-commercial use ([pending: commercial plan](/decisions/pending/accounts-and-sync.md)).

See [decision 0005](/decisions/0005-open-meteo-multi-model.md) and [Wave periods](/domain/wave-periods.md).
