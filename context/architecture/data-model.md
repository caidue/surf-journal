---
type: "Schema"
title: "Data model"
description: "The TypeScript types stored in IndexedDB and passed through the engine."
resource: "src/types.ts"
tags: ["architecture", "schema"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Data model

Defined in `src/types.ts`. Stored tables: `spots`, `sessions`, `forecasts`, `geocache`, `settings`, `photos` ([Storage](/architecture/storage.md)).

# Schema

**Spot**: `id`, `name` (Surfline's where it has one), `aliases?`, `externalIds? {surfline: "slug/id", surfForecast: slug}`, `region`, `lat`, `lon`, `coordsApprox`, `facing`, `idealSwellDir`, `swellWindow`, `minSize`, `maxSize` (breaking face height, m), `tide`, `breakType` (beach/reef/point), `bottom` (sand/reef/rock/mixed), `level` (beginner/all/intermediate/advanced/expert), `power?` (mellow/punchy/hollow/slab), `peel?` (slow/medium/fast/sectiony), `lifeguard?`, `crowd?`, `localism?`, `hazards[]`, `description`, `peaks[]`, `guide?`, `gain`, `source?`, `custom?`.

**Peak**: `id`, `name`, `description?`, `breakType?`, `bottom?`, `direction?`, `level?`, `goodWhen?`, `season?`, rating overrides `minSize?`, `maxSize?`, `tide?`, `power?`, `peel?` ([Per-peak rating](/engine/per-peak-rating.md)).

**HourConditions** (version `CONDITIONS_VERSION = 2`): `time` (local), `waveH`, `waveDir`, `waveTp` (peak), `waveTe` (energy period), `trains: WaveTrain[]`, `tpEstimated?`, `windSpeed`, `windDir`, `windGust` (km/h), `seaLevel` (m vs MSL incl. tide), `waterTemp`, `airTemp`.

**WaveTrain**: `kind` (swell/wind), `h` (m, scaled to MFWAM Hs), `tp` (peak period, s), `dir` (from, deg).

**ConditionsSeries** (cached forecast): `key` = `cell|start|end`, `lat`, `lon`, `timezone`, `utcOffsetSeconds`, `hours`, `days` (sunrise/sunset), `source`, `version`, `gridLat?`, `gridLon?` (MFWAM cell), `fetchedAt`, `stale?` (never stored).

**Session**: `id`, `spotId`, `date`, `startMin`, `endMin`, `ratings` (category → 1–10, `fun` required), `conditions` (snapshot), `conditionsSource`, `conditionsVersion?`, `conditionsPending?`, `days?`, `fields` {board, wetsuit, crowd, waves, observedSize (body-scale id), vsForecast, feel}, `tags`, `notes`, `excluded`, `skillAtTime` {stage, comfort, max}, `demo?`, timestamps.

**Settings** (single row `id: 'settings'`): `profile: SkillProfile | null` (null → onboarding), `categories`, `halfLifeMonths`, `ignoreBefore`, `boards`, `heightUnit` (m/ft), `windUnit` (kmh/kn/mph), `lastQuery?`, `seedVersion?`.

**SkillProfile**: `stage` 1–8, `comfort` (C), `max` (M), `board`, `reefExp` 0–3, `paddleOut` 0–3, `steepExp?` 0–2, `frequency?`, `years?`, `waterConfidence?`, `wantsChallenge?`, `updatedAt`, `lastChange?` {at, sessionId, before, reasons[], stagePrompt?, seen?}. See [Skill profile](/engine/skill-profile.md).

**UserPhoto**: `id`, `spotId`, `blob` (JPEG ≤ 1600 px), `width`, `height`, `caption?`, `addedAt`.

Derived (not stored): `Derived` per hour in `src/lib/conditions.ts` (`hb`, `tDom`, `dirDom`, `energy`, wind components `uOff`/`uX`, `tideNorm`, `tideTrend`).
