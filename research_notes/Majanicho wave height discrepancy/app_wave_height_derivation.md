# How Surf Journal derives the Majanicho "Wave" height for 2026-11-19 (and why it reads ~2.5 m when surf sites say ~1.5 m)

Method: read the app's code (read-only); fetched the exact Open-Meteo marine and weather requests the app builds for Majanicho on 2026-11-18 at about 13:20 local. Ran the app's own pure functions (`marineHour`, `windHour`, `deriveSeries`, `recommendSpotDay`, `recommendability`) on those responses with `vite-node` and `fake-indexeddb`. Nothing in `src/` or `context/` was modified. The script and its full output are in the scratchpad: `/private/tmp/claude-501/-Users-LucasD-Library-Application-Support-Claude-scratch-workspaces-10356c75-638b-4c5e-ab15-c1e1430ca707-8206ce31-7189-4c0b-a743-2bc8a0333e50-scratch-2026-11-12-e7fcb1/597688c2-893d-4327-a5af-80d16f4c8b5b/scratchpad/majanicho.ts` and `.../scratchpad/output.txt`. The raw JSON is in `.../scratchpad/data/marine.json` and `.../scratchpad/data/weather.json`.

Requests used (identical to what `fetchSeries` in `src/lib/openMeteo.ts` builds for this spot):
- Marine: `https://marine-api.open-meteo.com/v1/marine?latitude=28.770&longitude=-13.930&hourly=wave_height,wave_direction,wave_period,wave_peak_period,wind_wave_height,wind_wave_period,wind_wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,secondary_swell_wave_height,secondary_swell_wave_period,secondary_swell_wave_direction,tertiary_swell_wave_height,tertiary_swell_wave_period,tertiary_swell_wave_direction,sea_level_height_msl,sea_surface_temperature&timezone=auto&start_date=2026-11-19&end_date=2026-11-19&models=meteofrance_wave,ecmwf_wam,ncep_gfswave016,meteofrance_currents`
- Weather: `https://api.open-meteo.com/v1/forecast?latitude=28.770&longitude=-13.930&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m&timezone=auto&start_date=2026-11-19&end_date=2026-11-19&daily=sunrise,sunset&cell_selection=sea&models=ecmwf_ifs,icon_seamless,meteofrance_arpege_europe,gfs_seamless`

## Q1. Which value does the app show as "Wave", and which value does the size limit compare against?

### Takeaway
"Wave" is not Open-Meteo's `wave_height`. It is `Derived.hb`, an estimated breaking face height. The app computes it per swell train with the Komar–Gaughan formula (which grows with period), weights each train by swell-window exposure (0.7 for wind sea), combines the trains as a root-sum-square, and multiplies by a per-spot gain (0.77 for reefs). The Settings size limit compares against this same `hb`, rounded to 0.1 m. The "Swell" row shows something else entirely: the height of the most energetic offshore train, the number surf sites headline.

### Cited Findings
- `deriveHour` computes `hb` as follows. Per partition, `a = exposure(spot, p.dir) * p.weight` and `hb = breakingHeight(p.h, p.t) * a`; these are summed as squares, then `const hb = parts.length ? gain * Math.sqrt(hbSq) : null;` — [src/lib/conditions.ts:78-95](src/lib/conditions.ts)
- `breakingHeight` is Komar–Gaughan: `KG = 0.39 * Math.pow(G, 0.2)` and `return KG * Math.pow(t * h * h, 0.4);`, with `t` the PEAK period — [src/lib/conditions.ts:42-49](src/lib/conditions.ts). Numerically KG = 0.6157.
- Partitions are the hour's GFS-Wave trains (primary, secondary and tertiary swell plus wind sea). Wind sea gets weight 0.7. Only when no trains exist does the app fall back to total `waveH` — [src/lib/conditions.ts:71-75](src/lib/conditions.ts)
- `exposure()` is 1 within 55 % of `swellWindow` around `idealSwellDir`, then a cosine taper to 0 at the window edge — [src/lib/conditions.ts:51-59](src/lib/conditions.ts)
- Forecast table, row "Wave" (header tooltip "Estimated wave height at the spot: the face of the waves, from trough to crest"): plots and prints `c.derived.hb` to one decimal — [src/components/ForecastTable.tsx:242-270](src/components/ForecastTable.tsx). Legend: "Wave = estimated face height at the spot (the middle of a ±20 % range…); Swell = strongest train offshore (height and direction)" — [src/components/ForecastTable.tsx:429](src/components/ForecastTable.tsx)
- The "Swell" row uses `swellsOf(h)`, which picks the most energetic swell train by `trainsByEnergy` (energy 1.96·H²·Tp²) and shows its scaled height `t.h` — [src/components/surfGlyphs.tsx:110-116](src/components/surfGlyphs.tsx); [src/lib/conditions.ts:229-245](src/lib/conditions.ts). The Timeline does the same ("Wave" = `r.d.hb`; "Swell" = `swells[0].t.h`) — [src/components/Timeline.tsx:256-277](src/components/Timeline.tsx)
- The "Total sea" row (folded by default) shows raw MFWAM `waveH`, the only place Open-Meteo's combined `wave_height` appears — [src/components/ForecastTable.tsx:302-317](src/components/ForecastTable.tsx)
- The size badge and tooltip show `fmtSurfRange(hb)` = `hb × 0.8 … hb × 1.2` — [src/lib/format.ts:12-18](src/lib/format.ts); [src/components/ui.tsx:273-276](src/components/ui.tsx)
- Settings has no stand-alone "max wave height" field. The size limits are the skill profile's "Comfortable in" (`p.comfort`, C) and "Biggest caught" (`p.max`, M) — [src/components/SettingsPage.tsx:130-137](src/components/SettingsPage.tsx); [src/types.ts:17-22](src/types.ts) ("C: face height (m) you are comfortable in", "M: biggest face height (m) you have caught").
- `suitability()` compares `H = Math.round(d.hb * 10) / 10` (metres), with `M = Math.max(p.max, C * 1.2)`, against C and M — [src/lib/rating.ts:188-217](src/lib/rating.ts)
- The context docs confirm the design intent: "`Derived.hb` is a face height" — [context/domain/breaking-height.md](context/domain/breaking-height.md). They also note that surf-forecast.com's headline "Wave Height" is the strongest swell train's Hs, not a face height — [context/research/surf-metrics-spots-and-skill-model.md](context/research/surf-metrics-spots-and-skill-model.md), citing [surf-forecast.com Majanicho](https://www.surf-forecast.com/breaks/Majanicho/forecasts/latest/six_day)
- Open-Meteo's `wave_height` is "Wave height of significant mean, wind and swell waves", i.e. combined significant height — [Open-Meteo Marine API docs](https://open-meteo.com/en/docs/marine-weather-api)

### Inferences
- The user is comparing two different quantities. Surf sites' ~1.5 m is a significant height of one swell train (offshore Hs). The app's "Wave" is a modelled breaking face height that adds up all trains. The 2.2 m limit, set as "Biggest caught" (a face height), is checked against the second number.
- The app's "Swell" for this day is the scaled GFS primary train, 1.67–1.80 m (06:00–16:00) and 2.20 m from 17:00 when GFS merges the trains. The unscaled GFS primary is 1.46–1.54 m, which matches the "~1.5 m" from surf sites. The user's "~1.5 m swell" may come from an earlier model run or another screen; see Gaps.

### Gaps
- I could not see the user's actual profile (stage, comfort, max) or whether they have logged Majanicho sessions with an observed size. Their "2.2 m limit" is assumed to be "Biggest caught" (M = 2.2). Q5 shows why that is the only reading consistent with an outright exclusion at 2.5 m.

## Q2. Majanicho in the seed data, and which Open-Meteo grid cells it uses

### Takeaway
Majanicho is at 28.7493, −13.9332. It faces 0° (N), with an ideal swell of 340° and a ±70° window, a size range of 0.6–2.8 m, a reef break with gain 0.77, and three rated peaks. The app samples 2.5 km north of the spot, at 28.77, −13.93. Open-Meteo answers with the MFWAM cell at 28.7917, −13.9583 (open sea, ~3.5 km NW of the sample point) and the wind sea cell at 28.7873, −13.8857. No shelter or refraction factor exists: every swell between about 302° and 18° counts at 100 %.

### Cited Findings
- Seed entry: `lat: 28.7493`, `lon: -13.9332`, `facing: 0`, `idealSwellDir: 340`, `swellWindow: 70`, `minSize: 0.6`, `maxSize: 2.8`, `tide: 'mid'`, `breakType: 'reef'`, `bottom: 'reef'`, `level: 'intermediate'`, `power: 'punchy'`. Peak overrides: `inside-a {tide mid-high, minSize 0.8}`, `inside-right {tide mid-high, maxSize 1.9}`, `outside {tide all, minSize 0.8, maxSize 2.4}` — [src/data/seedSpots.ts:197-223](src/data/seedSpots.ts)
- There is no per-spot gain in the seed. It gets `DEFAULT_GAIN.reef = 0.77` ("Calibrated (seed 4) so heights from PEAK periods match what the earlier mean-period heights showed (+11 %)") — [src/data/seedSpots.ts:539-551](src/data/seedSpots.ts); [context/decisions/0011-gain-recalibration.md](context/decisions/0011-gain-recalibration.md)
- Your logged sessions can override the gain: `calibratedGain` takes the median of observed ÷ modelled `hb` over sessions at that spot that have an observed size, clamped to 0.3–2.5, and needs at least 2 such sessions — [src/lib/recommend.ts:62-81](src/lib/recommend.ts); used in `recommendSpotDay` at [src/lib/recommend.ts:244-245](src/lib/recommend.ts)
- Sample point: `samplePoint(spot, km = 2.5)` moves 2.5 km along `facing` and rounds to 2 decimals ("wave models mask cells that touch land") — [src/lib/geo.ts:71-75](src/lib/geo.ts); used by Explore and the forecast views through [src/hooks.ts:72-73](src/hooks.ts). For Majanicho: 28.7718, −13.9332, rounded to **28.77, −13.93**.
- Marine API response grid: `latitude 28.791664, longitude -13.958328`. Weather (cell_selection=sea): `28.787346, -13.885712`. Time zone Atlantic/Canary, UTC offset 0 — live responses from the URLs above (fetched 2026-11-18).
- The exposure core is 0.55 × 70 = 38.5°, so swells from 301.5° to 18.5° get exposure 1.0 — [src/lib/conditions.ts:52-58](src/lib/conditions.ts). All of this day's swells (306–316°, 327–329°, 0–2°) fall inside it: exposure 1.00 in every hour (script output).
- A regional "open North Shore" reference uses the same gain as Majanicho (`OPEN_GAIN = 0.77`, window 330 ± 90) — [src/lib/conditions.ts:38-40](src/lib/conditions.ts). So Majanicho is modelled as just as exposed as an open north-facing reef.
- The repo's own research says the model "treats every sample point as open ocean" and recommends a per-spot shelter factor. It cites surf-forecast's "too small" shares (Majanicho 14 % vs exposed reefs 2–5 %) and sources saying Majanicho inside needs about 2 m on the outside reefs — [context/research/local-surf-school-spot-knowledge.md](context/research/local-surf-school-spot-knowledge.md), citing [FuerteventuraPlayas](https://www.fuerteventuraplayas.com/es/spot/majanicho-inside/) and [surf-forecast](https://www.surf-forecast.com/breaks/Majanicho)
- Open-Meteo warns: "Accuracy at coastal areas is limited" and the data "is not suitable for coastal navigation". MFWAM runs at 0.08° (~8 km), ECMWF WAM at 9 km and GFS-Wave at 0.16° (~16 km) — [Open-Meteo Marine API docs](https://open-meteo.com/en/docs/marine-weather-api)

### Inferences
- Majanicho's wave height comes from an open-ocean cell several km offshore, with no nearshore transformation (refraction, shoaling over the reef shelf, sheltering by the coast to the west). The only spot-specific damping is the generic 0.77 gain, and the swell window passes 100 % of a WNW (306–316°) swell.

### Gaps
- Open-Meteo returns one `latitude/longitude` for the multi-model marine request (MFWAM's). The GFS-Wave 0.16° cell actually used for the trains is not reported separately, so I could not confirm its centre.

## Q3. Open-Meteo data the app uses for 2026-11-19 (06:00–19:00 local = UTC)

### Takeaway
The models disagree on the total sea: MFWAM 2.04–2.34 m, ECMWF WAM 1.74–2.02 m, GFS-Wave 1.88–1.92 m. MFWAM, the highest, is the one the app uses as its reference height. GFS-Wave splits the sea into a ~1.5 m / 11.8 s WNW (306–310°) primary, a ~1.0–1.16 m / 15–16 s NW (327–329°) secondary and a ~0.45 m / 13 s N tertiary. Wind sea appears only from 14:00 (~0.5 m / 3.5 s from NNE). Wind is light (11–17 km/h), turning from NE in the morning to E in the afternoon.

### Cited Findings
Source for every number below: the live marine and weather responses (URLs at the top), fetched 2026-11-18 ~13:20 local. Format: h (m) / T (s) / dir (°). MF swell periods are MEAN periods (Tm01) — [src/lib/openMeteo.ts:10-19](src/lib/openMeteo.ts). ECMWF WAM returned no partitions at this point, only total Hs and peak period.

| Local | Hs MFWAM | Hs ECMWF WAM | Hs GFS-Wave | MF swell1 (Tm) | MF wind sea | EC Tp total | GFS swell 1 (Tp) | GFS swell 2 (Tp) | GFS swell 3 (Tp) | GFS wind sea | Wind mean (km/h, from) | Wind spread (°) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 06 | 2.04 | 1.74 | 1.88 | 1.84/12.4/331 | 0.20/2.0 | 15.8 | 1.54/11.8/307 | 0.98/16.0/329 | 0.48/13.2/0 | 0 | 12.6 / 34 | 11 |
| 07 | 2.10 | 1.78 | 1.88 | 1.92/12.1/330 | 0.24/2.1 | 15.8 | 1.50/11.8/307 | 1.06/15.9/328 | 0.48/13.2/0 | 0 | 12.4 / 38 | 9 |
| 08 | 2.16 | 1.84 | 1.90 | 2.02/11.8/328 | 0.26/2.2 | 15.6 | 1.50/11.8/308 | 1.06/15.8/329 | 0.46/13.1/0 | 0 | 11.4 / 44 | 10 |
| 09 | 2.22 | 1.88 | 1.90 | 2.10/11.6/327 | 0.30/2.2 | 15.4 | 1.50/11.9/309 | 1.08/15.7/329 | 0.46/12.9/360 | 0 | 12.5 / 49 | 18 |
| 10 | 2.26 | 1.92 | 1.92 | 2.16/11.4/327 | 0.26/2.1 | 15.2 | 1.50/11.8/309 | 1.10/15.6/328 | 0.44/12.9/1 | 0 | 12.7 / 56 | 25 |
| 11 | 2.28 | 1.94 | 1.90 | 2.22/11.3/328 | 0.20/1.9 | 15.1 | 1.50/11.8/310 | 1.12/15.4/328 | 0.42/12.9/1 | 0 | 12.0 / 67 | 21 |
| 12 | 2.32 | 1.98 | 1.90 | 2.28/11.2/328 | 0.16/1.8 | 14.9 | 1.46/11.8/309 | 1.16/15.3/327 | 0.42/12.9/1 | 0 | 12.7 / 77 | 35 |
| 13 | 2.32 | 2.00 | 1.90 | 2.28/11.1/328 | 0.14/1.8 | 14.7 | 1.46/11.8/310 | 1.16/15.3/327 | 0.42/12.9/1 | 0 | 16.9 / 92 | 50 |
| 14 | 2.34 | 2.02 | 1.90 | 2.30/11.0/328 | 0.14/1.7 | 14.6 | 1.38/11.8/306 | 1.16/15.1/327 | 0.40/12.9/1 | 0.46/3.4/22 | 16.4 / 94 | 42 |
| 15 | 2.34 | 2.02 | 1.92 | 2.30/10.9/328 | 0.12/1.6 | 14.3 | 1.38/11.8/306 | 1.16/14.8/327 | 0.40/12.9/1 | 0.50/3.5/21 | 17.0 / 95 | 34 |
| 16 | 2.34 | 2.02 | 1.90 | 2.30/10.9/328 | 0.12/1.6 | 14.2 | 1.40/11.8/306 | 1.14/14.7/328 | 0.38/12.9/2 | 0.52/3.5/21 | 16.1 / 97 | 29 |
| 17 | 2.32 | 2.02 | 1.90 | 2.28/10.8/328 | 0.12/1.6 | 14.1 | 1.80/14.2/315 | 0.38/12.8/1 | – | 0.52/3.5/23 | 16.5 / 97 | 30 |
| 18 | 2.32 | 2.00 | 1.90 | 2.28/10.8/328 | 0.12/1.6 | 13.9 | 1.80/14.0/315 | 0.36/12.8/2 | – | 0.52/3.5/25 | 15.2 / 94 | 24 |
| 19 | 2.32 | 1.98 | 1.90 | 2.28/10.8/328 | 0.12/1.6 | 13.8 | 1.80/13.6/316 | 0.36/12.8/1 | – | 0.50/3.5/26 | 14.7 / 86 | 20 |

- Model spread of total Hs: MFWAM − ECMWF = +0.30 to +0.36 m. MFWAM − GFS = +0.16 to +0.44 m. MFWAM is 15–18 % above ECMWF and 9–23 % above GFS all day (table above).
- Sunrise 07:21, sunset 18:00 (weather response, daily).
- Which model the app takes for what: `waveH = hsMF ?? ec ?? gfs` (MFWAM first); trains from GFS-Wave; `waveTp` from ECMWF WAM — [src/lib/openMeteo.ts:106-140](src/lib/openMeteo.ts). Wind is the mean of four models over the sea — [src/lib/openMeteo.ts:159-190](src/lib/openMeteo.ts)

### Inferences
- The forecast on its own looks like a moderate WNW + long-period NW groundswell, ~1.5 m + ~1.1 m. Surf sites will headline the primary as ~1.5 m at ~12 s, which matches the user's report.

### Gaps
- These numbers are from the run available on 2026-11-18 ~13:20. The user's screen (~2.5 m) may come from an earlier run cached up to one hour ([src/lib/openMeteo.ts:270](src/lib/openMeteo.ts)), so small differences are expected.
- I did not fetch the other surf sites' numbers for this date. Another researcher may cover that.

## Q4. Reproducing the app's ~2.5 m, and which steps inflate it

### Takeaway
The app's own code on today's data gives `hb` = 2.56–2.86 m (shown 2.6–2.9 m; range 2.0–3.4 m) for 06:00–19:00. That is consistent with the user's ~2.5 m. Starting from the ~1.5 m primary swell, the number grows in four steps: (1) Komar–Gaughan turns 1.5 m Hs at 12 s into a 2.29 m breaking height (×1.5), and the 0.77 gain brings it back to 1.77 m. (2) Root-sum-square adding the long-period 15–16 s secondary and the tertiary, each also amplified by KG, raises it to 2.43 m (+37 %). (3) Scaling all GFS trains up to MFWAM's higher total Hs (×1.09–1.23) raises it to 2.56–2.86 m (+6 to +18 %). (4) Exposure is 1.0, so the spot's orientation and shelter remove nothing.

### Cited Findings
App derivation per hour (script output running the app's `marineHour` + `deriveSeries`; trains after scaling to MFWAM; per train: KG breaking height × exposure × weight):

| Local | MF Hs | scale (MF/GFS) | Train 1 → KG | Train 2 → KG | Train 3 → KG | Wind sea ×0.7 | RSS | × gain 0.77 = hb | Shown | Swell row |
|---|---|---|---|---|---|---|---|---|---|---|
| 06 | 2.04 | 1.09 | 1.67 m/11.8 s → 2.49 | 1.06/16.0 → 1.96 | 0.52/13.2 → 1.02 | – | 3.33 | **2.56** | 2.6 | 1.7 |
| 07 | 2.10 | 1.12 | 1.68/11.8 → 2.50 | 1.18/15.9 → 2.13 | 0.54/13.2 → 1.05 | – | 3.45 | **2.65** | 2.7 | 1.7 |
| 08 | 2.16 | 1.14 | 1.71/11.8 → 2.54 | 1.21/15.8 → 2.16 | 0.52/13.1 → 1.02 | – | 3.49 | **2.69** | 2.7 | 1.7 |
| 09 | 2.22 | 1.17 | 1.75/11.9 → 2.59 | 1.26/15.7 → 2.23 | 0.54/12.9 → 1.05 | – | 3.58 | **2.75** | 2.8 | 1.8 |
| 10 | 2.26 | 1.18 | 1.77/11.8 → 2.61 | 1.29/15.6 → 2.26 | 0.52/12.9 → 1.01 | – | 3.60 | **2.77** | 2.8 | 1.8 |
| 11 | 2.28 | 1.20 | 1.80/11.8 → 2.65 | 1.34/15.4 → 2.33 | 0.50/12.9 → 0.98 | – | 3.66 | **2.82** | 2.8 | 1.8 |
| 12 | 2.32 | 1.22 | 1.78/11.8 → 2.62 | 1.42/15.3 → 2.43 | 0.51/12.9 → 1.00 | – | 3.71 | **2.86** | 2.9 | 1.8 |
| 13 | 2.32 | 1.22 | 1.78/11.8 → 2.62 | 1.42/15.3 → 2.42 | 0.51/12.9 → 1.00 | – | 3.70 | **2.85** | 2.9 | 1.8 |
| 14 | 2.34 | 1.23 | 1.70/11.8 → 2.52 | 1.43/15.1 → 2.42 | 0.49/12.9 → 0.97 | 0.57/3.4 → 0.43 | 3.66 | **2.81** | 2.8 | 1.7 |
| 15 | 2.34 | 1.22 | 1.68/11.8 → 2.50 | 1.41/14.8 → 2.38 | 0.49/12.9 → 0.97 | 0.61/3.5 → 0.47 | 3.62 | **2.79** | 2.8 | 1.7 |
| 16 | 2.34 | 1.23 | 1.72/11.8 → 2.55 | 1.40/14.7 → 2.36 | 0.47/12.9 → 0.94 | 0.64/3.5 → 0.49 | 3.63 | **2.80** | 2.8 | 1.7 |
| 17 | 2.32 | 1.22 | 2.20/14.2 → 3.34 | 0.46/12.8 → 0.92 | – | 0.63/3.5 → 0.47 | 3.50 | **2.69** | 2.7 | 2.2 |
| 18 | 2.32 | 1.22 | 2.20/14.0 → 3.32 | 0.44/12.8 → 0.89 | – | 0.63/3.5 → 0.44 | 3.47 | **2.67** | 2.7 | 2.2 |
| 19 | 2.32 | 1.22 | 2.20/13.6 → 3.29 | 0.44/12.8 → 0.89 | – | 0.61/3.5 → 0.42 | 3.43 | **2.64** | 2.6 | 2.2 |

Step-by-step at 09:00 (the same pattern holds every hour):

| Step | What the code does | Value | Change |
|---|---|---|---|
| 0 | Surf-site headline: GFS primary swell Hs (unscaled) | 1.50 m @ 11.9 s, 309° | – |
| 1 | KG breaking height of that train, `0.6157·(T·H²)^0.4` ([conditions.ts:46-49](src/lib/conditions.ts)) | 2.29 m | ×1.53 |
| 1b | × reef gain 0.77 ([seedSpots.ts:544](src/data/seedSpots.ts)) | 1.77 m | ×0.77 |
| 2 | Add secondary 1.08 m @ 15.7 s (KG 1.99) and tertiary 0.46 m @ 12.9 s (KG 0.96) as root-sum-square of KG heights ([conditions.ts:85-95](src/lib/conditions.ts)), × 0.77 | 2.43 m | +37 % |
| 3 | Scale all GFS trains by MFWAM Hs / GFS Hs = 2.22 / 1.90 = 1.17 ([openMeteo.ts:115-123](src/lib/openMeteo.ts)) | 2.76 m | +13 % |
| 4 | Exposure for 309°, 329° and 360° vs ideal 340 ± 70 → 1.0, 1.0, 1.0 ([conditions.ts:52-58](src/lib/conditions.ts)) | 2.76 m | 0 % |
| – | Rounded for display and for the suitability check ([rating.ts:195](src/lib/rating.ts)) | 2.8 m | – |

Other numbers from the script:
- Without the MFWAM scaling (raw GFS trains), `hb` would be 2.25–2.44 m all day: ~2.4 m in the morning, which is the user's ~2.5 m. At 06:00 the scale is only 1.09, giving 2.56 m.
- KG ratio Hb/H for one train at gain 1: 1.49–1.53 at 11.8 s, 1.84 at 16 s, 1.97 for 0.52 m at 13.2 s. Smaller and longer-period trains are amplified more, because Hb ∝ H^0.8·T^0.4. Komar–Gaughan is Hb = 0.39·g^(1/5)·(T·H0²)^(2/5) with H0 the deep-water wave height, fitted to laboratory and field data — [Komar & Gaughan 1972, ICCE](https://doi.org/10.1061/9780872620926.067) (abstract via [Scilit](https://scilit.com/publications/c519f98275ffa892262a9da63d1d0575)); validity "within the constraints of calculating deep water wave characteristics, neglecting wave refraction and frictional effects" — summarised in a secondary source found via search ([Liu et al. 2011](https://data-ww3.ifremer.fr/BIB/Liu_etal_CE2011.pdf)). I did not read that wording directly.
- Root-sum-square of per-train KG heights vs KG of the combined sea: at 06:00, KG(combined 2.04 m, 13.3 s) = 3.07, against RSS of the trains = 3.33 (+8 %). The per-train split adds height on its own, because KG is concave in H (H^0.8).
- Wind sea (×0.7) adds almost nothing: 0.42–0.49 m of KG height in the afternoon, ~+1 % after RSS.
- `tDom` (energy-weighted peak period) is 13.0–14.0 s, which also fires the "Long-period groundswell (13 s peak): sets hit harder than the height suggests" reason — [src/lib/rating.ts:223-224](src/lib/rating.ts).
- The repo's history: decision 0011 cut default gains by 10 % (reef 0.85 → 0.77) when the app moved to peak periods, "so heights from PEAK periods match what the earlier mean-period heights showed". The gain is not calibrated against observed Majanicho surf — [context/decisions/0011-gain-recalibration.md](context/decisions/0011-gain-recalibration.md).
- Surf-forecast.com deliberately gives no breaking height, and Surfline's face-height ranges come from its LOTUS model calibrated against human reports. Both points are recorded in [context/research/surf-metrics-spots-and-skill-model.md](context/research/surf-metrics-spots-and-skill-model.md), citing [surf-forecast FAQ](https://www.surf-forecast.com/pages/faq) and [Surfline LOTUS](https://www.surfline.com/lp/whatsnew/features/lotus-swell-model).

### Inferences
- Ranked by effect on the 2.5 m:
  - (a) Surface vs face: the app converts Hs to a breaking face height, ×1.5 to ×1.85 per train before the gain. The user's 2.2 m limit and the surf sites' 1.5 m are on different scales.
  - (b) Multi-train RSS of KG heights: +37 % on top of the primary alone. This is the largest single increase over the "one swell" view, driven by the 15–16 s NW secondary that KG amplifies most.
  - (c) MFWAM reference height: +6 to +18 %. MFWAM is the highest of the three models today; ECMWF WAM is 0.3 m lower.
  - (d) No shelter or refraction: the 0.77 gain is generic, and exposure is 1.0.
- Not inflating: no max across models is taken (fixed MFWAM priority, not a max); periods are GFS peak periods, so no 1.3× mean→peak estimate is used this date (`tpEstimated` false); there is no per-spot gain above default (0.77 < 1). Session calibration is the only thing that could change the gain.
- If the user has ≥2 Majanicho sessions with an observed size, the gain would be their median ratio instead of 0.77. Its direction is unknown without their data.

### Gaps
- No ground truth for Majanicho's actual breaking height on 2026-11-19 exists yet. Whether ~1.5 m Hs really surfs at ~1.5 m or ~2.5 m face at Majanicho cannot be settled from code or model data alone.
- Komar–Gaughan's original paper was not read in full. Whether it is valid per spectral partition with Hs as input (rather than monochromatic H0) is an inference from the abstract and secondary sources.

## Q5. Confidence/uncertainty, how the limit is applied, and where Settings are stored

### Takeaway
The limit is a hard exclusion, not a penalty. When `suitability()` returns `unsuitable`, the hour's score is set to 0, and Explore ranks the spot at the bottom with a ✕ ("not for you"). With M = 2.2 m and stage ≤ 5, any hour with `hb` > 2.2 m is unsuitable. All daylight hours on 19 November are 2.6–2.9 m, so Majanicho scores 0 all day. Confidence (`sureness`) does not consider wave-height uncertainty or model spread, and never relaxes the size check. The ±20 % range is display-only.

### Cited Findings
- Size rules (`H` = `hb` rounded to 0.1 m; `M = max(p.max, 1.2·C)`): H ≤ 0.8C good; ≤ C ok; ≤ M "challenging" (or "stretch" with `wantsChallenge`); ≤ 1.15M → `st >= 6 ? 'challenging' : 'unsuitable'` ("Bigger than anything you've surfed"); above → `unsuitable` ("Well beyond your biggest waves") — [src/lib/rating.ts:205-217](src/lib/rating.ts)
- Extra flags: `H > 2.0 && st <= 5` → challenging ("Overhead sets") — [src/lib/rating.ts:218](src/lib/rating.ts). Per-peak `H > spot.maxSize * 1.15` → unsuitable for stage < 7 — [src/lib/rating.ts:226](src/lib/rating.ts). For Majanicho that is inside-right 1.9 × 1.15 = 2.19 m and outside 2.4 × 1.15 = 2.76 m.
- The worst status wins, and `factor: status === 'unsuitable' ? 0 : …` — [src/lib/rating.ts:258-273](src/lib/rating.ts). `recommendSpotDay` then sets `const score = r.suit.status === 'unsuitable' || sure.withheld ? 0 : pred.yhat;`, so even good past sessions cannot rescue an unsuitable hour — [src/lib/recommend.ts:257-260](src/lib/recommend.ts)
- Explore ranks unsuitable hours at `-1 + quality/100`, below every suitable spot, and marks them `✕` and "not for you" — [src/components/Explore.tsx:217](src/components/Explore.tsx), [src/components/Explore.tsx:261-270](src/components/Explore.tsx)
- Running `recommendSpotDay` on today's data:
  - Stage 5, C 1.5 or 1.8, M 2.2: every daylight hour 07–17 is `unsuitable`, score 0.00, at all three peaks. Reasons: "Well beyond your biggest waves: ~2.7–2.9 m vs 2.2 m", "Overhead sets…", "Long-period groundswell (13 s peak)…" (script output). The spot rating (quality, before suitability) is 2.5–3.8/10.
  - Stage-6 default profile (C 2.2, M 3.0): `challenging`, score 0.7–1.9. Inside-right is unsuitable all day (peak max), and outside is unsuitable 09–16 (hb > 2.76).
- `sureness()` uses spot knowledge level (local rules), wind-model direction spread ≥ 45° (down one level), `spot.dataNote` (down), and your sessions in similar conditions (up). Rating is withheld only for advanced/expert reefs at low tide with no tide source — [src/lib/confidence.ts:85-107](src/lib/confidence.ts). For Majanicho on 19 Nov the level is "high" except 13:00, which is "medium" because the wind spread is 50° (script output). Wave-model spread (MF vs EC vs GFS) is not an input anywhere.
- The ±20 % range (`hb × 0.8 … × 1.2`) is only formatted text — [src/lib/format.ts:12-24](src/lib/format.ts). The suitability check uses the central `hb` — [src/lib/rating.ts:195](src/lib/rating.ts)
- Storage: the profile (`comfort`, `max`, `stage` …) lives in the `Settings` record (`id: 'settings'`, field `profile`) in IndexedDB through Dexie (`db.settings`); `saveSettings()` patches it — [src/types.ts:348-361](src/types.ts), [src/db.ts:23-38](src/db.ts), [src/db.ts:71-125](src/db.ts). It is shown and edited in Settings under "Comfortable in" and "Biggest caught" — [src/components/SettingsPage.tsx:130-137](src/components/SettingsPage.tsx). Sessions marked "How did it feel?" can nudge C and M — [src/lib/skill.ts:232-271](src/lib/skill.ts)
- The repo's own research had already warned against hard steps: "Use ramps rather than hard steps at band edges, so that a 5 cm model change can no longer flip an hour from 'Right in your range' to zero" — [context/research/local-surf-school-spot-knowledge.md](context/research/local-surf-school-spot-knowledge.md)

### Inferences
- An outright exclusion at ~2.5 m with a "2.2 m" setting implies M = 2.2 and stage ≤ 5. If the 2.2 m were "Comfortable in", M would be at least 2.64 and the hour would be "challenging", not excluded.
- Because the check is a hard veto on one central estimate from the highest wave model, a 0.3 m model disagreement (MFWAM vs ECMWF) or the choice of combination method decides between "recommended" and "excluded". Model spread is not carried into the decision. Even the app's own lower bound (0.8 × 2.56 = 2.05 m) would fall under the 2.2 m limit at 06:00, yet it is ignored.

### Gaps
- I did not check whether any Majanicho local rule (`data/spotRules.ts`, e.g. the inside gates on regional size) changes the quality score on this day. It does not affect the suitability exclusion, which comes only from `hb` vs M.
