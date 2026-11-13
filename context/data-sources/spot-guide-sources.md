---
type: "Reference"
title: "Spot guide sources"
description: "Public guides the built-in spot guides were compiled from."
resource: "src/data/spotGuides.ts"
tags: ["data-source", "spots", "content"]
sources:
  - resource: "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/"
    id: "wannasurf"
  - resource: "https://www.fuerteventuraplayas.com/en/"
    id: "fvplayas"
  - resource: "https://vvanat.fr/blog/carte-spot-surf-corralejo/"
    id: "vvanat"
  - resource: "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura"
    id: "planet"
  - resource: "https://thesurfatlas.com/surfing-in-canary-islands/fuerteventura-surf/"
    id: "atlas"
  - resource: "https://www.windguru.cz/"
    id: "windguru"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T23:35:00+00:00"
---
# Spot guide sources

Built-in guides (`src/data/spotGuides.ts`) were compiled from Wannasurf, fuerteventuraplayas.com, vvanat.fr / Planet Surf Camps, The Surf Atlas, surf-forecast.com, Hello Canary Islands (official tourism site, for Corralejo Beach facilities) and OpenStreetMap, and written in our own words. Each guide lists its sources (shown in the app). Sources disagree on wind, tide and level for several spots; the seed values are a middle ground. Windguru ids helped cross-check pins. Pins still to verify are tracked in [pending: spot pins](/decisions/pending/verify-spot-pins.md).
