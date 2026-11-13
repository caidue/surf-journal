---
type: "Reference"
title: "Spot naming"
description: "Why spots carry Surfline's names, how aliases work, and the Generosa/Generoso question."
tags: ["spots", "naming"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
  - resource: "https://www.surfline.com/surf-reports-forecasts-cams-map/@28.715,-13.93,11z"
    id: "surfline-map"
  - resource: "https://www.openstreetmap.org/way/684871472"
    id: "osm-generoso"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T00:30:00+00:00"
---
# Spot naming

* **Rule:** display name = Surfline's name where Surfline has the spot (the best-known service); otherwise the surf-forecast / Wannasurf name. Every other name in use goes into `aliases`; the spot picker, Settings search and Explore's offline region match search them, and the picker shows which alias matched.
* **Ids never change** on rename (e.g. `fv-generoso` shows as "Generosa"), so sessions keep pointing at the right spot.
* **Generosa vs Generoso:** forecast services (Surfline, surf-forecast with slug "Genarosa", windy.app) say *Generosa*; OSM, Wannasurf ("Generoso", slug `la_hennerosa`) and locals often *Generoso*. "La Hennerosa" is most likely a phonetic spelling of "La Generosa" (Canarian aspirated *g*). No authoritative toponym source was found. Display: Generosa; aliases: Generoso, La Generosa, La Hennerosa.
* **El Hierro area:** Surfline has one spot, so its rule gives no names for the three waves; they follow the guides that list them separately: **Izquierda del Hierro** (surf-forecast "Izquierda", Wannasurf "Hierro (left)", fuerteventuraplayas "Izquierda del Hierro"; Surfline's text calls it "Hierro Left, also known as El Hierro"), **Derecha de los Alemanes** and **The Bubble**. "El Hierro" is an alias of both bay waves.
* **"Hierro Right" is ambiguous** (Surfline uses it for The Bubble, Wannasurf for Derecha de los Alemanes), so it is an alias of both and the name of neither. See [El Hierro area](/spots/el-hierro.md).
* **Surfline's "Castillo" is on Lanzarote**; El Cotillo's beach is Surfline's "Cotillo".
* **Suicides** is not on Surfline, so it uses surf-forecast's name; Wannasurf's "Suicidios" is an alias. Surfline's **Corralejo Beach** stands for the Grandes Playas (aliases "Grandes Playas", "Grandes Playas de Corralejo"); **Playa los Matos** is one named stretch of them. "Playa de Corralejo" stays an alias of Flag Beach, as Windguru uses it.
* External ids only power links out ([Surfline](/data-sources/surfline.md), [surf-forecast](/data-sources/surf-forecast.md)).

See [decision 0008](/decisions/0008-surfline-naming-and-aliases.md).
