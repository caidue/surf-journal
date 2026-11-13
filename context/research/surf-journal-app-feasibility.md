---
type: "Research Report"
title: "Surf journal app feasibility"
description: "Deep research before building: competitors, data APIs, spot data, similarity methods, stack, cost. Some feature ideas were later dropped (feel curves, per-peak segments)."
tags: ["research"]
sources:
  - resource: "reports/Surf journal app feasibility.md"
    id: "original"
    title: "Original report in the author's workspace"
researched: "2026-11-12"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Rivals cover seven features; your timeline ideas are new

**No existing app does what you describe**, but seven of your eleven features already ship, spread across at least six products. **Surfline** comes closest on the journal side: free manual session logging keeps the conditions of your session window, and "Forecast matches" flags upcoming forecasts that resemble those sessions. **SurfMap** comes closest on discovery: a skill-level map, a personal AI score and one daily "pick" of spot and time. Three features appear in no surf app we found. These are selecting your surfed window and inside/outside segments directly on a conditions timeline (2), drawing multi-category feel curves (3), and marking old sessions as no longer relevant (11). Free-text region search (7) exists only in part, and real web versions are rare in a market that is mostly iPhone-first. Matching your sessions against today's forecast (features 5, 9, 10) no longer sets an app apart: Surfline and at least five indie apps shipped it in 2025–2026. Building your version is realistic for one developer. Free CC-BY marine data (Open-Meteo, Copernicus) covers Fuerteventura well. Spots must be curated by hand, because open data names only three northern Fuerteventura breaks. Around that sits a MapLibre/PostGIS map, a rule-based skill score blended with a nearest-neighbour "analog" engine over your own sessions, and three custom touch components. It costs about **€0/month as a personal, non-commercial tool**, about **€70–85/month commercially up to ~1,000 users**, and roughly **8–12 full-time weeks** to an MVP. Per-peak segments and feel curves look like UX extras, but they are your real advantage: they produce time-resolved labels no competitor collects.

## Seven of eleven features exist, scattered across six apps

The table maps your list against the market as of November 2026. "Not found" means the feature did not appear in any listing, help page or release note across the more than 25 surf apps and forecast sites reviewed.

| # | Your feature | Verdict | Who does it today |
|---|---|---|---|
| 1 | Import conditions, show the day's timeline | **Exists** | Surfline, Swell Scope, Wave Day, Session and SurfMap attach model conditions to a logged session; LazySurfer uses NOAA buoys (US only) |
| 2 | Pick from–to on the timeline; split time by peak (inside/outside) | **Not found** | Surfline and Wave Day store a start/end window, but no app selects it graphically on the conditions chart or splits it by peak |
| 3 | Draw a 1–10 curve per category over the session | **Not found** | Swell Scope rates several categories as single values; Garmin asks for one post-activity effort number |
| 4 | Free notes plus predefined input fields | **Exists (commodity)** | Session (board, crew, rating, duration), Sessions.surf, Wax Journal, Surf Log |
| 5 | Remember entries by spot and conditions | **Exists** | Surfline (swell "fingerprint"), Swell Scope, LazySurfer, Wave Day, Session, SurfMap |
| 6 | Map of surf spots | **Exists** | SurfMap, Session, BreakFinder, Dawn Patrol, Sessions.surf |
| 7 | "Northern Fuerteventura" → spots, descriptions, current conditions | **Partial** | SurfMap destination guides, BreakFinder "Near me" (50 km), Surf-Forecast regional ranking; no free-text region query found |
| 8 | Recommendability by skill level | **Exists** | SurfMap (level changes hourly ratings); Surfline shows a static "Ability Level" per spot |
| 9 | Past sessions with conditions similar to today's | **Exists (crowded)** | Surfline Forecast matches, Swell Scope, LazySurfer Similarity Score, Wave Day |
| 10 | Recommend a spot from your own history | **Exists (small apps)** | Wave Day, SurfMap, Session; Surfline only within one spot |
| 11 | Mark old recordings as no longer relevant | **Not found** | Nearest: SurfMap ignores unrated sessions; LazySurfer retrains weekly |

### Surfline and SurfMap

**Surfline**, the incumbent, has moved firmly into your territory. Since about July 2025 you can "log every surf—no smartwatch required". The manual form takes date, location, a 1–5 star rating, start and end times, and notes, and each entry keeps "a record of ocean conditions from the time you surfed" ([Surfline release notes](https://www.surfline.com/lp/whatsnew/releases/jul-25)). Session logging and the personal journal are free; live cams need Premium ([Surfline support](https://support.surfline.com/hc/en-us/articles/56495860637467-Why-Surfline-Live-Cams-Require-a-Premium-Membership)). Since about October 2025, "Forecast matches" captures each session's swell-energy fingerprint. It then marks matching future forecast windows at that spot with a percentage match and a side-by-side comparison of surf height, swell, wind and tide ([Surfline](https://www.surfline.com/surf-news/new-find-forecast-windows-match-favorite-sessions/220707)). Surfline still works at session level: one star rating, typed times, and nothing on per-peak time or feelings over the session.

**SurfMap** covers the discovery and recommendation half. You tell it whether you are a beginner, intermediate or advanced surfer. "The AI adds a personal score that predicts how much you'll enjoy each hour", and "the map opens on one pick: the spot to surf, when to go and why". Its "destination guides show today's conditions next to what each spot needs". It covers 5,000+ spots, has a German interface, and costs $2.99/month, $15.99/year or $44.99 lifetime ([SurfMap App Store](https://apps.apple.com/gt/app/surfmap-your-surf-forecast/id6749829392?l=en-GB)).

### The journal-with-memory niche

Several smaller apps have also learned to "remember". Swell Scope promises that "next time the conditions are similar, you'll see your own ratings alongside the raw forecast data" ([App Store](https://apps.apple.com/us/app/-/id6747609653)). Its reviewers ask for exactly your features 6 and 10: a map overview, multi-spot comparison and a "best location for the day" ([Swell Scope](https://www.swell-scope.com/)). Wave Day stores the conditions of the exact session window and notifies you of "the spot, day and time that best match your own surfing history" ([App Store](https://apps.apple.com/app/wave-day/id6469349836)). LazySurfer's 0–10 Similarity Score relies on US NOAA buoys ([LazySurfer](https://lazysurfer.app/)), which makes it useless in the Canaries. Most of these apps have between 4 and 55 App Store ratings, so the niche is crowded with listings rather than with users.

### What is genuinely new

No surf app records time within a session by peak or by feeling. The nearest analogues come from other fields. Ski app Slopes auto-detects runs and lifts and lets users correct the segments in a timeline editor ([Slopes](https://apps.apple.com/ca/app/id643351983)), which is the right interaction model for feature 2. Garmin, typical of sports apps, asks for a single effort value after the activity ([Garmin manual](https://www8.garmin.com/manuals/webhelp/GUID-CF6857C0-CEF9-485F-B3B4-B8DC192FA66A/EN-US/GUID-75149D69-850F-4B21-80AF-825BDF3C3E6E.html)). A freehand "draw your intensity curve" input exists only as a psychology research tool ([MySocialBrain](https://mysocialbrain.org/drawem_info.html)). No app offers an explicit relevance flag or weighting by skill progression either. SurfMap's nearest equivalent is that "an unrated session no longer lowers your AI Session Rating" ([SurfMap](https://apps.apple.com/gt/app/surfmap-your-surf-forecast/id6749829392?l=en-GB)).

Two gaps matter for you specifically. Real web versions are rare: only Surfline, Sessions.surf and BreakFinder (file upload) offer one ([Sessions.surf](https://www.sessions.surf/); [BreakFinder](https://breakfinder.surf/en/features/session-tracking)). And nothing combines region entry, skill filtering and live conditions for Fuerteventura. Surf-Forecast ranks about 30 Fuerteventura breaks out of 10 with no skill level ([Surf-Forecast](https://www.surf-forecast.com/regions/Fuerteventura)), while a local site filters spots by skill on a map but shows no forecasts ([Fuerteventuraplayas](https://www.fuerteventuraplayas.com/en/?p=2653)).

### Before you build

Try Surfline's free logging and SurfMap for a few weeks. If they cover your needs, you are done. If they don't, the gap is specific and defensible. The main adoption risk is **logging friction**. Competitors advertise 30–60-second logs. A 2026 roundup of surf apps found that community apps fail to keep their users, and that some surfers prefer a paper journal ([The Wipeout Weekly](https://thewipeoutweekly.com/do-we-even-need-surf-apps-roundup/)). A brush, segments and several drawn curves must be quick to enter, or users will not finish logging.

## Open-Meteo and Copernicus feed the timeline; surf sites are off-limits

"Import from other websites" cannot mean scraping the surf sites. Surfline has no public API. Its terms ban "any robot, spider, scraper or other automated means" and limit use to "your own internal, personal use" ([Surfline Terms](https://www.surfline.com/terms-of-use)). Hobby apps that used its undocumented endpoints have been blocked ([Tidbyt forum](https://discuss.tidbyt.com/t/procedure-for-api-blocking-tidbyt-servers/5107)). Magicseaweed's API died when Surfline shut MSW down in 2023 ([meta-surf-forecast](https://github.com/swrobel/meta-surf-forecast)), and that took at least one open-source surf journal down with it ([oceanRidersJournal](https://www.github.com/kb0rg/oceanRidersJournal)). Windfinder's terms say "the data may not be used for own software, apps, websites" ([Windfinder T&C](https://windfinder.com/contact/terms)), and Surf-Forecast requires a licence for any commercial use ([Surf-Forecast terms](https://surf-forecast.com/pages/terms)). Under the CJEU's *Ryanair v PR Aviation* ruling, such terms are enforceable by contract even where no database right exists ([Kluwer Copyright Blog](https://legalblogs.wolterskluwer.com/copyright-blog/ryanair-ltd-v-pr-aviation-bv-contracts-rights-and-users-in-a-low-cost-database-law/)). The workable design is open model data plus deep links out to those sites.

| Source | What you get for Fuerteventura | History | Cost | Verdict |
|---|---|---|---|---|
| Open-Meteo Marine + Archive | Hourly swell partitions, wind sea, SST, sea level incl. tide | Partitions from ~Nov 2021; ERA5 total wave and wind back to 1940 | Free non-commercial; 29/month (1M calls) or 99/month (5M, needed for historical APIs) commercial | **Default**, CC BY 4.0 ([pricing](https://open-meteo.com/en/pricing)) |
| Copernicus Marine IBI | 1/36° (~3 km) hourly waves with primary/secondary swell, 10-day forecast; domain reaches 26°N | ~2-year rolling archive; WAVERYS reanalysis from 1980 at 0.2° | Free with registration | **Best resolution**, but you ingest NetCDF yourself ([CMEMS IBI](https://data.marine.copernicus.eu/product/IBI_ANALYSISFORECAST_WAV_005_005/description)) |
| Stormglass | Waves, swell, wind and tide in one call | ERA5 with swell partitions from 2014, ≤10 days per request | €19–129/month; commercial use from Medium (€49) | Simplest second source ([pricing](https://stormglass.io/pricing/)) |
| Windy Point Forecast | Wave models, no ECMWF waves | None | €990/year | Avoid ([pricing](https://api.windy.com/point-forecast/pricing)) |
| FES2022 tides via pyTMD/pyFES | Astronomical tide for any date | Unlimited | €0 | **Best tide option** ([AVISO](https://www.aviso.altimetry.fr/en/data/products/auxiliary-products/global-tide-fes.html)) |
| WorldTides | Tide predictions | — | From $4.99/month, licensed per end user | Website plans exclude login web apps ([WorldTides](https://www.worldtides.info/developer)) |

### Open-Meteo

Open-Meteo gives the most data per euro. It returns hourly wave, swell and wind-wave height, direction and period, a secondary swell from some models, SST, and "sea level height including tides", across ten wave models from global MFWAM (~8 km) to ECMWF WAM (9 km) and GFS-Wave 0.16° ([Open-Meteo Marine docs](https://open-meteo.com/en/docs/marine-weather-api)). The free tier (10,000 calls/day) is **non-commercial only**, and anything with subscriptions or ads counts as commercial ([Open-Meteo terms](https://open-meteo.com/en/terms)). Paid plans cost 29 per month (Standard, 1M calls) or 99 per month (Professional, 5M calls). Sources disagree on whether these prices are in dollars or euros ([Open-Meteo Substack](https://openmeteo.substack.com/p/api-subscriptions-for-commercial); [KI-Syndikat](https://www.ki-syndikat.de/tools/open-meteo/)).

### What live tests at El Cotillo showed

Live queries at El Cotillo on 12 November 2026 settled three practical questions. First, the swell-partitioned archive starts around **November 2021**: June 2021 returns nulls, November 2021 returns full data ([live query](https://marine-api.open-meteo.com/v1/marine?latitude=28.69&longitude=-14.03&hourly=wave_height,swell_wave_height,swell_wave_period,wind_wave_height&start_date=2021-11-01&end_date=2021-11-01)). Before that, ERA5-Ocean gives only total wave height, period and direction ([live query](https://marine-api.open-meteo.com/v1/marine?latitude=28.69&longitude=-14.03&hourly=wave_height,swell_wave_height,wind_wave_height,sea_surface_temperature&start_date=2015-03-10&end_date=2015-03-10&models=era5_ocean)), while hourly ERA5 wind and gusts work for any past date ([live query](https://archive-api.open-meteo.com/v1/archive?latitude=28.69&longitude=-14.03&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&start_date=2015-03-10&end_date=2015-03-10&wind_speed_unit=kn)).

Second, the choice of grid point is critical. For the same hour, GFS-Wave 0.25° returned **0.0 m**, because it treats that coastal cell as land, while GFS-Wave 0.16° returned 2.82 m ([live query](https://marine-api.open-meteo.com/v1/marine?latitude=28.69&longitude=-14.03&hourly=wave_height,swell_wave_height&models=ncep_gfswave016,ncep_gfswave025&forecast_days=1)). Third, the models that worked ranged from 2.82 to 3.28 m ([live query](https://marine-api.open-meteo.com/v1/marine?latitude=28.69&longitude=-14.03&hourly=wave_height,swell_wave_height,sea_level_height_msl,sea_surface_temperature&models=ewam,gwam,meteofrance_wave,ncep_gfswave016,ncep_gfswave025,ecmwf_wam025,meteofrance_currents&forecast_days=1)). Every spot therefore needs a hand-picked offshore sample point stored in your database, rather than its beach coordinates.

### Copernicus and tides

Copernicus Marine is the higher-resolution option for the Canaries. Its IBI wave product runs at 1/36°, hourly, twice daily, over a domain (26°N–56°N) that includes Fuerteventura ([CMEMS IBI](https://data.marine.copernicus.eu/product/IBI_ANALYSISFORECAST_WAV_005_005/description)). The licence is free and perpetual, permits derivative works "for any purpose", and requires the credit "Generated using E.U. Copernicus Marine Service Information" ([CMEMS licence](https://marine.copernicus.eu/user-corner/service-commitments-and-licence)).

For tides, compute astronomical tides yourself with FES2022 (AVISO says the heights are available "for all uses", with attribution) through the MIT-licensed pyTMD ([pyTMD](https://pytmd.readthedocs.io/en/latest/getting_started/Getting-Started.html)). That gives unlimited past and future tides at zero marginal cost. Open-Meteo's sea level is a simpler fallback, but it only goes back to January 2022 and is measured from mean sea level. Puertos del Estado runs a tide gauge on Fuerteventura's east coast ([Puertos REDMAR](https://bancodatos.puertos.es/BD/informes/INT_3.pdf)). Its download conditions forbid passing data to third parties ([Puertos INT_1](https://bancodatos.puertos.es/BD/informes/INT_1.pdf)), so use it only to check your model internally.

### Snapshot instead of backfilling

The cheapest timeline strategy is to **snapshot hourly data for every tracked spot as it happens**. When a session is logged, copy that slice into the session record. Call the archive only for retroactive sessions, and store the model, grid point and resolution so users can see that pre-2021 data is coarser. This builds your own archive for free, and most sessions never need a historical API call.

### From offshore swell to surf height

Turning offshore swell into surf height at the spot is where the big forecasters invest. Surfline's LOTUS model blends bathymetry with machine learning, and a spot-level retune cut its height error from 1.56 ft to 0.51 ft ([Surfline forecast updates](https://www.surfline.com/lp/whatsnew/forecast-performance-updates)). An indie app gets most of that value with three pieces: a swell-direction window per spot, the Komar–Gaughan breaker-height relation Hb/H0 = 0.56 (H0/L0)^(−1/5) ([breaker height paper](https://typeset.io/pdf/airy-wave-theory-and-breaker-height-prediction-c8qaq6jva3.pdf)), and a per-spot gain factor calibrated from your own logged "actual size" observations. Store raw model values and recompute derived heights on the fly, so formula improvements apply to old sessions too.

## Open data names only three northern Fuerteventura breaks

There is no open, properly licensed global database of surf breaks with surf attributes. In OpenStreetMap, `sport=surfing` appears on 1,283 objects worldwide, many of them shops and schools, and the attribute key `surfing` has just six uses ([taginfo](https://taginfo.openstreetmap.org/api/4/tag/stats?key=sport&value=surfing)). An Overpass query over Fuerteventura returned only **three named northern breaks**: El Muelle, Mejillones and El Charco de Bristol, with no attributes beyond a name. Rocky Point, Majanicho, El Hierro, Lobos, El Cotillo, Glass Beach and Generoso are all missing ([Overpass API](https://overpass-api.de/api/interpreter)). Wikidata holds five surf-break items worldwide, none in Spain ([Wikidata Query Service](https://query.wikidata.org/sparql)). Wannasurf lists 36 Fuerteventura spots with type, direction and experience level, but marks them "All right reserved" and allows its GPS files "ONLY for your personal use" ([Wannasurf](https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/index.html)). Stormrider's 4,500 spots appear on Windy under a commercial arrangement with no reuse licence ([Windy Community](https://community.windy.com/topic/7810/4-500-surfing-spots-round-the-world-directly-on-windy-forecast-map)). That leaves a hand-curated seed for each region: facts written in your own words from several sources, coordinates you digitise yourself, and user-added spots and sub-peaks treated as first-class data.

### Worked example: northern Fuerteventura

About 20 north-shore breaks are documented across [Planet Surf Camps](https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura), [vvanat.fr](https://vvanat.fr/blog/carte-spot-surf-corralejo/), [The Surf Atlas](https://thesurfatlas.com/surfing-in-canary-islands/fuerteventura-surf/), [Surf-Forecast](https://www.surf-forecast.com/breaks/Majanicho) and [Fuerteventuraplayas](https://www.fuerteventuraplayas.com/en/?p=7874). The sources often disagree, which is why spots need sub-peaks and a confidence flag.

| Spot → peaks | Break | Tide | Level (sources) | Data problem |
|---|---|---|---|---|
| Rocky Point → Inside / Outside ("Bajo del Medio") | Reef, lefts and rights | High | Inside all levels; outside intermediate/longboard | Offshore wind given as S, SW or W/NW depending on source |
| Majanicho → Inside A-frame / Inside right / Outside | Reef/point | All tides vs high | Intermediate | Offshore S (Surf-Forecast) vs E (camp guides) |
| El Hierro → Derecha de los Alemanes / La Izquierda / The Bubble | Reef | Low / all / mid–high | Advanced; Bubble experts only | Some guides merge Bubble and Hierro |
| El Muelle | Reef, left | Low–mid | Advanced | One of three with OSM coordinates |
| Bristol | Reef, mainly left | Mid vs high | Advanced | Tide conflict |
| Mejillones | Reef, lefts and rights | High | Experts only | Wannasurf flags a name/location mix-up with La Caleta |
| Generoso | Lava reef, left | High | "All levels" per camp guides | Label contradicts power, rocky entry and currents |
| Lobos | Reef/point right, up to ~400 m | Low–mid | Expert | Ferry access, localism |
| El Cotillo → Piedra Playa / Spew Pits | Beach / reef | All / — | Beginner in small summer swell / expert | One "spot", two very different waves |

Three rules follow from the table. Model spots as **region → spot → peak**, which your inside/outside feature needs anyway. Compute the offshore wind direction from the coastline's orientation rather than from source text. And treat surf-school level labels as optimistic, combining them with bottom type and hazards. Stormrider's field set makes a good template: minimum surfable and maximum safe swell size, swell window, bottom, tide, optimal wind and wave type. Add aliases, sources and a confidence value.

### The map

For the map, **MapLibre GL JS** (BSD-3) has clustering built into GeoJSON sources ([MapLibre](https://github.com/maplibre/maplibre-gl-js); [cluster example](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/)). Two tile options cost nothing: **OpenFreeMap** serves OSM vector tiles with no key and no fees ([OpenFreeMap](https://openfreemap.org)), and you can self-host **Protomaps PMTiles** on object storage ([Protomaps](https://docs.protomaps.com/)). MapTiler's free tier (5,000 sessions a month) is aimed at non-commercial use, and its paid Flex plan costs $30 ([MapTiler pricing](https://www.maptiler.com/cloud/pricing/)). Don't use tile.openstreetmap.org in production, since access "may be blocked without notice" ([OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/)). Colour each spot marker by its current recommendability for the user's level, and draw wind and swell arrows as rotated symbols.

### Turning "northern Fuerteventura" into an area

Region search becomes a geometry problem once the phrase is split into place and modifier. Nominatim returns Fuerteventura as relation 2214682, latitude 28.04–28.77 ([Nominatim](https://nominatim.openstreetmap.org/search?q=Fuerteventura&format=jsonv2&limit=2)). The municipality of **La Oliva** (relation 340785, latitude 28.563–28.766) is a natural definition of "north" ([Nominatim](https://nominatim.openstreetmap.org/search?city=La+Oliva&county=Las+Palmas&country=Spain&format=jsonv2&limit=3)). Buffer that polygon 1–2 km out to sea, because reefs sit offshore, and cache it permanently.

The public Nominatim server allows one request per second, forbids autocomplete and requires caching ([Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/)). For autocomplete, self-host Photon (about 95 GB of disk) ([Photon](https://github.com/komoot/photon)), or use OpenCage, which allows results to be stored permanently, from €45/month ([OpenCage](https://opencagedata.com/pricing)). An LLM helps only to parse messy phrasing such as "the windy side of Lanzarote"; it should never produce coordinates. Spots go in Supabase's PostGIS as `geography(Point)` with a GiST index. That one index serves "near me" (nearest-neighbour `<->`), map-viewport (`&&`) and region (`ST_Intersects`) queries ([Supabase PostGIS](https://supabase.com/docs/guides/database/extensions/postgis)).

## A rule score plus your own analogs powers features 8–11

### Skill-level recommendability starts from forecaster logic

Surf-Forecast rates from 1 to 10, "based on swell size and character (bigger the swell and longer the period the higher the rating)". With onshore wind the rating "drops in proportion to the wind speed", and very strong wind from any direction scores 0. Its energy scale calls 100 kJ "just about surfable" and 1,000–5,000+ kJ "really heavy and even dangerous" ([Surf-Forecast FAQ](https://www.surf-forecast.com/pages/faq)). Surfline's default ratings come from model surf height and wind, run through machine learning trained on 35 years of observations. They are **relative to each spot's potential**, and tide enters only through human forecasters ([Surfline support](https://support.surfline.com/hc/en-us/articles/36277684017819-Surf-Ratings-Colors)). Your engine should include tide, because Fuerteventura's reefs are tide-sensitive: El Muelle works at low–mid tide, Rocky Point at high.

Multiply interpretable factors so that one fatal flaw kills the score:

```
Quality Q   = 10 × f_size × f_swell_direction × f_period × f_wind × f_tide     (relative to the spot)
Suitability = hard gates by level: breaking height, bottom type, hazards, spot level label as a ceiling
Recommend   = Q × Suitability(level)
```

Size thresholds by level come only from blogs (e.g. beginners at roughly 0.3–1 m, per [climeradar](https://climeradar.com/blog/mastering-surf-forecasts-beginners-guide)); no authoritative body publishes them. Surf science names wave height and peel angle as the two variables that set the skill a wave demands ([Hutt, Black & Mead 2001](https://bvbvf1.bib-bvb.de/vufind/PrimoRecord/cdi_jstor_primary_25736206)).

### Finding similar past sessions is an analog-forecasting problem

The meteorological "analog ensemble" finds the closest past situations using a weighted, standardized Euclidean distance over a short time window ([Delle Monache et al. 2013](https://doi.org/10.1175/MWR-D-12-00281.1)). Fewer, well-chosen variables beat many. In one wind study, an equal-weighted analog over many variables did about **31% worse** than the raw model, while a tuned five-variable version **improved** on it by 7.6% ([Hu et al. 2021](https://ar5iv.labs.arxiv.org/html/2103.04530)). Van den Dool showed that the archive needed to find a good analog grows roughly exponentially with the number of dimensions matched ([van den Dool 1994](https://doi.org/10.3402/tellusa.v46i3.15481)).

A personal archive of 50–300 sessions therefore supports about five engineered, spot-relative features. They are effective swell energy (H²T, counting only swell inside the spot's window), energy-weighted period, swell angle relative to the ideal, onshore/offshore and cross-shore wind components, and tide height and phase. Encode tide phase as sin/cos so rising and falling tides stay distinct. Match session-hours rather than whole sessions, with a ±1 h window. Skip dynamic time warping, because tide timing is the very signal you want to keep. At a few thousand rows per user, computing this in application code takes milliseconds; pgvector only pays off for community-scale search ([pgvector](https://github.com/pgvector/pgvector)).

### Personal recommendations shrink toward the rule score

Kernel-weighted nearest neighbours with a Bayesian pseudo-count is exact, explainable and needs no training. With zero similar sessions it returns the rule score; with ten close analogs your own history dominates. This is the classic logic of partial pooling ([Efron & Morris 1975](https://doi.org/10.1080/01621459.1975.10479864)):

```
weight_i  = similarity_kernel(distance_i) × decay(age_i) × [not excluded_i] × skill_epoch_factor_i
predicted = (n0 × rule_score + Σ weight_i × rating_i) / (n0 + Σ weight_i)        n0 ≈ 2–3 virtual sessions
n_eff     = (Σ weight_i)² / Σ weight_i²   → "no history" <1, low 1–3, medium 3–8, high >8
```

Explain recommendations with the neighbours themselves ("3 similar sessions here: 9, 8, 6"). In a comparison of 21 explanation interfaces, a histogram of neighbours' ratings was the most persuasive ([Herlocker et al. 2000](https://doi.org/10.1145/358916.358995)). Leave machine learning for version 2. Tree models still beat deep nets on small tabular data ([Grinsztajn et al. 2022](https://arxiv.org/abs/2207.08815)), and pooled cross-user models or TabPFN ([Hollmann et al. 2025](https://doi.org/10.1038/s41586-024-08328-6)) only pay off once many users rate sessions. Competitors' accuracy claims, such as LazySurfer's "90.3% exact-match", are unaudited ([LazySurfer](https://lazysurfer.app/)).

### "No longer relevant" becomes three mechanisms

Feature 11 works best as three mechanisms rather than one checkbox. First, a hard exclusion flag gives a session zero weight while it stays visible, greyed out. Second, exponential time decay lowers old sessions' weight; time-weighting improved collaborative-filtering accuracy in recommender research ([Ding & Li 2005](https://doi.org/10.1145/1099554.1099689)). Our starting half-life is 18–24 months, which is an untested guess. Third, skill "epochs" down-weight sessions from earlier levels instead of deleting them. On top of these, simple drift detection on prediction errors ([Gama et al. 2014](https://doi.org/10.1145/2523813)) lets the app ask "your recent big-swell ratings beat our predictions; have you levelled up?" rather than silently discarding history.

### Segments and curves are where your design pulls ahead

Resample each session onto a 15-minute grid of zone, conditions, and fun, exertion and other ratings. Each session then becomes a dozen labelled rows. Comparing rows within a session cancels everything that stayed constant (board, crowd, mood, the overall day), so even a small journal can learn "outside beats inside on a mid rising tide". Add a fatigue term so that "late in the session" is not confused with "falling tide". Phrase results descriptively, because you moved outside partly *because* it got better. An LLM fits around this engine rather than inside it: turning notes into structured tags (crowd, board, "closeouts"), writing explanations strictly from computed facts, and answering conversational queries.

## Three custom touch components carry the most build risk

No off-the-shelf component covers all three of your interactions. You need a charting base plus two small custom widgets, tested on real phones early.

### The conditions timeline and session brush

For the timeline and session brush, **Apache ECharts** (Apache-2.0, canvas-rendered) offers a `lineX` brush. You can set it from code, it supports multiple selections and follows zoom, and `markArea` can draw the saved segments ([ECharts brush](https://echarts.apache.org/en/option.html#brush)). D3's `brushX` gives full control and can snap the selection to whole hours. It has two mobile pitfalls: handles default to 6 px, and its touch detection "fails" in Chrome's mobile emulator, so only real devices tell the truth ([d3-brush](https://d3js.org/d3-brush)).

For the inside/outside segments, the closest ready-made piece is the amCharts 5 "Selecting and Marking Multiple Ranges" demo. It keeps ranges from overlapping and supports pinch-zoom ([amCharts demo](https://www.amcharts.com/demos/selecting-and-marking-multiple-ranges/)). Highcharts costs $366 per seat ([Highcharts shop](https://shop.highcharts.com/)), and the React wrappers for vis-timeline have been stale since 2022 ([npm](https://npmjs.com/package/react-vis-timeline)). Our recommendation is a custom lane strip under the chart, with one lane per peak and segments snapped to 5–15 minutes. On phones, add +/- 5-minute steppers, which are far easier than precise drags.

### The draw-your-curve widget

The draw-your-curve widget should use Pointer Events or d3-drag, which "unifies mouse and touch input" ([d3-drag](https://d3js.org/d3-drag)). Set CSS `touch-action: none` so drawing doesn't scroll the page; the one-finger conflict between chart and page is well known, and AG Charts has a dedicated setting for it ([AG Charts touch](https://www.ag-grid.com/charts/javascript/touch.md)). Draw one category at a time, with the others shown as faint ghost lines. Resample to a fixed 5–10-minute grid, clamp values to 1–10, and allow overwriting part of a curve. The NYT-style "you draw it" project is useful reference code ([you-draw-it](https://github.com/EE2dev/you-draw-it)). For accessibility and quick logging, offer 3–5 draggable control points per category as an alternative. On touch screens, their hit radius must exceed 25 px ([chartjs-plugin-dragdata](https://npmjs.com/package/chartjs-plugin-dragdata)).

## Supabase in Frankfurt runs free as a hobby, ~€75/month commercially

### Stack

The lowest-effort stack for a solo developer, hosted in the EU, is Next.js or SvelteKit on Supabase's Frankfurt region. Supabase supplies Postgres, PostGIS, Auth, Storage, and pg_cron with Edge Functions for scheduled ingestion ([Supabase GDPR/regions](https://supabase.com/docs/guides/security/gdpr-compliance); [scheduled functions](https://supabase.com/docs/guides/functions/schedule-functions)). Add MapLibre with OpenFreeMap tiles, ECharts plus custom D3 widgets, and IndexedDB for offline drafts. Supabase has deprecated TimescaleDB on Postgres 17 ([Supabase](https://supabase.com/docs/guides/database/extensions/timescaledb)), but plain tables with a BRIN index handle the roughly 17.5M rows a year that 2,000 hourly-tracked spots produce.

Ship a PWA first. Apple kept home-screen web apps in the EU in iOS 17.4 ([MacRumors](https://www.macrumors.com/2024/03/01/apple-walks-back-decision-to-disable-eu-web-apps/)). iOS Safari lacks Background Sync ([MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)), so beach-side drafts are saved locally and synced when the app is next opened; conditions are attached on the server anyway. Wrap the app with Capacitor later if you want store presence or reliable push. The EU-sovereign alternative, Django/GeoDjango on Hetzner, still undercuts the managed stack despite two Hetzner price rises in 2026, with CX23 at about €5.49 ([bitdoze](https://www.bitdoze.com/hetzner-cloud-cost-optimized-plans/)).

### Data model

Keep conditions independent of sessions, and store rating curves as fixed-grid arrays:

```
spots(id, parent_id, name, aliases[], geom, offshore_bearing, swell_window, tide_window,
      break_type, bottom, level_label, hazards[], min_size_m, max_size_m,
      model_lat, model_lon, sources[], licence, confidence, created_by, visibility)
sub_peaks(id, spot_id, name)                         -- inside, outside, The Bubble …
regions(id, name, osm_id, geom)                      -- cached "north Fuerteventura" polygon
conditions_hourly(spot_id, valid_time, provider, model, lead_time_h, swell1/2_*, wind_wave_*,
      wind_speed, wind_gust, wind_dir, sea_level_m, water_temp_c)   -- append-only
sessions(id, user_id, spot_id, started_at, ended_at, tz, board_id, skill_level_snapshot,
      is_relevant, irrelevant_reason, notes, client_uuid)          -- client_uuid = idempotent offline sync
session_segments(session_id, sub_peak_id, started_at, ended_at)
rating_categories(id, key, label, is_health_like)    -- fun, exertion, crowd, fear …
rating_curves(session_id, category_id, grid_start, step_minutes, values[])
field_definitions / session_field_values             -- the predetermined inputs
session_condition_summary(session_id, …, feature_vector)   -- frozen at save time
```

Store times as `timestamptz` alongside the spot's IANA timezone, so a day timeline survives 23- and 25-hour DST days. Ingestion runs every 1–3 hours over active spots, grouped by model grid cell. The app reads only from the database, never from the weather API at request time. Attribute Open-Meteo and Copernicus in the footer and on the charts.

### Running costs

Cost depends on spots × fetch frequency, not on users. The table shows our estimates, built from list prices ([Supabase pricing](https://supabase.com/pricing); [Vercel pricing](https://vercel.com/pricing); [Open-Meteo pricing](https://open-meteo.com/en/pricing)):

| Scale | Managed (Supabase Pro $25 + Vercel Pro $20 + Open-Meteo) | Self-hosted EU (Hetzner + Open-Meteo) |
|---|---|---|
| Personal, non-commercial | **€0** (all free tiers) | ~€6 |
| 100 users, commercial | ~€70–80 | ~€40–45 |
| 1,000 users | ~€75–85 | ~€45–60 |
| 10,000 users | ~€130–180; up to €230–260 with Open-Meteo Professional | ~€60–160 |

Vercel Hobby ("personal, non-commercial use"), Open-Meteo, MapTiler and Stadia all forbid commercial use on their free tiers, so budget for paid tiers from the first subscription or ad. Supabase Free also pauses a project after one week of inactivity. For pricing context, indie surf journals charge about $2–4/month or $15–40/year ([Session](https://apps.apple.com/us/app/-/id6759348837); [Swell Scope](https://apps.apple.com/us/app/-/id6747609653)). At €3/month, roughly 30–60 paying users would cover the infrastructure.

## German law adds an Impressum and a health-data trap in "exertion"

### Baseline obligations

A German operator of a paid service needs an Impressum under § 5 DDG ([gesetze-im-internet](https://www.gesetze-im-internet.de/ddg/__5.html)). It also needs a GDPR privacy policy, a record of processing activities, and a data processing agreement with every processor, including Supabase ([Supabase DPA](https://supabase.com/legal/dpa)). A cookie banner is required only for non-essential cookies or trackers. The Bavarian data protection authority considers reach measurement "basically never strictly necessary" ([BIHK guide](https://www.bihk.de/fileadmin/eigene_dateien/bihk/Teaserbilder/Sonstiges/Digitalisierung/20250728_Webseiten_datenschutzkonform_gestalten.pdf)). The EU's "Digital Omnibus" relaxation was still only a proposal on 23 October 2026 ([Heuking](https://www.heuking.de/de/news-events/newsletter-fachbeitraege/artikel/cookie-einwilligung-nach-dem-digital-omnibus-geplante-aenderungen-und-technische-umsetzung.html)). Login cookies, self-hosted fonts and log-based analytics avoid the banner entirely.

### Health data

Health data is the subtle risk. In *Lindenapotheke* (C-21/23, October 2024), the CJEU applied Art. 9 GDPR wherever health information can be inferred with "a certain degree of probability". It also held that performing a contract is not an Art. 9 legal basis ([Taylor Wessing](https://www.taylorwessing.com/en/insights-and-events/insights/2024/10/ecj-lindenapotheke)). An "exertion" or "fatigue" curve, or a note like "shoulder hurt again", could therefore count as health data, although no regulator has yet ruled on self-ratings in sports apps. You have three options: frame these categories as experience ratings, ask for separate explicit consent for health-like categories (hence the `is_health_like` column), or keep everything private by default with export and deletion.

### Transfers, data rights and app stores

The EU–US Data Privacy Framework remains valid while the appeal C-703/25 P is pending ([WilmerHale](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework)). Keep Standard Contractual Clauses as a fallback, and choose EU regions. The EU sui generis database right protects against substantial extraction from databases built with substantial investment ([EUR-Lex](https://eur-lex.europa.eu/EN/legal-content/summary/legal-protection-databases.html)). Together with *Ryanair*, this rules out bulk-copying Wannasurf or Surf-Forecast spot lists, while individual facts in your own words are fine. Keep OSM-derived rows in a separate table so the ODbL's share-alike obligation stays contained.

Micro-enterprises (fewer than 10 staff and no more than €2M turnover) are exempt from the BFSG accessibility law for services ([Händlerbund](https://ohn.haendlerbund.de/recht/rechtsfragen/kleinstunternehmen-bfsg-ausnahme)), but an input that doesn't rely on gestures is still good practice. Going native adds Apple's DSA trader declaration: apps without one have been removed from the EU App Store since February 2025 ([Apple](https://developer.apple.com/news/?id=einwn76m)). Apple also requires in-app account deletion ([Apple guideline 5.1.1(v)](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)).

## An MVP takes 8–12 full-time weeks; prototype the gestures first

There are no published effort benchmarks for comparable apps, so the phases below are our estimate for one experienced full-stack developer.

| Phase | Effort (full-time) | Your features | Scope |
|---|---|---|---|
| MVP | 8–12 weeks (~4–6 months part-time) | 1, 2, 3, 4, 5, 6, 11 | Auth and legal pages; northern Fuerteventura seed with sub-peaks; ingestion and day chart; brush, segments, drawn curves, fields and notes; history with relevance flag; PWA offline drafts; beta with 10–20 surfers |
| v1 | +6–10 weeks | 7, 8, 9 | Region search with PostGIS; rule-based recommendability on the map; similar sessions with explanations; stats, export, billing |
| v2 | +8–12 weeks | 10 | Personal spot and time recommendations; alerts and push; Capacitor apps; moderated crowd-sourced spot edits |

The order is deliberate: build what nobody else has first, and add the commodity memory features once there are sessions to match. The biggest risk is the mobile gesture UX, so spike the brush and curve drawing in week 1 on iOS Safari and Android Chrome. Next comes per-spot data quality. The 0 m GFS cell shows how much grid-point choice matters, and Fuerteventura's reefs will deviate from beach-based formulas until you calibrate them. Then comes cold start: personal recommendations need roughly 20+ sessions, so the rule score must carry the early experience. Offline sync conflicts are a smaller risk, handled by idempotent `client_uuid`s.

AI coding assistants help most with boilerplate such as auth, row-level security, migrations, CRUD and SQL. Their overall effect is unclear. METR's 2025 trial found experienced developers 19–20% *slower* on their own mature codebases, even though they believed they were faster. METR's 2026 update suggests larger gains but calls its own estimate unreliable ([METR](https://metr.org/blog/2026-02-24-uplift-update/)). A greenfield app on a mainstream stack is close to the best case, but gesture tuning and data validation still need hands-on device work. No-code tools are a poor fit, because all three custom interactions would need custom code anyway.

## Conclusion

The market has already made "remember my sessions and match today's forecast" table stakes, so the obvious pitch for this app is gone. What survives is more interesting. Time-resolved, per-peak, multi-category labels turn a journal of star ratings into a dataset that can say "the outside at Majanicho works for you on a rising mid tide; the inside doesn't". The same labels make standard similarity and shrinkage methods work with few sessions. The binding constraints are neither money (a personal build costs about €0) nor algorithms (decades-old analog and pooling methods suffice). They are data rights, which rule out surf-site data and force hand-curated spots, and logging friction, which your richest features make worse.

Two decisions should come before any code. First, decide **personal tool or product**. That choice sets the licence regime (non-commercial free tiers versus paid Open-Meteo, Vercel and map plans), whether you need an Impressum and billing, and how carefully "exertion" must be handled as possible health data. Second, design the **60-second path**: brush the session, draw only the fun curve, and make segments and the other categories optional. Northern Fuerteventura is a good proving ground, with about 20 breaks, several obvious multi-peak spots and ~3 km Copernicus model coverage. One season of personal use there would show whether richer logging actually buys better recommendations.
