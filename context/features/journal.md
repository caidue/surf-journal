---
type: "Feature"
title: "Journal"
description: "List of logged sessions with filters, stats and relevance switches."
resource: "src/components/Journal.tsx"
tags: ["feature", "journal"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Journal

Stats (relevant sessions, time in water, spots, average fun; about half height on phones), filters (spot, text search over notes/tags/boards, hide not relevant), sessions grouped by month, 10 per page. Each card: fun badge, spot, date, time, summary (`sessionSummary`: surf range · peak period · wind · "felt comfortable"), other ratings, tags, notes, demo badge, and a **relevant** checkbox (unticked = kept but ignored for predictions).
