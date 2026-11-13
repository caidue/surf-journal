# Surf Journal

A local-first surf journal that imports real conditions for every session and learns which spots and conditions you enjoy.

## What it does

- **Your surfing:** at first launch a few questions set up your skill profile: stage (1–8), the size you're comfortable in, the biggest you've caught, board, reef experience, getting out on bigger days, and optionally steep waves, how often you surf and water confidence. Every recommendation is checked against it with plain reasons ("Bigger than you're comfortable in: ~1.5 m vs chest high (1.2 m), but within the 1.6 m you've caught"). Change it anytime under Settings → Your surfing; sessions you log with "How did it feel?" nudge it in small, explained, undoable steps.
- **Spot popup:** tap a spot on the map for its full description, the best time for you and an hourly forecast table: spot rating (Poor … Epic) and your own score, surf as a face-height range with body words, the strongest swell train with its **peak** period (expandable into every train), wave energy, wind (km/h, knots or mph) and a tide curve with high/low times. Spots with several peaks (e.g. Suicides) are rated per peak: "Best for you: Inside left".
- **Explore:** type a region ("northern part of Fuerteventura", "Norden von Fuerteventura") or use *Near me*. You get a map and a list of spots with a description and current conditions, plus a score **for you**. "Best picks" lists the top three spots for today (best time window) or right now (this hour), and explains the top one. Choose today, tomorrow or the day after.
- **Similar sessions:** see past sessions logged in conditions like today's, with a similarity percentage and the condition that differed most.
- **Personal recommendations:** each spot's score starts from a rule-based guide (size × period × wind × tide, gated by your level). As you log sessions, it is blended with your own fun ratings from sessions in similar conditions (a kernel-weighted nearest-neighbour estimate). A confidence label shows how much history is behind each number.
- **Log a session:** pick a spot and date, and the day's hourly conditions are imported (surf height estimate, swell period and direction, wind, tide). Then:
  - drag on the timeline to mark when you were in the water;
  - rate it 1–10 with one slider per category: fun (required), exertion, confidence, plus your own;
  - add details in groups (waves: size you saw, vs forecast, waves caught; gear: board, wetsuit; crowd & vibe: crowd, tags), and notes.
- **Not relevant anymore:** mark single sessions, or every session before a date (e.g. after a big jump in skill). They stay in the journal but stop counting for predictions. Older sessions also fade out with a configurable half-life, and sessions logged at another surfing stage count less.
- **Spot names** follow Surfline, the best-known surf app (Generosa, Los Lobos, El Burro (Glass Beach), Cotillo…); other names stay searchable (Generoso, Isla de Lobos, Glass Beach, Piedra Playa…), and each spot links to Surfline and surf-forecast.com.
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
npm run context    # regenerate context/ indexes and check the knowledge base format
```

To use it on your phone it needs to be on HTTPS (service workers only run on HTTPS or `localhost`). `.github/workflows/pages.yml` tests, builds and publishes it to GitHub Pages on every push to `main`. Turn it on once under **Settings → Pages → Source: GitHub Actions**. On a free GitHub plan the repo has to be public for Pages to work. `dist/` also works on any other static host (Netlify, Cloudflare Pages).

`package.json` overrides esbuild and Rollup with their WebAssembly builds (`esbuild-wasm`, `@rollup/wasm-node`), so nothing native has to be downloaded and executed. That is a little slower than the native builds. On a machine where native binaries run fine, you can delete the `overrides` block and reinstall.

New here? Go to **Settings → Add demo sessions**. This adds 12–16 random sessions on real past dates at your spots, with real conditions and invented ratings, so you can see the matching and recommendations working. Each time gives a new random set; remove them in one click.

## How it works

| Part | Choice |
|---|---|
| Data | [Open-Meteo](https://open-meteo.com/) Marine API with four models in one request: Météo-France MFWAM (total height), ECMWF WAM (peak period), NOAA GFS-Wave 0.16° (swell trains with peak periods, scaled to MFWAM's height) and Météo-France currents (sea level incl. tide, SST). Plus the Forecast, Historical-forecast and ERA5 Archive APIs (wind, sunrise and sunset). Free, no key; **CC BY 4.0, non-commercial** on the free tier. |
| Surf height | Offshore model values are sampled 2.5 km seaward of the spot. Breaking height uses the Komar–Gaughan formula per swell train (peak period), attenuated by the spot's swell window, times a per-spot factor that calibrates from your observations. Shown as a face-height range with body words. |
| Rating | Spot rating `quality = 10 × size × period × wind × tide` (multiplicative, so one fatal flaw sinks it). For you: quality × suitability, where explicit rules compare the hour with your skill profile (size vs comfortable and biggest size, spot level vs stage, reef, wave shape, wind, paddle-out, water confidence) and say why. Rated per peak where peaks differ. |
| Similarity | Weighted, tolerance-scaled distance over spot-relative features: log size, period, swell angle, offshore and cross-shore wind, tide height and tide trend. A Gaussian kernel turns distance into a similarity score. |
| Prediction | `ŷ = (n0·μ0 + Σ wᵢ·yᵢ) / (n0 + Σ wᵢ)`, where μ0 is the rule score, yᵢ is your fun rating at the best-matching hour of each past session, and wᵢ = similarity × time decay × stage match × relevance. |
| Map / search | MapLibre GL + OpenFreeMap tiles; Nominatim geocoding (cached, ≤ 1 request/s) with English, German and Spanish direction words. |
| Storage | IndexedDB (Dexie). Nothing leaves the browser except API requests for conditions and place search. Export and import a JSON backup in Settings. Saving a session asks the browser to keep the data even when space runs low. |
| Offline | A hand-written service worker (`src/pwa/sw.js`). The build step in `vite.config.ts` writes the list of every built file and a content hash into it. App files come from that cache; a new deploy downloads in the background and the app offers *Reload*. Map tiles, fonts and sprites are cached as you view them (capped at 1,500 tiles). Conditions stay in IndexedDB: if a request fails, the newest saved copy covering that day is used and marked as saved. Sessions logged without conditions are filled in on start-up and whenever the browser comes back online (`src/lib/sync.ts`). |

Spot data for northern Fuerteventura is compiled from public spot guides (`src/data/spotGuides.ts`, sources per spot). Positions come from OpenStreetMap or Surfline where they agree with the guides; the rest are approximate and flagged in the app, so drag the marker in the spot editor to correct them. Built-in spots are refreshed when the app's spot list changes (`SEED_VERSION`); your own spots are never touched.

## Knowledge base

`context/` holds the project's knowledge base in [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format) v0.2: architecture, data sources, surf domain, engine, features, spots, influences, decisions (accepted and pending), research and operations. Start at [`context/index.md`](context/index.md). Every change to the repo updates the related files there (see `CLAUDE.md`); `npm run context` regenerates the indexes and checks the format.

## Next steps (not built yet)

- Accounts and sync, e.g. Supabase in Frankfurt (Postgres + PostGIS) with the same data model.
- Background Sync / periodic sync, so pending sessions fill in even when the app isn't open (Chrome/Android only today).
- A higher-resolution wave model for the Canaries (Copernicus IBI), and FES2022 tides.
- Learned per-user feature weights (Gaussian process) once there are enough sessions.
- Open-Meteo's commercial plan before any paid or public launch.
