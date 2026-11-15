---
type: "Reference"
title: "Day recommendation and best picks"
description: "Best time window per spot and the top three spots for today or right now."
resource: "src/lib/recommend.ts"
tags: ["engine", "recommendation"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-16T16:00:00+00:00"
---
# Day recommendation and best picks

`recommendSpotDay(spot, hours, days, sessions, settings, profile, date, today, nowMin)`:
* calibrates the gain, derives every hour, rates it per peak, predicts For you;
* **daylight** hours = at least half the hour between sunrise and sunset;
* **best window** = the best single or two consecutive upcoming daylight hours (average score), clipped to daylight;
* `now` = the current hour when looking at today; `dayOver` when no daylight is left (Explore then jumps to tomorrow once);
* `windTurn`: the first hour within 3 h after the window starts where the wind factor drops below 0.5 (and by more than 0.15) → "The wind turns onshore around 13:00: go early.";
* `evenDay`: the best window beats the median of the other windows by less than 0.5 → the cards say "Go any time" instead of a window (and no tide); `TimingNotes` only writes "Fairly even day" where `showEven` is left on;
* `sure` on every hour ([How sure a rating is](/engine/confidence.md)): Reliable / Less certain / Rough guide, or `withheld` (score 0, never a best window);
* `windUnsure`: the wind models disagree by ≥ 45° at the best hour → "check the wind before you go".

`TimingNotes` (ui.tsx) shows the wind turn and model disagreement (marked "!") under each card (Any time only) and on the spot's recommendation card (below the forecast table).

`recommendSpotDay(…, opts)`: `opts.history === false` rates for someone else (Rate for): no session history in the prediction (score = rule score, `sumW` 0); your sessions still calibrate the spot's size gain. `explain(r, fmt, forLevel)` then opens with "Rated for a typical <level> surfer …".

**Ranked spot list** (Explore, which replaced the top-three best picks): every spot, by best-window score (Time filter "Any time"), by this hour's score ("Now") or by the chosen hour's score; spots not for you or without a rating at that hour follow. Every card shows the explanation (incl. "Local knowledge (sources agree): …" lines for rules that changed the hour) and suitability reasons.
