---
type: "Feature"
title: "Explore"
description: "Region search, map and list of spots, best picks for today or now, similar past sessions."
resource: "src/components/Explore.tsx"
tags: ["feature", "explore"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Explore

* **Region:** free text (English, German, Spanish direction words) via [Nominatim](/data-sources/nominatim.md), or *Near me* (30 km). The last region is remembered (localStorage) and the query in settings.
* **Toolbar:** "You: Stage 5 · comfortable to shoulder high" (just "Stage 5" on phones) opens Settings → Your surfing; Day: Today / Tomorrow / day after.
* **Best picks for you:** top three spots, Today (best window) or Now (this hour) ([Day recommendation](/engine/day-recommendation.md)); each shows the window, surf range and peak period, wind, tide, "Best for you: <peak>" when peaks differ, suitability badge and confidence; the top one also explains itself and lists the [suitability reasons](/engine/suitability-rules.md).
* **Spot list:** cards with map thumbnail, name, break · bottom · level, description, conditions now or at the best hour, badge, best window, guide score and history confidence. Tap opens the [spot view](/features/spot-view.md) as a sheet.
* **Map:** score markers ([Maps](/architecture/maps.md)). On phones a bottom bar switches List · N / Map; the list is the default.
* **Similar sessions:** "Your past sessions in conditions like today" with % similarity and what differed most, or the nearest ones when none is close enough ([Similarity](/engine/similarity.md)).
* After sunset Explore jumps to tomorrow once and says so.
