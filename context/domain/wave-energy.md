---
type: "Metric"
title: "Wave energy (kJ)"
description: "Energy per metre of wave crest, as surf-forecast.com shows it."
resource: "src/lib/conditions.ts"
tags: ["domain", "energy", "metric"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Wave energy (kJ)

# Computation
`E = ρ g² / (16 π) · H² · Tp² ≈ 1.957 · H² · Tp²` kJ per metre of crest (`trainEnergyKJ`), per train.

* **Headline** (`waveEnergyKJ`): the **strongest single train**, matching surf-forecast.com. Tooltip shows the total over all trains (`totalEnergyKJ`).
* It is a property of the model grid cell, not the spot: all spots in one cell show the same value (the table legend lists them).
* Colour ramp `energyColors()` in `src/lib/format.ts`.
* Rough guide (tooltip): ~100 kJ barely surfable, 200–1,000 increasingly punchy, 1,000–5,000+ heavy.

Before v2 the app summed all trains with mean periods, which disagreed with surf-forecast. See [decision 0007](/decisions/0007-strongest-train-energy.md).
