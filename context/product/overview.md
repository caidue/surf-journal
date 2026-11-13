---
type: "Product Overview"
title: "Surf Journal"
description: "What the app is for, who uses it, and its main parts."
resource: "https://github.com/caidue/surf-journal"
tags: ["product", "overview"]
sources:
  - resource: "README.md"
    id: "readme"
    title: "README"
  - resource: "https://caidue.github.io/surf-journal/"
    id: "live"
    title: "Live app"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Surf Journal

A local-first web app (installable PWA) for surfers in **northern Fuerteventura**, usable anywhere. It does three things:

1. **Explore:** for a region, rank spots for *you* today, tomorrow or the day after (best picks, map, list, per-spot forecast). See [Explore](/features/explore.md).
2. **Log sessions:** mark your time in the water on the day's real conditions, rate fun (and other categories), note size and how it felt. See [Session logging](/features/session-logging.md).
3. **Learn from you:** recommendations blend a rule-based spot rating with your own ratings in similar past conditions. See [Personal prediction](/engine/personal-prediction.md).

Everything stays in the browser (IndexedDB); the only network calls are forecasts, map tiles and place search. See [Principles](/product/principles.md).

## Users

One surfer on a phone at the beach (often offline) or on a laptop planning the next days. The author surfs the north shore of Fuerteventura; the built-in spots cover it ([Spot catalogue](/spots/catalogue.md)).

## Where things are

* Live: https://caidue.github.io/surf-journal/ (GitHub Pages, see [Deployment](/operations/deployment.md)).
* Code: `src/` ([Code map](/architecture/code-map.md)).
* This knowledge base: `context/` ([Knowledge base maintenance](/operations/knowledge-base.md)).
