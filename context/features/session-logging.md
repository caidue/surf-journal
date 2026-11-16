---
type: "Feature"
title: "Session logging"
description: "Logging a session on the day's conditions timeline, with ratings, details and how it felt."
resource: "src/components/SessionEditor.tsx"
tags: ["feature", "journal", "session"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-16T17:30:00+00:00"
---
# Session logging

`SessionEditor` (`#/log`, `#/session/:id`):
No "To save: …" hint in the bottom bar any more (removed 2026-11-16): Save stays disabled until a spot, your time on the chart and Fun are set.

1. **Spot** (searchable picker, aliases included, see `SpotPicker.tsx`), **date** (from 2021-11-01) and, once you have trips, **Trip** (No trip or one of them; a new session starts in the trip it was logged from (journal "+" with a trip selected, `?trip=`), else in the trip whose dates include its day, following the date until you pick one; an existing session keeps its trip).
2. **"When were you at {spot} on {day}?"** The day's conditions load automatically ([Open-Meteo](/data-sources/open-meteo-marine.md)); drag across the [timeline](/features/timeline.md) to mark your time (tap = 90 min; the only hint is inside the empty chart, no help text above it). Zoom: Session / Daylight / Full day (a toggle centred next to the title on wide screens, under it on phones, `.when-head`). A summary line shows time, surf range with body words, peak period, wind and tide.
3. **How was it?** One 1–10 slider per category (Fun required; Exertion, Confidence by default; own categories in Settings).
4. **Details:** Waves & conditions (wave size you saw on the [body scale](/domain/body-scale.md) and **How did the size feel?**, both as step sliders (`StepSlider`, ui.tsx: the chosen step above the slider, the two ends below, "Not set" with a faded thumb until touched, "clear" to unset; the size slider rests on the forecast size of your time in the water, the feel slider on Comfortable), vs forecast, waves caught), Gear (board, wetsuit), Crowd, Notes. There is no tags input any more (removed 2026-11-16); an edited session keeps the tags it has, and the journal still shows and searches them.

5. **Delete session** (editing only): at the very bottom of the page, apart from the Cancel / Save bar; it opens a confirm window (`ConfirmDialog`, ui.tsx: spot, date and time, "can't be undone", Cancel / red Delete; Esc or a tap outside cancels).

Saving stores the conditions snapshot (`conditionsVersion`), your skill snapshot (`skillAtTime`), and, when "How did it feel?" is new or changed, runs [profile learning](/engine/profile-learning.md). Offline: saved with conditions pending, filled in later. The timeline's score strip is "For you" with your profile at the time. No peak split per session (removed on request; [decision 0012](/decisions/0012-no-peak-split-in-sessions.md)).
