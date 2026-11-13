---
type: "Feature"
title: "Onboarding: Your surfing"
description: "First-launch questions that build the skill profile; also the profile editor."
resource: "src/components/Onboarding.tsx"
tags: ["feature", "onboarding", "skill"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Onboarding: Your surfing

Shown instead of the app while `settings.profile` is null (first launch, or after the v3 upgrade); also at `#/surfing` (edit, from Settings) and `#/surfing?step=<id>` (jump to one question, e.g. `comfort` from "Edit comfort size").

Screens (each says "You can change this anytime under Settings → Your surfing"; single-choice answers advance automatically):
1. Stage (eight statements; at first launch the choice pre-fills the later answers from the [stage table](/engine/skill-profile.md))
2. Comfortable size (body scale, face height, "not Hawaiian")
3. Biggest caught (≥ the comfortable size)
4. Board
5. Reef experience
6. Getting out on a bigger day
7. Steep and hollow waves (optional)
8. How often and how long (optional)
9. Out of your depth without the board (optional)

Then a summary ("That's you"): the one-line profile, a gentle check, "I want to push my limits" (Stretch session), a short explanation of how the profile is used and nudged, and links to change any answer. Save → Explore (first launch) or Settings. Edit mode adds "Done" to jump to the summary.
