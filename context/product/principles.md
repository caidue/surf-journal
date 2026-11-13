---
type: "Reference"
title: "Product principles"
description: "Rules every change follows: local-first, explain every number, user's own words, no backwards compatibility while unreleased."
tags: ["product", "principles"]
sources:
  - resource: "README.md"
    id: "readme"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Product principles

* **Local-first, no backend.** Data lives in IndexedDB on the device; export/import JSON for backups. See [decision 0001](/decisions/0001-local-first-indexeddb.md).
* **Works offline at the beach.** App shell, saved forecasts, map tiles and photos are cached; sessions logged offline get their conditions later. See [Offline and PWA](/architecture/offline-pwa.md).
* **Explain every number.** Scores come with reasons generated only from computed values (`explain()` in `src/lib/recommend.ts`, `SuitReasons` in `src/components/ui.tsx`). Size reasons always name both sizes and link to "Edit comfort size".
* **Conventions surfers know.** Peak periods, face heights with body words, strongest-train energy, Surfline spot names. See [Wave periods](/domain/wave-periods.md), [Spot naming](/spots/naming.md).
* **Safety floors are not negotiable.** Fun ratings never lower the size, reef or overhead floors ([Suitability rules](/engine/suitability-rules.md)); the surfing stage never changes automatically ([Profile learning](/engine/profile-learning.md)).
* **Our own words, credited sources.** Spot guides are written in our own words from public guides, with sources listed; photos are freely licensed with credit. Other services (Surfline, surf-forecast) are linked, never copied.
* **No backwards compatibility while unreleased.** The app has no users besides its author, so schemas and data can change freely; a Dexie upgrade or a re-fetch is enough. See [decision 0004](/decisions/0004-no-backwards-compatibility.md).
* **Simple inputs.** One slider per rating category, chips instead of free text where possible, a fixed action bar for Save/Cancel.
* **Design system.** One spacing scale (4 px steps), one type scale, three radii, 44 px touch targets, 16 px inputs (no iOS zoom); follows Nielsen's usability heuristics. See [Design rules](/influences/design-rules.md).
