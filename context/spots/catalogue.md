---
type: "Reference"
title: "Built-in spot catalogue"
description: "The 19 built-in northern Fuerteventura spots: ids, names, aliases, external ids, level, peaks and pin status."
resource: "src/data/seedSpots.ts"
tags: ["spots", "content", "fuerteventura"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
  - resource: "https://www.surfline.com/surf-reports-forecasts-cams-map/@28.715,-13.93,11z"
    id: "surfline-map"
seed_version: "5"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T23:35:00+00:00"
---
# Built-in spot catalogue (seed 5)

Ids never change; names follow Surfline where it has the spot ([Naming](/spots/naming.md)). Pin = where the coordinates come from.

| id | Name | Aliases | Surfline | surf-forecast | Level | Peaks | Pin |
|---|---|---|---|---|---|---|---|
| fv-rocky-point | Rocky Point | Punta Elena, Bajo del Medio, Punta del Corralejo | ✓ | Rocky-Point_Bajodel-Medio | all | Inside (all), Outside (advanced, ≥ 1.8 m) | Wannasurf, 80 m from Surfline; approximate |
| fv-el-muelle | El Muelle | Harbour Wall, Corralejo harbour, Waikiki | – | El-Muelle | advanced | – | OSM |
| fv-bristol | Bristol | Shooting Gallery | ✓ | Bristol | advanced | – | OSM |
| fv-mejillones | Mejillones | El Mejillón, Mechihonas | – | Mejillones | expert | – | **to verify**: surf-forecast's longitude on the reef (28.7485, −13.9106), west of Suicides (seed 5; was 28.7561, −13.8933 from a Wannasurf comment) |
| fv-generoso | **Generosa** | Generoso, La Generosa, La Hennerosa | ✓ | Genarosa | intermediate | – | Wannasurf/surf-forecast; approximate |
| fv-suicides | Suicides | Suicidios | – | Suicides_2 | expert | Main reef (expert), Inside left (advanced) | Wannasurf (approximate, on the reef); surf-forecast's point is 1.7 km out to sea |
| fv-la-caleta | La Caleta | Caletta | – | – | intermediate | – | fuerteventuraplayas; approximate; no counterpart elsewhere |
| fv-majanicho | Majanicho | – | ✓ | Majanicho | intermediate | Inside A-frame, Inside right, Outside (overrides) | Surfline (moved from 28.742, −13.944) |
| fv-el-hierro | El Hierro | The Bubble, Hierro Left/Right, La Izquierda, Izquierda del Hierro, Derecha de los Alemanes, German Right, Yarro | ✓ (The Bubble (Hierro Right)) | Izquierda | advanced | La Izquierda, Derecha de los Alemanes, The Bubble (expert) | Surfline single point ([El Hierro](/spots/el-hierro.md)) |
| fv-punta-blanca | Punta Blanca | Playa Punta Blanca | ✓ | – | intermediate | Outside reef, Inside reform | Surfline/Windguru (moved 1.5 km east); approximate |
| fv-esquinzo | Esquinzo | Playa de Esquinzo | – | Playade-Esquinzo_1 | intermediate | – | OSM |
| fv-cotillo-piedra-playa | **Cotillo** | El Cotillo, Piedra Playa, El Cotillo – Piedra Playa, Playa del Castillo | ✓ | Cotillo | all | Playa del Castillo (north), Piedra Playa peaks | approximate |
| fv-cotillo-spew-pits | **Spew Pits** | El Cotillo – Spew Pits | – | Spew-Pits | expert | – | approximate |
| fv-lobos | **Los Lobos** | Isla de Lobos, Lobos | ✓ | Los-Lobos | advanced | Top of the point, Inside section | approximate |
| fv-flag-beach | Flag Beach | Playa de Corralejo | ✓ | – | all | – | approximate (agrees with Surfline) |
| fv-playa-los-matos | Playa los Matos | Playa de los Matos, Los Matos | ✓ | – | all | – | Surfline's latitude on the shoreline (OSM coastline); approximate |
| fv-corralejo-beach | Corralejo Beach | Grandes Playas, Grandes Playas de Corralejo | ✓ | – | all | – | Surfline's latitude on the shoreline (Surfline's pin is 420 m out to sea); approximate |
| fv-glass-beach | **El Burro (Glass Beach)** | El Burro, Glass Beach, Glasbeach, Playa del Burro | ✓ | El-Burro | all | – | OSM/Wannasurf; approximate |
| fv-playa-del-moro | Playa del Moro | – | ✓ | – | beginner | – | OSM (Surfline's pin 1.2 km north; to verify) |

Retired: `fv-the-bubble` → merged into `fv-el-hierro` (`RETIRED_SPOTS`). Attributes per spot (power, peel, crowd, localism, lifeguard) and rating overrides per peak are in `src/data/seedSpots.ts`; guides in `src/data/spotGuides.ts`. Seed 5 added the three spots other services list: Corralejo Beach and Playa los Matos (Surfline) and Suicides (surf-forecast, Wannasurf) ([decision 0013](/decisions/0013-add-spots-other-services-list.md)). Corralejo Beach and Playa los Matos sit 200 m apart and share their settings, because no source tells them apart; Surfline lists both.
