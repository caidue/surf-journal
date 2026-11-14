---
type: "Reference"
title: "Code map"
description: "Which file does what in src/."
resource: "src/"
tags: ["architecture", "code"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T20:30:00+00:00"
---
# Code map

## Entry and shell
* `src/main.tsx`: `initDb()` (seed spots, migrations), prune cache, `initPwa()`, render.
* `src/App.tsx`: hash routes (`explore`, `log`, `session/:id`, `journal`, `settings`, `surfing`, `spot/:id`, `spot-edit/:id`, `spot-new`), top nav, first-run [onboarding](/features/onboarding.md), toasts (update ready, sessions synced, profile changed with Undo).
* `src/hooks.ts`: `useSettings`, `useStoredSettings` (undefined while loading), `useSpots`, `useSessions`, `useRoute`, `useConditions` (per-cell fetch), `useElementWidth`, `useMediaQuery`.
* `src/db.ts`: Dexie schema, upgrade, `refreshSeedSpots`, defaults, backup export/import. See [Storage](/architecture/storage.md).
* `src/types.ts`: the data model. See [Data model](/architecture/data-model.md).

## Engine (`src/lib/`)
* `openMeteo.ts`: four-model marine request, `marineHour()` parsing, caching, offline fallback. [Open-Meteo marine](/data-sources/open-meteo-marine.md).
* `conditions.ts`: partitions, Komar–Gaughan breaking height, exposure, derived hour, tide, wind kind, energy. [Breaking height](/domain/breaking-height.md), [Wave energy](/domain/wave-energy.md).
* `rating.ts`: spot quality, word ladder, per-peak rating, suitability rules. [Spot rating](/engine/spot-rating.md), [Suitability rules](/engine/suitability-rules.md).
* `skill.ts`: stages, body scale, boards, profile summary, learning, undo, rusty offer. [Skill profile](/engine/skill-profile.md), [Profile learning](/engine/profile-learning.md).
* `recommend.ts`: session weights, size calibration, analog prediction, day recommendation, explanations, insights. [Personal prediction](/engine/personal-prediction.md).
* `similarity.ts`: feature distance and kernel. [Similarity](/engine/similarity.md).
* `format.ts`: heights, surf range + body words, wind units (km/h, kn, mph), directions ("NNW 333°"), energy colours.
* `links.ts`: Surfline and surf-forecast URLs.
* `sync.ts`: fills in / re-fetches session conditions. `pwa.ts`: service worker, install, persistence. `demo.ts`: [demo sessions](/features/demo-sessions.md). `geocode.ts`: [Nominatim](/data-sources/nominatim.md). `geo.ts`, `time.ts`: helpers.

## Data (`src/data/`)
* `seedSpots.ts`: built-in spots, names, aliases, external ids, attributes, peak overrides, `SEED_VERSION`, `RETIRED_SPOTS`. [Spot catalogue](/spots/catalogue.md).
* `../lib/confidence.ts`: knowledge level per spot, confidence per hour, withheld ratings. [How sure a rating is](/engine/confidence.md).
* `../lib/rules.ts`: the rules engine (`evaluateRules`, `tideWindowFactor`, `inArc`). [Rules engine](/engine/rules-engine.md).
* `../lib/fixtures/caleta-2026-11-14.ts`: real Open-Meteo data for the La Caleta regression test.
* `spotRules.ts`: local knowledge per built-in spot (rules with sources, confidence, whether the rating follows them). [Local knowledge](/spots/local-knowledge.md).
* `spotGuides.ts`: researched guides (peaks, season, boards, access, warnings, parking, facilities, photos, sources). [Spot guide](/features/spot-guide.md).

## Scripts and docs
* `scripts/make-icons.mjs` (app icons), `scripts/context-index.mjs` (knowledge-base indexes and conformance check).
* `CLAUDE.md` / `AGENTS.md`: agent instructions, incl. the rule to keep `context/` current.

## Components (`src/components/`)
Explore, SpotSheet/SpotPage/SpotView, ForecastTable, Timeline, SpotGuide, SessionEditor, Journal, SettingsPage, Onboarding, StageCard, SpotEditor, SpotPicker, MapView, SpotThumb, ui (Chips, Segmented, ActionBar, badges, SuitReasons), icons. See [features](/features/index.md).
