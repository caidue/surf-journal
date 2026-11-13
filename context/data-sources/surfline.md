---
type: "Reference"
title: "Surfline"
description: "The best-known surf service; source of spot names and the ids we link to."
resource: "https://www.surfline.com/"
tags: ["data-source", "spots", "naming"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
  - resource: "https://www.surfline.com/surf-reports-forecasts-cams-map/@28.715,-13.93,11z"
    id: "map"
    title: "Surfline map, northern Fuerteventura"
  - resource: "https://www.surfline.com/terms-of-use"
    id: "terms"
    title: "Surfline Terms of Use"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T23:35:00+00:00"
---
# Surfline

* Used for **names and links only**: each built-in spot Surfline has carries `externalIds.surfline = "slug/spotId"` and links out from the spot's Info tab (`surflineUrl()` in `src/lib/links.ts`). No forecasts, texts or images are copied.
* Surfline lists 13 spots in our area, all now built in (Corralejo Beach and Playa los Matos since seed 5). It lacks El Muelle, Mejillones, Suicides, La Caleta, Spew Pits and Esquinzo, and folds all of El Hierro into one spot "The Bubble (Hierro Right)".
* **What a spot id is:** the hex string at the end of a spot page's URL, e.g. `surfline.com/surf-report/majanicho/584204204e65fad6a77096a2`. The id identifies the spot; the slug is the readable name. The id is also the key of Surfline's undocumented forecast API, which we never call.
* Its "Castillo" (`640b8a024519052897dbddab`) is on **Lanzarote**, not El Cotillo; never map it.
* **Terms (checked 2026-11-13):** Surfline's Terms of Use forbid robots, scrapers and any "manual, automated or programmatic method to crawl or extract data", unauthorized API access, and storing "any significant portion of the Content"; content use is personal and non-commercial only. Nothing restricts linking to its pages. So: link out, never fetch ([decision 0014](/decisions/0014-link-out-never-fetch.md)).

See [Spot naming](/spots/naming.md) and [decision 0008](/decisions/0008-surfline-naming-and-aliases.md).
