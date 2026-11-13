# Decisions

Accepted decisions (numbered) and pending ones.

* [0001: Local-first storage in IndexedDB, no backend](0001-local-first-indexeddb.md) - All user data stays in the browser.
* [0002: Static hosting on GitHub Pages](0002-github-pages-static-hosting.md) - Build once, serve static files over HTTPS.
* [0003: WebAssembly builds of esbuild and Rollup](0003-wasm-build-tools.md) - Avoid native binaries the Mac blocks.
* [0004: No backwards compatibility while unreleased](0004-no-backwards-compatibility.md) - Change schemas and data freely.
* [0005: Four wave models in one Open-Meteo request](0005-open-meteo-multi-model.md) - MFWAM height, ECMWF peak period, GFS-Wave trains, Météo-France currents.
* [0006: Show and rate peak periods](0006-peak-period-convention.md) - Peak period everywhere a period appears.
* [0007: Headline energy = strongest train](0007-strongest-train-energy.md) - Match surf-forecast's energy number.
* [0008: Surfline names, aliases and external ids](0008-surfline-naming-and-aliases.md) - Use the best-known app's spot names; keep the rest searchable.
* [0009: El Hierro as one spot with three peaks](0009-el-hierro-single-spot.md) - Merge The Bubble into El Hierro, rate per peak.
* [0010: Skill profile replaces the four levels](0010-skill-profile-replaces-levels.md) - Stage, comfortable size, biggest size, board and experience instead of beginner…expert.
* [0011: Recalibrate default gains for peak periods](0011-gain-recalibration.md) - Keep displayed surf heights stable after the period change.
* [0012: No peak split in session logs](0012-no-peak-split-in-sessions.md) - Sessions are per spot, not per peak.
* [0013: Add the spots other services list](0013-add-spots-other-services-list.md) - Corralejo Beach and Playa los Matos (Surfline) and Suicides (surf-forecast, Wannasurf) became built-in spots in seed 5.
* [0014: Link to Surfline and surf-forecast, never fetch from them](0014-link-out-never-fetch.md) - External spot ids are only used to build links; no data is requested from or copied out of those services.

# Pending decisions

* [Accounts, sync and a commercial data plan](pending/accounts-and-sync.md) - What a public release would need.
* [Should several challenging causes compound?](pending/compounding-challenges.md) - Worst status wins, so two problems count like one.
* [Ask Open-Meteo for per-train peak periods in MFWAM](pending/open-meteo-upstream.md) - Upstream improvement, not ours to build.
* [Wave data for sessions before October 2021](pending/pre-2021-history.md) - Explicit models return nothing before MFWAM's archive.
* [Tune the skill thresholds](pending/threshold-tuning.md) - The rule thresholds are design proposals.
* [Verify uncertain spot pins](pending/verify-spot-pins.md) - Pins that disagree between sources.
