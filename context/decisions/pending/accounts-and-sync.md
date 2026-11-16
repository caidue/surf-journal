---
type: "Decision"
title: "Accounts, sync and a commercial data plan"
description: "What a public release would need."
tags: ["decision", "pending", "roadmap"]
sources:
  - resource: "context/research/surf-journal-app-feasibility.md"
    id: "feas"
status: "draft"
decision_status: "pending"
generated:
  by: "claude-code/claude-fable-5-2"
  at: "2026-11-16T12:50:00+00:00"
---
# Accounts, sync and a commercial data plan

From the README's next steps: accounts and sync (e.g. Supabase in Frankfurt, same data model), Background Sync for pending sessions, a higher-resolution wave model for the Canaries (Copernicus IBI) and FES2022 tides, learned per-user feature weights, and Open-Meteo's commercial plan before any paid or public launch (the free tier is non-commercial).

Until then the journal is protected by manual backups into the user's own cloud ([decision 0022](/decisions/0022-share-sheet-backup.md)). If backups should become automatic, a sync backend is preferred over Google Drive / CloudKit integrations, because it also gives multi-device sync.
