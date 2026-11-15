---
type: "Decision"
title: "0020: Trips as named folders of sessions"
description: "Group journal sessions into named trips with optional dates; one trip per session."
resource: "src/db.ts"
tags: ["decision", "journal", "data-model"]
decision_status: accepted
decided: "2026-11-16"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-16T11:30:00+00:00"
---
# 0020: Trips as named folders of sessions

## Context
Sessions of one vacation or time period belong together, and you want to look at just those (and their stats) in the journal.

## Decision
A `trips` table (Dexie version 4) with a name and optional From / To dates; a session points to at most one trip (`tripId`), like a file in one folder. Dates are a convenience, not a rule: saving a trip with dates adds the sessions on those days that aren't in another trip, and new sessions on those days start in it, but any session can be moved in or out in the session editor. Deleting a trip keeps its sessions. The journal filters by trip (All / a trip / Not in a trip) and its stats follow. Trips don't affect predictions.

## Consequences
* One trip per session keeps the filter and the stats simple; overlapping trips (e.g. a long stay with a weekend trip inside) are possible but a session sits in only one of them.
* Trips are part of the backup file (optional on import, so older backups still load).
