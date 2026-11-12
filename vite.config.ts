/// <reference types="vitest" />
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const ROOT = __dirname;

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/**
 * Emits sw.js next to index.html with the list of every built file (plus public/) and a
 * content hash, so the installed app opens offline and picks up new versions.
 */
function serviceWorker(): Plugin {
  return {
    name: 'surf-journal-sw',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const hash = createHash('sha256');
      const files = new Set<string>(['index.html']);
      for (const name of Object.keys(bundle).sort()) {
        if (name.endsWith('.map')) continue;
        const item = bundle[name];
        files.add(name);
        hash.update(name);
        hash.update(item.type === 'chunk' ? item.code : item.source);
      }
      const publicDir = resolve(ROOT, 'public');
      for (const full of listFiles(publicDir).sort()) {
        const name = relative(publicDir, full).split('\\').join('/');
        if (name.startsWith('.')) continue;
        files.add(name);
        hash.update(name);
        hash.update(readFileSync(full));
      }
      const template = readFileSync(resolve(ROOT, 'src/pwa/sw.js'), 'utf8');
      hash.update(template);
      const fill = { "'__VERSION__'": JSON.stringify(hash.digest('hex').slice(0, 12)), __PRECACHE__: JSON.stringify([...files].sort()) };
      let source = template;
      for (const [token, value] of Object.entries(fill)) {
        if (source.split(token).length !== 2) this.error(`sw.js template must contain ${token} exactly once`);
        source = source.replace(token, value);
      }
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

// `base: './'` keeps the build portable (GitHub Pages, any static host, sub-folders).
export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
  server: { port: 5178 },
  preview: { port: 4178 },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: { output: { manualChunks: { maplibre: ['maplibre-gl'] } } },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
