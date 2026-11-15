---
type: "Feature"
title: "Journal"
description: "List of logged sessions with trips (named folders), filters, stats and relevance switches."
resource: "src/components/Journal.tsx"
tags: ["feature", "journal"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-16T17:40:00+00:00"
---
# Journal

**Header:** the page title is what the trip filter shows ("All sessions", the trip's name, or "Not in a trip"); a round **+** button logs a session, into the selected trip (`#/log?trip=<id>` pre-fills the Trip select).

**Trips:** named folders for the sessions of a vacation or time period ([data model](/architecture/data-model.md)). A row of chips above the stats filters the journal: **All sessions** (the default) · each trip (folder icon, newest first) · **Not in a trip** (when there are trips) · **+ New trip**; each with its session count. The choice is remembered on the device (localStorage `surf-journal.trip`; a deleted trip falls back to All). With a trip selected (its name is the page title), a line shows its dates (its own, else its first and last session) and session count, with **Edit trip** and **Delete trip** (confirmation; the sessions stay in the journal without a trip); the stats and the spot filter then cover only that trip. The trip form takes a name and optional From / To dates: on saving, sessions on those days that aren't in another trip join it (`saveTrip`, db.ts), and new sessions logged on those days start in it (`tripForDate`). In All sessions each card shows its trip as a small badge. Sessions are put into a trip in the [session editor](/features/session-logging.md) (Trip select).

Stats (relevant sessions, time in water, spots, average fun; about half height on phones), filters (spot select and "hide not relevant" on one row, also on phones; no text search), sessions grouped by month, 10 per page. Each card: fun badge, spot, date, time, summary (`sessionSummary`: surf range · peak period · wind · "felt comfortable"), other ratings, tags, notes, demo badge, and a **relevant** checkbox (unticked = kept but ignored for predictions).
