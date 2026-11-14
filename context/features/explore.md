---
type: "Feature"
title: "Explore"
description: "Region search, map and list of spots, best picks for the day, now or a picked time, similar past sessions."
resource: "src/components/Explore.tsx"
tags: ["feature", "explore"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T20:30:00+00:00"
---
# Explore

* **Region:** free text (English, German, Spanish direction words) via [Nominatim](/data-sources/nominatim.md), or *Near me* (30 km). The last region is remembered (localStorage) and the query in settings.
* **Toolbar:** "Your level" with the level name as a badge in the band's colour (e.g. "Intermediate+"; the label is hidden on phones, the tooltip adds stage and comfortable size); it opens Settings → Your surfing; Day: Today / Tomorrow / day after.
* **Best picks for you:** top three spots for the selected day: the day (best window; the button is named after the day), Now (this hour, today only) or **At…** with a time picker (the day's daylight hours, from the current hour today; defaults to the top pick's best hour, and "Best picks … at 14:00" in the heading) ([Day recommendation](/engine/day-recommendation.md)). The map markers keep showing each spot's best score of the day. Each pick shows the window (or "At 14:00"), surf range and peak period, wind, tide, "Best for you: <peak>" when peaks differ, suitability badge and confidence; every pick (not only the first) also explains itself and lists the [suitability reasons](/engine/suitability-rules.md), so all three show the same information. Each pick carries a confidence badge (Reliable / Less certain / Rough guide, reasons on hover), and on close scores a well-known spot ranks first ([How sure a rating is](/engine/confidence.md)). Next to the heading a day verdict (Worth going / Marginal / Not much for you); under each pick (day mode) timing notes: wind turning onshore, models disagreeing, fairly even day.
* **Spot list:** cards with map thumbnail, name, break · bottom · level, description, conditions now or at the best hour, badge, best window, guide score and history confidence. Tap opens the [spot view](/features/spot-view.md) as a sheet.
* **Map:** score markers ([Maps](/architecture/maps.md)). On phones a bottom bar switches List · N / Map; the list is the default.
* **Similar sessions:** "Your past sessions in conditions like today" with % similarity and what differed most, or the nearest ones when none is close enough ([Similarity](/engine/similarity.md)).
* After sunset Explore jumps to tomorrow once and says so.
