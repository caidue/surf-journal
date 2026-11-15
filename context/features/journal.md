---
type: "Feature"
title: "Journal"
description: "List of logged sessions with trips (named folders), filters, stats and relevance switches."
resource: "src/components/Journal.tsx"
tags: ["feature", "journal"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-16T18:30:00+00:00"
---
# Journal

**Header:** the page title is the trip filter, as a **dropdown** (`TripMenu`, Journal.tsx; tap the title): **All sessions** (the default) · under "Trips" each trip with a folder icon, its session count and **edit** (pencil, opens the trip form) and **delete** (trash, with confirmation; the sessions stay in the journal without a trip) buttons · **Not in a trip** (when there are trips) · **+ New trip**. The title shows the choice ("All sessions", the trip's name wrapping if long, or "Not in a trip"); it's remembered on the device (localStorage `surf-journal.trip`; a deleted trip falls back to All). A round **+** button next to it logs a session, into the selected trip (`#/log?trip=<id>` pre-fills the Trip select). With a trip selected, a line under the title shows its dates (its own, else its first and last session) and session count; the stats and the spot filter then cover only that trip.

**Trips:** named folders for the sessions of a vacation or time period ([data model](/architecture/data-model.md), [decision 0020](/decisions/0020-trips.md)). The trip form takes a name and optional From / To dates: on saving, sessions on those days that aren't in another trip join it (`saveTrip`, db.ts), and new sessions logged on those days start in it (`tripForDate`). In All sessions each card shows its trip as a small badge. Sessions are put into a trip in the [session editor](/features/session-logging.md) (Trip select).

Stats (relevant sessions, time in water, spots, average fun; about half height on phones), filters (spot select and "hide not relevant" on one row, also on phones; no text search), sessions grouped by month, 10 per page. Each card: fun badge, spot, date, time, summary (`sessionSummary`: surf range · peak period · wind · "felt comfortable"), other ratings, tags, notes, demo badge, and a **relevant** checkbox (unticked = kept but ignored for predictions).
