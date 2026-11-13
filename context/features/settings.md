---
type: "Feature"
title: "Settings"
description: "Your surfing, units, spots, how old sessions count, categories, phone/offline, data, demo, about."
resource: "src/components/SettingsPage.tsx"
tags: ["feature", "settings"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T01:10:00+00:00"
---
# Settings

* **Your surfing:** a stage card (`StageCard.tsx`: big stage badge coloured by skill band, band and short stage name, the stage's own words, a 1–8 ladder, badges for comfortable size, biggest wave, reef, board and "Pushing my limits"), then each answer with an Edit link (`#/surfing?step=…`), "Edit all", push-my-limits checkbox, profile check, rusty offer after six months, last automatic change with Undo. See [Skill profile](/engine/skill-profile.md).
* **Units:** metres/feet; km/h, knots, mph.
* **Spots:** search (incl. aliases), edit, add, restore built-in spots (`refreshSeedSpots`). See [Spot editor](/features/spot-editor.md).
* **How old sessions count:** half-life (months), ignore before a date; note on stage weighting (¾ one stage apart, ½ two, ¼ more).
* **Feeling categories:** name, colour, add/remove (Fun is fixed).
* **On your phone:** install, offline explanation, sessions waiting for conditions (incl. old snapshots) with "Fetch now", storage use and persistence.
* **Your data:** export/import JSON, clear forecast cache.
* **Demo sessions:** add random / remove ([Demo sessions](/features/demo-sessions.md)).
* **About the data:** Open-Meteo (MFWAM height, ECMWF peak period, GFS-Wave trains), maps, surf-height estimate, Surfline naming, spot guide sources.
