---
type: "API Endpoint"
title: "Nominatim place search"
description: "Geocoding of free-text regions in Explore."
resource: "src/lib/geocode.ts"
tags: ["data-source", "geocoding"]
sources:
  - resource: "https://nominatim.org/"
    id: "nom"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Nominatim place search

`geocode()` queries Nominatim at most once per second, caches results in the `geocache` table, and `parseRegionQuery()` understands direction words in English, German and Spanish ("northern part of Fuerteventura", "Norden von", "norte de"), which `subBox()` turns into half or quarter of the bounding box. Offline or unknown places fall back to matching spot names and regions. No personal data is sent; the query is only the typed place.
