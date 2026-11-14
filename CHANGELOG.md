# Changelog

## 1.3.0 — 2026-11-14

- **Wind over the sea, from four models.** The wind used to come from a point about 9 km inland; it now comes from the sea off each spot, as the mean of ECMWF, ICON, ARPEGE and GFS. Hover a wind cell to see each model; a "?" marks hours where they disagree on the direction. Your logged sessions are updated automatically.
- **Local knowledge for every spot**, in the Guide tab: when it works and for whom, from local and first-hand sources, each with how much the sources agree and whether the rating already uses it.
- **Spot data corrected from local sources:** La Caleta needs a northerly swell (north-west swell doesn't wrap in) and no longer prefers mid–high tide, since the sources disagree; Generosa and Spew Pits have no tide preference for the same reason; Rocky Point outside low to mid tide; El Muelle experts only; Punta Blanca mellow; Playa los Matos intermediate.

## 1.2.1 — 2026-11-14

- **"Your level" instead of "Stage 4"** in Explore: a coloured badge with your level, which opens Settings → Your surfing. Each of the 8 stages now has its own level: Beginner, Beginner+, Improver, Intermediate, Intermediate+, Advanced, Expert, Expert+. Reasons and the stage card use these names too.
- **Forecast tab opens on the table.** The recommendation card is hidden until you tap the green "Best ▾" tag on the best time in the table (or "Why?" on days with nothing for you); high and low tide times moved below the table.
- **Spot description moved to the Guide tab**, as "About this spot" at the top, instead of sitting between the spot's name and the tabs.

## 1.2.0 — 2026-11-14

- **Best picks at a time you choose:** next to the day's best and "Now", "At…" picks a time on the selected day and ranks the spots for that hour.
- **Stage card** under Settings → Your surfing (and at the end of the questions): your stage as a badge, its band (Beginner … Expert), a 1–8 ladder and badges for your answers.
- **All three best picks show the same details**: the explanation and the reasons are no longer only on the first one.
- Journal: less empty space under "hide not relevant" on phones.
- The questions' page no longer hides the footer behind the buttons, drops the "You can change this anytime" line, and spaces the two parts of "How often, and how long?".
- **El Hierro is three spots again**, as Wannasurf, surf-forecast and most guides list them: Izquierda del Hierro (the left, west side of the bay), Derecha de los Alemanes (the right, east side) and The Bubble (expert reef further east). Each has its own forecast, rating, guide and sessions, and links to Surfline's one spot for the area. "El Hierro" still finds the bay waves in search. Sessions that 1.1.0 moved from The Bubble to El Hierro stay with Izquierda del Hierro; change their spot in the session if needed.

## 1.1.0 — 2026-11-13

- **Your surfing:** a short set of questions at first launch replaces the four levels: stage (1–8), comfortable size, biggest wave caught, board, reef experience, getting out, and optional steep waves, frequency and water confidence. Edit it under Settings → Your surfing.
- **Clear reasons:** "For you" now comes from explicit rules that name both sizes ("Bigger than you're comfortable in: ~1.5 m vs chest high (1.2 m), but within the 1.6 m you've caught"), cover reef, wave shape, wind, paddle-out and the spot's level, and say when size is fine but something else isn't. Sizes are compared as shown, so a wave never counts as bigger than your comfort size when both read the same. Optional "Stretch session" for waves between your comfortable and biggest size.
- **How did it feel?** in the session log nudges your comfortable size and biggest wave in small steps, explains every change and lets you undo it. Your stage never changes by itself.
- **Periods like surf sites:** swell periods are now peak periods (they were mean periods, 2–3 s lower), from GFS-Wave swell trains, ECMWF WAM and Météo-France MFWAM combined. Energy is the strongest swell train's kJ, as on surf-forecast.com. Logged sessions are re-fetched automatically.
- **New forecast table:** spot rating (Poor … Epic) and "For you" as separate rows, surf as a face-height range with body words, the strongest swell with every train on tap (trains outside the spot's swell window greyed out), total sea, energy, wind in km/h, knots or mph, tide heights vs mean sea level.
- **Spot names follow Surfline**, other names stay searchable: Generosa (Generoso), Los Lobos, El Burro (Glass Beach), Cotillo (Piedra Playa), Bristol (Shooting Gallery), El Muelle. Links to Surfline and surf-forecast.com in each spot's Info tab. Majanicho, El Hierro and Punta Blanca pins moved to where the forecast services put them.
- **Three more spots** that other services list, with guides: Corralejo Beach and Playa los Matos (dune beaches, all levels) and Suicides (expert lava reef on the North Shore, with a less risky inside left). Mejillones moved west of Suicides, as the forecast sites place it.
- **El Hierro** is one spot with three peaks (La Izquierda, Derecha de los Alemanes, The Bubble), each rated on its own; the forecast tells you which suits you best. Spots also know their wave shape, peel, crowds, localism and lifeguard.
- **Knowledge base** in `context/` (Open Knowledge Format), kept current with every change.

## 1.0.1 — 2026-11-13

- Fixes the package lockfile in the 1.0.0 tag, where the version bump also changed a map dependency (`@mapbox/point-geometry`) and broke clean installs. No changes to the app itself.

## 1.0.0 — 2026-11-13

First release. Live at https://caidue.github.io/surf-journal/

- **Explore:** search a region (English, German, Spanish) or use your location. Map of spots with a score for your level, the best pick with a time window and the reasons, and past sessions in similar conditions (or the nearest ones, with what differs).
- **Spot popup:** tap a spot for its full description, best time, and an hourly forecast table: rating, surf height, swell, wave energy, wind and a tide curve with high/low times.
- **Spot guides** for 17 northern Fuerteventura spots: peaks (break, bottom, direction, level, when it's good), best months, boards, paddling in and out, warnings, parking, nearby facilities, sources, and credited Wikimedia Commons photos. Add your own photos too.
- **Log sessions** on the day's conditions timeline: mark your time in the water, rate fun, wave quality and exertion with one slider each, add board, crowd, size seen, tags and notes.
- **Personal recommendations** that blend a rule-based spot guide with your own ratings in similar conditions; mark old sessions as not relevant.
- **Installable and offline:** add to your home screen; the app, your journal, saved forecasts, map areas and photos you've seen work without signal. Sessions logged offline get their conditions when you're back online.
- **Your data stays on your device** (IndexedDB), with JSON export/import.
