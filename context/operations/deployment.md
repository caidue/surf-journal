---
type: "Playbook"
title: "Deployment"
description: "Publishing to GitHub Pages and checking the live build."
resource: ".github/workflows/pages.yml"
tags: ["operations", "deploy"]
sources:
  - resource: "https://caidue.github.io/surf-journal/"
    id: "live"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Deployment

1. Push to `main` of `github.com/caidue/surf-journal` (SSH: `GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=20" git push`).
2. `.github/workflows/pages.yml` runs `npm ci --ignore-scripts`, `npm test`, `npm run build`, uploads `dist/` and deploys to Pages.
3. Check: poll `https://api.github.com/repos/caidue/surf-journal/actions/runs` for the commit's run until `completed`/`success`, then fetch https://caidue.github.io/surf-journal/ and grep the JS bundle for a string from the change.
4. Installed apps pick up the new version in the background and offer "Reload".

Never force-push or move tags (the environment blocks it); release a new patch version instead. See [Releases](/operations/releases.md).
