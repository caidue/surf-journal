---
type: "Feature"
title: "Backup"
description: "Backup into the user's own cloud through the share sheet on phones, download elsewhere, import, last-backup line."
resource: "src/lib/backup.ts"
tags: ["feature", "backup", "settings", "pwa"]
sources:
  - resource: "https://web.dev/articles/web-share"
    id: "webshare"
  - resource: "https://developer.chrome.com/articles/file-system-access/"
    id: "fsa"
generated:
  by: "claude-code/claude-fable-5-2"
  at: "2026-11-16T12:50:00+00:00"
---
# Backup

The journal lives only in the browser ([Storage](/architecture/storage.md)). Settings → Your data offers three ways to get it out and back in. Why this shape: [decision 0022](/decisions/0022-share-sheet-backup.md).

## Back up to your cloud (phones and tablets)
* Button **Back up to your cloud…**, shown when `offersShareBackup()` is true: a touch device (`(pointer: coarse)`) whose browser can share files (`navigator.canShare({ files })`).
* `shareBackup()` builds the backup (`exportAll` in `src/db.ts`, the same content as the download) and calls `navigator.share({ files: [file] })`. The phone's share sheet then offers Save to Files (iCloud Drive), Drive, Dropbox, mail and so on. The app never signs in anywhere and never learns where the file went.
* **File name:** always `surf-journal-backup.json`, so saving into the same folder again offers to replace the old backup. Chrome only shares a fixed list of file types without JSON, so there the same content goes out as `surf-journal-backup.txt` (`shareableFile()` takes the first type the browser accepts).
* **Only `files` is passed:** iOS saves a `title` or `text` as an extra text file next to the backup.
* **Results:** `shared` (the time is stored), `cancelled` (share sheet closed: nothing stored, no message), `retry` (the browser refused with `NotAllowedError` because building the backup outlasted the tap, possible with many photos on Safari: the file is kept, the button reads **Save backup** and the next tap shares it at once), `unsupported`.
* The hint under the intro names the target by platform (`isIOS()`: Save to Files → iCloud Drive; otherwise Drive or another cloud app).

## Download
`Export backup (JSON)` (labelled `Download backup` where the share button is shown) downloads `surf-journal-backup-YYYY-MM-DD.json`. On desktop this is the only way: desktop share dialogs have no "save to my cloud" target, and a download into a synced folder does the same job.

## Import
`Import backup…` reads a `.json` or `.txt` backup and merges it with `importAll` (`bulkPut`).

## Last backup
`markBackedUp()` stores the time of a share or download in `localStorage` (`surf-journal.lastBackupAt`): per device and outside the backup, so an import doesn't change it. Settings shows "Last backup from this device: today / yesterday / N days ago" or "No backup from this device yet" (`backupAge`). The line takes the warning colour (`.backup-due`) when there are sessions and no backup for `BACKUP_DUE_DAYS` = 30 days (`backupDue`). The app can't tell whether the user really saved the shared or downloaded file.

## Limits
* Manual: one tap per backup, and restore means finding the file and importing it. No sync between devices ([pending: accounts and sync](/decisions/pending/accounts-and-sync.md)).
* Photos are embedded as data URLs, so the file grows with them; how large a file each share target accepts is untested.
* Checked with a stubbed share sheet in the browser and in `src/lib/backup.test.ts`; not yet tried on a real iPhone or Android phone.
