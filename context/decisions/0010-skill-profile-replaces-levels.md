---
type: "Decision"
title: "0010: Skill profile replaces the four levels"
description: "Stage, comfortable size, biggest size, board and experience instead of beginner…expert."
resource: "src/lib/skill.ts"
tags: ["decision", "skill"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
decision_status: "accepted"
decided: "2026-11-13"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Skill profile replaces the four levels

## Context
"Above your usual size" came from a hard-coded cap per level (beginner 1.0, intermediate 1.8, advanced 3.0, expert 6.0 m), which users couldn't see or change.

## Decision
A [skill profile](/engine/skill-profile.md) filled in at first launch ([onboarding](/features/onboarding.md)), editable in Settings, checked by [explicit rules](/engine/suitability-rules.md) that name both sizes, and nudged by sessions ([profile learning](/engine/profile-learning.md)).

## Consequences
Explore's level picker became a profile chip; sessions store a stage snapshot; old levels map to stages 2/4/6/7.
