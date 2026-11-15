---
type: "Reference"
title: "UI shell and shared components"
description: "Routing, navigation, action bar, toasts and shared UI pieces."
resource: "src/components/ui.tsx"
tags: ["architecture", "ui"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-17T10:10:00+00:00"
---
# UI shell and shared components

* **Routing:** hash router (`useRoute`), so GitHub Pages needs no rewrites. Query params via `queryParam()`.
* **Top nav:** Explore (logo icon), Log, Journal, Settings; icon-only labels on phones. A sticky bar; the page itself never bounces past its top or bottom (`overscroll-behavior-y: none` on `html` and `body`; vertical only so sideways back-swipes keep working), so pulling down at the top no longer drags the header and the whole page with it. Desktop Explore is the exception to page scrolling: it fits the window and only its list scrolls ([Explore](/features/explore.md)).
* **ActionBar:** fixed bottom bar for a page's main actions (Save/Cancel, onboarding Back/Next; Delete is not in it but at the bottom of the page) with a note on what's missing.
* **Toasts:** app update, sessions synced, profile changed (Undo/OK), Settings action results.
* **Shared components** (`ui.tsx`): `Chips` (single/multi, tap again to clear), `Segmented`, `ScoreBadge`, `SuitBadge` (labels from `SUIT_LABEL`), `SuitReasons` (✓ for points in favour, − against, ✕ for "not for you", all in the text colour; "Edit comfort size" link on size reasons), `SureBadge` (how sure a rating is), `StepSlider` (a slider over named steps that can stay "Not set"), `CondBadges` (wave / swell / wind badges with icons, wind on the forecast's colours), `SureLine` (confidence footer: label and badge), `PickDetails` (everything under a recommendation's conditions, shared by Explore and the spot card), `.dialog` (a small window over the page with a dimmed backdrop: the trip form), `ConfirmDialog` (confirm / cancel in such a window; `danger` makes the confirm button red: deleting a session). Page headers wrap as usual; only the journal's (trip title + "+") stays on one row, `SuitBadge` takes `who` when rating for another level, `TimingNotes` (⏱ wind turn, models disagree, even day). The explanation (›), reasons and timing notes share one icon column (1.4em) so their text lines up, `Card`, `Empty`, `DirArrow` (points where waves/wind go), `ConditionsStatus` (offline / saved-forecast line).
* **Styles:** one stylesheet `src/styles.css` with tokens (`--accent`, spacing scale, radii). See [Design rules](/influences/design-rules.md).
