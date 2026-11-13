---
type: "Reference"
title: "Skill profile"
description: "Stages 1–8, comfortable and biggest size, board and experience: what the app knows about the surfer."
resource: "src/lib/skill.ts"
tags: ["engine", "skill"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
  - resource: "https://surfsimply.com/what-level-surfer-am-i"
    id: "surfsimply"
  - resource: "https://thewave.com/about-wavegarden-technology/surf-sessions"
    id: "thewave"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T01:10:00+00:00"
---
# Skill profile

Replaces the old four levels (beginner…expert), which hid *why* a spot was "above your usual size" (a hard-coded size cap per level). Stored in `Settings.profile`; `null` until [onboarding](/features/onboarding.md) is done.

| Stage | Statement | C default | M default | Reef · steep · paddle pre-fill |
|---|---|---|---|---|
| 1 | Never surfed, or whitewater with a push | 0.5 | 0.7 | 0·0·0 |
| 2 | Stand up and steer in whitewater on my own | 0.7 | 0.9 | 0·0·0 |
| 3 | First green waves, starting to angle | 0.9 | 1.2 | 0·0·1 |
| 4 | Green waves on my own, ride along the face | 1.2 | 1.5 | 1·0·1 |
| 5 | Bottom/top turns, speed; head high on my own | 1.5 | 1.8 | 1·1·2 |
| 6 | Link turns, steep take-offs, enjoy overhead | 2.2 | 3.0 | 2·1·2 |
| 7 | Heavy waves, barrels, shallow reefs, well overhead | 3.0 | 5.0 | 2·2·3 |
| 8 | Big waves, double overhead and up | 3.6 | 5.0 | 3·2·3 |

Defaults snap to the [body scale](/domain/body-scale.md) (the research proposed 1.6/2.0 for stage 5 and 4.5/8.0 for stage 8).

Other fields: board (soft-top, longboard, mid-length, fish, shortboard, step-up/gun, bodyboard; each with a minimum fun size), reef experience 0–3, paddle-out 0–3, steep waves 0–2 (optional), frequency and years (optional), water confidence (optional), "I want to push my limits" (`wantsChallenge`).

* Each stage has a `short` name (First waves, Whitewater, First green waves, Riding the face, Turns and speed, Overhead waves, Heavy waves, Big waves); `stageBand()` groups stages as Beginner 1–3, Intermediate 4–5, Advanced 6, Expert 7–8, the same cut-offs as `REQUIRED_STAGE`. Both are shown on the stage card.
* `profileSummary()`: "Stage 4 · comfortable to chest high (1.2 m) · caught up to 1.5 m · some reef · mid-length".
* `profileCheck()`: gentle warning for stage ≥ 6 with under a year of surfing.
* Sessions store a snapshot `{stage, comfort, max}`; sessions from another stage count less ([Personal prediction](/engine/personal-prediction.md)).
* `DEFAULT_PROFILE` (stage 4) is used only before onboarding or in tests.

See [decision 0010](/decisions/0010-skill-profile-replaces-levels.md), [Suitability rules](/engine/suitability-rules.md), [Profile learning](/engine/profile-learning.md).
