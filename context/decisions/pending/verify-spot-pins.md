---
type: "Decision"
title: "Verify uncertain spot pins"
description: "Pins that disagree between sources."
tags: ["decision", "pending", "spots"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
status: "draft"
decision_status: "pending"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T23:35:00+00:00"
---
# Verify uncertain spot pins

Open: Mejillones (moved in seed 5 to surf-forecast's longitude, 28.7485, −13.9106, so it sits west of Suicides as both forecast sites order them; a Wannasurf comment had put it at −13.893); Suicides (Wannasurf 28.7556, −13.8951, "approximate"; surf-forecast −13.9058, 1 km further west); Corralejo Beach and Playa los Matos (Surfline latitudes snapped to the OSM shoreline, 200 m apart); Playa del Moro (OSM beach vs Surfline 1.2 km north); La Caleta vs Mejillones vs surf-forecast's "Mechihonas"; exact positions of Derecha de los Alemanes and The Bubble; Punta Blanca now at Surfline's pin (moved 1.5 km). Needs a local check or an authoritative map (Grafcan/IDECanarias). Spots flagged `coordsApprox` show a warning in the Info tab.
