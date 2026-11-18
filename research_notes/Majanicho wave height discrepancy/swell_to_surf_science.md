# From offshore swell forecast to surfable breaking-wave height (and how far to trust global wave models near north Fuerteventura)

Research date: 2026-11-18. Tool budget was limited and several primary sources (Surfline Labs blog, BoM, Le Roux 2007 PDF, Komar & Gaughan 1972 PDF) returned HTTP 403 or empty bodies. Where a fact comes only from a search-result snippet of a source, it is marked "(snippet)". Worked numbers marked "computed" were calculated by the researcher from the cited formulas.

---

## 1. Definitions: combined Hs vs swell partition vs wind-sea partition, and why combined Hs can be much larger than "swell"

### Takeaway
"Wave height" in Open-Meteo (`wave_height`) is the significant height (Hs, ~mean of the highest third of waves, spectral Hm0) of the *whole* sea state. It combines the swell and wind-sea partitions in quadrature: Hs_total = sqrt(Hs_swell² + Hs_windsea² [+ Hs_swell2² + ...]). With a NE trade-wind sea of ~1.5–2 m on top of a 1.5 m NW swell, total Hs is ~2.1–2.5 m. A surf app that starts from total Hs (or adds the wind sea to the surf calculation) will show much bigger numbers than one that uses the swell partition only.

### Cited Findings
- Open-Meteo defines `wave_height`, `wind_wave_height`, `swell_wave_height` as "significant height of mean, wind, and swell waves" in metres, instantaneous values. Secondary swell is "only available for some models" and tertiary swell only for the GFS wave models. Directions are "the direction the waves come from" — [Open-Meteo Marine API docs](https://open-meteo.com/en/docs/marine-weather-api)
- NWS definition: seas = √(S² + W²), where S = swell height and W = wind-wave height. "When used, seas should be considered as being the same as the significant wave height" — [NWS Jacksonville marine glossary](https://www.weather.gov/jax/marine_glossary) (snippet); same formula on [OffshoreBlue](https://OffshoreBlue.com/wx/wx-wave-heights.php) (snippet).
- NWS: "Combined seas" may replace the swell + wind-wave pair "when the two cannot be clearly distinguished". Swell is usually the longer-period part (≥10 s), wind waves the shorter part (≤8 s) — [NWS directive 10-310](https://www.weather.gov/media/directives/010_pdfs/pd01003010w122003curr.pdf); [NWS ILM wave terminology](https://www.weather.gov/media/ilm/PDD%20Wave%20Terminology%2005072020.pdf) (snippets).
- Surf forecasting services use significant height, the mean of the highest third. Smaller waves are left out because they would give a misleading average — [Surf forecasting (Wikipedia mirror)](https://wiki.riteme.site/wiki/Surf_forecasting) (snippet).
- The CMEMS/Météo-France global wave product (MFWAM) outputs total Hm0, wind-wave Hs, primary-swell Hs and secondary-swell Hs as separate "spectral significant" heights, each with its own period and direction. "MFWAM uses partitioning to split the swell spectrum into primary and secondary swells" — [CMEMS QUID GLO-WAV-001-027, issue 3.2, Nov 2024](https://documentation.marine.copernicus.eu/QUID/CMEMS-GLO-QUID-001-027.pdf)
- surf-forecast.com: periods "under 9 seconds" usually come from local wind and are less likely to give good surf — [surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)

### Inferences
- Worked quadrature examples (computed): swell 1.5 m + wind sea 1.8 m → total 2.34 m; swell 1.5 m + wind sea 2.0 m → total 2.50 m; swell 1.0 m + wind sea 2.2 m → total 2.42 m. So a total "wave height" of about 2.5 m while the swell partition shows 1.5 m is what you would expect when there is a ~2 m NE trade-wind sea (common in the Canaries in autumn and winter). It is not an error in either number.
- Because squares add, the larger partition dominates. A 2 m wind sea "hides" a 1.5 m swell in the total. Partition heights cannot be added linearly, and the total cannot be compared directly with one partition.
- For a surf app, start from the swell partition(s) (height, peak period, direction), not from `wave_height`. Treat the wind sea as its own component that gets its own exposure filter and a much smaller surf multiplier.
- Partition labels depend on the model. A partition is "wind sea" if the local wind forces it. A trade-wind sea that has outrun its generating wind can be labelled "swell", typically with Tp 7–9 s and a NE direction. So the app should also classify partitions by period and direction, not only by the model label (see §4).

### Gaps
- I could not fetch the BoM page (403) that gives the same combination formula and the Hmax ≈ 1.8–2 × Hs relationship.
- I found no source on how Open-Meteo's "best match" chooses or blends models for `swell_wave_height` at a given point. The docs say only that it "provides the best forecast for any given location".

---

## 2. Breaking (face) height conversions used in practice

### Takeaway
No standard exists. Industry methods are proprietary. The best-known physics-based estimate is the Komar–Gaughan energy-flux formula, Hb = 0.39·g^0.2·(T·H0²)^0.4 (equivalent to ≈ 0.62·H0^0.8·T^0.4 in SI). For long-period groundswell it gives multipliers Hb/H0 of about 1.3–1.65, and about 1.1 for 6–7 s wind sea. Surfline's published rule of thumb is face ≈ 1.3 × deep-water swell height for 12–16 s swell at an average spot. The "Hawaiian scale" is about half of face height. The source rules and examples in this section are in feet or metres. Divergent displayed numbers come from three choices: which input is used (total Hs vs swell Hs), which multiplier (period-dependent or not), and which scale (face vs Hawaiian vs open-water Hs).

### Cited Findings
**Komar–Gaughan / energy-flux breaker formula**
- Komar & Gaughan (1972), "Airy Wave Theory and Breaker Height Prediction", ICCE 13 (DOI 10.9753/icce.v13.20). They apply Airy theory and conservation of wave energy flux, and get a breaker height of the form k·g^(1/5)·(H²T)^(2/5) — [scilit record](https://scilit.com/publications/c519f98275ffa892262a9da63d1d0575); [typeset/scispace](https://typeset.io/pdf/airy-wave-theory-and-breaker-height-prediction-c8qaq6jva3.pdf) (snippets; the full text could not be retrieved).
- Le Roux (2007, Coastal Engineering) states Hb = 0.39 g^0.2 (T H0²)^0.4 and attributes it to Komar (1998) — [Le Roux CE2007](https://data-ww3.ifremer.fr/BIB/LeRoux_CE2007.pdf) (snippet; PDF 403).
- A blog version of the same relation gives surf height = 0.62 × (swell height)^0.8 × (period)^0.4 — [breaking wave height (buymeacoffee)](https://buymeacoffee.com/72vxkvpm3/breaking-wave-height) (snippet). This agrees with 0.39·9.81^0.2 ≈ 0.616 (computed).
- A later review says the Komar–Gaughan formulation "adequately predicts the breaking wave height within the limits of deep-water inputs". Laboratory and field data showed "remarkable agreement" — [core.ac.uk review](https://core.ac.uk/download/235404257.pdf); [ASCE technical note](https://ascelibrary.com/doi/10.1061/%28ASCE%290733-950X%281984%29110%3A2%28276%29) (snippets).
- Breaking depth rule: a wave breaks at about Hb ≈ 0.78 × local depth (the breaker index) — [surfertoday](https://www.surfertoday.com/surfing/14099-what-is-the-hawaiian-wave-scale) (snippet).

**Worked Komar–Gaughan multipliers (computed, H0 = deep-water Hs of the component)**

| H0 (m) | T (s) | Hb (m) | Hb/H0 |
|---|---|---|---|
| 1.5 | 8 | 1.96 | 1.30 |
| 1.5 | 10 | 2.14 | 1.43 |
| 1.5 | 12 | 2.30 | 1.53 |
| 1.5 | 14 | 2.45 | 1.63 |
| 1.0 | 12 | 1.66 | 1.66 |
| 2.0 | 12 | 2.90 | 1.45 |
| 1.8 | 6 | 2.02 | 1.12 |
| 2.0 | 6 | 2.20 | 1.10 |
| 2.5 | 7 | 2.79 | 1.12 |

**Surfline**
- An older Surfline forecast-blog post says that for "most spots on an average ground swell with periods between 12-16 seconds, the surf face height will grow to be about 1.3 times the deepwater swell height – on the average". Longer periods give bigger surf, and deep offshore water or underwater canyons and seamounts change the local result strongly — [Surfline wave height scale blog post](https://www.surfline.com/surfline/forecasts4/forecast_blog_entry.cfm?id=22495&sef=true) (snippet; undated).
- Surfline uses swell height, period and direction to estimate an average surf height — [thebeginnersurfer.com](https://www.thebeginnersurfer.com/how-to-read-a-surf-forecast/) (snippet).
- Surfline's current LOTUS model is "specifically configured for surf", whereas "most forecast models you'll see are configured for deep water swell". Surfline says it validates LOTUS against satellites and buoys at more than 5,000 spots. Its team tunes the model by comparing historic forecaster observations of surf height with predicted breaking wave height, "to understand how off our model is, and for which swells we are under or over-calling". Its predecessor LOLA (2001) combined satellite data with bathymetry and nearshore buoy data — [Surfline: LOTUS swell model](https://www.surfline.com/lp/whatsnew/features/lotus-swell-model) (snippet).
- Surfline measures accuracy as mean absolute error against a "naive" forecast based on simple shoaling — [Surfline Labs: Surf Forecast Accuracy](https://medium.com/surfline-labs/surf-forecast-accuracy-b563605f104c) (snippet; page 403).
- Surfline admits misses, e.g. under-calling a Hurricane Erin swell in August 2025 — [Surfline forecast performance](https://www.surfline.com/lp/whatsnew/forecast-performance-updates) (snippet). One opinion piece (not an independent test) claims LOTUS heights became unreliable after its AI integration — [Golden Gate Xpress](https://goldengatexpress.org/113424/opinion/opinion-surfline-sucks-now/) (snippet).

**Other services and scales**
- surf-forecast.com: "The swell sizes are the open water wave height (measured peak to trough) close to the coastline". They are not breaking heights. "Breaking wave heights are strongly determined by the local sea bed geometry at each individual beach or reef." Long-period waves can "jack up to a greater size than their open ocean wave height would suggest". The site also gives wave energy (kJ) as a size guide: about 100 kJ is just surfable, 200–1,000 kJ is increasingly punchy, and 1,000–5,000+ kJ is heavy — [surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)
- StormSurf calculates surf height from primary swell height and period with a proprietary formula. The result is the average set wave at a theoretical break that has nothing to reduce or enhance the swell — [StormSurf buoy FAQ](https://www.stormsurf.com/buoy/mht/faqs.html) (snippet).
- Hawaiian scale: an 8 ft face is a 4 ft Hawaiian wave, i.e. about half the face height. Surfline shows face height by default except in some regions (e.g. Australia/NZ) — [thebeginnersurfer.com](https://www.thebeginnersurfer.com/how-to-read-a-surf-forecast/); [surfertoday Hawaiian scale](https://www.surfertoday.com/surfing/14099-what-is-the-hawaiian-wave-scale) (snippets).
- Folk conversion: "halve it and add two feet" (unsourced rule of thumb) — [surfresearch.com.au](https://surfresearch.com.au/awaveheight.html) (snippet).

### Inferences
- How 2.5 m vs 1.5 m can arise (computed): applying a groundswell-type multiplier (×1.3–1.5) to total Hs ≈ 1.9–2.3 m gives about 2.5–3.4 m "surf". Using the swell partition (1.5 m) as open-water height gives 1.5 m, as surf-forecast-style sites do. Komar–Gaughan on the swell partition alone at 10–12 s gives about 2.1–2.3 m face at a fully exposed spot.
- Suggested per-partition conversion for an app (design proposal built from the cited formulas, not an industry standard):
  1. For each partition i (swell1, swell2, wind sea): Hb_i = 0.62 · H_i^0.8 · T_i^0.4 (SI units, T = peak period), or equivalently Hb_i/H_i ≈ 0.56·(H_i/L0_i)^(-1/5) with L0 = gT²/2π (algebraic rearrangement, computed).
  2. Multiply by an exposure/direction factor E_i in [0,1] for the spot (§3).
  3. Combine as face_sig = sqrt(Σ (E_i·Hb_i)²), consistent with energy addition. Or use the maximum when one component clearly dominates.
  4. Report a range: lower ≈ 0.8×, upper ≈ 1.2× (set waves), and optionally the Hawaiian value ≈ 0.5 × face.
- Because Komar–Gaughan scales as T^0.4, going from 7 s to 14 s raises Hb by about 32% for the same H0 (2^0.4 = 1.32, computed). Period is a key input, and the wind sea's ~1.1× multiplier is much smaller than a groundswell's 1.4–1.65×.
- Komar–Gaughan assumes straight, parallel contours and full exposure. It does not include refraction focusing (reefs, canyons) or the energy loss on a wide shelf. A per-spot calibration constant is still needed, which is what Surfline does with forecaster observations.

### Gaps
- Surfline's current LOTUS surf-height equation is not public. I found no first-hand Surfline description of its spectral or per-spot method.
- I found no surf-forecast.com description of how it computes its breaking-wave-height figure. The FAQ describes only open-water swell sizes and energy.
- I could not confirm from the original 1972 text whether H0 means the significant height or an individual wave, or the exact data range. Komar–Gaughan was calibrated mostly on lab and beach data, not reefs.
- Coastal Engineering Manual shoaling tables (Ks vs h/L0) were not retrieved.

---

## 3. Exposure/shadowing, refraction, directional spread — Majanicho (N/NW-facing) receiving NW–N swell vs NE wind sea

### Takeaway
Surf services all say breaking height depends on local bathymetry and exposure, but none publishes its directional-reduction function. For a north-facing spot like Majanicho, NW–N groundswell is the main surf source. NE trade-wind sea arrives at an oblique angle, is partly blocked by Lanzarote and Lobos to the NE/E (geographic inference), and comes with wind that is cross-shore. It should add little to rideable surf. A cos^n-type directional window applied per partition is a reasonable, transparent approach, but it is a design choice, not a cited standard.

### Cited Findings
- "Breaking wave heights are strongly determined by the local sea bed geometry at each individual beach or reef." A 3 m swell can produce hollow waves at an exposed reef and smaller, crumbling surf at a nearby gentle beach — [surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)
- surf-forecast.com's advanced forecast notes cases where "the prevailing wind waves are blocked by a headland" — [surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)
- Surfline: deep water close offshore or underwater canyons and seamounts can strongly change local surf heights — [Surfline blog](https://www.surfline.com/surfline/forecasts4/forecast_blog_entry.cfm?id=22495&sef=true) (snippet).
- Surfline uses swell direction as an input along with height and period — [thebeginnersurfer.com](https://www.thebeginnersurfer.com/how-to-read-a-surf-forecast/) (snippet).
- In a 33-year Canary Islands hindcast (18 buoys, mean absolute percent error 8.6% in Hs), the authors link lower nearshore heights to island shadowing — [Wave energy assessment, 33-yr hindcast, Canary Islands (ResearchGate)](https://www.researchgate.net/publication/338421104_Wave_energy_assessment_based_on_a_33-year_hindcast_for_the_Canary_Islands) (snippet).
- In WAVEWATCH III, islands smaller than a grid cell are handled with "obstruction grids", which suppress energy flux across cell boundaries in proportion to the blocked fraction. Tolman (2003) found a "local but dramatic impact on model errors" — [Tolman, Ocean Modelling 2003](https://data-ww3.ifremer.fr/BIB/Tolman_OM2003.pdf); [Chawla & Tolman 2007](https://data-ww3.ifremer.fr/BIB/Chawla_Tolman_OM2007.pdf) (snippets).
- Coarse grids with obstruction grids reproduced the "systematic patterns of energy attenuation behind the islands" seen in high-resolution grids (Chawla & Tolman 2008). UOST (Mentaschi et al. 2020; WW3 ≥ v6.07) separates local dissipation from the downstream "shadow" of unresolved features — [Mentaschi et al. 2020](https://iris.unige.it/retrieve/e268c4cd-9666-a6b7-e053-3a05fe0adea1/2020_OD_menta.pdf); [Springer article](https://link.springer.com/article/10.1007/s10236-020-01410-3) (snippets).
- StormSurf's surf height is for a "theoretical break" with nothing to reduce or enhance the swell, so exposure is deliberately left out — [StormSurf](https://www.stormsurf.com/buoy/mht/faqs.html) (snippet).

### Inferences
- Geography (researcher's knowledge, verify on a map): Majanicho is on Fuerteventura's north coast and faces roughly N. Lanzarote lies about 10–15 km to the NE across La Bocaina strait, and Isla de Lobos is to the E/NE off Corralejo. So swell from about 290–010° has open fetch, while energy from about 030–070° crosses or is partly shadowed by Lanzarote and Lobos. A NE (030–045°) trade wind blows cross-shore from the right at a N-facing spot. That is not offshore, and it does not add well-organised surf.
- Proposed exposure factor (design choice, not cited): E(θ) = max(0, cos(θ − θ_spot))^n inside the spot's swell window, and E = 0 (or a small floor) outside it. Here θ_spot ≈ 330–360° for Majanicho, n ≈ 1–2 for swell (directional spread gives some wrap) and a higher n or extra sheltering coefficient for NE wind sea (e.g. 0.2–0.4). Then calibrate the factors against the user's own logged sessions. The surf journal is the right ground truth, in the same way that Surfline tunes LOTUS against forecaster observations.
- Refraction around the island tip (Punta de la Tiñosa / Corralejo) may let some NE energy wrap in at low amplitude, but short-period wind sea refracts less than long-period swell in deep water. Its contribution at a N-facing reef is likely small.
- Practical rule for the app: if a model's `swell_wave_direction` is NE and Tp < 9 s, treat it as trade-wind sea (old wind sea), even if the model labels it "swell".

### Gaps
- I found no published spot-specific study of wave transformation at Majanicho or along the north Fuerteventura coast (SWAN/nearshore), and no Puertos del Estado nearshore point validation for this coast.
- No surf service publishes its directional window or reduction formula. The cos^n proposal is the researcher's, not cited.

---

## 4. Accuracy of Open-Meteo marine sources (MFWAM, ECMWF WAM, GFS-Wave) near coasts and islands

### Takeaway
Offshore, global wave models are good: Hs scatter index is about 8–10% and bias a few cm against altimeters. Near coasts, errors roughly double or triple: scatter index about 19–24% and RMSE about 0.35 m at coastal buoys. The bias is larger along coastlines. Grid spacing is 8–25 km (ECMWF WAM 9 km since Nov 2025, MFWAM 0.08°, GFS-Wave 0.16°/0.25°), so the north Fuerteventura shelf, La Bocaina strait and Lobos are only crudely resolved. Whether a grid point next to the island is "sheltered" depends on how each model handles sub-grid obstructions. Partition-level fields (swell vs wind sea heights) are less reliable than total Hs. Of the partitions, the wind sea is the more reliably reproduced and swell is weaker.

### Cited Findings
**Open-Meteo model inventory (as of late 2026)** — [Open-Meteo Marine API docs](https://open-meteo.com/en/docs/marine-weather-api)
- MeteoFrance MFWAM: global, 0.08° (~8 km), 3-hourly, 10 days, updated every 12 h.
- ECMWF WAM: global, 9 km, hourly, 15 days, data from Nov 2025, updated every 6 h. ECMWF WAM 0.25: ~25 km, 3-hourly.
- NCEP GFS Wave 0.16°: 52.5°N–15°S (covers the Canaries at ~28.7°N), hourly, 16 days. GFS Wave 0.25°: global.
- DWD EWAM: Europe, 0.05° (~5 km), 78 h. DWD GWAM: global 0.25°, 174 h. ERA5-Ocean: 0.5°, reanalysis only.
- Docs warn "Accuracy at coastal areas is limited" (for currents and tides) and that sea level "can be reasonably accurate near unobstructed coasts". The `cell_selection` parameter defaults to `land`, and "sea prefers grid-cells on sea". For marine use, request `cell_selection=sea` so a coastal point is not mapped to a land or mixed cell.
- A GitHub issue reports that swell fields came back null with the default model selection but returned data with `models=ncep_gfswave025` — [open-meteo issue #1364](https://github.com/open-meteo/open-meteo/issues/1364) (snippet). So it is worth requesting each model explicitly.

**MFWAM (CMEMS GLOBAL_ANALYSIS_FORECAST_WAV_001_027)** — [CMEMS QUID issue 3.2, Nov 2024](https://documentation.marine.copernicus.eu/QUID/CMEMS-GLO-QUID-001-027.pdf)
- Grid: standard 1/10° (~10 km) output (dataset cmems_mod_glo_wav_anfc_0.083deg_PT3H-i). The V4 upgrade reduced resolution to 10 km and the minimum water depth from 10 m to 5 m. The model is forced by IFS-ECMWF winds, assimilates altimeters (Jason, Saral, CryoSat-2, Sentinel-3/6, CFOSAT SWIM, SWOT) and Sentinel-1 SAR spectra, has 24 directions × 30 frequencies (0.035–0.58 Hz), and splits swell into primary and secondary.
- Altimeter validation (HY-2B/2C, June 2022): average scatter index 7.9%, bias 3 cm. Bias is about 2, 2 and 5 cm at high, mid and tropical latitudes. "Overall, the bias is small and larger in coastal areas". The bias map range reaches 60 cm.
- "SI of SWH is smaller than 8% in open oceans and increases in the coastal areas. The bias is lightly positive and remains with values smaller than 10 cm" (SWIM validation, Jan–Mar 2020).
- NDBC buoys (Jan–May 2020): Hs bias 0.02 m, SI 13.8%. Peak period bias 0.33 s, SI 12.6%.
- French coastal buoys (Mar–May 2017, n = 10,177): V4 Hs bias 0.00 m, RMSD 19.4%, SI 19.4%, correlation 91.2% (V3: bias −0.03 m, SI 24%). The improvement was attributed to "better resolution in the upgraded system".

**CMEMS reanalysis (WAVERYS, MFWAM-based) open ocean vs coastal** — [CMEMS SQO GLO-001-032](https://documentation.marine.copernicus.eu/SQO/CMEMS-GLO-SQO-001-032.pdf); [Law-Chune et al. 2021](https://data-ww3.ifremer.fr/BIB/Law-Chune_etal_OD2021.pdf) (snippets)
- Open ocean: bias about 3 cm, RMS 22 cm, SI 8.5–8.8%. Coastal: bias −6 cm, RMS 37 cm, SI 22.2%. Another validation against buoys gives SI 20.7%, bias 6 cm, RMSD 34 cm.

**Canary Islands-specific**
- A Moroccan Atlantic study reports bias < 0.2 m and correlation ≈ 0.9 at a Canary Islands buoy — [MDPI JMSE 11(11):2159](https://www.mdpi.com/2077-1312/11/11/2159) (snippet).
- Lanzarote nested SWAN driven by ERA5 WAM: Hs bias ≈ −0.03 m, r = 0.91 vs buoy — [ScienceDirect, Lanzarote wave resource](https://www.sciencedirect.com/science/article/pii/S0960148123002768) (snippet).
- Canary Islands 33-yr hindcast: mean absolute percent error 8.6% in Hs over 18 buoys. Lower nearshore heights are linked to island shadowing — [ResearchGate](https://www.researchgate.net/publication/338421104_Wave_energy_assessment_based_on_a_33-year_hindcast_for_the_Canary_Islands) (snippet).
- A study used Puertos del Estado deep-water buoys near the islands for validation, but not of WAM itself — [ResearchGate AI forecasting](https://www.researchgate.net/publication/342019561_Forecasting_of_wave_energy_in_Canary_Islands_based_on_Artificial_Intelligence) (snippet).

**Unresolved islands / sheltering in coarse grids**
- WW3 handles sub-grid islands with obstruction grids, later automated from the GSHHS coastline. Without them, energy leaks through unresolved islands, and the obstruction grids "significantly reduce the bias" against ERS-2 altimetry — [Tolman 2003](https://data-ww3.ifremer.fr/BIB/Tolman_OM2003.pdf); [Chawla & Tolman 2007](https://data-ww3.ifremer.fr/BIB/Chawla_Tolman_OM2007.pdf) (snippets). UOST (WW3 ≥ 6.07) adds explicit downstream shadowing — [Mentaschi et al. 2020](https://iris.unige.it/retrieve/e268c4cd-9666-a6b7-e053-3a05fe0adea1/2020_OD_menta.pdf) (snippet).
- Another regional (Greek) WAM validation found the model overestimating heights, with the gap growing above about 2 m — [Semantic Scholar PDF](https://pdfs.semanticscholar.org/7df0/2d6fa4b82bb200885d102088406870cefd76.pdf) (snippet; a different region).

**Partition reliability (swell vs wind sea)**
- Bulk Hs can hide compensating partition errors. One configuration looked best on bulk stats despite "a substantial underestimation of wind sea, compensated with a substantial overestimation of swell". Partition quantities match well in direction and frequency, but "the magnitude and directional spread typically have larger discrepancies". Another study found "the performance for the swell part is lower than that of the corresponding wind sea" — [Hanson et al. 2009, JTECH (WaveMEDS)](https://data-ww3.ifremer.fr/BIB/Hanson_etal_JTECH2009.pdf); [Stopa et al. 2016](https://data-ww3.ifremer.fr/BIB/Stopa_etal_OM2016.pdf); [Ifremer archimer doc](https://archimer.ifremer.fr/doc/00280/39122/38300.pdf) (snippets; attribution of each quote to an exact paper is uncertain because results were aggregated).
- Partition classification commonly uses a wave-age criterion: a partition is wind sea only if the wind component along the wave direction forces it, and the rest is swell — same sources (snippet).

### Inferences
- For a grid point within one or two cells of north Fuerteventura (8–25 km cells), expect Hs errors closer to coastal statistics: SI about 20–25%, RMSE about 0.3–0.4 m at Hs ≈ 1.5–2.5 m. Differences of a few tenths of a metre between MFWAM, ECMWF WAM and GFS-Wave are within normal model error.
- Coarser models (GFS 0.25°, ECMWF 0.25°) are more likely to treat La Bocaina strait as open water, or to pick a cell whose NE exposure differs from the spot's. NE wind sea may then be over-represented at a "Majanicho" point that is really in Lanzarote's partial lee. The 8–9 km grids (MFWAM, ECMWF WAM 9 km) should do better, but still do not resolve the reef or the immediate shelf.
- None of these models gives nearshore, breaking-zone values. All are offshore boundary conditions. Pick a grid point a few km offshore in open water to the N/NW of the spot and apply your own exposure and breaker transformation, rather than trusting the nearest-to-coast cell.
- Because swell-partition magnitudes are the weaker part of model output, compare MFWAM, ECMWF and GFS swell partitions side by side. If they disagree by more than about 30%, flag low confidence.

### Gaps
- No published validation of Open-Meteo's ECMWF WAM 9 km (since Nov 2025) or GFS-Wave 0.16° specifically near the Canaries was found.
- No study quantifying Hs bias at grid points adjacent to Fuerteventura or Lanzarote (the island-blocking error at that location) was found. Puertos del Estado's own operational WAM/SWAN validation reports were not retrieved.
- It is unconfirmed whether ECMWF WAM or MFWAM use sub-grid obstruction schemes equivalent to WW3's obstruction grids or UOST.
- No quantitative swell-partition bias or RMSE was found for any of the three models.

---

## 5. Ensemble / model spread as an uncertainty measure

### Takeaway
ECMWF runs a coupled 51-member wave ensemble (ENS-WAM). It publishes probabilities (e.g. P(Hs ≥ 2/4/6/8 m)) and swell-partition fields, and studies find ensemble spread is a useful indicator of forecast uncertainty. At long lead times (~10 days) the ensemble tails lose skill. For an app, the multi-model spread (MFWAM vs ECMWF vs GFS) and, if available, ensemble spread are reasonable confidence indicators.

### Cited Findings
- ECMWF ENS-WAM (Set IV) gives ensemble wave products "providing an estimate of the reliability of a single forecast", including Hs in period bands, by swell partition, and probabilities such as "Significant wave height of at least 8 m %" — [ECMWF Set IV ENS-WAM](https://www.ecmwf.int/en/forecasts/datasets/set-iv) (snippet).
- The ECMWF ensemble has run since 1992 and has been coupled to WAM since 1998. ECMWF has started an operational data-driven AIFS ENS wave stream (listed 12 May 2026), whose `swh` is "Significant height of combined wind waves and swell" — [ECMWF AIFS ENS wave (Set XIII)](https://www.ecmwf.int/en/forecasts/datasets/aifs-forecast-aifs-ensemble-wave-set-xiii-aifs-ens-wave) (snippet).
- Met Norway validation: the spread of a regional wave ensemble "gives a good indication of the uncertainty of a deterministic forecast". Another report compared the ECMWF and Met Norway wave ensembles against buoys for 2007–2008 — [MET report 22/2008](https://www.met.no/publikasjoner/met-report/met-report-2008/_/attachment/download/e213f004-65b1-402b-b04e-245502aaf0e9:f571d712607465cd385577739a9160e487005d59/MET-report-22-2008pdf.pdf); [MET report 11/2011](https://www.met.no/publikasjoner/met-report/met-report-2011/_/attachment/download/bc44b09e-1e2b-4456-b638-a28bedbe896c:5e5a4ac710673c1f719ce4188fb56bd4637890de/MET-report-11-2011.pdf) (snippets).
- Breivik et al.: at +240 h, ensemble members of wind and waves are only weakly correlated with the outcome, and upper percentiles are "virtually uncorrelated" — [arXiv 1310.0943](https://ar5iv.arxiv.org/html/1310.0943) (snippet).

### Inferences
- App design: show the face-height estimate with a band from (a) the min/max across the deterministic models (MFWAM, ECMWF WAM, GFS-Wave) and (b) the 10th–90th percentile of ensemble members, if Open-Meteo exposes wave ensembles. Widen the band with lead time, and treat days 7+ as trend only.
- Add a fixed coastal-error floor of about ±20% (from the coastal SI of 19–24% above) even when the models agree. They share forcing (MFWAM is driven by ECMWF IFS winds), so agreement between them overstates confidence.

### Gaps
- The Open-Meteo marine docs page fetched did not list ensemble wave models. I could not confirm whether Open-Meteo serves ECMWF or GFS wave ensemble members through its ensemble API.
- No published spread–skill numbers for ECMWF ENS-WAM Hs (e.g. spread/RMSE ratio) were retrieved.
