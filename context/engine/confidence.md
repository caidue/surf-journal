---
type: "Reference"
title: "How sure a rating is"
description: "Knowledge level per spot, confidence per hour, and when the app gives no rating at all."
resource: "src/lib/confidence.ts"
tags: ["engine", "confidence", "local-knowledge"]
sources:
  - resource: "context/research/local-surf-school-spot-knowledge.md"
    id: "report"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T20:30:00+00:00"
---
# How sure a rating is

A good local says "I don't know that reef at low tide" instead of guessing; the app does the same ([decision 0019](/decisions/0019-rating-confidence.md)).

**What the app knows about a spot** (`spotKnowledge`): rules with "some support" or better from [Local knowledge](/spots/local-knowledge.md), grouped as tide · swell/wind · size/role/level.
* **Local knowledge**: at least two of the three groups covered (e.g. La Caleta, El Muelle, Bristol, Majanicho, Cotillo, Lobos, Derecha de los Alemanes).
* **Partial local knowledge**: some rules, or only disputed ones (e.g. The Bubble, Suicides, Mejillones, Spew Pits, the Corralejo beaches).
* **General model only**: no rules: your own spots, and anywhere outside the built-in area.

Shown in the Info tab ("What the app knows"), with the spot's `dataNote` when its forecast point or location is doubtful (Flag Beach near Lobos, Mejillones, Spew Pits).

**How sure one hour is** (`sureness`, on every `HourRec`): local → Reliable, partial → Less certain, general → Rough guide; one step down when the wind models disagree by ≥ 45° and one step down for a `dataNote`; one step up when your similar past sessions here weigh ≥ 1.2 (`Prediction.sumW`). The badge (`SureBadge`) sits on every best pick and on the spot's recommendation card; hover lists the reasons.

**No rating** (`withheld`): an advanced or expert reef or rock spot with no tide source (`tideKnown` false: tide preference "all" and no well-sourced tide rule) at a tide position below 0.25 → "No source describes this reef at low tide …". The hour scores 0 (never a best window or pick); the table shows "?" in Spot and For you (For you keeps ✕ when the spot isn't for you at any tide). Today this applies to Spew Pits.

**Best picks prefer what the app knows**: ranking adds 0.4 (Reliable) or 0.2 (Less certain) to the score, so on close scores a well-known spot wins; the shown score is unchanged.
