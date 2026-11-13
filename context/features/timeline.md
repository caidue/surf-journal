---
type: "Feature"
title: "Conditions timeline"
description: "The SVG day chart used to mark a session: For you, surf, swell, energy, wind, tide."
resource: "src/components/Timeline.tsx"
tags: ["feature", "chart"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Conditions timeline

SVG chart with rows: score strip ("For you"), surf height bars (+ line of the strongest train's offshore height), swell peak period and direction, energy (strongest train), wind (speed, arrow, colour), tide curve with high/low labels, night shading, a brush to mark the session (drag edges or move; 5-minute snapping), and a "now" line. Labels thin out on narrow screens. Used in the [session editor](/features/session-logging.md).
