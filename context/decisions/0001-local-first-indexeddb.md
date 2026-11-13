---
type: "Decision"
title: "0001: Local-first storage in IndexedDB, no backend"
description: "All user data stays in the browser."
resource: "src/db.ts"
tags: ["decision", "storage"]
sources:
  - resource: "context/research/surf-journal-app-feasibility.md"
    id: "feas"
decision_status: "accepted"
decided: "2026-11-12"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Local-first storage in IndexedDB, no backend

## Context
A personal journal; the feasibility research priced a backend (Supabase) at ~€0 personal but real work and privacy duties.

## Decision
Store everything in IndexedDB via Dexie; JSON export/import for backups; ask for persistent storage when saving.

## Consequences
No accounts or sync across devices (see [pending: accounts and sync](/decisions/pending/accounts-and-sync.md)); data can be lost if the browser clears it, so the app nudges backups.
