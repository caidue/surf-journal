---
type: "Playbook"
title: "Knowledge base maintenance"
description: "How context/ is organised and kept up to date (Open Knowledge Format v0.2)."
resource: "context/"
tags: ["operations", "knowledge-base", "okf"]
sources:
  - resource: "https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md"
    id: "okf"
    title: "Open Knowledge Format v0.2 specification"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Knowledge base maintenance

`context/` is an [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format) v0.2 bundle. The rule (in `CLAUDE.md`, pointed to from `AGENTS.md`): **after every change in the repo, update or create the related knowledge files in the same commit**, run `npm run context` (`scripts/context-index.mjs`: regenerates every `index.md` from the frontmatter, fails on files without frontmatter or `type`, warns about broken bundle-relative links), and add an entry to `/log.md`.

## Folders
| Folder | Holds |
|---|---|
| `product/` | what the app is, principles, glossary |
| `architecture/` | technical structure: stack, code map, data model, storage, PWA, maps, UI shell |
| `data-sources/` | external data and services (Open-Meteo, maps, geocoding, photos, Surfline, surf-forecast, guide sources) |
| `domain/` | surf science the app relies on (periods, trains, breaking height, energy, wind, tides, body scale) |
| `engine/` | algorithms: ratings, rules, skill profile, learning, prediction, similarity |
| `features/` | user-facing features, one file per screen or flow |
| `spots/` | spot content: catalogue, naming, special cases |
| `influences/` | products, research and design rules that shaped the app |
| `decisions/` | accepted decisions (numbered, ADR style); `decisions/pending/` for open ones |
| `research/` | research reports behind decisions |
| `operations/` | commands, testing, deployment, releases, this file |

## File rules
* Every file except `index.md` and `log.md` starts with YAML frontmatter with a non-empty `type` (e.g. Reference, Feature, Metric, Schema, Decision, Playbook, Glossary, API Endpoint, Research Report), plus `title`, `description`, `resource` (repo path or URL it describes), `tags`, `sources` (each with `resource`), `generated` or `verified` with an actor (`claude-code/<model>` or `human:<id>`) and an ISO 8601 time with offset.
* Pending decisions use `status: draft` and `decision_status: pending`; accepted ones `decision_status: accepted` and `decided: <date>`. When a pending decision is settled, move it to a numbered decision and mark the old file `status: deprecated` or delete it.
* Link with bundle-relative paths (`/engine/spot-rating.md`). Keep files short and factual; code is the source of truth, these files explain the why and where.
* `index.md` per folder: generated, don't edit by hand. No frontmatter (except the root's `okf_version`), `#` headings with `* [Title](relative-url) - description` entries; folder blurbs and order are in `scripts/context-index.mjs`.
* `log.md`: `## YYYY-MM-DD` headings, newest first, entries starting with **Creation**, **Update** or **Deprecation**.
