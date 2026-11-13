---
type: "Feature"
title: "Session logging"
description: "Logging a session on the day's conditions timeline, with ratings, details and how it felt."
resource: "src/components/SessionEditor.tsx"
tags: ["feature", "journal", "session"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Session logging

`SessionEditor` (`#/log`, `#/session/:id`):
1. **Spot** (searchable picker, aliases included, see `SpotPicker.tsx`) and **date** (from 2021-11-01).
2. **"When were you at {spot} on {day}?"** The day's conditions load automatically ([Open-Meteo](/data-sources/open-meteo-marine.md)); drag across the [timeline](/features/timeline.md) to mark your time (tap = 90 min). Zoom: Session / Daylight / Full day. A summary line shows time, surf range with body words, peak period, wind and tide.
3. **How was it?** One 1–10 slider per category (Fun required; Exertion, Confidence by default; own categories in Settings).
4. **Details:** Waves & conditions (wave size you saw on the [body scale](/domain/body-scale.md), **How did the size feel?**, vs forecast, waves caught), Gear (board, wetsuit), Crowd & vibe (crowd, tags incl. "Injured"), Notes.

Saving stores the conditions snapshot (`conditionsVersion`), your skill snapshot (`skillAtTime`), and, when "How did it feel?" is new or changed, runs [profile learning](/engine/profile-learning.md). Offline: saved with conditions pending, filled in later. The timeline's score strip is "For you" with your profile at the time. No peak split per session (removed on request; [decision 0012](/decisions/0012-no-peak-split-in-sessions.md)).
