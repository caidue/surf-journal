---
type: "Reference"
title: "El Hierro (one spot, three peaks)"
description: "How El Hierro, Derecha de los Alemanes, La Izquierda and The Bubble are modelled."
resource: "src/data/seedSpots.ts"
tags: ["spots", "el-hierro", "peaks"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
  - resource: "https://www.surfline.com/surf-report/the-bubble-hierro-right-/5842041f4e65fad6a7708cbf"
    id: "surfline-bubble"
  - resource: "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/the_bubble/index.html"
    id: "wannasurf-bubble"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# El Hierro (one spot, three peaks)

Sources disagree: Surfline has **one** spot, "The Bubble (Hierro Right)", describing twin breaks (Hierro Left / El Hierro, and Hierro Right / The Bubble just east); Wannasurf, fuerteventuraplayas and Windguru users keep three waves; surf-forecast has five overlapping entries. Most pins put The Bubble **east** of the bay (our old seed had it west, which was wrong).

Model since seed 4: one spot `fv-el-hierro` at Surfline's point (28.7442, −13.9481), level advanced, with three rated peaks:

| Peak | Level | Size range | Tide | Shape |
|---|---|---|---|---|
| La Izquierda (left) | advanced | 1.0–3.5 m | all | punchy, fast |
| Derecha de los Alemanes (right) | advanced | 1.2–3.0 m | low–mid | punchy, sectiony |
| The Bubble (A-frame, east) | expert | 1.4–3.5 m | mid–high | hollow, fast |

The forecast names the best peak for you each hour ([Per-peak rating](/engine/per-peak-rating.md)). The old `fv-the-bubble` spot is retired; its sessions and photos move to El Hierro on the seed refresh. The research's alternative (three separate spots) was not chosen; see [decision 0009](/decisions/0009-el-hierro-single-spot.md).
