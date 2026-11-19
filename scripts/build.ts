/**
 * @file Bundles the extension, its notebook renderer, and its VS Code
 *   integration tests with esbuild, and writes the license notices of the
 *   packages in the extension and renderer bundles. Run it with `npm run
 *   build`. Node runs this file directly, so it uses only erasable TypeScript
 *   syntax.
 */

import {build} from 'esbuild';
import {copyFile, glob, rm, writeFile} from 'node:fs/promises';
import {
  bundledPackageDirectories,
  readBundledPackage,
  thirdPartyNotices,
} from './third-party-notices.ts';

// Remove earlier output, so that deleted sources and tests don't leave stale
// bundles that `vscode-test` still runs.
await rm('dist', {recursive: true, force: true});
await rm('out', {recursive: true, force: true});

const integrationTestEntryPoints: string[] = [];
for await (const path of glob('test/vscode/**/*.test.ts')) {
  integrationTestEntryPoints.push(path);
}

const extensionBuild = await build({
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  external: ['vscode'],
  sourcemap: true,
  metafile: true,
  logLevel: 'info',
});

// The notebook webview loads the renderer as an ES module, and loads a
// renderer's other files only from the folder of its entry point. So the
// renderer gets its own folder, and its stylesheet is copied next to it.
const notebookRendererBuild = await build({
  entryPoints: ['src/notebook/renderer.ts'],
  outfile: 'dist/notebook/renderer.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2023',
  sourcemap: true,
  metafile: true,
  logLevel: 'info',
});
await copyFile('media/notebook.css', 'dist/notebook/notebook.css');

const bundledInputs = [
  ...Object.keys(extensionBuild.metafile.inputs),
  ...Object.keys(notebookRendererBuild.metafile.inputs),
];
const bundledPackages = await Promise.all(
  bundledPackageDirectories(bundledInputs).map(readBundledPackage),
);
await writeFile('ThirdPartyNotices.txt', thirdPartyNotices(bundledPackages));

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
