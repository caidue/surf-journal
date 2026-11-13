---
type: "Feature"
title: "Demo sessions"
description: "Random sessions on real past conditions to try the app."
resource: "src/lib/demo.ts"
tags: ["feature", "demo"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Demo sessions

`addDemoSessions(spots, settings)`: 12–16 sessions over the last 60 days at 3–5 favourite spots (+ a few others), random times, real conditions (current `CONDITIONS_VERSION`), fun following the conditions (spot rating, tide, wind) with noise, fitting tags, observed size near the estimate, a **feel** derived from the size vs your comfortable size, and your current skill snapshot. Marked `demo: true`; adding again replaces the previous set; one click removes them. They never change your profile.
