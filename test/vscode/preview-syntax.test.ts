/**
 * @file Checks, inside VS Code, that the built-in Markdown renderer uses the
 *   syntax that Markdown Reader adds. If an extension's `extendMarkdownIt` hook
 *   throws, the built-in renderer logs the error and renders without that
 *   extension's plugins, so these tests assert on the rendered HTML.
 */

import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

/**
 * Renders Markdown with VS Code's built-in Markdown renderer.
 *
 * @param source - The Markdown to render.
 * @returns The rendered HTML.
 */
async function render(source: string): Promise<string> {
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

suite('markdown.api.render', () => {
  test('renders task list items as disabled checkboxes', async () => {
    const html = await render('- [x] Done\n- [ ] To do\n');

    assert.match(
      html,
      /<input type="checkbox" class="task-list-item-checkbox" checked="checked" disabled="disabled">/,
    );
    assert.match(
      html,
      /<input type="checkbox" class="task-list-item-checkbox" disabled="disabled">/,
    );
  });

  test('keeps the classes that VS Code uses to sync scrolling', async () => {
    const html = await render('- [ ] To do\n');

    assert.match(html, /<ul [^>]*class="task-list-container code-line"/);
    assert.match(html, /<li [^>]*class="task-list-item code-line"/);
  });

  test('renders an alert with its title and icon', async () => {
    const html = await render('> [!TIP]\n> Text.\n');

    assert.match(html, /<div [^>]*class="markdown-alert markdown-alert-tip /);
    assert.match(
      html,
      /<p [^>]*class="markdown-alert-title code-line"[^>]*><svg class="octicon octicon-light-bulb" aria-hidden="true" fill="currentColor" [^>]*><path d="[^"]+"\/><\/svg>Tip<\/p>/,
    );
  });

  test('renders a footnote reference and its note', async () => {
    const html = await render('A claim.[^source]\n\n[^source]: The source.\n');

    assert.match(
      html,
      /<sup class="footnote-ref"><a href="#footnote1">1<\/a><a class="footnote-anchor" id="footnote-ref1"><\/a><\/sup>/,
    );
    assert.match(
      html,
      /<li id="footnote1" class="footnote-item"><p [^>]*>The source\. <a href="#footnote-ref1" class="footnote-backref" aria-label="Back to reference 1">/,
    );
  });

  test('starts the footnotes with a heading for screen readers', async () => {
    const html = await render('A claim.[^source]\n\n[^source]: The source.\n');

    assert.match(
      html,
      /<section class="footnotes">\n<h2 class="footnotes-heading">Footnotes<\/h2>\n<ol class="footnotes-list">/,
    );
  });
});
