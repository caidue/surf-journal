# Knowledge base log

## 2026-11-17

* **Update** of [Releases](/operations/releases.md): 1.6.9 committed, tagged `v1.6.9` and pushed.
* **Update** of [Session logging](/features/session-logging.md) (Delete at the bottom, confirm window) and [UI shell](/architecture/ui-shell.md) (`ConfirmDialog`).
* **Update** of [Forecast table](/features/forecast-table.md) (arrows side by side, waves of all swells when unfolded), [Journal](/features/journal.md) (trip form as a window), [UI shell](/architecture/ui-shell.md) (`.dialog`, header wrap).
* **Update** of [Forecast table](/features/forecast-table.md) (Period row), [Releases](/operations/releases.md) (1.6.9).

## 2026-11-16

* **Update** of [Releases](/operations/releases.md): 1.6.4–1.6.8 committed together, tagged `v1.6.8` and pushed.
* **Update** of [Forecast table](/features/forecast-table.md): swell waves face left when the swell comes from a poor direction for the spot.
* **Update** of [Forecast table](/features/forecast-table.md): swell colours by energy (blue, red, purple; grey outside the window).
* **Update** of [Forecast table](/features/forecast-table.md): the swells as small waves in the Swell row (main in front, 2nd / 3rd violet behind); the Wave row's figure removed; [pending: threshold tuning](/decisions/pending/threshold-tuning.md) display values.
* **Update** of [Forecast table](/features/forecast-table.md) (2nd / 3rd swell as violet arrows in the folded Swell row; the mirrored waves in the Wave row were tried and removed again), [Releases](/operations/releases.md) (1.6.8).
* **Update** of [Spot guide](/features/spot-guide.md) (photo viewer arrows, keys, swipe), [Releases](/operations/releases.md) (1.6.7).
* **Update** of [Explore](/features/explore.md) and [Day recommendation](/engine/day-recommendation.md) (explanation line kinds: journal icon, minus), [Releases](/operations/releases.md) (1.6.6).
* **Update** of [Explore](/features/explore.md) (desktop: no page scroll, only the list scrolls), [UI shell](/architecture/ui-shell.md), [Releases](/operations/releases.md) (1.6.5).
* **Update** of [Journal](/features/journal.md) (title as a trip dropdown with edit/delete; chips removed), [Releases](/operations/releases.md) (1.6.4).
* **Update** of [Releases](/operations/releases.md): 1.6.2 and 1.6.3 committed together, tagged `v1.6.3` and pushed.
* **Update** of [Journal](/features/journal.md) (title from the trip filter, + button, no search, one filter row), [Session logging](/features/session-logging.md) (`?trip=` pre-fill), [Releases](/operations/releases.md) (1.6.3).
* **Update** of [Explore](/features/explore.md), [Spot view](/features/spot-view.md), [Day recommendation](/engine/day-recommendation.md), [How sure a rating is](/engine/confidence.md), [UI shell](/architecture/ui-shell.md) (`PickDetails`), [Releases](/operations/releases.md) (1.6.2): no suitability badge, peak and even day as bullets, no "No logged sessions" line.
* **Update** of [Releases](/operations/releases.md): 1.6.1 committed, tagged `v1.6.1` and pushed.
* **Update** of [Explore](/features/explore.md) and [Spot view](/features/spot-view.md) (card layout: go line with tide, condition badges, suitability with peak, confidence footer), [Day recommendation](/engine/day-recommendation.md) (Go any time on even days), [How sure a rating is](/engine/confidence.md), [UI shell](/architecture/ui-shell.md), [Releases](/operations/releases.md) (1.6.1).
* **Update** of [Releases](/operations/releases.md): 1.6.0 committed, tagged `v1.6.0` and pushed.
* **Update** of [Explore](/features/explore.md): badges under the conditions line, then peak, timing notes, reasons, explanation.
* **Update** of [UI shell](/architecture/ui-shell.md): no page overscroll bounce; `StepSlider`.
* **Update** of [Session logging](/features/session-logging.md) (step sliders for size seen and feel, tags input removed) and [Journal](/features/journal.md) (search placeholder).
* **Update** of [Forecast table](/features/forecast-table.md) (one Rating row for me or the Rate-for level, Spot row removed, no "now" label), [Per-peak rating](/engine/per-peak-rating.md), [Session logging](/features/session-logging.md) (no help text above the chart).
* **Creation** of [0021: Rate spots for another level](/decisions/0021-rate-for-another-level.md). **Update** of [Explore](/features/explore.md) (Rate for menu on the level chip), [Spot view](/features/spot-view.md), [Forecast table](/features/forecast-table.md) ("For Advanced" row), [Day recommendation](/engine/day-recommendation.md) (`opts.history`, `explain(…, forLevel)`), [Testing](/operations/testing.md), [Releases](/operations/releases.md).
* **Creation** of [0020: Trips](/decisions/0020-trips.md). **Update** of [Journal](/features/journal.md) (trip chips, trip header, trip form), [Session logging](/features/session-logging.md) (Trip select), [Storage](/architecture/storage.md) (version 4, trips table, backup), [Data model](/architecture/data-model.md) (Trip, `tripId`), [Code map](/architecture/code-map.md), [Testing](/operations/testing.md) (trips.test.ts), [Releases](/operations/releases.md).
* **Update** of [Explore](/features/explore.md) (one ranked list of spots for you instead of Best picks plus a list), [Day recommendation](/engine/day-recommendation.md), [How sure a rating is](/engine/confidence.md), [Maps](/architecture/maps.md) (markers follow the filters), [Product overview](/product/overview.md), [Releases](/operations/releases.md) (1.6.0).
* **Update** of [Explore](/features/explore.md): one filter panel (area and level, day and time in matching controls), softer level chip, quieter list heading.

## 2026-11-15

* **Update** of [Releases](/operations/releases.md): 1.5.0 committed, tagged `v1.5.0` and pushed.
* **Update** of [Explore](/features/explore.md) (area breadcrumb and level badge row, Time filter driving Best picks and the spot list, tomorrow notice removed), [Day recommendation](/engine/day-recommendation.md), [Forecast table](/features/forecast-table.md) (opens at the chosen time), [Releases](/operations/releases.md) (1.5.0).
* **Update** of [Releases](/operations/releases.md): 1.4.7 committed, tagged `v1.4.7` and pushed.
* **Update** of [Forecast table](/features/forecast-table.md): back to the slim breaking-wave figure, with a pointed peak; [Releases](/operations/releases.md) (1.4.7).
* **Update** of [Releases](/operations/releases.md): 1.4.6 committed, tagged `v1.4.6` and pushed.
* **Update** of [Forecast table](/features/forecast-table.md) (Wave row, new wave figure, Legend & sources incl. the data line) and [Spot view](/features/spot-view.md) (tide chips below their title), [Releases](/operations/releases.md) (1.4.6).
* **Update** of [Releases](/operations/releases.md): 1.4.5 committed, tagged `v1.4.5` and pushed.
* **Update** of [Forecast table](/features/forecast-table.md) (wave figures, Spot score pill, strong gusts only), [Spot view](/features/spot-view.md) (fixed tab row in the popup, no overscroll), [Releases](/operations/releases.md) (1.4.5) and [pending: threshold tuning](/decisions/pending/threshold-tuning.md).
* **Update** of [Releases](/operations/releases.md): 1.4.4 committed, tagged `v1.4.4` and pushed.
* **Update** of [Forecast table](/features/forecast-table.md): the Wind row labels the gusts.
* **Update** of [Forecast table](/features/forecast-table.md): the Surf row shows one height per hour; range and body words in the tooltip.
* **Update** of [Spot view](/features/spot-view.md): no vertical scrollbar on the tab bar; session rows on phones; [Releases](/operations/releases.md) (1.4.4).
* **Update** of [Releases](/operations/releases.md): 1.4.3 committed, tagged `v1.4.3` and pushed.
* **Update** of [Insights](/engine/insights.md): tide stage shows the average fun per stage (like wind), with your average as reference; [Releases](/operations/releases.md) (1.4.3).
* **Update** of [Releases](/operations/releases.md): 1.4.2 committed, tagged `v1.4.2` and pushed.
* **Update** of [Spot view](/features/spot-view.md) (recommendation below the forecast, Best time tab removed, scroll reset on tab change, sticky tabs under the measured top bar), [Forecast table](/features/forecast-table.md) (legend toggle) and [Explore](/features/explore.md) (map sticky offset), [Releases](/operations/releases.md) (1.4.2).

## 2026-11-14

* **Update** of [Releases](/operations/releases.md): 1.4.1 committed, tagged `v1.4.1` and pushed.
* **Update**: removed the photo dot on the spot view's Guide tab (no knowledge file described it).
* **Update** of [Spot view](/features/spot-view.md) (fixed popup height) and [Onboarding](/features/onboarding.md) (edit mode: "Done" saves and returns, no summary).
* **Update** of [Explore](/features/explore.md): Best picks is a collapsible section, remembered per device.
* **Update** of [Spot view](/features/spot-view.md) (new Best time tab with the recommendation and the forecast for those hours), [Forecast table](/features/forecast-table.md) (`only`, `legend`; no Best tag or window line) and [Day recommendation](/engine/day-recommendation.md).
* **Update** of [Forecast table](/features/forecast-table.md): the tide curve spans the full width.
* **Update** of [Forecast table](/features/forecast-table.md) (now marker), [Explore](/features/explore.md) and [Day recommendation](/engine/day-recommendation.md) (day badge removed), [UI shell](/architecture/ui-shell.md) (reason marks in the text colour), [Releases](/operations/releases.md) (1.4.1) and [pending: threshold tuning](/decisions/pending/threshold-tuning.md).
* **Update** of [Releases](/operations/releases.md): 1.4.0 committed, tagged `v1.4.0` and pushed.
* **Update** of [UI shell](/architecture/ui-shell.md): reasons use ✓ / − / ✕ instead of coloured dots; explanation, reasons and timing notes share one icon column.
* **Creation** of [How sure a rating is](/engine/confidence.md) and [decision 0019](/decisions/0019-rating-confidence.md) (confidence per rating, withheld ratings for undocumented expert reefs at low tide).
* **Update** of [Day recommendation](/engine/day-recommendation.md), [Explore](/features/explore.md), [Spot view](/features/spot-view.md), [Forecast table](/features/forecast-table.md), [Local knowledge](/spots/local-knowledge.md) (Derecha tide and Lobos size as their own rules), [Spot catalogue](/spots/catalogue.md) (seed 8, `dataNote`), [Data model](/architecture/data-model.md), [Code map](/architecture/code-map.md), [Testing](/operations/testing.md) and [pending: threshold tuning](/decisions/pending/threshold-tuning.md).
* **Creation** of [Rules engine](/engine/rules-engine.md) and [decision 0018](/decisions/0018-rules-engine.md) (executable local rules limited by confidence, size fit, no cliffs).
* **Update** of [Spot rating](/engine/spot-rating.md), [Suitability rules](/engine/suitability-rules.md), [Day recommendation](/engine/day-recommendation.md), [Tides](/domain/tides.md), [Local knowledge](/spots/local-knowledge.md), [Explore](/features/explore.md), [Data model](/architecture/data-model.md), [Code map](/architecture/code-map.md), [Testing](/operations/testing.md), [Releases](/operations/releases.md) (1.4.0) and [pending: threshold tuning](/decisions/pending/threshold-tuning.md).
* **Update** of [Releases](/operations/releases.md): 1.3.0 committed, tagged `v1.3.0` and pushed.
* **Creation** of [Local knowledge](/spots/local-knowledge.md), [decision 0016](/decisions/0016-sea-wind-multi-model.md) (wind over the sea, four models), [decision 0017](/decisions/0017-local-knowledge-rules.md) (sourced spot rules) and the research copies [Rating errors at La Caleta](/research/rating-errors-at-la-caleta.md) and [Local surf school spot knowledge](/research/local-surf-school-spot-knowledge.md).
* **Update** of [Open-Meteo weather](/data-sources/open-meteo-weather.md), [Wind](/domain/wind.md), [Data model](/architecture/data-model.md) (`CONDITIONS_VERSION` 3, `windModels`, `windSpread`, `SpotRule`), [Code map](/architecture/code-map.md), [Spot catalogue](/spots/catalogue.md) (seed 7 corrections), [Spot guide](/features/spot-guide.md), [Forecast table](/features/forecast-table.md), [Releases](/operations/releases.md) (1.3.0) and the pending notes on [spot pins](/decisions/pending/verify-spot-pins.md) and [threshold tuning](/decisions/pending/threshold-tuning.md).
* **Update** of [Releases](/operations/releases.md): 1.2.1 committed, tagged `v1.2.1` and pushed.
* **Update** of [Skill profile](/engine/skill-profile.md), [Explore](/features/explore.md), [Settings](/features/settings.md) and [Suitability rules](/engine/suitability-rules.md): one level name per stage (Beginner … Expert+), shown as the "Your level" badge in Explore and in place of "stage N" in texts.
* **Update** of [Spot view](/features/spot-view.md) and [Forecast table](/features/forecast-table.md): table first; recommendation card hidden until the best window's "Best" tag opens it; tide chips below the table.
* **Update** of [Spot guide](/features/spot-guide.md) and [Spot view](/features/spot-view.md): the description opens the Guide tab ("About this spot") instead of the header; [Releases](/operations/releases.md) for 1.2.1.
* **Update** of [Releases](/operations/releases.md): 1.2.0 committed, tagged `v1.2.0` and pushed.
* **Update** of [Explore](/features/explore.md): all three best picks show the same details (explanation and suitability reasons).
* **Update** of [Explore](/features/explore.md) (best picks at a picked time), [Settings](/features/settings.md) and [Onboarding](/features/onboarding.md) (stage card; footer above the action bar; helper text removed; spacing in step 8), [Skill profile](/engine/skill-profile.md) (short stage names, skill bands) and [Code map](/architecture/code-map.md) (`StageCard.tsx`).
* **Creation** of [decision 0015](/decisions/0015-split-el-hierro.md): El Hierro split into three spots (Izquierda del Hierro, Derecha de los Alemanes, The Bubble) after checking Surfline, Wannasurf, surf-forecast, fuerteventuraplayas, vvanat.fr, Windguru and OSM. **Deprecation** of [decision 0009](/decisions/0009-el-hierro-single-spot.md) (superseded).
* **Update** of [El Hierro area](/spots/el-hierro.md) (rewritten), [Spot catalogue](/spots/catalogue.md) (seed 6, 21 spots), [Spot naming](/spots/naming.md), [Per-peak rating](/engine/per-peak-rating.md), [Surfline](/data-sources/surfline.md), [surf-forecast](/data-sources/surf-forecast.md), [Storage](/architecture/storage.md), [Testing](/operations/testing.md), [Glossary](/product/glossary.md), [Releases](/operations/releases.md) (1.2.0) and the pending notes on [spot pins](/decisions/pending/verify-spot-pins.md) and [compounding challenges](/decisions/pending/compounding-challenges.md).

## 2026-11-13

* **Update** of [Releases](/operations/releases.md): 1.1.0 committed, tagged `v1.1.0` and pushed.
* **Update** of [Spot catalogue](/spots/catalogue.md), [Spot naming](/spots/naming.md), [Surfline](/data-sources/surfline.md), [surf-forecast](/data-sources/surf-forecast.md), [Storage](/architecture/storage.md) and [pending: spot pins](/decisions/pending/verify-spot-pins.md) for seed 5: Suicides, Playa los Matos and Corralejo Beach added, Mejillones pin moved ([decision 0013](/decisions/0013-add-spots-other-services-list.md)).
* **Creation** of [decision 0014](/decisions/0014-link-out-never-fetch.md) after reading Surfline's terms: external ids only build links; the app never fetches from Surfline or surf-forecast. **Deprecation** (removal) of the pending files "Add Corralejo Beach, Playa los Matos, Suicides?" and "Check Surfline's terms for storing spot ids", now decided.
* **Update** of [Suitability rules](/engine/suitability-rules.md): sizes are compared at the shown precision.
* **Creation** of the bundle (Open Knowledge Format v0.2) with folders product, architecture, data-sources, domain, engine, features, spots, influences, decisions (+ pending), research and operations, covering the app as of v1.0.1 and the v1.1 changes below. Rule added to `CLAUDE.md`: every repo change updates the related files here.
* **Creation** of [Open-Meteo marine (four models)](/data-sources/open-meteo-marine.md), [Wave periods](/domain/wave-periods.md), [Swell trains](/domain/swell-trains.md) and [Wave energy](/domain/wave-energy.md) for the switch to peak periods, GFS-Wave swell trains scaled to MFWAM, ECMWF peak period and strongest-train energy ([0005](/decisions/0005-open-meteo-multi-model.md), [0006](/decisions/0006-peak-period-convention.md), [0007](/decisions/0007-strongest-train-energy.md), [0011](/decisions/0011-gain-recalibration.md)).
* **Creation** of [Skill profile](/engine/skill-profile.md), [Suitability rules](/engine/suitability-rules.md), [Profile learning](/engine/profile-learning.md) and [Onboarding](/features/onboarding.md) for the skill profile that replaces the four levels ([0010](/decisions/0010-skill-profile-replaces-levels.md)).
* **Creation** of [Spot catalogue](/spots/catalogue.md), [Spot naming](/spots/naming.md), [El Hierro](/spots/el-hierro.md) and [Per-peak rating](/engine/per-peak-rating.md) for Surfline names, aliases, external ids, the El Hierro merge and per-peak rating ([0008](/decisions/0008-surfline-naming-and-aliases.md), [0009](/decisions/0009-el-hierro-single-spot.md)).
* **Creation** of [the forecast table](/features/forecast-table.md) description for the overhaul (spot rating vs For you, face range with body words, expandable swell trains, strongest-train energy, mph).
* **Update** of [Releases](/operations/releases.md), [Commands](/operations/commands.md) and [Code map](/architecture/code-map.md) for version 1.1.0 and the `npm run context` script.
* **Creation** of the research reports [Surf journal app feasibility](/research/surf-journal-app-feasibility.md) (2026-11-12) and [Surf metrics, spot data and skill model](/research/surf-metrics-spots-and-skill-model.md) (2026-11-13).
