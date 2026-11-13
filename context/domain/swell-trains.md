---
type: "Reference"
title: "Swell trains"
description: "Primary, secondary, tertiary swell and wind sea, and how they are combined."
resource: "src/lib/conditions.ts"
tags: ["domain", "waves"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Swell trains

A sea state is several trains: up to three swells from distant storms plus the local wind sea. GFS-Wave 0.16° reports each with height, **peak** period and direction; missing trains are 0/0/0. Heights are scaled so the trains add up to MFWAM's total Hs (MFWAM models island sheltering better).

* `partitions(c)` (`src/lib/conditions.ts`) turns `HourConditions.trains` into partitions; wind sea counts with weight 0.7 in breaking height (short, disorganised waves break weaker). With no trains, the total sea (Hs, Tp, direction) is used.
* `trainsByEnergy(c)` sorts trains by energy; the strongest is the **headline swell** in the forecast table, Explore and the timeline. The table expands into Swell 1–3 (by energy), Wind sea and Total sea; trains outside the spot's swell window are greyed out.
