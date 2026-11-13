---
type: "Decision"
title: "0004: No backwards compatibility while unreleased"
description: "Change schemas and data freely."
tags: ["decision", "process"]
decision_status: "accepted"
decided: "2026-11-13"
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# No backwards compatibility while unreleased

## Context
The user: "Assume this app hasn't been deployed on any device yet… we do not need to be backwards compatible" and "Ignore already deployed versions".

## Decision
Breaking changes are fine. Keep only cheap safety nets: a Dexie upgrade that re-fetches or resets data instead of migrating it field by field, and a seed refresh.

## Consequences
Code stays simple. Before a public release this must be revisited (versioned migrations, backup compatibility).
