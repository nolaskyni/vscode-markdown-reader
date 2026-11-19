/**
 * @file Configures Vitest. esbuild loads an SVG file as a string when the
 *   import has the `type: 'text'` attribute, but Vite ignores the attribute and
 *   returns the file's URL. The plugin here loads every SVG file as a string,
 *   so that unit tests see what the extension bundle contains.
 */

import {readFile} from 'node:fs/promises';
import {defineConfig} from 'vitest/config';

// oxlint-disable-next-line import/no-default-export -- Vitest reads the default export.
export default defineConfig({
  plugins: [
    {
      name: 'svg-as-text',
      enforce: 'pre',
      async load(id: string): Promise<string | undefined> {
        if (!id.endsWith('.svg')) {
          return undefined;
        }
        const contents = await readFile(id, 'utf8');
        return `export default ${JSON.stringify(contents)};`;
      },
    },
  ],
});
