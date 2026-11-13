# Surf Journal

A local-first surf journal that imports real conditions for every session and learns which spots and conditions you enjoy.

## What it does

- **Spot popup:** tap a spot on the map for its full description, the best time for your level and an hourly forecast table: rating, surf height, swell, wave energy, wind and a tide curve with high/low times.
- **Explore:** type a region ("northern part of Fuerteventura", "Norden von Fuerteventura") or use *Near me*. You get a map and a list of spots with a description and current conditions, plus a score for **your level** (beginner to expert). "Best picks" lists the top three spots for today (best time window) or right now (this hour), and explains the top one. Choose today, tomorrow or the day after.
- **Similar sessions:** see past sessions logged in conditions like today's, with a similarity percentage and the condition that differed most.
- **Personal recommendations:** each spot's score starts from a rule-based guide (size × period × wind × tide, gated by your level). As you log sessions, it is blended with your own fun ratings from sessions in similar conditions (a kernel-weighted nearest-neighbour estimate). A confidence label shows how much history is behind each number.
- **Log a session:** pick a spot and date, and the day's hourly conditions are imported (surf height estimate, swell period and direction, wind, tide). Then:
  - drag on the timeline to mark when you were in the water;
  - rate it 1–10 with one slider per category: fun (required), exertion, confidence, plus your own;
  - add details in groups (waves: size you saw, vs forecast, waves caught; gear: board, wetsuit; crowd & vibe: crowd, tags), and notes.
- **Not relevant anymore:** mark single sessions, or every session before a date (e.g. after a big jump in skill). They stay in the journal but stop counting for predictions. Older sessions also fade out with a configurable half-life, and sessions logged at another skill level count less.
- **Spot guides:** for each spot, its peaks (break type, bottom, direction, level, when it's good), best months, boards, where and when to paddle in and out, warnings, parking and nearby facilities, plus photos: freely licensed Wikimedia Commons photos with credits, and your own (kept on the device and included in backups). The built-in guides for northern Fuerteventura are compiled from public surf guides; sources are listed in each guide.
- **Spot editor** (Settings → Spots): add your own spots anywhere by clicking the map. Set the direction the spot faces, its swell window, size range, tide, bottom, level, hazards, peaks and the guide.
- **Calibration:** noting the size you actually saw tunes each spot's surf-height factor automatically.
- **Insights per spot:** from your fun ratings, see which tide stage and wind you enjoyed most.
- **Install on your phone, works offline:** add it to your home screen (Android: *Install app*; iPhone: Safari → Share → *Add to Home Screen*). After one visit with a connection, the app, your journal, the next three days of forecasts for the region you looked at, and the map areas you viewed all work without signal. Log a session at the beach with no connection: it's saved with a "conditions pending" badge and the conditions are filled in automatically when you're back online.

## Run it

```bash
npm install --ignore-scripts
npm run dev        # http://localhost:5178
npm test           # unit tests for the rating / similarity / recommendation engine
npm run build      # static build in dist/ (works on GitHub Pages or any static host)
npm run preview    # serve the build on http://localhost:4178 (the service worker only runs in the build)
npm run icons      # redraw the app icons in public/ (plain Node, no image tools)
```

To use it on your phone it needs to be on HTTPS (service workers only run on HTTPS or `localhost`). `.github/workflows/pages.yml` tests, builds and publishes it to GitHub Pages on every push to `main`. Turn it on once under **Settings → Pages → Source: GitHub Actions**. On a free GitHub plan the repo has to be public for Pages to work. `dist/` also works on any other static host (Netlify, Cloudflare Pages).

`package.json` overrides esbuild and Rollup with their WebAssembly builds (`esbuild-wasm`, `@rollup/wasm-node`), so nothing native has to be downloaded and executed. That is a little slower than the native builds. On a machine where native binaries run fine, you can delete the `overrides` block and reinstall.

New here? Go to **Settings → Add demo sessions**. This adds 12–16 random sessions on real past dates at your spots, with real conditions and invented ratings, so you can see the matching and recommendations working. Each time gives a new random set; remove them in one click.

## How it works

| Part | Choice |
|---|---|
| Data | [Open-Meteo](https://open-meteo.com/) Marine API (swell partitions, wind waves, sea level incl. tide, SST) plus the Forecast, Historical-forecast and ERA5 Archive APIs (wind, sunrise and sunset). Free, no key; **CC BY 4.0, non-commercial** on the free tier. |
| Surf height | Offshore model values are sampled 2.5 km seaward of the spot. Breaking height uses the Komar–Gaughan formula per swell partition, attenuated by the spot's swell window, times a per-spot factor that calibrates from your observations. |
| Rating | `quality = 10 × size × period × wind × tide` (multiplicative, so one fatal flaw sinks it). `suitability(level)` applies gates on size, the spot's level, bottom, hazards and wind. |
| Similarity | Weighted, tolerance-scaled distance over spot-relative features: log size, period, swell angle, offshore and cross-shore wind, tide height and tide trend. A Gaussian kernel turns distance into a similarity score. |
| Prediction | `ŷ = (n0·μ0 + Σ wᵢ·yᵢ) / (n0 + Σ wᵢ)`, where μ0 is the rule score, yᵢ is your fun rating at the best-matching hour of each past session, and wᵢ = similarity × time decay × skill match × relevance. |
| Map / search | MapLibre GL + OpenFreeMap tiles; Nominatim geocoding (cached, ≤ 1 request/s) with English, German and Spanish direction words. |
| Storage | IndexedDB (Dexie). Nothing leaves the browser except API requests for conditions and place search. Export and import a JSON backup in Settings. Saving a session asks the browser to keep the data even when space runs low. |
| Offline | A hand-written service worker (`src/pwa/sw.js`). The build step in `vite.config.ts` writes the list of every built file and a content hash into it. App files come from that cache; a new deploy downloads in the background and the app offers *Reload*. Map tiles, fonts and sprites are cached as you view them (capped at 1,500 tiles). Conditions stay in IndexedDB: if a request fails, the newest saved copy covering that day is used and marked as saved. Sessions logged without conditions are filled in on start-up and whenever the browser comes back online (`src/lib/sync.ts`). |

Spot data for northern Fuerteventura is compiled from public spot guides (`src/data/spotGuides.ts`, sources per spot). Positions come from OpenStreetMap where it names the break or beach; the rest are approximate and flagged in the app, so drag the marker in the spot editor to correct them. The built-in spots are added to a device on first start; after that they're yours to edit.

## Next steps (not built yet)

- Accounts and sync, e.g. Supabase in Frankfurt (Postgres + PostGIS) with the same data model.
- Background Sync / periodic sync, so pending sessions fill in even when the app isn't open (Chrome/Android only today).
- A higher-resolution wave model for the Canaries (Copernicus IBI), and FES2022 tides.
- Learned per-user feature weights (Gaussian process) once there are enough sessions.
- Open-Meteo's commercial plan before any paid or public launch.
