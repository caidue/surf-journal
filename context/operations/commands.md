---
type: "Playbook"
title: "Commands"
description: "How to run, test, typecheck and build locally."
resource: "package.json"
tags: ["operations", "dev"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Commands

Run from `surf-journal/`. On the author's Mac call the tools through `node` (WebAssembly builds, see [decision 0003](/decisions/0003-wasm-build-tools.md)):

| Task | Command |
|---|---|
| install | `npm install --ignore-scripts` |
| dev server | `npm run dev` → http://localhost:5178 |
| typecheck | `node node_modules/typescript/bin/tsc -b` |
| tests | `node node_modules/vitest/vitest.mjs run` |
| build | `node node_modules/vite/bin/vite.js build` (then `rm -rf dist` if only checking) |
| preview build (service worker active) | `npm run build && npm run preview` → http://localhost:4178 |
| icons | `npm run icons` |
| knowledge base indexes + check | `npm run context` |

Preview configs for Claude Code's browser pane live in the workspace's `.claude/launch.json` ("surf-journal", "surf-journal-build").
