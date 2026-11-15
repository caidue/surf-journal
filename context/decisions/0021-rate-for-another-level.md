---
type: "Decision"
title: "0021: Rate spots for another level"
description: "A temporary Rate-for switch rates spots for a typical surfer of any level, without your sessions."
resource: "src/hooks.ts"
tags: ["decision", "explore", "skill"]
decision_status: accepted
decided: "2026-11-16"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-16T12:30:00+00:00"
---
# 0021: Rate spots for another level

## Context
On your own device you sometimes want to check the spots for a friend who surfs better (or worse) than you. All ratings use your profile and your logged sessions.

## Decision
The level chip on Explore opens a "Rate for" menu: you, or one of the 8 levels. Another level uses the typical profile of that stage (`profileForStage`) and leaves your session history out of the prediction (your sessions describe how *you* surfed); the spot-size calibration from your sessions stays, as it describes the spot. Explore, the map, the spot popup and the spot page all follow it, and the texts name the level. The choice is kept in memory only, so the app never keeps rating for someone else after it is reopened, and the chip is accent-coloured with an × while it's on.

Rating for a group (several levels at once, lowest score wins) was considered and left out as unnecessary.

## Consequences
* A friend gets the generic stage profile, not their own comfort size or reef experience.
* Suitability reasons still speak to "you" (the rated surfer); the level is named in the chip, heading, badges and first explanation line.
