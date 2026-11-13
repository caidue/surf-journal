---
type: "Reference"
title: "Design rules"
description: "Usability heuristics and the visual system the UI follows."
resource: "src/styles.css"
tags: ["influence", "design", "ux"]
sources:
  - resource: "https://www.nngroup.com/articles/ten-usability-heuristics/"
    id: "nielsen"
    title: "Nielsen's 10 usability heuristics"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Design rules

The UI was reworked against Nielsen's ten usability heuristics (visibility of status, match with the real world, user control and freedom, consistency, error prevention, recognition over recall, flexibility, minimalism, error recovery, help):

* one spacing scale in 4 px steps (page edges 16 px on phones, 24 px on desktop), one type scale, three corner radii;
* touch targets ≥ 44 px; inputs at 16 px so iOS Safari doesn't zoom;
* fixed bottom action bars (Save/Cancel, onboarding Back/Next) and a fixed List/Map switch on phones; tabs as icons on phones;
* status always visible (offline pill, saved-forecast line, pending conditions, toasts with Undo);
* plain words and the user's own units; explanations next to every score.
