---
type: "Reference"
title: "Storage and migrations"
description: "Dexie schema, the version-3 upgrade, seed refresh, backup and persistence."
resource: "src/db.ts"
tags: ["architecture", "storage", "indexeddb"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T00:30:00+00:00"
---
# Storage and migrations

`src/db.ts` defines one Dexie database, `surf-journal`, schema **version 3**:

| Table | Key / indexes | Content |
|---|---|---|
| spots | `id, region, name` | built-in and own spots |
| sessions | `id, spotId, date` | the journal |
| forecasts | `key, fetchedAt` | cached `ConditionsSeries` (`cell|start|end`) |
| geocache | `q` | Nominatim results |
| settings | `id` | one row |
| photos | `id, spotId` | your spot photos |

## Version-3 upgrade (wave trains + skill profile)
Clears `forecasts`; converts a string `skillAtTime` (old four levels) to `{stage, comfort, max}` via `LEGACY_STAGE` (beginner 2, intermediate 4, advanced 6, expert 7); marks sessions whose `conditionsVersion` isn't current as `conditionsPending` so `src/lib/sync.ts` re-fetches them; drops `settings.level` and sets `profile: null` (→ [onboarding](/features/onboarding.md)).

## Seed refresh
`initDb()` calls `refreshSeedSpots()` when there are no spots or `settings.seedVersion !== SEED_VERSION` (currently 6; 3 had been used by an earlier build). It moves sessions and photos of `RETIRED_SPOTS` (old id → new id; empty since seed 6 brought `fv-the-bubble` back) to their new spot, rewrites every built-in spot, and stores the version. Own spots (`custom`) are untouched; edits to built-in spots are overwritten by the next seed bump. "Restore built-in spots" in Settings runs the same function.

## Cache rules
Forecasts: past days (end < today − 2) kept forever, today/future for one hour, entries older than a week pruned at start (`pruneCache`). A cached series with another `version` is ignored. Offline, `findSaved()` returns the newest saved series covering the range, flagged `stale`.

## Backup
Settings → Your data exports `{app, version: 1, spots, sessions, settings, photos (data URLs)}` as JSON; import merges with `bulkPut`. Saving a session calls `navigator.storage.persist()` (`requestPersistence`).
