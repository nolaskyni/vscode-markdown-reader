/**
 * @file Checks, inside VS Code, that the notebook webview can load the notebook
 *   stylesheet. The webview loads a renderer's files only from the folder of
 *   its entry point, or from the workspace's folders.
 */

import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

/** Markdown Reader's ID, which is `PUBLISHER.NAME` from `package.json`. */
const EXTENSION_ID = 'nolaskyni.markdown-reader';

suite('notebook renderer', () => {
  test('has the notebook stylesheet in its entry point folder', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, `Expected the \`${EXTENSION_ID}\` extension`);
    const entrypointPath: unknown =
      extension.packageJSON.contributes?.notebookRenderer?.[0]?.entrypoint
        ?.path;
    assert.ok(
      typeof entrypointPath === 'string',
      `Expected a notebook renderer entry point path, got ${typeof entrypointPath}`,
    );
    const entrypointURI = vscode.Uri.joinPath(
      extension.extensionUri,
      entrypointPath,
    );

    const stylesheetURI = vscode.Uri.joinPath(
      entrypointURI,
      '..',
      'notebook.css',
    );
    const stylesheet = await vscode.workspace.fs.stat(stylesheetURI);

    assert.equal(stylesheet.type, vscode.FileType.File);
  });
});
