---
type: "Decision"
title: "0002: Static hosting on GitHub Pages"
description: "Build once, serve static files over HTTPS."
resource: ".github/workflows/pages.yml"
tags: ["decision", "hosting"]
decision_status: "accepted"
decided: "2026-11-12"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Static hosting on GitHub Pages

## Context
Service workers need HTTPS; the app has no server side.

## Decision
GitHub Actions tests, builds and deploys `dist/` to Pages on every push to `main` (hash routing, relative base).

## Consequences
Free and simple; the repo must be public on the free plan. See [Deployment](/operations/deployment.md).
