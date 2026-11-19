/**
 * @file Checks, inside VS Code, the defaults that Markdown Reader contributes
 *   to the settings that size notebook Markdown cells.
 */

import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

suite('notebook Markdown settings', () => {
  test('default to a 17-pixel font and a 28-pixel line height', () => {
    const settings = vscode.workspace.getConfiguration('notebook');

    assert.equal(settings.inspect('markup.fontSize')?.defaultValue, 17);
    assert.equal(settings.inspect('markdown.lineHeight')?.defaultValue, 28);
  });
});
