---
okf_version: "0.2"
---

# Surf Journal knowledge base

Knowledge about the Surf Journal app (code in `src/`), in Open Knowledge Format v0.2. Keep it current: see [Knowledge base maintenance](operations/knowledge-base.md). Changes are recorded in [the log](log.md).

# Product

What the app is, its principles and vocabulary. ([folder index](product/index.md))

* [Glossary](product/glossary.md) - Surf and app terms used in code, UI and this knowledge base.
* [Surf Journal](product/overview.md) - What the app is for, who uses it, and its main parts.
* [Product principles](product/principles.md) - Rules every change follows: local-first, explain every number, user's own words, no backwards compatibility while unreleased.

# Architecture

Technical structure: stack, code map, data model, storage, offline, maps, UI shell. ([folder index](architecture/index.md))

* [Code map](architecture/code-map.md) - Which file does what in src/.
* [Data model](architecture/data-model.md) - The TypeScript types stored in IndexedDB and passed through the engine.
* [Maps](architecture/maps.md) - MapLibre map, markers, spot thumbnails.
* [Offline and PWA](architecture/offline-pwa.md) - Service worker, caches, update flow and filling in sessions logged offline.
* [Tech stack](architecture/stack.md) - Libraries, versions and why they were chosen.
* [Storage and migrations](architecture/storage.md) - Dexie schema, the version-3 upgrade, seed refresh, backup and persistence.
* [UI shell and shared components](architecture/ui-shell.md) - Routing, navigation, action bar, toasts and shared UI pieces.

# Data sources

External data and services the app uses or links to. ([folder index](data-sources/index.md))

* [Nominatim place search](data-sources/nominatim.md) - Geocoding of free-text regions in Explore.
* [Open-Meteo Marine API (four models)](data-sources/open-meteo-marine.md) - How wave, swell, tide and sea temperature data are requested and parsed.
* [Open-Meteo weather APIs](data-sources/open-meteo-weather.md) - Wind, gusts, air temperature, sunrise and sunset for each session date.
* [OpenFreeMap and OpenStreetMap](data-sources/openfreemap-osm.md) - Map tiles and the base for some spot positions.
* [Spot guide sources](data-sources/spot-guide-sources.md) - Public guides the built-in spot guides were compiled from.
* [surf-forecast.com](data-sources/surf-forecast.md) - Forecast conventions we match, and break slugs we link to.
* [Surfline](data-sources/surfline.md) - The best-known surf service; source of spot names and the ids we link to.
* [Wikimedia Commons photos](data-sources/wikimedia-commons.md) - Freely licensed spot photos with credits.

# Domain

Surf science behind the numbers: periods, swell trains, breaking height, energy, wind, tides, body scale. ([folder index](domain/index.md))

* [Body scale (face heights)](domain/body-scale.md) - One scale of body words for onboarding, observed sizes and the forecast.
* [Breaking height at a spot](domain/breaking-height.md) - From offshore trains to an estimated face height at the spot.
* [Swell trains](domain/swell-trains.md) - Primary, secondary, tertiary swell and wind sea, and how they are combined.
* [Tides](domain/tides.md) - Sea level, normalised tide stage, and high/low times.
* [Wave energy (kJ)](domain/wave-energy.md) - Energy per metre of wave crest, as surf-forecast.com shows it.
* [Wave periods: peak vs mean](domain/wave-periods.md) - Which period the app shows and why, and how the models report periods.
* [Wind relative to a spot](domain/wind.md) - Offshore/onshore components and the six wind kinds.

# Engine

Algorithms: spot rating, suitability rules, skill profile and learning, prediction, similarity. ([folder index](engine/index.md))

* [Day recommendation and best picks](engine/day-recommendation.md) - Best time window per spot and the top three spots for today or right now.
* [Insights per spot](engine/insights.md) - What your fun ratings say about tide stage and wind at a spot.
* [Per-peak rating](engine/per-peak-rating.md) - Rating each peak of a spot on its own and naming the best one for you.
* [Personal prediction (For you)](engine/personal-prediction.md) - Blending the rule-based score with your fun ratings in similar past conditions.
* [Profile learning from sessions](engine/profile-learning.md) - Bounded, explained, undoable updates of the comfortable size and experience after a session.
* [Similarity of conditions](engine/similarity.md) - Analog matching of hours at the same spot.
* [Size calibration](engine/size-calibration.md) - Per-spot gain from the sizes you noted.
* [Skill profile](engine/skill-profile.md) - Stages 1–8, comfortable and biggest size, board and experience: what the app knows about the surfer.
* [Spot rating (wave quality)](engine/spot-rating.md) - How good the waves are at a spot in one hour, 0–10, for anyone.
* [Suitability rules](engine/suitability-rules.md) - Rule-based check of an hour at a spot against your skill profile, with reasons.

# Features

User-facing screens and flows. ([folder index](features/index.md))

* [Demo sessions](features/demo-sessions.md) - Random sessions on real past conditions to try the app.
* [Explore](features/explore.md) - Region search, map and list of spots, best picks for today or now, similar past sessions.
* [Hourly forecast table](features/forecast-table.md) - Surf-forecast-style hourly table: spot rating, For you, surf, swell trains, energy, wind, tide.
* [Journal](features/journal.md) - List of logged sessions with filters, stats and relevance switches.
* [Onboarding: Your surfing](features/onboarding.md) - First-launch questions that build the skill profile; also the profile editor.
* [Session logging](features/session-logging.md) - Logging a session on the day's conditions timeline, with ratings, details and how it felt.
* [Settings](features/settings.md) - Your surfing, units, spots, how old sessions count, categories, phone/offline, data, demo, about.
* [Spot editor](features/spot-editor.md) - Adding and editing spots, peaks and guides.
* [Spot guide](features/spot-guide.md) - Peaks, season, boards, access, warnings, parking, facilities and photos for a spot.
* [Spot view](features/spot-view.md) - Everything about one spot in tabs, as a sheet over Explore or as its own page.
* [Conditions timeline](features/timeline.md) - The SVG day chart used to mark a session: For you, surf, swell, energy, wind, tide.

# Spots

Spot content: the built-in catalogue, naming, special cases. ([folder index](spots/index.md))

* [Built-in spot catalogue](spots/catalogue.md) - The 19 built-in northern Fuerteventura spots: ids, names, aliases, external ids, level, peaks and pin status.
* [El Hierro (one spot, three peaks)](spots/el-hierro.md) - How El Hierro, Derecha de los Alemanes, La Izquierda and The Bubble are modelled.
* [Spot naming](spots/naming.md) - Why spots carry Surfline's names, how aliases work, and the Generosa/Generoso question.

# Influences

Products, research and design rules that shaped the app. ([folder index](influences/index.md))

* [Influence: analog forecasting and kNN](influences/analog-forecasting.md) - Matching today's conditions with past sessions.
* [Design rules](influences/design-rules.md) - Usability heuristics and the visual system the UI follows.
* [Influence: Magicseaweed-style ratings](influences/magicseaweed-ratings.md) - Solid vs faded stars: potential vs what the wind leaves.
* [Influence: surf-forecast.com](influences/surf-forecast.md) - Forecast-table layout, energy, rating words and periods we adopted.
* [Influence: surf-school progression and injury research](influences/surf-school-progression.md) - Where the stages, size limits and safety floors come from.
* [Influence: Surfline](influences/surfline.md) - Spot names, face-height ranges with body words, session logging with conditions.

# Decisions

Accepted decisions (numbered) and pending ones. ([folder index](decisions/index.md))

* [0001: Local-first storage in IndexedDB, no backend](decisions/0001-local-first-indexeddb.md) - All user data stays in the browser.
* [0002: Static hosting on GitHub Pages](decisions/0002-github-pages-static-hosting.md) - Build once, serve static files over HTTPS.
* [0003: WebAssembly builds of esbuild and Rollup](decisions/0003-wasm-build-tools.md) - Avoid native binaries the Mac blocks.
* [0004: No backwards compatibility while unreleased](decisions/0004-no-backwards-compatibility.md) - Change schemas and data freely.
* [0005: Four wave models in one Open-Meteo request](decisions/0005-open-meteo-multi-model.md) - MFWAM height, ECMWF peak period, GFS-Wave trains, Météo-France currents.
* [0006: Show and rate peak periods](decisions/0006-peak-period-convention.md) - Peak period everywhere a period appears.
* [0007: Headline energy = strongest train](decisions/0007-strongest-train-energy.md) - Match surf-forecast's energy number.
* [0008: Surfline names, aliases and external ids](decisions/0008-surfline-naming-and-aliases.md) - Use the best-known app's spot names; keep the rest searchable.
* [0009: El Hierro as one spot with three peaks](decisions/0009-el-hierro-single-spot.md) - Merge The Bubble into El Hierro, rate per peak.
* [0010: Skill profile replaces the four levels](decisions/0010-skill-profile-replaces-levels.md) - Stage, comfortable size, biggest size, board and experience instead of beginner…expert.
* [0011: Recalibrate default gains for peak periods](decisions/0011-gain-recalibration.md) - Keep displayed surf heights stable after the period change.
* [0012: No peak split in session logs](decisions/0012-no-peak-split-in-sessions.md) - Sessions are per spot, not per peak.
* [0013: Add the spots other services list](decisions/0013-add-spots-other-services-list.md) - Corralejo Beach and Playa los Matos (Surfline) and Suicides (surf-forecast, Wannasurf) became built-in spots in seed 5.
* [0014: Link to Surfline and surf-forecast, never fetch from them](decisions/0014-link-out-never-fetch.md) - External spot ids are only used to build links; no data is requested from or copied out of those services.
* [Accounts, sync and a commercial data plan](decisions/pending/accounts-and-sync.md) - What a public release would need.
* [Should several challenging causes compound?](decisions/pending/compounding-challenges.md) - Worst status wins, so two problems count like one.
* [Ask Open-Meteo for per-train peak periods in MFWAM](decisions/pending/open-meteo-upstream.md) - Upstream improvement, not ours to build.
* [Wave data for sessions before October 2021](decisions/pending/pre-2021-history.md) - Explicit models return nothing before MFWAM's archive.
* [Tune the skill thresholds](decisions/pending/threshold-tuning.md) - The rule thresholds are design proposals.
* [Verify uncertain spot pins](decisions/pending/verify-spot-pins.md) - Pins that disagree between sources.

# Research

Research reports behind the decisions. ([folder index](research/index.md))

* [Surf journal app feasibility](research/surf-journal-app-feasibility.md) - Deep research before building: competitors, data APIs, spot data, similarity methods, stack, cost. Some feature ideas were later dropped (feel curves, per-peak segments).
* [Surf metrics, spot data and skill model](research/surf-metrics-spots-and-skill-model.md) - Deep research: period/energy conventions of surf sites, Open-Meteo model capabilities, spot naming across services, and a skill model with onboarding and rules. Implemented in v1.1.

# Operations

Commands, testing, deployment, releases and knowledge-base upkeep. ([folder index](operations/index.md))

* [Commands](operations/commands.md) - How to run, test, typecheck and build locally.
* [Deployment](operations/deployment.md) - Publishing to GitHub Pages and checking the live build.
* [Knowledge base maintenance](operations/knowledge-base.md) - How context/ is organised and kept up to date (Open Knowledge Format v0.2).
* [Releases and changelog](operations/releases.md) - Versioning, tags and CHANGELOG.md.
* [Testing](operations/testing.md) - What the unit tests cover and how to verify UI changes.
