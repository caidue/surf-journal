---
type: "Decision"
title: "0022: Backup into the user's own cloud through the share sheet"
description: "Phones back up through the system share sheet; no native cloud, no cloud APIs; desktop keeps its data and the download."
resource: "src/lib/backup.ts"
tags: ["decision", "backup", "pwa"]
sources:
  - resource: "https://web.dev/articles/web-share"
    id: "webshare"
  - resource: "https://developer.chrome.com/articles/file-system-access/"
    id: "fsa"
decision_status: accepted
decided: "2026-11-16"
generated:
  by: "claude-code/claude-fable-5-2"
  at: "2026-11-16T12:50:00+00:00"
---
# 0022: Backup into the user's own cloud through the share sheet

## Context
The journal is stored only in the browser ([decision 0001](/decisions/0001-local-first-indexeddb.md)); a lost phone or cleared browser data loses it. The wish was to keep the data in the phone's native cloud (iCloud on iPhones, Google's on Android). A web app can't reach those: iCloud app storage and Android's app backup are open to native apps only, and browser storage isn't reliably part of a device backup.

Options looked at:
* **Share sheet** (Web Share API with files): one standard web call, the phone offers its cloud apps. Manual.
* **Cloud APIs from the web** (Google Drive app folder, CloudKit JS): automatic, but two integrations, a sign-in in the app, a Google Cloud project and a paid Apple developer account.
* **Native wrapper** (e.g. Capacitor): real native backup, but app-store distribution instead of a web page.
* **Own sync backend:** automatic and multi-device, needs accounts and a server ([pending: accounts and sync](/decisions/pending/accounts-and-sync.md)).
* **Pick a file once and rewrite it** (File System Access API): works in desktop Chrome and Edge, not on iPhones, unsettled on Android.

## Decision
* Phones and tablets back up through the share sheet ([Backup](/features/backup.md)). The app stays without a backend, sign-in or stored tokens.
* The share sheet gives no information back about where the file went, so the app can't overwrite it later; a fixed file name lets the cloud app offer "Replace" instead.
* The share button is offered on touch devices only. Desktop keeps the download, which a synced folder picks up.
* Desktop keeps the user data. Making the desktop version data-less was considered and left out: telling desktop from mobile is unreliable (iPads report as Macs), development and testing happen on desktop, and a big screen is useful for the journal. Device detection only chooses which backup button is shown, never whether data is available.
* The pick-once auto-overwrite file was left out of this first step.

## Consequences
* Backups stay manual; Settings shows the age of the last one and highlights it after 30 days.
* Restore is manual (find the file, import).
* If backups should become automatic, the sync backend is preferred over two platform cloud integrations.
* Not yet tried on real phones; Chrome needs the `.txt` file name because JSON isn't on its list of shareable types.
