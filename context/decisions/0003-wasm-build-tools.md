---
type: "Decision"
title: "0003: WebAssembly builds of esbuild and Rollup"
description: "Avoid native binaries the Mac blocks."
resource: "package.json"
tags: ["decision", "build"]
decision_status: "accepted"
decided: "2026-11-12"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# WebAssembly builds of esbuild and Rollup

## Context
On the author's Mac, macOS hangs on non-notarised native esbuild/rollup binaries.

## Decision
`package.json` overrides `esbuild` → `esbuild-wasm@0.21.5` and `rollup` → `@rollup/wasm-node`; install with `--ignore-scripts`; run tools via `node node_modules/...` paths.

## Consequences
Slower builds (~6 s); remove the overrides on machines where native binaries run fine.
