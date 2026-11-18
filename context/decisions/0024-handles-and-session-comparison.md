---
type: "Decision"
title: "0024: Handles-only dragging and comparing sessions instead of editing them"
description: "The session chart moves only by its handles (with ±5 min buttons); a session in a spot's Sessions tab opens a comparison with the chosen day, not the editor."
resource: "src/components/Timeline.tsx"
tags: ["decision", "sessions", "timeline", "similarity"]
decision_status: accepted
decided: "2026-11-18"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-18T18:00:00+00:00"
---
# 0024: Handles-only dragging and comparing sessions instead of editing them

## Context
Marking the time in the water: dragging anywhere on the chart moved or redrew the session, which made it easy to change it by accident (also when scrolling on a phone), and exact times were fiddly to hit. In a spot's Sessions tab, tapping a session opened the editor, and "27% like today" was not explained anywhere.

## Decision
* Once a session is marked, only its **handles** drag it (1.2 × wider and 1.5 × longer, with a wider invisible grip); the rest of the chart doesn't react. **±5 min buttons** for the start and the end sit above the chart.
* Tapping a session in a spot's Sessions tab opens the [session comparison](/features/session-comparison.md) in the same tab (back arrow at the top right): the chosen day's forecast and the surfed hours stacked on one time scale, the session draggable by whole hours, and the closest pair explained condition by condition. Editing stays one link away; the Journal still opens the editor.

## Consequences
* Moving a whole session means dragging both handles or using the buttons (rarely needed).
* The comparison works in whole hours, like the hourly conditions behind it.
