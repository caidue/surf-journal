---
type: "Reference"
title: "Local knowledge (spot rules)"
description: "Per-spot rules from local sources: what they cover, how confidence is set, which are in the rating and which wait for the rules engine."
resource: "src/data/spotRules.ts"
tags: ["spots", "local-knowledge", "rules"]
sources:
  - resource: "context/research/local-surf-school-spot-knowledge.md"
    id: "report"
    title: "Research: local surf school spot knowledge (2026-11-14)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T20:30:00+00:00"
---
# Local knowledge (spot rules)

How local schools decide (from the [research](/research/local-surf-school-spot-knowledge.md)): which coast has swell and how big, then wind relative to each coast over the water (onshore rules a spot out), then the tide (it sets the time, not the spot), then the group's level; they go before the NE trade turns onshore, usually in the morning.

`SPOT_RULES` in `src/data/spotRules.ts` holds that knowledge per built-in spot, in our own words: 1–4 rules per spot, 21 spots. Shown in the spot guide under **Local knowledge** with badges for agreement and use in the rating, plus linked sources.

* **Confidence:** high = several independent local sources agree; medium = one local source with support elsewhere or consistent reef physics; low = conflicting or single source. Source kinds, most local first: local (Jandía Riders, surfmarket.org, singlequiver, Surf Skate Academy FTV), first-hand (Wannasurf), portal (FuerteventuraPlayas), school, travel (The Surf Atlas, gonna.surf, Mondo.surf), forecast site, observation (your sessions).
* **In the rating already** (`inRating: true`): plain attribute rules the existing rating follows, e.g. La Caleta's northerly swell window, Lobos low–mid tide, Esquinzo mid–high, Punta Blanca mellow.
* **Executable** (`apply`, evaluated every hour by the [rules engine](/engine/rules-engine.md)): tide by size at El Muelle (low tide under 2 m, any tide above), La Caleta (low to mid under 1.8 m; disputed, so it costs at most a third) and Playa del Moro; gates at Majanicho inside right (open reefs ~2 m+), the bay A-frame (~3 m+), Rocky Point outside (~3.5 m+) and Suicides (~2 m+); wind cap at Derecha de los Alemanes (N–NW above 12 km/h); level rules at Bristol and Izquierda del Hierro (low tide → expert) and Cotillo's Piedra Playa peaks (beginners only at lower tide and under ~1 m).
* **Guide only** (`inRating: false`): e.g. Generosa's small-swell role, Lobos ferry times, El Burro mornings (the sea wind forecast covers it), Flag Beach's wind note.
* **Knowledge level:** the rules decide how sure ratings are and whether a rating is withheld ([How sure a rating is](/engine/confidence.md)).
* **Conflicts kept visible:** La Caleta and Generosa tide, Mejillones location and data, Spew Pits location, El Burro level.

Decisions: [0017](/decisions/0017-local-knowledge-rules.md) (rules with provenance; no hard preference from conflicting sources), [0016](/decisions/0016-sea-wind-multi-model.md) (the wind those rules need). Next: backtesting on Open-Meteo archives and a quick "check" log to validate and tune the rules.
