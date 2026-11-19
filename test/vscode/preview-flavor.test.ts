/**
 * @file Checks, inside VS Code, that the `markdownReader.preview.flavor`
 *   setting picks the syntax that the built-in Markdown renderer uses.
 */

import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

/** Markdown with an inline footnote, which only the Obsidian flavor renders. */
const INLINE_FOOTNOTE_SOURCE = 'Text.^[An inline note.]\n';

/** How long to wait for a setting change to reach a cached document. */
const REFRESH_TIMEOUT_MILLISECONDS = 5000;

/** How long to wait between renders while waiting for a refresh. */
const REFRESH_POLL_INTERVAL_MILLISECONDS = 50;

/**
 * Renders Markdown with VS Code's built-in Markdown renderer.
 *
 * @param source - The Markdown, or a document that holds it. The renderer
 *   caches the tokens of the last document it rendered, but not of strings.
 * @returns The rendered HTML.
 */
async function render(source: string | vscode.TextDocument): Promise<string> {
  const html: unknown = await vscode.commands.executeCommand(
    'markdown.api.render',
    source,
  );
  assert.ok(
    typeof html === 'string',
    `Expected \`markdown.api.render\` to return a string, got ${typeof html}`,
  );
  return html;
}

/**
 * Sets the preview flavor in the user settings.
 *
 * @param flavor - The flavor, or `undefined` to remove the user's value.
 */
async function setFlavor(flavor: string | undefined): Promise<void> {
  await vscode.workspace
    .getConfiguration('markdownReader.preview')
    .update('flavor', flavor, vscode.ConfigurationTarget.Global);
}

suite('markdownReader.preview.flavor', () => {
  teardown(async () => {
    await setFlavor(undefined);
  });

  test('defaults to "github" for each resource', () => {
    const setting = vscode.workspace
      .getConfiguration('markdownReader.preview')
      .inspect('flavor');

    assert.equal(setting?.defaultValue, 'github');
  });

  test('leaves inline footnotes as text in the GitHub flavor', async () => {
    await setFlavor('github');

    assert.doesNotMatch(
      await render(INLINE_FOOTNOTE_SOURCE),
      /class="footnote-ref"/,
    );
  });

  test('renders inline footnotes in the Obsidian flavor', async () => {
    await setFlavor('obsidian');

    assert.match(
      await render(INLINE_FOOTNOTE_SOURCE),
      /<sup class="footnote-ref"><a href="#footnote1">1<\/a>/,
    );
  });

  test('treats an unknown value as the GitHub flavor', async () => {
    await setFlavor('Obsidian');

    assert.doesNotMatch(
      await render(INLINE_FOOTNOTE_SOURCE),
      /class="footnote-ref"/,
    );
  });

  test('re-renders a cached document after the setting changes', async () => {
    const document = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: INLINE_FOOTNOTE_SOURCE,
    });
    assert.doesNotMatch(await render(document), /class="footnote-ref"/);

    await setFlavor('obsidian');

    // The extension clears the renderer's cache when it receives the change
    // event, which can arrive after `update` resolves, so the test waits.
    const deadline = Date.now() + REFRESH_TIMEOUT_MILLISECONDS;
    let html = await render(document);
    while (!html.includes('class="footnote-ref"') && Date.now() < deadline) {
      await new Promise((resolve) => {
        setTimeout(resolve, REFRESH_POLL_INTERVAL_MILLISECONDS);
      });
      html = await render(document);
    }
    assert.match(html, /class="footnote-ref"/);
  });
});
