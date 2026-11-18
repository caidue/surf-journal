# Other forecast sites vs our app: Majanicho (north Fuerteventura), forecast for Thu 19 Nov 2026

Access window: Wed 18 Nov 2026, about 12:20 to 12:30 UTC. Local time in the Canaries is WET = UTC+0 in November, so local = UTC. Our app shows about 1.5 m swell and about 2.5 m "waves" for 19 Nov.

## Q1. What does each site show for 19 Nov (morning / midday / afternoon)?

### Takeaway
Every site I could read puts tomorrow's sea at about 1.5 to 2.3 m. Swell builds from NW to NNW, the period is long (12 to 16 s), and there is a light NE to ENE breeze of 7 to 12 kt. The spread between sites comes from which quantity each one labels as the headline number, not from disagreement about the ocean.

### Comparison table

| Site (page) | Accessed (UTC) | Model / run | Morning | Midday | Afternoon / evening | Wind | What the headline number is |
|---|---|---|---|---|---|---|---|
| **Surfline** (Majanicho spot) | 18 Nov ~12:22 | LOTUS; run 18 Nov 00 UTC | 06h: **surf 2.4–3 m**; swells 1.6 m 16 s, 1.4 m 12 s, 0.4 m 13 s; 1529 kJ | 12h: **surf 1.8–2.4 m**; swells 1.7 m 15 s, 1.3 m 12 s, 0.4 m 13 s; 1465 kJ | 18h: **surf 1.8–2.4 m**; swell 2.2 m 14 s, 0.4 m 13 s; 1252 kJ | 10–12 kt (06h), 10–11 kt (12h), 9–11 kt (18h) | Surf height range at the spot (breaking-wave estimate, "waist to chest" style labels). Day summary for 19 Nov: **1.8–2.4 m** |
| **surf-forecast.com** (Majanicho) | 18 Nov ~12:20 | Issued 05:00 18 Nov (model not stated on the page) | AM: **wave 1.6 m**; primary swell 1.6 m NW 12 s; 1305 kJ (combined wave table: 1.6 m NNW 16 s) | PM: **1.5 m**; 1.5 m NNW 15 s; 1028 kJ | Night: **2.2 m**; 2.2 m NNW 15 s; 2318 kJ | 15 km/h NE (AM), 20 km/h NE (PM), 15 km/h ENE (night); cross-onshore | "Wave height", described as a "near shore open water" forecast. Breaking waves "will often be smaller at less exposed spots" |
| **Windfinder** (Fuerteventura Majanicho) | 18 Nov ~12:25 | GFS (per the page); updated 10:33, next 16:42 | 06h: **2.1 m** 16 s 327°; 09h: 2.1 m 16 s | 12h: **2.1 m** 15 s 327° | 15h: **2.0 m** 14 s 323°; 18h: 2.0 m 14 s | 06h 9 kt, gust 11, ~44°; 09h 10/12 kt; 12h 9/11 kt ~46°; 15h 12/13 kt ~57° | "Wave height (m)", not defined on the page (most likely total significant wave height, see Inferences) |
| **Open-Meteo marine API**, best_match (cross-check, not a surf site) | 18 Nov 12:21 | best_match (values match Météo-France MFWAM) | 07h: **Hs 2.10 m**, 13.5 s, 327°; swell 1.92 m | 10h: Hs 2.26; swell 2.16 | 13h: 2.32 / 2.28; 16h: 2.34 / 2.30 | Open-Meteo forecast: 2.5 kt (07h) → 6.3 (10h) → 9.5 (13h) → 9.6 kt (16h), NE→ENE (51°→76°) | `wave_height` = total significant wave height; `swell_wave_height` = swell partition only |
| Open-Meteo, **ECMWF WAM 0.25°** | same | ECMWF | 07h: Hs **2.02 m** 13.3 s 325° | 10h: 2.14; 13h: 2.22 | 16h: **2.24 m** 12.6 s | – | Total Hs (swell partition not returned) |
| Open-Meteo, **Météo-France MFWAM** | same | MF | 07h: Hs 2.10, swell 1.92 m 12.1 s 330°, wind sea 0.24 | 10h: 2.26 / 2.16 | 13h: 2.32 / 2.28; 16h: **2.34 / 2.30** | – | Total Hs and partitions |
| Open-Meteo, **NOAA GFS-Wave 0.16°** | same | NCEP GFS-Wave | 07h: Hs **1.88 m** 15.6 s; swell 1.50 m 11.8 s 307° | 10h: 1.92 / 1.50 | 13h: 1.90 / 1.46; 16h: 1.90 / **1.40** | – | Total Hs vs primary swell partition |
| Windguru | 18 Nov ~12:28 | – | **Not obtained** | – | – | – | WebFetch got only a "Loading..." page. In the browser, a consent wall offered "Accept all" with no reject option on its first layer, and I did not accept. A search for "Majanicho" found no spot. |
| Windy.com, Magicseaweed, Glassy.pro, Surfguru, Wannasurf/Surf-Report, Spotfav, Puertos del Estado, Copernicus | – | – | **Not accessed** | – | – | – | Not attempted, or JavaScript-only, within the time/tool budget. Magicseaweed now redirects to Surfline, so the Surfline row covers it. |

### Cited Findings
- Surfline Majanicho, 19 Nov: day summary "1.8-2.4m". Hourly: 6am surf 2.4–3 m, primary swell 1.6 m 16 s plus 1.4 m 12 s and 0.4 m 13 s, wind 10–12 kt, 1529 kJ. Noon 1.8–2.4 m, 1.7 m 15 s / 1.3 m 12 s / 0.4 m 13 s, 10–11 kt. 6pm 1.8–2.4 m ("FAIR"), 2.2 m 14 s / 0.4 m 13 s, 9–11 kt. Model "LOTUS", run "18 Nov 12am WET (18 Nov 00 UTC)". Friday 20 Nov is 2.4–3 m all day. Today (18 Nov) is 0.9–1.2 m, swell 1.1 m 9 s NW 311° + 0.5 m 15 s N 360°, wind 7 kt ENE — [Surfline Majanicho](https://www.surfline.com/surf-report/majanicho/584204204e65fad6a77096a2) (table view, read in the browser at 12:22 local/UTC). Swell directions for 19 Nov were not in the page text.
- surf-forecast.com Majanicho, 19 Nov: AM 1.6 m (primary swell 1.6 m NW 12 s), PM 1.5 m (NNW 15 s), night 2.2 m (NNW 15 s). Wind NE 15–20 km/h, issued "5 am 18 Nov 2026". The page says the forecast "is for near shore open water. Breaking waves will often be smaller at less exposed spots" — [surf-forecast.com six-day](https://www.surf-forecast.com/breaks/Majanicho/forecasts/latest/six_day)
- Windfinder Majanicho, 19 Nov: wave height 1.9–2.1 m all day, period 13–16 s, direction 314–327°, wind 7–12 kt from NE–ENE. Based on GFS, last update 10:33 — [Windfinder](https://www.windfinder.com/forecast/fuerteventura_majanicho)
- Open-Meteo marine API at 28.75 N, -13.94 W (grid point 28.79 N, -13.96 W), 19 Nov local time:
  - best_match total Hs rises from 1.60 m at 00h to 2.10 (07h), 2.26 (10h), 2.32 (13h) and 2.34 m (16h). The swell partition rises 1.14 → 2.30 m. Wind sea stays at 0.12–0.30 m.
  - ECMWF WAM total Hs: 2.02–2.24 m.
  - MFWAM total Hs: 2.10–2.34 m, swell 1.92–2.30 m.
  - GFS-Wave 0.16° total Hs: 1.88–1.92 m, but its swell partition is only 1.40–1.50 m (11.8 s, ~307–310°). Its total peak period is longer, 14–15.6 s.
  - The ncep_gfswave025 model returned all zeros (invalid).
  - [Open-Meteo Marine API](https://marine-api.open-meteo.com/v1/marine?latitude=28.75&longitude=-13.94&hourly=wave_height,swell_wave_height,wind_wave_height&models=ecmwf_wam025,meteofrance_wave,ncep_gfswave016&start_date=2026-11-19&end_date=2026-11-19)
- Observed/now-cast context for 18 Nov: Surfline puts current swell at 1.1 m 9 s NW. Open-Meteo puts 18 Nov midday Hs at about 1.16–1.22 m. Both agree that the swell builds overnight into 19 Nov — [Surfline](https://www.surfline.com/surf-report/majanicho/584204204e65fad6a77096a2); [Open-Meteo](https://marine-api.open-meteo.com/v1/marine?latitude=28.75&longitude=-13.94&hourly=wave_height&start_date=2026-11-17&end_date=2026-11-19)

### Inferences
- The sea state is consistent across sources: about 2.0–2.3 m total Hs offshore, mostly long-period NNW groundswell, light NE trade wind and little wind sea (≤0.3 m). The big spreads come from definitions:
  - GFS swell partition: ~1.5 m.
  - surf-forecast "wave height": 1.5–1.6 m by day.
  - Total Hs: 1.9–2.3 m.
  - Surfline surf face height: 1.8–3 m.
- Our app's "1.5 m swell" closely matches the GFS-Wave primary swell partition (1.40–1.50 m) and surf-forecast's daytime value (1.5–1.6 m). Our app's "2.5 m waves" sits slightly above the total significant wave height from ECMWF/MFWAM (2.0–2.34 m). It matches Surfline's surf (breaking face) height: 2.4–3 m at 06h and 1.8–2.4 m later.

## Q2. What does each displayed number represent, and which model is behind it?

### Takeaway
Surfline shows a modelled breaking-wave (surf) height range produced by its LOTUS system. surf-forecast.com shows a near-shore open-water wave height that equals its primary swell row. Windfinder shows GFS-based wave height, most likely total significant wave height. Open-Meteo gives total significant wave height and the swell/wind-wave partitions separately.

### Cited Findings
- Surfline labels the headline number "SURF" with a human-scale descriptor such as "Waist to chest". It lists swell components separately ("Model Forecast SWELL 1.1m 9s NW 311º") and credits the "LOTUS Model - our advanced surf forecasting system designed specifically for surfers". It also shows "NEARSHORE ENERGY 194kJ, 96% Swell 4% Windsea" alongside "OFFSHORE ENERGY 304kJ" — [Surfline Majanicho](https://www.surfline.com/surf-report/majanicho/584204204e65fad6a77096a2)
- On surf-forecast.com the "Wave height" row equals the primary swell height in every period (1.6/1.5/2.2 m). The page calls it a near-shore open-water forecast and says breaking waves are often smaller at less exposed spots. It does not name the model on this page — [surf-forecast.com](https://www.surf-forecast.com/breaks/Majanicho/forecasts/latest/six_day)
- Windfinder lists "Wave height (m)" from GFS without defining it on the forecast page — [Windfinder](https://www.windfinder.com/forecast/fuerteventura_majanicho)
- Open-Meteo `wave_height` is total significant wave height. `swell_wave_height` and `wind_wave_height` are the partitions, from ECMWF WAM, Météo-France MFWAM and NOAA GFS-Wave — [Open-Meteo Marine docs](https://open-meteo.com/en/docs/marine-weather-api)

### Inferences
- Windfinder's 2.0–2.1 m is closer to GFS total Hs (1.9 m) than to the GFS swell partition (1.5 m). That suggests Windfinder shows total significant wave height. This is not confirmed by a definition.
- surf-forecast's swell/wave value (1.5–1.6 m by day) is lower than the ECMWF/MF total Hs (2.0–2.3 m). It is close to the GFS swell partition, which suggests a GFS/WW3-type swell partition. This is not confirmed.
- Surfline's 2.4–3 m at dawn, with a 1.6 m 16 s primary swell plus a 1.4 m 12 s secondary, fits a breaking-height transform. Long-period swell shoals and breaks well above its open-ocean Hs, and Surfline adds the energy of the separate swell trains.

### Gaps
- I could not open Surfline's or surf-forecast.com's own FAQ pages defining "surf height" and "wave height" within the budget, so the definitions above come from the labels and notes on the forecast pages themselves.
- Windguru's definition is not verified for this location. Windguru publishes "wave" = significant wave height per model (GFS-Wave, ECMWF-WAM, ICON-wave), but the page could not be read.

## Q3. Does any site show ~2.5 m for 19 Nov, and which quantity is it?

### Takeaway
Yes. Surfline's surf height is 2.4–3 m at 06h and 1.8–2.4 m (day summary) later. The model total significant wave heights (ECMWF 2.0–2.24 m, MFWAM 2.1–2.34 m) reach about 2.3 m by afternoon. surf-forecast reaches 2.2 m only at night. No site shows 2.5 m as swell height.

### Cited Findings
- Surfline 06h surf 2.4–3 m, noon and 18h 1.8–2.4 m — [Surfline](https://www.surfline.com/surf-report/majanicho/584204204e65fad6a77096a2)
- MFWAM total Hs is 2.34 m and its swell is 2.30 m at 16h. ECMWF WAM is 2.24 m at 16h — [Open-Meteo](https://marine-api.open-meteo.com/v1/marine?latitude=28.75&longitude=-13.94&hourly=wave_height,swell_wave_height&models=ecmwf_wam025,meteofrance_wave,ncep_gfswave016&start_date=2026-11-19&end_date=2026-11-19)
- surf-forecast night value 2.2 m NNW 15 s — [surf-forecast.com](https://www.surf-forecast.com/breaks/Majanicho/forecasts/latest/six_day)

### Inferences
- If our app's "waves" field is total Hs from ECMWF or MFWAM, 2.5 m is slightly high: the daily maximum is about 2.3 m. It is plausible if the app takes a later hour, a different run, or a nearby grid cell. It is not explained by wind sea, which is only 0.1–0.3 m.
- If the "waves" field is a breaking/face-height estimate, 2.5 m matches Surfline.
- Either way, a 1.5 m swell next to 2.5 m waves mixes models or quantities. The GFS swell partition is 1.5 m while ECMWF/MF total Hs is 2.2–2.3 m, and MFWAM's own swell partition is already about 2.2 m. Checking which model and field feeds each number in our app is the likely resolution.

### Gaps
- None beyond the definition gaps noted under Q2.

## Q4. Nearby buoy observations (Puertos del Estado) for 17–18 Nov vs forecasts

### Takeaway
I did not obtain any buoy observations.

### Cited Findings
- None.

### Inferences
- The only proxy I have is the model now-cast: Surfline's current 1.1 m 9 s NW and Open-Meteo's ~1.1–1.3 m Hs on 17–18 Nov. These are model values, not observations.

### Gaps
- Puertos del Estado PORTUS (the Lanzarote/Fuerteventura and Gran Canaria buoys) was not accessed. It is a JavaScript application, and I ran out of tool budget.
- Copernicus Marine IBI/Global wave forecasts were not accessed. They require an account or toolbox.
- Windy.com, Glassy.pro, Surfguru, Wannasurf/Surf-Report and Spotfav were not accessed.
- Windguru was blocked by a consent wall that offered only "Accept all" on its first layer. I declined to accept it.
- A direct request to Surfline's JSON forecast endpoint was refused by the session's permission classifier, so Surfline values were read from the public web page in the browser instead.
