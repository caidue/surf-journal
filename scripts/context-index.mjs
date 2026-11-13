// Regenerates context/**/index.md from each concept's frontmatter and checks the bundle against
// Open Knowledge Format v0.2: every .md except index.md and log.md needs YAML frontmatter with a
// non-empty `type`. Also warns about bundle-relative links that point nowhere.
// Usage: npm run context   (exit code 1 when a file doesn't conform)
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../context/', import.meta.url));

/** Folder order and blurbs for the indexes; folders not listed here are appended alphabetically. */
const FOLDERS = [
  ['product', 'Product', 'What the app is, its principles and vocabulary.'],
  ['architecture', 'Architecture', 'Technical structure: stack, code map, data model, storage, offline, maps, UI shell.'],
  ['data-sources', 'Data sources', 'External data and services the app uses or links to.'],
  ['domain', 'Domain', 'Surf science behind the numbers: periods, swell trains, breaking height, energy, wind, tides, body scale.'],
  ['engine', 'Engine', 'Algorithms: spot rating, suitability rules, skill profile and learning, prediction, similarity.'],
  ['features', 'Features', 'User-facing screens and flows.'],
  ['spots', 'Spots', 'Spot content: the built-in catalogue, naming, special cases.'],
  ['influences', 'Influences', 'Products, research and design rules that shaped the app.'],
  ['decisions', 'Decisions', 'Accepted decisions (numbered) and pending ones.'],
  ['research', 'Research', 'Research reports behind the decisions.'],
  ['operations', 'Operations', 'Commands, testing, deployment, releases and knowledge-base upkeep.'],
];

const errors = [];
const warnings = [];

function frontmatter(path) {
  const text = readFileSync(path, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!mm || !mm[2]) continue;
    let v = mm[2].trim();
    try {
      v = JSON.parse(v);
    } catch {
      v = v.replace(/^['"]|['"]$/g, '');
    }
    out[mm[1]] = v;
  }
  return out;
}

/** Concept files directly in a folder (not index.md / log.md). */
function concepts(folder) {
  const dir = join(ROOT, folder);
  return readdirSync(dir)
    .filter((n) => n.endsWith('.md') && n !== 'index.md' && n !== 'log.md')
    .sort()
    .map((name) => {
      const meta = frontmatter(join(dir, name));
      const rel = relative(ROOT, join(dir, name));
      if (!meta) errors.push(`${rel}: no YAML frontmatter`);
      else if (!meta.type) errors.push(`${rel}: frontmatter has no "type"`);
      return { name, meta: meta ?? {} };
    });
}

const subdirs = (dir) => readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory()).sort();
const entry = (href, meta) => `* [${meta.title ?? href}](${href}) - ${meta.description ?? ''}`;

function writeFolderIndex(folder, title, blurb) {
  const lines = [`# ${title}`, '', blurb, '', ...concepts(folder).map((c) => entry(c.name, c.meta))];
  for (const sub of subdirs(join(ROOT, folder))) {
    const subTitle = sub === 'pending' ? 'Pending decisions' : sub[0].toUpperCase() + sub.slice(1);
    writeFolderIndex(`${folder}/${sub}`, subTitle, sub === 'pending' ? 'Open questions that still need a decision.' : '');
    lines.push('', `# ${subTitle}`, '', ...concepts(`${folder}/${sub}`).map((c) => entry(`${sub}/${c.name}`, c.meta)));
  }
  writeFileSync(join(ROOT, folder, 'index.md'), lines.join('\n') + '\n');
}

const known = new Set(FOLDERS.map(([f]) => f));
const all = [...FOLDERS.filter(([f]) => existsSync(join(ROOT, f))), ...subdirs(ROOT).filter((f) => !known.has(f)).map((f) => [f, f[0].toUpperCase() + f.slice(1), ''])];

const root = [
  '---',
  'okf_version: "0.2"',
  '---',
  '',
  '# Surf Journal knowledge base',
  '',
  'Knowledge about the Surf Journal app (code in `src/`), in Open Knowledge Format v0.2. Keep it current: see [Knowledge base maintenance](operations/knowledge-base.md). Changes are recorded in [the log](log.md).',
  '',
];
for (const [folder, title, blurb] of all) {
  writeFolderIndex(folder, title, blurb);
  root.push(`# ${title}`, '', `${blurb} ([folder index](${folder}/index.md))`.trim(), '');
  root.push(...concepts(folder).map((c) => entry(`${folder}/${c.name}`, c.meta)));
  for (const sub of subdirs(join(ROOT, folder))) root.push(...concepts(`${folder}/${sub}`).map((c) => entry(`${folder}/${sub}/${c.name}`, c.meta)));
  root.push('');
}
writeFileSync(join(ROOT, 'index.md'), root.join('\n').trimEnd() + '\n');

// Broken bundle-relative links (tolerated by OKF, but worth fixing).
function walk(dir) {
  return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : n.endsWith('.md') ? [join(dir, n)] : []));
}
for (const file of walk(ROOT)) {
  for (const [, href] of readFileSync(file, 'utf8').matchAll(/\]\((\/[^)#\s]+)\)/g)) {
    if (!existsSync(join(ROOT, href))) warnings.push(`${relative(ROOT, file)}: link ${href} points nowhere`);
  }
}

for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
console.log(`context/: ${walk(ROOT).length} files, ${errors.length} errors, ${warnings.length} broken links`);
process.exit(errors.length ? 1 : 0);
