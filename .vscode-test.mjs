/**
 * @file Configures `vscode-test`, which runs the integration tests in a
 *   downloaded copy of VS Code.
 */

import {defineConfig} from '@vscode/test-cli';

// oxlint-disable-next-line import/no-default-export -- `vscode-test` reads the default export.
export default defineConfig({
  files: 'out/test/vscode/**/*.test.js',
  version: '1.146.0',
  mocha: {ui: 'tdd', timeout: 20000},
});
