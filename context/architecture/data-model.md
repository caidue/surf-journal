---
type: "Schema"
title: "Data model"
description: "The TypeScript types stored in IndexedDB and passed through the engine."
resource: "src/types.ts"
tags: ["architecture", "schema"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-18T20:00:00+00:00"
---
# Data model

Defined in `src/types.ts`. Stored tables: `spots`, `sessions`, `forecasts`, `geocache`, `settings`, `photos` ([Storage](/architecture/storage.md)).

# Schema

**Spot**: `id`, `name` (Surfline's where it has one), `aliases?`, `dataNote?` (why its forecast point or location is doubtful), `externalIds? {surfline: "slug/id", surfForecast: slug}`, `region`, `lat`, `lon`, `coordsApprox`, `facing`, `idealSwellDir`, `swellWindow`, `minSize`, `maxSize` (breaking face height, m), `tide`, `breakType` (beach/reef/point), `bottom` (sand/reef/rock/mixed), `level` (beginner/all/intermediate/advanced/expert), `power?` (mellow/punchy/hollow/slab), `peel?` (slow/medium/fast/sectiony), `lifeguard?`, `crowd?`, `localism?`, `hazards[]`, `description`, `peaks[]`, `guide?`, `gain`, `source?`, `custom?`.

**Peak**: `id`, `name`, `description?`, `breakType?`, `bottom?`, `direction?`, `level?`, `goodWhen?`, `season?`, rating overrides `minSize?`, `maxSize?`, `tide?`, `power?`, `peel?`, `sizeFactor?` (breaking height relative to the spot's estimate, e.g. 0.8 for a sheltered inside peak) ([Per-peak rating](/engine/per-peak-rating.md)).

**HourConditions** (version `CONDITIONS_VERSION = 4`): `time` (local), `waveH` (median of the wave models), `waveHModels?` (each model's total height), `waveDir`, `waveTp` (peak), `waveTe` (energy period), `trains: WaveTrain[]`, `tpEstimated?`, `windSpeed`, `windDir`, `windGust` (km/h; mean of the wind models over the sea), `windModels?: {model, speed, dir, gust}[]`, `windSpread?` (deg), `seaLevel` (m vs MSL incl. tide), `waterTemp`, `airTemp`.

**SpotRule** (`src/data/spotRules.ts`, not stored): `id`, `kind` (tide/swell/size/wind/level/role/timing/logistics), `text`, `confidence` (high/medium/low), `sources: {name, url?, kind}[]`, `inRating`, `note?`. See [Local knowledge](/spots/local-knowledge.md).

**WaveTrain**: `kind` (swell/wind), `h` (m, scaled to the models' median Hs), `tp` (peak period, s), `dir` (from, deg).

**ConditionsSeries** (cached forecast): `key` = `cell|start|end`, `lat`, `lon`, `timezone`, `utcOffsetSeconds`, `hours`, `days` (sunrise/sunset), `source`, `version`, `gridLat?`, `gridLon?` (MFWAM cell), `fetchedAt`, `stale?` (never stored).

**Session**: `id`, `spotId`, `date`, `startMin`, `endMin`, `ratings` (category → 1–10, `fun` required), `conditions` (snapshot), `conditionsSource`, `conditionsVersion?`, `conditionsPending?`, `days?`, `fields` {board, wetsuit, crowd, waves, observedSize (body-scale id), vsForecast, feel}, `tags`, `notes`, `excluded`, `tripId?`, `skillAtTime` {stage, comfort, max}, `demo?`, timestamps.

**Trip** (a named folder of sessions: a vacation or time period): `id`, `name`, `from?` / `to?` (YYYY-MM-DD, inclusive, both or neither: sessions on those days that aren't in another trip join it when it's saved, and new sessions on those days start in it), timestamps. Deleting a trip removes `tripId` from its sessions.

**Settings** (single row `id: 'settings'`): `profile: SkillProfile | null` (null → onboarding), `categories`, `halfLifeMonths`, `ignoreBefore`, `boards`, `heightUnit` (m/ft), `windUnit` (kmh/kn/mph), `lastQuery?`, `seedVersion?`.

**SkillProfile**: `stage` 1–8, `comfort` (C), `max` (M), `board`, `reefExp` 0–3, `paddleOut` 0–3, `steepExp?` 0–2, `frequency?`, `years?`, `waterConfidence?`, `wantsChallenge?`, `updatedAt`, `lastChange?` {at, sessionId, before, reasons[], stagePrompt?, seen?}. See [Skill profile](/engine/skill-profile.md).

**UserPhoto**: `id`, `spotId`, `blob` (JPEG ≤ 1600 px), `width`, `height`, `caption?`, `addedAt`.

Derived (not stored): `Derived` per hour in `src/lib/conditions.ts` (`hb`, `hbLo`/`hbHi` (likely range: the wave models' spread, at least ±20 %), `hsSpread` ((max − min) / median of the models' total height), `hIn` (swell height reaching the spot, raw: no breaking formula or size factor; used for similarity), `tDom`, `dirDom`, `energy`, wind components `uOff`/`uX`, `tideNorm`, `tideTrend` (between the bracketing low and high, mid-hour), `openHb` (the same swell on an open north-facing reef, for local-rule gates)).
