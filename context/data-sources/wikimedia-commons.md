---
type: "Reference"
title: "Wikimedia Commons photos"
description: "Freely licensed spot photos with credits."
resource: "src/data/spotGuides.ts"
tags: ["data-source", "photos", "licensing"]
sources:
  - resource: "https://commons.wikimedia.org/"
    id: "commons"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Wikimedia Commons photos

Spot guides include photos from Wikimedia Commons with `imageUrl` (thumbnail on `upload.wikimedia.org` or `thumb.wikimedia.org`), `pageUrl`, `author`, `license` and an optional caption; the guide shows the credit under each photo. The service worker caches them (`spot-photos`). Users can add their own photos (stored as JPEG blobs in IndexedDB, included in backups). See [Spot guide](/features/spot-guide.md).
