---
type: "Reference"
title: "UI shell and shared components"
description: "Routing, navigation, action bar, toasts and shared UI pieces."
resource: "src/components/ui.tsx"
tags: ["architecture", "ui"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-14T21:40:00+00:00"
---
# UI shell and shared components

* **Routing:** hash router (`useRoute`), so GitHub Pages needs no rewrites. Query params via `queryParam()`.
* **Top nav:** Explore (logo icon), Log, Journal, Settings; icon-only labels on phones.
* **ActionBar:** fixed bottom bar for a page's main actions (Save/Cancel/Delete, onboarding Back/Next) with a note on what's missing.
* **Toasts:** app update, sessions synced, profile changed (Undo/OK), Settings action results.
* **Shared components** (`ui.tsx`): `Chips` (single/multi, tap again to clear), `Segmented`, `ScoreBadge`, `SuitBadge` (labels from `SUIT_LABEL`), `SuitReasons` (✓ for points in favour, − against, ✕ for "not for you", all in the text colour; "Edit comfort size" link on size reasons), `SureBadge` (how sure a rating is), `TimingNotes` (⏱ wind turn, models disagree, even day). The explanation (›), reasons and timing notes share one icon column (1.4em) so their text lines up, `Card`, `Empty`, `DirArrow` (points where waves/wind go), `ConditionsStatus` (offline / saved-forecast line).
* **Styles:** one stylesheet `src/styles.css` with tokens (`--accent`, spacing scale, radii). See [Design rules](/influences/design-rules.md).
