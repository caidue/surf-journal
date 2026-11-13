---
type: "Feature"
title: "Spot editor"
description: "Adding and editing spots, peaks and guides."
resource: "src/components/SpotEditor.tsx"
tags: ["feature", "spot", "editor"]
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-13T21:20:00+00:00"
---
# Spot editor

`#/spot-new` (from Settings → Spots → Add) and `#/spot-edit/:id`. Fields: name, region, **also called** (aliases), **Surfline spot** (slug/id) and **surf-forecast.com break**, position (click/drag on the map; approximate flag), facing, best swell direction, swell window, size range, size factor, tide, break type, bottom, level, **wave shape** (power), **peels**, **crowds**, **localism**, **lifeguard**, hazards, description; peaks with description, best-when, break/bottom/direction, level and **rating overrides** (size range, tide, wave shape); the guide (season, boards, access, warnings, parking, facilities). Built-in spots show a note that app updates refresh their details ([Storage](/architecture/storage.md)). Deleting needs the spot to have no sessions.
