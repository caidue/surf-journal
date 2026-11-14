---
type: "Reference"
title: "Rules engine (local knowledge in the rating)"
description: "How the executable local rules change each hour's spot rating and suitability, and how their sources' agreement limits them."
resource: "src/lib/rules.ts"
tags: ["engine", "rules", "local-knowledge"]
sources:
  - resource: "context/research/local-surf-school-spot-knowledge.md"
    id: "report"
  - resource: "context/research/rating-errors-at-la-caleta.md"
    id: "caleta"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T19:30:00+00:00"
---
# Rules engine (local knowledge in the rating)

`evaluateRules(spotId, derived, peakId?)` in `src/lib/rules.ts` runs every rule with an `apply` from [Local knowledge](/spots/local-knowledge.md) for one hour (and peak). It is called by `recommendability()` in `src/lib/rating.ts`; `quality()` and `suitability()` use the result.

| `apply.type` | What it does | Example |
|---|---|---|
| `tideBySize` | Picks the row for the wave size (`own` = this spot's `hb`, `open` = `openHb`) and **replaces the tide factor**: 1 inside the row's range, falling over 0.45 of tide outside it, never below the confidence floor | El Muelle: low tide under 2 m, any tide above |
| `gate` | When the open north-facing reef (`openHb`) is below `atLeast`, caps the spot rating (and its potential) | Majanicho inside right: ~2 m+ on the open reefs |
| `windCap` | Wind from an arc above a speed caps the rating (not the wind-free potential) | Derecha de los Alemanes: N–NW over 12 km/h |
| `levelWhen` | Under a tide or size condition the spot needs a higher level; suitability names the rule ("Local knowledge: …") | Bristol at low tide → expert |

**Confidence limits every rule** ([decision 0018](/decisions/0018-rules-engine.md)): tide floor high 0.3 · medium 0.45 · low 0.65 (a disputed rule costs at most about a third); caps are softened by 0 · 15 % · 35 % of the rating above them. Several caps: the lowest wins; several level rules: the highest level wins.

`openHb` (`deriveHour`) is the breaking height the same offshore trains make on an open reef facing ~330° ± 90° with gain 0.77: the regional "how big is the North Shore" for gates, computed from each spot's own model cell, so no extra request is needed.

Rules that changed an hour are listed in `Quality.rules` and appear in the explanation ("Local knowledge (sources agree): the open reefs are ~1.4 m, it needs about 2.0 m."). The regression case of 14 Nov 2026 (`src/lib/fixtures/caleta-2026-11-14.ts`) checks that La Caleta's morning beats the afternoon push.

Limits: thresholds are priors, not local fact (no source gives knots or periods: [pending: tuning](/decisions/pending/threshold-tuning.md)); the size shown for gated inside peaks is still the open-reef size; validation against archives and your checks is the next step.
