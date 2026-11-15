---
type: "Playbook"
title: "Releases and changelog"
description: "Versioning, tags and CHANGELOG.md."
resource: "CHANGELOG.md"
tags: ["operations", "release"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-16T17:40:00+00:00"
---
# Releases and changelog

* Semantic versions in `package.json` (and the two root entries in `package-lock.json` only: a blanket replace once changed a dependency's version and broke `npm ci`).
* `CHANGELOG.md`: newest first, user-facing wording. Tags `vX.Y.Z` on the release commit. Released: 1.0.0, 1.0.1 and 1.1.0 (2026-11-13; 1.1.0 = skill profile, peak periods, Surfline names, three more spots, knowledge base) and 1.2.0 (2026-11-14: El Hierro split into three spots, best picks at a chosen time, stage card, layout fixes). 1.2.1 (2026-11-14: spot description in the Guide tab, forecast table first with the recommendation behind "Best ▾", "Your level" badge with one level name per stage). 1.3.0 (2026-11-14: wind over the sea from four models, local knowledge per spot, spot corrections). 1.4.0 (2026-11-14: rules engine, tide between bracketing extremes, size fit, timing notes, rating confidence, clearer reasons). 1.4.1 (2026-11-14: Best time tab, collapsible Best picks, fixed popup height, Done saves your surfing, now marker in the forecast, full-width tide curve, day badge removed, black reason marks, Guide tab photo dot removed). 1.4.2 (2026-11-15: recommendation below the forecast, Best time tab removed, legend toggle, tab scroll reset, sticky tabs under the measured top bar). 1.4.3 (2026-11-15: tide insight as average fun per stage). 1.4.4 (2026-11-15: tab bar scrollbar, session rows on phones, one surf height per hour, wind gusts labelled). 1.4.5 (2026-11-15: fixed popup tabs, no overscroll, wave figures, Spot pill, strong gusts only). 1.4.6 (2026-11-15: Wave row and figure, Legend & sources, tide chips below the title). 1.4.7 (2026-11-15: slim wave figure back, with a pointed peak). 1.5.0 (2026-11-15: Time filter on Explore driving Best picks and the forecast scroll, area breadcrumb with the level badge, no tomorrow notice). 1.6.0 (2026-11-16: Explore as one ranked list of spots for you, Best picks section removed, markers follow the filters, one filter panel, trips in the journal, Rate for another level, one Rating row, step sliders, no page bounce). 1.6.1 (2026-11-16: spot cards with condition badges, Go any time on even days, confidence footer). 1.6.2 (2026-11-16: no suitability badge, peak and even day as bullets, window back on even days, no no-sessions line, badge-only confidence footer; released together with 1.6.3 under the tag `v1.6.3`, no own tag). 1.6.3 (2026-11-16: journal title from the trip filter, + button into the selected trip, no text search). Push the tag together with the release commit.
* Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` when written by Claude.
* Every change also updates `context/` ([Knowledge base maintenance](/operations/knowledge-base.md)).
