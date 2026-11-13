---
type: "Playbook"
title: "Profile learning from sessions"
description: "Bounded, explained, undoable updates of the comfortable size and experience after a session."
resource: "src/lib/skill.ts"
tags: ["engine", "skill", "learning"]
sources:
  - resource: "context/research/surf-metrics-spots-and-skill-model.md"
    id: "report"
    title: "Research: surf metrics, spots and skill model (2026-11)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Profile learning from sessions

Triggered when a session is saved with "How did the size feel?" (too small / comfortable / pushing it / out of my depth) and the feel or size is new or changed (`SessionEditor.save` → `learnFromSession`). Size S = the size you noted ("Wave size you actually saw"), else the mean estimate over your time in the water.

* **Comfortable at S > C:** C moves a quarter of the way to S (5 cm steps), at most one body-scale step unless another session within 60 days also felt comfortable at least that big.
* **Out of my depth at S ≤ C:** C moves a quarter of the way down to 0.9 S (floor 0.3 m).
* **Comfortable or pushing it at S > M** and waves caught ≠ 0: M = S.
* **Reef experience** rises with non-"out of my depth" reef/rock sessions in the journal (≥ 1 → "a few times", ≥ 5 → "regularly"); never automatically to the top answer.
* **Steep waves** rises to "OK with steeper" after a session at a hollow/slab spot.
* **Stage never changes automatically.** When C reaches the next stage's default comfort size, the notice asks "update your stage?" (`stagePrompt`).
* Fun ratings never move anything. Demo sessions are created without triggering learning.

Every change is stored in `profile.lastChange` with one reason per change and the previous profile; the app shows a toast ("Your surfing profile changed. Comfortable size 1.5 m → 1.6 m: Cotillo felt comfortable at ~1.8 m.") with **Undo** (`undoLastChange`) and OK, and Settings → Your surfing keeps the last change with Undo.

**Rusty offer:** after six months without sessions and without profile changes, Settings offers to lower C one body-scale step (`rustyOffer`).
