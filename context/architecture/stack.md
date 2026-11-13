---
type: "Reference"
title: "Tech stack"
description: "Libraries, versions and why they were chosen."
resource: "package.json"
tags: ["architecture", "stack"]
sources:
  - resource: "package.json"
    id: "pkg"
  - resource: "reports/Surf journal app feasibility.md"
    id: "feas"
    title: "Feasibility research (2026-11)"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Tech stack

| Layer | Choice | Notes |
|---|---|---|
| UI | React 18 + TypeScript 5.6 | Function components, no state library; Dexie live queries drive re-renders. |
| Build | Vite 5 | `esbuild` and `rollup` are overridden with their WebAssembly builds (`esbuild-wasm`, `@rollup/wasm-node`) because macOS blocks the native, non-notarised binaries. See [decision 0003](/decisions/0003-wasm-build-tools.md). |
| Storage | Dexie 4 (IndexedDB) + `dexie-react-hooks` | See [Storage](/architecture/storage.md). |
| Maps | MapLibre GL 4.7 + OpenFreeMap vector tiles | See [Maps](/architecture/maps.md). |
| Tests | Vitest 2 + `fake-indexeddb` | See [Testing](/operations/testing.md). |
| PWA | Hand-written service worker (`src/pwa/sw.js`) + Vite plugin in `vite.config.ts` | See [Offline and PWA](/architecture/offline-pwa.md). |
| Hosting | GitHub Pages via Actions | See [Deployment](/operations/deployment.md). |

No backend, no accounts, no analytics. Dependencies are kept minimal on purpose (five runtime packages).
