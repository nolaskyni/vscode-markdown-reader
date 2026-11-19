/**
 * @file Checks, inside VS Code, the defaults that Markdown Reader contributes
 *   to the built-in Markdown preview's settings.
 */

import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

suite('markdown.preview settings', () => {
  test('default to a 17-pixel font and a 1.65 line height', () => {
    const settings = vscode.workspace.getConfiguration('markdown.preview');

    assert.equal(settings.inspect('fontSize')?.defaultValue, 17);
    assert.equal(settings.inspect('lineHeight')?.defaultValue, 1.65);
  });
});
