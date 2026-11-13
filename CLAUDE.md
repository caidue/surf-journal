# Surf Journal: notes for coding agents

Local-first surf journal PWA for northern Fuerteventura (React 18, Vite 5, TypeScript, Dexie/IndexedDB, MapLibre, Open-Meteo). No backend. Live on GitHub Pages: https://caidue.github.io/surf-journal/

**Start with the knowledge base in [`context/`](context/index.md)**: what each part does, why, and where it lives ([code map](context/architecture/code-map.md), [data model](context/architecture/data-model.md), [decisions](context/decisions/index.md)).

## Keep the knowledge base current (required)

After **every** change in this repo, update or create the related knowledge files under `context/` in the same change (same commit):

1. **Find the related files:** search `context/` for the paths you touched (`grep -rl "src/lib/rating.ts" context`; every file names what it describes in `resource:`) and for the concepts you changed. The [code map](context/architecture/code-map.md) lists which file covers which part.
2. **Update them** so they match the code: facts, numbers, thresholds, file names, behaviour. Refresh the `generated` block (`by: claude-code/<model>`, `at:` ISO 8601 time with offset). Code is the source of truth; the files explain what, why and where.
3. **Create new files** for anything new (a feature, data source, algorithm, spot rule, influence, research) in the matching folder: `product/`, `architecture/`, `data-sources/`, `domain/`, `engine/`, `features/`, `spots/`, `influences/`, `decisions/`, `research/`, `operations/`.
4. **Decisions:** record a settled design choice as the next numbered file in `context/decisions/` (Context / Decision / Consequences, `decision_status: accepted`, `decided: <date>`). Put open questions in `context/decisions/pending/` (`status: draft`, `decision_status: pending`); when one is decided, turn it into a numbered decision and remove or deprecate the pending file.
5. **Run `npm run context`**: it regenerates every `index.md` from the frontmatter and fails if a file lacks frontmatter or a `type`; fix any broken links it reports.
6. **Add a line to [`context/log.md`](context/log.md)** under today's date (`## YYYY-MM-DD`, newest first) starting with **Creation**, **Update** or **Deprecation**.

Format: [Open Knowledge Format v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md). Every `.md` except `index.md`/`log.md` needs YAML frontmatter with a non-empty `type` (plus `title`, `description`, `resource`, `tags`, `sources`). Link with bundle-relative paths like `/engine/spot-rating.md`. Details: [Knowledge base maintenance](context/operations/knowledge-base.md).

## Working on the code

- Commands (run from this folder; the Mac blocks native esbuild/rollup, so call tools through `node`):
  - typecheck: `node node_modules/typescript/bin/tsc -b`
  - tests: `node node_modules/vitest/vitest.mjs run`
  - build: `node node_modules/vite/bin/vite.js build` (delete `dist/` afterwards if you only checked)
  - dev server: `npm run dev` (port 5178); production preview with the service worker: port 4178
- Check UI changes in a browser at phone width (375 px) and on desktop.
- The app is unreleased to anyone but its author: no backwards compatibility needed ([decision 0004](context/decisions/0004-no-backwards-compatibility.md)). Bump `CONDITIONS_VERSION` (`src/types.ts`) when stored conditions change and `SEED_VERSION` (`src/data/seedSpots.ts`) when built-in spots change.
- Conventions surfers know: peak periods, face heights with body words, strongest-train energy, Surfline spot names (other names go into `aliases`).
- Never force-push or move tags; release a new version instead. Deploy = push to `main` (GitHub Actions → Pages), see [Deployment](context/operations/deployment.md).
- Update `CHANGELOG.md` for user-visible changes.
