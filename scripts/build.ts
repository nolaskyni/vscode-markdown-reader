/**
 * @file Bundles the extension and its VS Code integration tests with esbuild.
 *   Run it with `npm run build`. Node runs this file directly, so it uses only
 *   erasable TypeScript syntax.
 */

import {build} from 'esbuild';
import {glob, rm} from 'node:fs/promises';

// Remove earlier output, so that deleted sources and tests don't leave stale
// bundles that `vscode-test` still runs.
await rm('dist', {recursive: true, force: true});
await rm('out', {recursive: true, force: true});

const integrationTestEntryPoints: string[] = [];
for await (const path of glob('test/vscode/**/*.test.ts')) {
  integrationTestEntryPoints.push(path);
}

await build({
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  external: ['vscode'],
  sourcemap: true,
  logLevel: 'info',
});

await build({
  entryPoints: integrationTestEntryPoints,
  outdir: 'out/test/vscode',
  outbase: 'test/vscode',
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  external: ['vscode'],
  sourcemap: true,
  logLevel: 'info',
});
