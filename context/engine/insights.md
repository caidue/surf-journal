---
type: "Reference"
title: "Insights per spot"
description: "What your fun ratings say about tide stage and wind at a spot."
resource: "src/lib/recommend.ts"
tags: ["engine", "insights"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-15T10:10:00+00:00"
---
# Insights per spot

`insights(spot, sessions)`: every surfed hour counts with its minutes in the water. Tide stage (low/mid/high, rising/falling) and wind kind both show the **average fun rating** in those conditions; your plain average at the spot (`mean`, over `sessions`) is printed above the bars as the reference. Shown as bars in the spot's Sessions tab. (Until 1.4.3 tide was shown relative to your average, which made a spot with one session read "0.0" at every stage, i.e. no bars.)
