---
type: "Reference"
title: "Offline and PWA"
description: "Service worker, caches, update flow and filling in sessions logged offline."
resource: "src/pwa/sw.js"
tags: ["architecture", "pwa", "offline"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Offline and PWA

* **Service worker** (`src/pwa/sw.js`, hand-written). The `surf-journal-sw` plugin in `vite.config.ts` replaces two placeholders (each must occur exactly once) with the list of built files plus `public/` and a content hash. Caches: shell (precache), `map-tiles` (capped 1,500), `map-meta` (styles, fonts, sprites), `spot-photos` (`upload.wikimedia.org`, `thumb.wikimedia.org`). Asset matching uses `ignoreVary: true` (the CDN sends `Vary: Origin`).
* **Updates:** a new deploy installs in the background; `usePwa().updateReady` shows a "Reload" toast that posts `SKIP_WAITING`.
* **Install:** `beforeinstallprompt` → "Install app" pill; iOS instructions in Settings. Manifest and icons in `public/` (`npm run icons` redraws them).
* **Forecasts offline:** IndexedDB cache with stale fallback ([Storage](/architecture/storage.md)).
* **Sessions offline:** saved with `conditionsPending`; `syncPendingSessions()` (`src/lib/sync.ts`) runs on start-up and on `online`, also re-fetching snapshots with an old `CONDITIONS_VERSION`. A toast reports "Conditions added or updated for N sessions".
* The service worker only runs in the production build (`npm run build && npm run preview`, port 4178).
