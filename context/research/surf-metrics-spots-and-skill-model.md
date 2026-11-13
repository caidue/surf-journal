---
type: "Research Report"
title: "Surf metrics, spot data and skill model"
description: "Deep research: period/energy conventions of surf sites, Open-Meteo model capabilities, spot naming across services, and a skill model with onboarding and rules. Implemented in v1.1."
tags: ["research"]
sources:
  - resource: "reports/Surf metrics spots and skill model.md"
    id: "original"
    title: "Original report in the author's workspace"
researched: "2026-11-13"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Realign periods, spot names and skill limits

**Your app disagrees with the surf sites mainly because it shows a different kind of wave period.** Surf forecasts list each swell train as significant height at its *peak* period and the direction it comes from. Open-Meteo's default model for northern Fuerteventura (Météo-France MFWAM) supplies only *mean* periods. At noon on 13 November that gave 8.05 s off Majanicho, against 10.4 s from GFS-Wave's peak periods and 11 s on surf-forecast.com for the same swell. The fix is one multi-model Open-Meteo request: MFWAM for coastal heights, GFS-Wave 0.16° for peak periods per swell train, ECMWF WAM for the total-sea peak period and Météo-France currents for tide. Alongside it, the forecast table should show the dominant swell train, a face-height surf range, the energy (kJ) of the strongest train, and a 0–10 spot rating kept separate from the personal score. **Surfline is the best-known service.** It has about 2.2× surf-forecast.com's web traffic and 30× its iOS ratings, and it now owns the former Magicseaweed. But its north-shore list is staff-curated and sparse: 13 spots, and one of them, "The Bubble (Hierro Right)", covers all of El Hierro. Spot names drift for three reasons: these are informal surfer names with no official place name behind them, each database was built separately, and imports keep whatever spelling they arrived with. Forecast sites say "Generosa"; maps and local guides say "Generoso". **Matching Surfline therefore means renaming six spots and merging The Bubble into El Hierro, not splitting Derecha out.** Aliases and external IDs keep every name searchable. **"Above your usual size" has nothing to do with you.** It fires whenever the estimated breaking height passes a hard-coded cap per level (1.8 m for intermediates), which is why exposed reefs like El Hierro trigger it and Majanicho does not. Replace it with a profile filled in at onboarding: an observable skill stage, comfortable and maximum face height, board, and reef, steep-wave and paddle-out experience. Score that profile with named rules, each of which prints a comparison with the user's own numbers, and refine it from the set size and "how it felt" that each logged session records.

## Surf sites show peak-period swell trains; the app shows mean periods

There is no formal standard, but surf forecasts share three conventions. Height is **significant wave height** (Hs, the mean of the highest third of waves), given per swell train rather than as one lump. Direction is **where the swell comes from**, in degrees clockwise from true north, usually with a 16-point compass label. The sea is split into **primary, secondary and sometimes tertiary swell plus wind sea** ([NDBC](https://www.ndbc.noaa.gov/faq/measdes.shtml); [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)). For a European audience the clearest template is surf-forecast.com's six-day table for Majanicho. It shows:

| Row | What it shows |
|---|---|
| Rating | 0–10 |
| Wave | Height in metres, compass direction, period in whole seconds, energy in kJ |
| Wind | km/h, plus a wind state from on-shore to glassy |
| Tide | High and low times with heights |
| Advanced block | Swell 1–3 and wind waves, each with its own height, direction, period and kJ |

Source: [surf-forecast.com Majanicho](https://www.surf-forecast.com/breaks/Majanicho/forecasts/latest/six_day).

### Period: peak versus mean

Period is where the services split, and that split explains the gap you noticed.

- **Definitions.** NOAA defines dominant period as the period carrying the most wave energy, and average period as a mean over all waves ([NDBC](https://www.ndbc.noaa.gov/faq/measdes.shtml)).
- **What surf sites show.** Surfline describes each listed swell's period as its spectral peak ([Surfline: Swell Spectra](https://www.surfline.com/lp/whatsnew/features/swell-spectra)). On Windy's forum, ECMWF's wave-modelling lead found Windy's two wave models showing 9 s and 21 s at the same point. He explained that one was a mean period and the other almost certainly a peak period ([Windy Community](https://community.windy.com/post/4598)).
- **What the app gets.** Open-Meteo's source code maps MFWAM's per-train periods to the Copernicus variables VTM01_SW1, VTM01_SW2 and VTM01_WW. These are Tm01 spectral means, not peaks ([MfWaveDownload.swift](https://github.com/open-meteo/open-meteo/blob/main/Sources/App/MfWave/MfWaveDownload.swift); [Copernicus Marine help](https://help.marine.copernicus.eu/en/articles/5158710-how-to-compute-the-mean-wave-period-mwp)).

At 12:00 UTC on 13 November, the same two swells off Majanicho came out as follows:

| Source | Period definition | Swell 1 | Swell 2 |
|---|---|---|---|
| MFWAM ([API test](https://marine-api.open-meteo.com/v1/marine?latitude=28.79&longitude=-13.96&hourly=swell_wave_period,secondary_swell_wave_period,swell_wave_peak_period,wave_peak_period&models=meteofrance_wave,ncep_gfswave016,dwd_gwam,ecmwf_wam&forecast_days=1)) | Mean (Tm01) | **8.05 s** | **8.8 s** |
| GFS-Wave (same test) | Peak, per train | **10.4 s** | **11.75 s** |
| ECMWF (same test) | Peak, total sea | **11.45 s** (one value for the whole sea) | |
| surf-forecast.com, that morning ([Majanicho](https://www.surf-forecast.com/breaks/Majanicho/forecasts/latest/six_day)) | Not stated | **11 s** | **12 s** |

The gap comes from the definition, not from a model error. Surfers compare against peak periods, so the app should show peak periods.

### Headline height

Surf-forecast's headline "Wave Height" is not total Hs; it is the height of the strongest swell train. In 19 of 21 time slots it equalled Swell 1. In the other two it equalled Swell 2, which carried more energy that hour. On the Friday morning it showed 1.6 m, while its own trains combine to about 1.95 m ([surf-forecast.com Majanicho](https://www.surf-forecast.com/breaks/Majanicho/forecasts/latest/six_day)).

Today the app's Swell row shows MFWAM's primary train with its mean period, and falls back to total wave height when that is missing (`src/components/ForecastTable.tsx`). To conform, the headline should be the most energetic train, with its peak period and direction, and the other trains should sit in an expandable block. If total Hs is shown at all, give it its own "Total sea" label, because adding up the trains does not give it.

### Surf height

Only Surfline commits to a breaking height for each spot. It shows a face-height range in feet with body-part descriptors, produced by its surf-tuned LOTUS model and calibrated against decades of human reports ([Surfline LOTUS](https://www.surfline.com/lp/whatsnew/features/lotus-swell-model)). Users can switch to the Hawaiian scale, which is roughly half the face height ([Jamie O'Brien](https://jamieobrien.com/articles/how-to-measure-wave-height); [Surfertoday](https://www.surfertoday.com/surfing/14099-what-is-the-hawaiian-wave-scale)). Surf-forecast.com deliberately gives no breaking height, because the local seabed shape dominates it ([surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)).

The app's estimate (the Komar–Gaughan breaker formula, shown as a ±20 % range in `src/lib/format.ts`) is in line with this practice, with three gaps:

- The table shows a single number instead of a range.
- It never says "face height".
- It is fed mean periods. Komar–Gaughan scales with period to the power 0.4, so switching from 8.05 s to 10.4 s raises the estimate by **about 11 %** at the same swell heights (my calculation with the code in `src/lib/conditions.ts`).

### Energy

Surf-forecast.com publishes no formula for its kJ figure. Its 38 values for Majanicho fit **E = 1.96·H²·T² per swell train**, with a least-squares coefficient of 1.957 ([surf-forecast.com Majanicho](https://www.surf-forecast.com/breaks/Majanicho/forecasts/latest/six_day)). That is the same constant the app's `waveEnergyKJ` uses, and it equals ρg²H²T²/16π ([Wikipedia: Wave power](https://en.wikipedia.org/wiki/Wave_power)).

Two differences remain. Surf-forecast's headline kJ is the energy of the strongest train, while the app adds up all trains. And the app uses mean periods; energy scales with T², so that roughly halves it at the same height. For noon on 13 November:

| Method | Energy |
|---|---|
| The app today: all trains added, mean periods | About **490 kJ** |
| Strongest train only, peak periods | **450–465 kJ** |
| All trains added, peak periods | **720–840 kJ** (would read high) |
| Surf-forecast's Swell 1, that morning | **560 kJ** |

Make both changes together: peak periods and the strongest-train headline. Surf-forecast's guidance makes a good tooltip: about 100 kJ is barely surfable at many breaks, 200–1,000 kJ gets increasingly punchy, and 1,000–5,000+ kJ is heavy ([surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)).

### Rating

Ratings have no common scale, but they share one principle: they describe the spot's conditions, not the user.

- **Surf-forecast.com** rates 0–10 stars from swell size and character. The stars fade in proportion to onshore wind ([surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)).
- **Magicseaweed** showed solid stars for the swell and faded stars for what the wind took away ([MSW rating docs](https://de.magicseaweed.com/docs/developers/59/msw-rating/9913/)).
- **Surfline** uses seven word ratings shown on five bars. They are relative to each spot's potential and estimated by its model from surf height and wind. Good and Epic are reserved for forecasters who have watched the surf ([Surfline support](https://support.surfline.com/hc/en-us/articles/36277684017819-Surf-Ratings-Colors); [Surfline Apr 2025](https://www.surfline.com/lp/whatsnew/releases/apr-25)).

The app's Rating row is something else: a **personal fun prediction**, which drops to ✕ when the spot is unsuitable for your level (`src/lib/recommend.ts`). Keep it, because it is what sets the app apart, but move it to its own "For you" row. Above it, show a conventional spot rating:

- The existing quality score `q`, on 0–10.
- A faded extension up to `potential`, the score without wind, which `src/lib/rating.ts` already computes.
- A word label. The current labels jump from "good" to "epic" at 7.5. A Surfline-like ladder (Poor, Poor–Fair, Fair, Fair–Good, Good, Epic), with Epic only above 9, matches how rare users expect "epic" to be.

### Wind, tide and direction

Wind and direction already conform. The app's six wind states (glassy, offshore, cross-offshore, cross-shore, cross-onshore, onshore) and its green-for-offshore colouring mirror surf-forecast.com's wind-state row ([surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)).

Tide does not. Surf-forecast lists high and low times with heights that are all positive (0.44–1.99 m at Majanicho), which points to a chart-datum reference ([surf-forecast.com Majanicho](https://www.surf-forecast.com/breaks/Majanicho/forecasts/latest/six_day)). Open-Meteo's `sea_level_height_msl` is measured from mean sea level and goes negative. Print the high/low list with heights and label it "relative to mean sea level", so nobody reads −0.3 m as an error.

### Summary: what to change per metric

| Metric | What most surf sites do | What the app does now | Change |
|---|---|---|---|
| Swell height | Hs per train (primary, secondary, tertiary, wind sea); headline is the most energetic train | MFWAM primary train only; total height as fallback | Headline = most energetic train; expandable rows per train; grey out trains outside the spot's swell window; total Hs only as "Total sea" |
| Period | Peak period per train, whole seconds | MFWAM Tm01 mean (about 8 s where others show 10–12 s) | GFS-Wave 0.16° peak period per train, labelled "Period (peak)" |
| Direction | Where it comes from; degrees and 16-point compass | Same, but the compass label only shows in a tooltip | Print "NNW 333°" inline |
| Surf height | Surfline: face-height range plus body descriptor; surf-forecast: none | Single number, "m, est." | Face range ±20 % plus descriptor ("1.8–2.6 m · head high to overhead"), computed with peak periods |
| Energy | kJ ≈ 1.96·H²·T² per train; headline is the strongest train | All trains added, mean periods | Strongest train's kJ with peak period; per-train kJ in the expanded rows; total in the tooltip |
| Rating | Rates the spot, 0–10 stars or words; wind fades it | Personal fun prediction; 0 when unsuitable | Split into "Spot rating" (q, faded bar up to potential, word label) and "For you" |
| Wind | km/h or mph (knots on wind sites); six-step state; green = offshore | Already conforms; km/h or kn; shows gusts | Add mph |
| Tide | High/low times and heights against a datum | Curve against mean sea level; high/low times only | Add heights and a datum label |

## A four-model Open-Meteo request restores peak periods

No single Open-Meteo model has everything near Fuerteventura. Worse, the same variable name means different spectral quantities in different models:

- **MFWAM:** `wave_period` is the energy period Tm-1,0, and every per-train period is a Tm01 mean ([MfWaveDownload.swift](https://github.com/open-meteo/open-meteo/blob/main/Sources/App/MfWave/MfWaveDownload.swift)).
- **ECMWF WAM:** `wave_peak_period` is a true peak period (`pp1d`), the reciprocal of the frequency at the peak of the spectrum ([EcmwfVariable.swift](https://github.com/open-meteo/open-meteo/blob/main/Sources/App/Ecmwf/EcmwfVariable.swift); [ECMWF parameter 140231](https://codes.ecmwf.int/grib/param-db/140231)).
- **GFS-Wave:** every `*_period` field is a **peak period of that swell train**, even though the names never say "peak". Open-Meteo reads them from the WAVEWATCH III fields SWPER and WVPER, which the WW3 GRIB writer fills from its per-train peak-period array ([GfsWaveVariable.swift](https://github.com/open-meteo/open-meteo/blob/main/Sources/App/Gfs/GfsWaveVariable.swift); [ww3_grib.F90](https://github.com/NOAA-EMC/WW3/blob/develop/model/src/ww3_grib.F90)).
- **DWD GWAM:** gives a peak period for total swell and for wind sea only ([IconWaveDomain.swift](https://github.com/open-meteo/open-meteo/blob/main/Sources/App/IconWave/IconWaveDomain.swift)).

The app currently sends no `models` parameter, so it gets "best match", which here is MFWAM (`src/lib/openMeteo.ts`).

| Model key | Grid / horizon | Gives | Use it for | Caveat |
|---|---|---|---|---|
| `meteofrance_wave` | 1/12° (~8 km), 3-hourly interpolated to hourly, 10 days | Total Hs, Tm-1,0, wind sea, primary and secondary swell (Tm01) | Total Hs near the coast, energy period, height scaling | No peak period |
| `ncep_gfswave016` | 0.16°, hourly, 16 days | Swell 1–3 and wind sea, each with peak period | Height, peak period and direction per train | Reports missing trains as 0, not null |
| `ecmwf_wam` | 9 km, hourly to ~90 h, 15 days | Total Hs, mean period, **peak period** | Total-sea peak period | No swell trains |
| `meteofrance_currents` | 0.08° | Sea level including tide, sea temperature, currents | Tide and water temperature | Must now be named explicitly |
| `dwd_gwam` (optional) | 0.25°, ~7 days | Peak period of total swell and of wind sea | Cross-check | Ignores island sheltering: 1.88 m on the east side, where MFWAM, ECMWF and GFS 0.16° gave 0.46–0.64 m |

Two models to avoid ([Open-Meteo live tests](https://marine-api.open-meteo.com/v1/marine?latitude=28.75&longitude=-14.0&hourly=wave_height,swell_wave_period&models=ncep_gfswave025&forecast_days=1&cell_selection=sea)):

- **`ncep_gfswave025`** returns all zeros at its 28.75 N, 14.0 W cell, which is the nearest cell for much of the north-west coast.
- **`dwd_ewam`** does not cover the Canaries at all: its grid stops at 30°N ([IconWaveDomain.swift](https://github.com/open-meteo/open-meteo/blob/main/Sources/App/IconWave/IconWaveDomain.swift)).

This exact combination was tested live on 13 November and returned every field listed above ([validated request](https://marine-api.open-meteo.com/v1/marine?latitude=28.79&longitude=-13.96&hourly=wave_height,wave_direction,wave_period,wave_peak_period,wind_wave_height,wind_wave_period,wind_wave_direction,swell_wave_height,swell_wave_period,swell_wave_peak_period,swell_wave_direction,secondary_swell_wave_height,secondary_swell_wave_period,secondary_swell_wave_direction,tertiary_swell_wave_height,tertiary_swell_wave_period,tertiary_swell_wave_direction,sea_level_height_msl,sea_surface_temperature&models=meteofrance_wave,ecmwf_wam,ncep_gfswave016,dwd_gwam,meteofrance_currents&forecast_days=3&timezone=Atlantic/Canary)):

```
https://marine-api.open-meteo.com/v1/marine?latitude=…&longitude=…
 &hourly=wave_height,wave_direction,wave_period,wave_peak_period,
         wind_wave_height,wind_wave_period,wind_wave_direction,
         swell_wave_height,swell_wave_period,swell_wave_direction,
         secondary_swell_wave_height,secondary_swell_wave_period,secondary_swell_wave_direction,
         tertiary_swell_wave_height,tertiary_swell_wave_period,tertiary_swell_wave_direction,
         sea_level_height_msl,sea_surface_temperature
 &models=meteofrance_wave,ecmwf_wam,ncep_gfswave016,meteofrance_currents
 &timezone=auto&start_date=…&end_date=…
```

Every variable comes back once per model, with the model as a suffix (`<variable>_<model>`). Combinations a model doesn't provide come back as null arrays rather than errors. So `merge()` in `src/lib/openMeteo.ts` has to pick fields per model:

| App field (`HourConditions`) | Open-Meteo key | Meaning |
|---|---|---|
| `waveH`, `waveDir` | `wave_height_meteofrance_wave`, `wave_direction_meteofrance_wave` | Total Hs on the best coastal grid |
| `waveTe` (new) | `wave_period_meteofrance_wave` | Energy period Tm-1,0 |
| `waveTp` (new) | `wave_peak_period_ecmwf_wam`; if missing, `wave_period_ncep_gfswave016` | Total-sea peak period |
| `swellH`/`swellTp`/`swellDir` | `swell_wave_*_ncep_gfswave016`, height × (MFWAM Hs ÷ GFS Hs) | Train 1 |
| `swell2*`, `swell3*` (new) | `secondary_swell_wave_*`, `tertiary_swell_wave_*` from `_ncep_gfswave016`, scaled the same way | Trains 2 and 3 |
| `windWaveH`/`windWaveTp`/`windWaveDir` | `wind_wave_*_ncep_gfswave016`; if that is 0, MFWAM wind sea marked "mean period" | Wind sea |
| `swellTm01` (optional, new) | `swell_wave_period_meteofrance_wave` | Mean period, labelled as such |
| `seaLevel`, `waterTemp` | `sea_level_height_msl_meteofrance_currents`, `sea_surface_temperature_meteofrance_currents` | Tide, sea temperature |

### Implementation gotchas

- **Missing trains.** GFS reports absent trains as 0 m, 0 s, 0°. Map these to "no train", never to "flat".
- **Height scaling.** Scale GFS heights by MFWAM's total Hs ÷ GFS's total Hs. MFWAM's finer grid captures sheltering: on the east side it gave 0.46 m against GFS's 0.58 m. The two models' directions already agree within a few degrees (333° vs 333°, 281° vs 279°).
- **Different grid cells.** Each model uses its own nearest cell, about 5–10 km apart, and the top-level coordinates in a multi-model reply belong to the first model only. Fetch and store each model's grid point once per spot with a single-model call.
- **Batching is untested.** The app sends up to 25 locations per request. The tests covered several models at one location, not several models at several locations, so verify that combination or fall back to one request per spot.
- **Cost.** Requests with more than 10 variables count as fractional extra calls ([Open-Meteo pricing](https://open-meteo.com/en/pricing)), and it is undocumented whether extra models also count. Even the worst case (about 10 call-units per request) fits easily within the free tier's 5,000 calls an hour ([Open-Meteo terms](https://open-meteo.com/en/terms)).

### History

Archive coverage is uneven:

- **ECMWF peak period:** from 30 October 2025 (0.25° grid) and 16 November 2025 (9 km grid).
- **GFS-Wave 0.16° trains:** from 2 October 2024. Secondary and tertiary trains start 29 April 2025.
- **MFWAM:** from October 2021, but its secondary swell only from 14 April 2025.
- **Earlier peak periods:** ERA5 up to 18 November 2024, and DWD GWAM (with a gap from June 2024 to December 2025).

Source: [Open-Meteo archive probe](https://marine-api.open-meteo.com/v1/marine?latitude=28.79&longitude=-13.96&hourly=wave_height,wave_period,wave_peak_period&models=ecmwf_wam025&start_date=2021-10-01&end_date=2026-11-20).

So the app should do three things. Store the raw values from every model at the moment a session is logged. Version the snapshot schema. And for older snapshots that only have Tm01, estimate peak period with the observed GFS/MFWAM ratio of **1.29–1.34**, labelled as an estimate: it is a rough local heuristic, not a conversion. Longer term, ask Open-Meteo to ingest MFWAM's peak-period variable VTPK, which is already in the Copernicus product they download. That would give peak period on the best coastal grid with the longest archive ([MfWaveDownload.swift](https://github.com/open-meteo/open-meteo/blob/main/Sources/App/MfWave/MfWaveDownload.swift)).

### What the switch does to the rating engine

Switching to peak periods shifts everything downstream, and these thresholds were tuned against mean periods:

- **`fPeriod`** reaches full marks at 11 s. Feed it a 10.5 s peak instead of an 8 s mean and the factor jumps from 0.75 to about 0.96. Re-base it on peak periods, for example 0.25 below 6 s, rising through 9 s (surf-forecast treats periods under 9 s as locally generated wind swell ([surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq))) to 1.0 from 12 s.
- **The long-period warning** at 13 s rarely fired on Tm01 values. It becomes meaningful.
- **Breaking heights** rise about 11 %. So spot gains, `minSize`/`maxSize` and the size thresholds need one recalibration pass, with the engine tests re-run.

## Surfline sets the reference names, but lists only 13 north-shore spots

### Four databases built four different ways

| Service | How its spot list is built |
|---|---|
| **Surfline** | Curated by staff. The oldest north-Fuerteventura spots (Rocky Point, Bristol, Majanicho, The Bubble, Los Lobos, Corralejo Beach) carry IDs from its older platform and guide fields written by staff. Most of the others (Generosa, Flag Beach, Playa del Moro, El Burro and eight more) were created within minutes of each other on **10 March 2023**, with no legacy ID and empty guide fields. The creation dates come from decoding the timestamps inside Surfline's database IDs ([MongoDB ObjectId](https://www.mongodb.com/docs/manual/reference/method/ObjectId/); [Surfline map](https://www.surfline.com/surf-reports-forecasts-cams-map/@28.715,-13.93,11z)). That batch was probably the Magicseaweed import (see below). |
| **Surf-forecast.com** (Meteo365) | Claims over 7,000 spots ([surf-forecast.com](https://www.surf-forecast.com/)). Pairs guides written from a template with user reviews, photos and "secret spot" reports ([Generosa guide](https://www.surf-forecast.com/breaks/Genarosa)). Its Fuerteventura list contains misspelt slugs ("Genarosa", "Heirro") and near-duplicates ([region page](https://www.surf-forecast.com/regions/Fuerteventura)). |
| **Wannasurf** | Entirely user-submitted. Each page names its author and contributors ([Wannasurf Fuerteventura](https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/index.html)). |
| **Windguru** | Nine official north-shore spots, plus hundreds of user "custom" spots that anyone can find in search ([Windguru](https://www.windguru.cz/49340)). |

Why the 2023 batch is probably the Magicseaweed import: Surfline bought Magicseaweed in 2017 ([Swellnet](https://swellnet.com/news/swellnet-dispatch/2017/09/19/surfstitch-sell-magicseaweed-surfline)), and the MSW app's final update on 24 May 2023, about two months after the batch, announced that MSW had joined Surfline ([App Store](https://apps.apple.com/us/app/-/id322103952)). No primary statement confirms it.

No evidence turned up of any of these services licensing spot data from another. Open data does not fill the gap either: OpenStreetMap names only three northern breaks, and Wannasurf reserves all rights ([Overpass API](https://overpass-api.de/api/interpreter); [Wannasurf](https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/index.html)).

### Surfline leads on traffic, ratings and reach

Among dedicated surf forecasters, Surfline leads on every measure found:

| Measure | Surfline | Surf-forecast.com |
|---|---|---|
| Web visits, 3 months to October 2026 | **7.6M** ([Similarweb](https://www.similarweb.com/website/surfline.com/)) | 3.5M ([Similarweb](https://www.similarweb.com/website/surf-forecast.com/)) |
| US iOS ratings | **30,674** ([iTunes](https://itunes.apple.com/lookup?id=393782096&country=us)) | 1,016 ([iTunes](https://itunes.apple.com/lookup?id=6450721636&country=us)) |
| Android | 1M+ downloads ([Google Play](https://play.google.com/store/apps/details?id=com.surfline.android&hl=en&gl=US)) | — |

Surfline also absorbed Magicseaweed, historically Europe's best-known surf brand. The caveat is audience. **Surfline's traffic is 72 % American.** Surf-forecast.com gets **20 % of its traffic from Spain**, and lists more north-shore breaks. That makes it the natural second reference for a Fuerteventura app.

### Names drift because none of them are official

No official Spanish place name exists for "Generoso" or "Generosa". Spain's CartoCiudad geocoder, which includes the national gazetteer of place names, returns nothing for either spelling. It does return Majanicho ([CartoCiudad](https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=Generoso)). The spellings split by type of source:

| Spelling | Used by |
|---|---|
| **"Generosa"** | Surfline ([Generosa](https://www.surfline.com/surf-report/generosa/640b892d606c4576c6ef960a)), created in the 2023 batch; surf-forecast.com (slug misspelt "Genarosa"); windy.app ([windy.app](https://windy.app/forecast2/spot/4016135/Generosa/statistics)) |
| **"Generoso"** | OpenStreetMap ([OSM way 684871472](https://www.openstreetmap.org/way/684871472)); Wannasurf; fuerteventuraplayas.com, which adds "also known as La Generosa" ([fuerteventuraplayas](https://www.fuerteventuraplayas.com/en/spot/generoso-surf-spot/)); a Windguru custom spot |
| **"La Hennerosa"** | Wannasurf's original page name and alternative name ([Wannasurf](https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/la_hennerosa/index.html)) |

"La Hennerosa" is most likely "La Generosa" written down by ear: Canarian Spanish pronounces "ge" with an aspirated h. That is a linguistic inference, not a sourced fact.

The same process creates duplicates. Surf-forecast lists a "Yarro" next to its "Hierro" entry, and a "Mechihonas" near Mejillones; both look like phonetic copies of names that already exist. The pattern holds across the coast: these are informal surfer names, carried by visitors and imports, and nobody deduplicates them.

### Surfline folds all of El Hierro into one spot

Locally, El Hierro bay has three named waves:

- the left: La Izquierda, also called Hierro Left or "El Hierro";
- the right: Derecha de los Alemanes, the "German Right";
- a heavier A-frame, The Bubble, which needs a bigger swell.

Sources split them differently:

| Source | How it lists El Hierro |
|---|---|
| Wannasurf ([Derecha de los Alemanes](https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/derecha_de_los_alemanes/index.html); [The Bubble](https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/the_bubble/index.html)) | Three entries |
| fuerteventuraplayas.com ([German Right](https://www.fuerteventuraplayas.com/en/?p=7914)) | Separate pages for the left and the right |
| Windguru users ([Windguru 1209824](https://www.windguru.cz/1209824)) | Three entries |
| Surf-forecast.com ([Izquierda](https://www.surf-forecast.com/breaks/Izquierda)) | Five overlapping entries: Hierro, Izquierda, Derecha de los Alemanes, Yarro and The Bubble |
| **Surfline** ([The Bubble (Hierro Right)](https://www.surfline.com/surf-report/the-bubble-hierro-right-/5842041f4e65fad6a7708cbf)) | **One spot**, "The Bubble (Hierro Right)". Its staff-written guide describes Hierro as twin breaks: the left, and The Bubble just to the east |

So the apps that list Derecha as its own spot are the user-built and loosely curated catalogues, which add one entry per named wave. The best-known app does the opposite.

Two details matter for the app. First, **"Hierro Right" is ambiguous**: Surfline uses it for The Bubble, while Wannasurf uses it as the alternative name for Derecha de los Alemanes. It should not be anyone's primary name. Second, **our seed puts The Bubble 1.9 km west of Surfline's pin**, while every source with a position puts it east of the bay (my distance calculation from the cited coordinates).

### The spot list that matches Surfline

To match Surfline, rename where Surfline has the spot. Keep the five reefs it lacks under surf-forecast's names. Store aliases and per-service IDs, and keep the internal `id`s unchanged so that logged sessions and peak segments still match.

| Our spot (`seedSpots.ts`) | New display name | Surfline spot | Change |
|---|---|---|---|
| Rocky Point | Rocky Point | 584204204e65fad6a77096a0 | Keep. Aliases: Punta Elena, Bajo del Medio |
| El Muelle (Harbour Wall) | El Muelle | — | Shorten the name. Not on Surfline |
| Bristol (Shooting Gallery) | **Bristol** | 584204204e65fad6a77096a3 | Rename. Alias: Shooting Gallery |
| Mejillones | Mejillones | — | Not on Surfline. Our pin is 1.7 km east of surf-forecast's and 0.8 km from our own Generoso: verify |
| Generoso | **Generosa** | 640b892d606c4576c6ef960a | Rename. Aliases: Generoso, La Generosa, La Hennerosa |
| La Caleta | La Caleta | — | On no forecast site; keep as a local spot |
| Majanicho | Majanicho | 584204204e65fad6a77096a2 | Keep as one spot with three peaks. Our pin is 1.3 km from Surfline's Majanicho but only 0.46 km from Surfline's Bubble pin: move it toward 28.749, −13.933 |
| El Hierro + The Bubble | **El Hierro** (shown as "The Bubble (Hierro Right)" on Surfline) | 5842041f4e65fad6a7708cbf | **Merge** into one spot with three peaks: La Izquierda, Derecha de los Alemanes, The Bubble. Spot pin near Surfline's 28.7442, −13.9481 |
| Punta Blanca | Punta Blanca | 666b3248646e832432d19dd2 | Alias: Playa Punta Blanca. Our pin is 1.5 km from Surfline's |
| Esquinzo | Esquinzo | — | Alias: Playa de Esquinzo |
| El Cotillo – Piedra Playa | **Cotillo** | 6052148c589a23368a742cb4 | Rename. Alias: Piedra Playa. Do not link Surfline's "Castillo", which is on Lanzarote |
| El Cotillo – Spew Pits | **Spew Pits** | — | Shorten the name |
| Isla de Lobos | **Los Lobos** | 5842041f4e65fad6a7708cb9 | Rename. Alias: Isla de Lobos |
| Flag Beach | Flag Beach | 640b894d4519055a3bdbaeaf | Keep |
| Glass Beach (El Burro) | **El Burro (Glass Beach)** | 640b89264519055221dba4e8 | Lead with El Burro, as Surfline and Windguru do |
| Playa del Moro | Playa del Moro | 640b89598284fe91dbacaee1 | Our pin is 1.2 km south of Surfline's: verify |

Optional additions are Surfline's Corralejo Beach and Playa los Matos, plus surf-forecast and Wannasurf's Suicides, a right-hand reef between Generosa and Mejillones. Sources: [Surfline map](https://www.surfline.com/surf-reports-forecasts-cams-map/@28.715,-13.93,11z); [surf-forecast region](https://www.surf-forecast.com/regions/Fuerteventura).

The El Hierro merge works because the app already models peaks. But the rating currently reads only spot-level fields (level, sizes, tide). The Bubble (expert, mid–high tide, bigger swell) would otherwise be averaged with the left (advanced, all tides). So add per-peak overrides to `Peak`: `level`, `minSize`, `maxSize`, `tide` and `power`. Rate each peak, and show the spot's best peak for the user ("Best for you: La Izquierda"). If that is too much work for now, the acceptable fallback is to keep The Bubble as its own spot with corrected coordinates and link both spots to the same Surfline ID.

Link out to Surfline and surf-forecast rather than copying from them. Surfline's terms forbid scrapers and limit use to personal, internal purposes ([Surfline Terms](https://www.surfline.com/terms-of-use)). Whether storing its spot IDs for deep links raises any terms issue was not researched.

## "Above your usual size" compares you with a hard-coded 1.8 m

### What the label actually measures

`suitability()` in `src/lib/rating.ts` compares the estimated breaking height `hb` with a fixed cap per level, `SIZE_CAP` = beginner 1.0 m, intermediate 1.8 m, advanced 3.0 m, expert 6.0 m. The code comments call these "blog/vendor consensus". The bands are:

| Breaking height `hb` | Status | Label shown |
|---|---|---|
| Above 0.8 × cap | ok | "Upper end of your size range" |
| Above the cap | challenging | "Above your usual size" |
| Above 1.3 × cap | unsuitable | "Too big for your level" |

`hb` is worked out per spot in four steps (`src/lib/conditions.ts`, `src/lib/recommend.ts`):

1. A Komar–Gaughan breaking height for each offshore swell train, using its height and period.
2. Each train weighted by how well its direction fits the spot's swell window.
3. The trains combined.
4. A multiplier applied: 0.85 for reefs, 0.8 for beaches, or, once you have logged observed sizes in at least two sessions at that spot, the median ratio of observed to forecast height.

So "usual" never refers to anything you entered or surfed. It is a constant attached to the level picker.

The "some spots" pattern comes from the swell-window weighting. Take the MFWAM values for noon on 13 November: primary swell 1.48 m at 8.05 s from 333°, secondary 1.18 m at 8.8 s from 281°. Feed them through the code, assuming both spots sit in the same model cell:

| Spot | Swell window | `hb` | Intermediate sees |
|---|---|---|---|
| El Hierro | Ideal 315° ± 70°: both trains count in full | **2.2 m** | "Above your usual size (~2.2 m)" |
| Majanicho | Ideal 340°: the 281° train is cut to about 27 % | **1.7 m** | "Upper end of your size range" |

After the switch to peak periods, the same swell gives 2.4 m and 1.9 m. Without re-based thresholds, El Hierro would escalate to "Too big for your level" and Majanicho to "Above your usual size". These figures are my calculations with the app's own code.

The single cap also mixes up two different limits: "a bit more than I usually surf" and "more than I've ever surfed".

### What the evidence supports

No peer-reviewed source gives comfortable or maximum ocean wave heights per ability level. Several solid building blocks exist:

| Evidence | What it shows | Source |
|---|---|---|
| Skill science | Wave height and peel angle (how fast the break runs along the wave) set the skill a wave demands. The academic 1–10 Hutt scale ties levels to rideable height and peel angle | [Hutt, Black & Mead 2001](https://bvbvf1.bib-bvb.de/vufind/PrimoRecord/cdi_jstor_primary_25736206); [Lewis 2015](https://www.coastalconference.com/2015/papers2015/James%20Lewis.pdf) |
| Injury risk | Among competitive surfers, overhead waves carried **2.4×** the injury risk of smaller waves, and reef or rock bottoms **2.6×** that of sand | [Nathanson et al. 2007](https://journals.sagepub.com/doi/full/10.1177/0363546506293702) |
| Wave shape | Beginners cannot make fast sections. Offshore wind makes waves steeper and harder to catch | [Scarfe et al. 2003](https://escholarship.org/uc/item/6h72j1fz) |
| Rescues | Rip currents were the main hazard in rescues performed by surfers | [PubMed 26056968](https://pubmed.ncbi.nlm.nih.gov/26056968/) |
| Surf schools and wave pools | A common ladder of observable milestones. Lapoint's level 3 rides waist-high green waves alone; Surf Simply's level 3 catches head-high waves unassisted; The Wave sets heights per session tier and asks for a 25 m swim before intermediate sessions | [Surf Simply](https://surfsimply.com/what-level-surfer-am-i); [Lapoint](https://lapointcamps.freshdesk.com/support/solutions/articles/43000068136-choosing-a-surf-level); [Independent Surfer](https://independentsurfer.com/blog/which-surfing-level-am-i); [The Wave](https://thewave.com/about-wavegarden-technology/surf-sessions) |
| Labels | Coaches find "intermediate" too vague to self-assign | [Surf Simply](https://surfsimply.com/what-level-surfer-am-i) |
| Perception | Surfers' perceived heights differ from buoy heights by about 50 % | [Barlow et al. 2014](https://eprints.leedsbeckett.ac.uk/id/eprint/70/) |

That last point argues for learning each user's own size scale rather than trusting a fixed conversion. Among apps, SurfMap asks one level question and shows plain-language reasons ([SurfMap](https://surf-map.com/)). WaveCheck adds board type and per-spot overrides ([WaveCheck](https://www.wavecheck.surf/)). BUIO and LazySurfer learn from rated sessions ([BUIO](https://buioapp.com/); [LazySurfer](https://lazysurfer.app/compare/best-ai-surf-forecast-app-2026.html)). None of the products surveyed combines a fine-grained level, separate comfort and maximum sizes, reef experience and learning from sessions. That combination is open ground.

All the thresholds below are design proposals informed by these sources, not validated values. Tune them with real logs.

### Profile and onboarding

Replace `Settings.level` with a `SkillProfile`. Show it as a six-screen onboarding flow on first launch, plus three optional screens, with "You can change this anytime" on each. Make it editable later under Settings → Your surfing. Answer every size question on **one shared body scale**:

- Use it both for onboarding and for the existing "Observed size" chips in the session editor.
- Add a missing "shoulder" step.
- Pin each step to a single metre value.

Today `OBSERVED_SIZES` puts head height at 1.6 m, while the proposed onboarding scale puts it at 1.8 m. Consistency matters more than the exact numbers, because the per-spot calibrated multiplier (`calibratedGain`) already converts model heights into the user's own body-scale judgement.

| # | Screen | Answers | Stored as |
|---|---|---|---|
| 1 | "Which sounds most like your surfing right now?" | Eight observable statements (stage table below) | `stage` 1–8 |
| 2 | "Biggest waves you're comfortable in?" | Knee · waist · chest · shoulder · head · overhead · double overhead · bigger. Picture of a surfer, note "face height, not Hawaiian". Pre-filled from the stage | `comfort` (C) |
| 3 | "Biggest waves you've actually caught?" | Same scale; must be at least the answer to 2; defaults to one step above | `max` (M) |
| 4 | "What do you usually ride?" | Soft-top · longboard 9'+ · mid-length 7–8'6 · fish/groveller · shortboard · step-up/gun · bodyboard, with optional length | `board` |
| 5 | "Have you surfed over reef or rock?" | Never · a few times · regularly · shallow reef at low tide too | `reefExp` 0–3 |
| 6 | "Getting out back on a bigger day…" | I struggle or need help · I get through with turtle rolls and effort · I duck-dive or turtle-roll reliably and use the channel · long paddles and strong currents don't faze me | `paddleOut` 0–3 |
| 7 (optional) | "Steep or hollow waves?" | Prefer mellow · OK with steeper take-offs · love late drops and barrels | `steepExp` 0–2 |
| 8 (optional) | "How often, and for how long, have you surfed?" | <1/month to 2+/week; <1, 1–3, 3–10, 10+ years | `frequency`, `years` |
| 9 (optional) | "Can you swim 25 m and stay calm out of your depth without your board?" | Yes · not sure · no | `waterConfidence` |

The stage ladder is the common milestone sequence from surf schools. It maps back to the four existing levels, so `skillAtTime` and the session weighting keep working through a derived legacy level.

| Stage | Statement shown | Legacy level | C default | M default | Reef · steep · paddle pre-fill |
|---|---|---|---|---|---|
| 1 | Never surfed, or whitewater with a push | beginner | knee 0.5 m | 0.7 m | 0 · 0 · 0 |
| 2 | I stand and steer in whitewater on my own | beginner | 0.7 m | waist 0.9 m | 0 · 0 · 0 |
| 3 | I'm catching my first green waves and angling | beginner | waist 0.9 m | chest 1.2 m | 0 · 0 · 1 |
| 4 | I catch green waves on my own and ride along the face | intermediate | chest 1.2 m | 1.6 m | 0–1 · 0–1 · 1–2 |
| 5 | Bottom and top turns, speed; head-high waves on my own | intermediate | shoulder–head 1.6 m | 2.0 m | 1 · 1 · 2 |
| 6 | I link turns, handle steep take-offs, enjoy overhead surf | advanced | 2.0 m | 3.0 m | 2 · 1–2 · 2–3 |
| 7 | Heavy waves, barrels and reefs, well overhead | expert | 3.0 m | 4.5 m | 2–3 · 2 · 3 |
| 8 | Big waves, double overhead and up | expert | 4.5 m | 8.0 m | 3 · 2 · 3 |

After onboarding, sum up the profile in one editable line, for example: "Stage 4 · comfortable to chest-high (1.2 m) · caught up to 1.6 m · sand only · mid-length". If someone picks stage 6 or higher with under a year of surfing, show a gentle check. Lapoint's 60- and 98-hour level criteria show that time in the water is a usable sanity check ([Lapoint](https://lapointcamps.freshdesk.com/support/solutions/articles/43000068136-choosing-a-surf-level)).

### Rules that print reasons

Each rule below looks at one factor and returns two things: the lowest status it allows and a reason. The worst status wins, and the existing multipliers stay (good 1, ok 0.85, challenging 0.5, unsuitable 0). Show at most three reasons, worst first, plus one positive reason when the status is good. Every size reason names both numbers in the user's unit and links to "Edit comfort size".

Spot data needs new fields for these rules: `power` (mellow, punchy, hollow, slab), peel speed, lifeguard, crowd and localism. Map the existing `SpotLevel` to a required stage: beginner/all → 1, intermediate → 4, advanced → 6, expert → 7. H is `hb` × the calibrated multiplier, and periods are peak periods.

| Factor | Condition | Status | Reason shown |
|---|---|---|---|
| Size | H ≤ 0.8·C | good | "Right in your range: ~0.9 m (waist); you're comfortable to chest-high." |
| Size | 0.8·C < H ≤ C | ok | "Top of your comfort zone: ~1.1 m vs your chest-high." |
| Size | C < H ≤ M | challenging, or "Stretch session" (factor 0.7) if the user turned on `wantsChallenge` | "Bigger than you're comfortable in: ~1.5 m vs chest-high, but within the 1.6 m you've caught. Harder paddle-out, heavier wipeouts." |
| Size | M < H ≤ 1.15·M | challenging at stage 6+, unsuitable at stage ≤5 | "Bigger than anything you've surfed: ~1.8 m vs your max 1.6 m." |
| Size | H > 1.15·M | unsuitable | "Well beyond your biggest waves: ~2.4 m vs 1.6 m. Sets could break on you paddling out." |
| Size floor | H at or above overhead, stage ≤5 | at least challenging | "Overhead sets: injury risk rises sharply in overhead surf." |
| Too small | H below the board's minimum | ok | "Probably too small for a shortboard; a longboard or fish would be more fun." |
| Period | Tp ≥ 13 s, H > 0.7·C, stage ≤5 | ok (challenging if H > C) | "Long-period groundswell (15 s): sets hit harder and rips pull stronger than the height suggests." |
| Bottom | Reef or rock, `reefExp` = 0 | challenging; unsuitable if stage ≤3 or H > C | "Reef bottom and you haven't surfed reef yet: wear booties, avoid low tide." |
| Bottom | Sand, stage ≤3 | good (positive) | "Sand bottom: forgiving falls." |
| Shape | `power` hollow or slab, `steepExp` = 0 | challenging; unsuitable if H > C | "Steep, hollow take-offs: late drops are hard until you're used to steeper waves." |
| Shape | Fast or sectiony peel, stage ≤3 | challenging | "Fast, sectiony waves: hard to make before you can generate speed." |
| Wind | Offshore > 25 km/h, `steepExp` = 0 | ok | "Strong offshore: steeper waves that are harder to catch." |
| Wind | > 30 km/h onshore or offshore, stage ≤3 | challenging | "Strong offshore: you'll drift out if you lose your board, so stay close in." |
| Wind | > 45 km/h | challenging at stage 6+, otherwise unsuitable | "Very strong wind (50 km/h): hard to paddle, messy waves." |
| Paddle-out | Rip or current hazard, `paddleOut` ≤1 | challenging if H > 0.8·C, else ok | "Strong currents here: don't fight a rip." |
| Paddle-out | H > C, `paddleOut` ≤1 | challenging | "Getting out will be tough at this size without a reliable duck-dive." |
| Water | No `waterConfidence`, stage ≤3, no lifeguard | challenging | "Deep water and no lifeguard: stick to lifeguarded beaches for now." |
| Spot | Spot (or peak) needs a stage more than 1 above yours | unsuitable | "This spot needs advanced skills (stage 6+: steep reef take-offs). You're stage 4." |
| Spot | Needs exactly one stage more | challenging | "A step up from your level; go with someone who knows it." |
| Spot | H > spot `maxSize` × 1.15 (keep) | as now | "Bigger than this spot handles well, likely closing out." |

Keep the overhead and reef floors in place even for experienced users, but turn them into information rather than blocks: injury risk at these conditions is higher for experts too ([Nathanson et al. 2007](https://journals.sagepub.com/doi/full/10.1177/0363546506293702)). When size is fine but other factors drag the status down, say so: "Size is fine; it's the reef and the offshore wind."

### Logged sessions refine the profile

The session editor already records set size (the observed-size chips), a 1–10 fun rating and waves caught (`src/components/SessionEditor.tsx`). Add one question: **"How did it feel?"**, answered too small · comfortable · pushing it · out of my depth. The update rules then stay simple and visible:

- **Calibration.** Keep the existing per-spot `calibratedGain` (median of observed to forecast height, at least two sessions). It already maps model heights onto the user's own size judgement.
- **Comfort size C, upward.** When a session felt comfortable at sets S above C, move C a quarter of the way toward S.
- **Comfort size C, downward.** When a session felt out of my depth at or below C, move C a quarter of the way down, toward 0.9·S.
- **Speed limit on C.** Require two consistent sessions within 60 days before C moves by more than one body-scale step.
- **Maximum size M.** Raise M to S when the session felt comfortable or pushing it and waves caught is above zero.
- **Reef and steep experience.** Increment `reefExp` and `steepExp` after sessions at reef or hollow spots that did not feel out of my depth.
- **Stage.** Never change it automatically. Ask instead, for example "You've been comfortable in head-high waves four times; move up to stage 5?"
- **Explain every change, with undo.** For example: "We moved your comfortable size to shoulder-high based on 3 sessions at Majanicho. Undo."
- **Long breaks.** After six months without sessions, offer to lower C rather than doing it silently.
- **Fun stays separate from safety.** Fun ratings can keep feeding preferences and the personal prediction, but must never push warnings below the overhead and reef floors.
- **Session snapshots.** Replace `skillAtTime: Level` with a snapshot of `{stage, C, M}`, so that `sessionWeight` can down-weight sessions logged at a different stage.

## Conclusion: fix the data first, then the names, then the profile

All three problems share one root. The app compares numbers whose definitions it never states: a mean period against sites that show peak periods, a breaking height against a cap nobody entered, and a list of local wave names against a list of forecast points. Each fix is as much about labelling and provenance as about algorithms. Record which model and which period definition produced each number, which external spot each of ours corresponds to, and which profile values a warning was compared against. Do the data change first. The ratings, the size calibration and the similarity matching all inherit the period definition, and every session logged before the switch would otherwise have to be re-based. Since nothing is deployed yet, this is the cheapest moment to make all of these changes.

| Priority | Change | Where |
|---|---|---|
| 0 (today) | Reword the size reasons so they state the cap: "Above the intermediate size limit (1.8 m): ~2.2 m here" | `lib/rating.ts` |
| 1 | Request `meteofrance_wave,ecmwf_wam,ncep_gfswave016,meteofrance_currents`; add `wave_peak_period` and the `tertiary_swell_*` variables; parse suffixed keys; treat GFS zeros as missing; store the grid point per model | `lib/openMeteo.ts`, `types.ts` |
| 2 | Build swell trains from GFS peak periods with heights scaled to MFWAM's total Hs; feed peak periods into `hb`, `tDom` and similarity; add `waveTp`/`waveTe`; version the session snapshots; mark estimated peak periods on old sessions | `lib/conditions.ts`, `lib/similarity.ts` |
| 3 | Re-base `fPeriod` on peak periods; recalibrate spot gains and `minSize`/`maxSize`; re-run engine tests | `lib/rating.ts`, `data/seedSpots.ts`, `lib/engine.test.ts` |
| 4 | Forecast table: headline = most energetic train with expandable trains; "Period (peak)"; surf as a face-height range with body descriptor; energy of the strongest train; separate "Spot rating" (with faded potential and word label) and "For you" rows; high/low tide heights with datum | `components/ForecastTable.tsx`, `lib/format.ts` |
| 5 | Rename six spots, add `aliases` and `externalIds` (Surfline, surf-forecast, Wannasurf, Windguru) and search them; fix The Bubble, Majanicho, Punta Blanca, Playa del Moro and Mejillones pins; deep links instead of copied data | `data/seedSpots.ts`, `components/SpotPicker.tsx` |
| 6 | Merge The Bubble into El Hierro as a third peak; add per-peak `level`/`minSize`/`maxSize`/`tide`/`power` and rate per peak | `types.ts`, `lib/rating.ts`, `lib/recommend.ts` |
| 7 | `SkillProfile` type and first-launch onboarding (six screens plus three optional); editable "Your surfing" page replacing the level picker | `types.ts`, new onboarding component, `SettingsPage.tsx`, `Explore.tsx` |
| 8 | Rewrite `suitability()` as the named rules above, with reasons that state both numbers, positive reasons, and the "Stretch session" option | `lib/rating.ts` |
| 9 | One shared body scale with a shoulder step; "How did it feel?" in the session editor; bounded profile updates with explanations, undo and stage prompts | `lib/recommend.ts`, `components/SessionEditor.tsx` |
| 10 | Spot attributes for the shape and safety rules: `power`, peel speed, lifeguard, crowd, localism | `data/seedSpots.ts`, `data/spotGuides.ts` |
| 11 | Optional new spots: Corralejo Beach, Playa los Matos, Suicides | `data/seedSpots.ts` |
| 12 | Ask Open-Meteo to ingest MFWAM's peak period (VTPK) and Tm02 | upstream issue |
