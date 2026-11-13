---
type: "Reference"
title: "surf-forecast.com"
description: "Forecast conventions we match, and break slugs we link to."
resource: "https://www.surf-forecast.com/"
tags: ["data-source", "conventions"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T00:30:00+00:00"
---
# surf-forecast.com

* Linked via `externalIds.surfForecast` (break slug) from the spot's Info tab. Slugs are sometimes misspelled on their side (e.g. Generosa is `Genarosa`, El Hierro's right `Heirro_Derechadelos-Alemanes`); we keep their spelling for the link.
* Suicides (`Suicides_2`) is built in since seed 5; its break points sit out at sea (Suicides' is 1.7 km offshore), so we use them for longitude at most.
* Its catalogue has near-duplicates: five overlapping El Hierro entries (Izquierda, Derecha de los Alemanes, "Hierro (Derecha de los Alemanes)", Yarro, The Bubble; we link Izquierda, Los-Alemanes and The-Bubble), and "Mechihonas" ≈ Mejillones.
* Conventions we adopted from it: **peak** periods, headline energy = **strongest single train** (1.96 · H² · T² kJ), a word-ladder rating. See [surf-forecast influence](/influences/surf-forecast.md).
