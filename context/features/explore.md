---
type: "Feature"
title: "Explore"
description: "Area breadcrumb, day and time filters, map and list of spots, best picks for them, similar past sessions."
resource: "src/components/Explore.tsx"
tags: ["feature", "explore"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-15T15:10:00+00:00"
---
# Explore

* **Top row (narrow, 32 px):** the area as a **breadcrumb** with a pin icon ("Fuerteventura › North", split from the stored label "North of Fuerteventura"; "Near you (30 km)" stays one crumb), at most 70 % of the row; tapping it opens the area picker below (free text in English, German or Spanish direction words via [Nominatim](/data-sources/nominatim.md), or *Near me* (30 km); closes after a search, Esc closes). On the right the level name as a badge in the band's colour (e.g. "Intermediate+"; the tooltip adds stage and comfortable size); it opens Settings → Your surfing. The last area is remembered (localStorage) and the query in settings.
* **Filters:** Day (Today / Tomorrow / day after) and **Time**: "Any time" (the default, nothing set: the day's best windows), "Now" (today only, while there is daylight) or one of the day's daylight hours (from the current hour today). Changing the day keeps a chosen hour if that day has it; "Now" falls back to Any time on other days.
* **Best picks for you:** a collapsible section (tap the heading; open the first time, then remembered on the device in localStorage `surf-journal.picksOpen`; collapsed it shows only the heading). Top three spots for the Day and Time filters: the best window of the day (Any time), this hour (Now) or the chosen hour, with the heading saying which ("Best picks for you tomorrow at 14:00") ([Day recommendation](/engine/day-recommendation.md)). There is no separate time switch inside the section. The map markers keep showing each spot's best score of the day. Each pick shows the window (or "At 14:00"), surf range and peak period, wind, tide, "Best for you: <peak>" when peaks differ, suitability badge and confidence; every pick (not only the first) also explains itself and lists the [suitability reasons](/engine/suitability-rules.md), so all three show the same information. Each pick carries a confidence badge (Reliable / Less certain / Rough guide, reasons on hover), and on close scores a well-known spot ranks first ([How sure a rating is](/engine/confidence.md)). Under each pick (day mode) timing notes: wind turning onshore, models disagreeing, fairly even day.
* **Spot list:** cards with map thumbnail, name, break · bottom · level, description, conditions at the chosen hour (Time filter), else now or at the best hour, badge, best window, guide score and history confidence. Tap opens the [spot view](/features/spot-view.md) as a sheet; with an hour chosen its forecast table opens scrolled to that hour, with one hour before it (when at least four columns fit) and the following hours in view.
* **Map:** sticky beside the list on wide screens, right under the measured top bar (`--topbar-actual`); score markers ([Maps](/architecture/maps.md)). On phones a bottom bar switches List · N / Map; the list is the default.
* **Similar sessions:** "Your past sessions in conditions like today" with % similarity and what differed most, or the nearest ones when none is close enough ([Similarity](/engine/similarity.md)).
* After sunset Explore jumps to tomorrow once (without a notice: the Day filter shows it).
