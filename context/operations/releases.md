---
type: "Playbook"
title: "Releases and changelog"
description: "Versioning, tags and CHANGELOG.md."
resource: "CHANGELOG.md"
tags: ["operations", "release"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T21:10:00+00:00"
---
# Releases and changelog

* Semantic versions in `package.json` (and the two root entries in `package-lock.json` only: a blanket replace once changed a dependency's version and broke `npm ci`).
* `CHANGELOG.md`: newest first, user-facing wording. Tags `vX.Y.Z` on the release commit. Released: 1.0.0, 1.0.1 and 1.1.0 (2026-11-13; 1.1.0 = skill profile, peak periods, Surfline names, three more spots, knowledge base) and 1.2.0 (2026-11-14: El Hierro split into three spots, best picks at a chosen time, stage card, layout fixes). 1.2.1 (2026-11-14: spot description in the Guide tab, forecast table first with the recommendation behind "Best ▾", "Your level" badge with one level name per stage). 1.3.0 (2026-11-14: wind over the sea from four models, local knowledge per spot, spot corrections). 1.4.0 (2026-11-14: rules engine, tide between bracketing extremes, size fit, timing notes, rating confidence, clearer reasons). Push the tag together with the release commit.
* Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` when written by Claude.
* Every change also updates `context/` ([Knowledge base maintenance](/operations/knowledge-base.md)).
