---
type: "Reference"
title: "Day recommendation and best picks"
description: "Best time window per spot and the top three spots for today or right now."
resource: "src/lib/recommend.ts"
tags: ["engine", "recommendation"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Day recommendation and best picks

`recommendSpotDay(spot, hours, days, sessions, settings, profile, date, today, nowMin)`:
* calibrates the gain, derives every hour, rates it per peak, predicts For you;
* **daylight** hours = at least half the hour between sunrise and sunset;
* **best window** = the best single or two consecutive upcoming daylight hours (average score), clipped to daylight;
* `now` = the current hour when looking at today; `dayOver` when no daylight is left (Explore then jumps to tomorrow once).

**Best picks** (Explore): the top three spots by best-window score ("Today") or by this hour's score ("Now"), with score > 0.5. The top pick also shows the explanation and suitability reasons.
