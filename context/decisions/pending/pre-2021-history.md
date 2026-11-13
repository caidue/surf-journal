---
type: "Decision"
title: "Wave data for sessions before October 2021"
description: "Explicit models return nothing before MFWAM's archive."
tags: ["decision", "pending", "data"]
status: "draft"
decision_status: "pending"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Wave data for sessions before October 2021

With explicit `models`, dates before 2021-10 return no marine data (MFWAM's archive starts then), so such a session would get wind but no waves or tide. Option: a fallback request with `best_match` / ERA5-Ocean (mean periods, Tp estimated). Not built; the session date picker starts at 2021-11-01.
