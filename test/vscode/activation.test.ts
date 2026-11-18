/**
 * @file Checks, inside VS Code, that rendering Markdown activates the
 *   extension.
 */

import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

const packageName = 'markdown-reader';

suite('activation', () => {
  test('activates when the Markdown preview renders', async () => {
    const extension = vscode.extensions.all.find(
      (candidate) => candidate.packageJSON.name === packageName,
    );
    assert.ok(extension, `Expected an extension named ${packageName}`);
    assert.equal(extension.isActive, false);

    await vscode.commands.executeCommand('markdown.api.render', '# Title');

    assert.equal(extension.isActive, true);
  });
});
