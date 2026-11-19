/**
 * @file Checks the syntax that Markdown Reader adds to the Markdown preview,
 *   using a plain markdown-it instance with HTML enabled. The tests in
 *   `test/vscode/` check the same syntax in VS Code's own renderer.
 */

import MarkdownIt from 'markdown-it';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe, expect, test} from 'vitest';
import {addPreviewSyntax} from './preview-syntax.ts';

/**
 * The text of a footnote's back link: a leftwards arrow with hook, followed by
 * the variation selector that asks for text rather than emoji presentation.
 */
const BACK_ARROW = '↩︎';

/**
 * Renders Markdown with the preview syntax added.
 *
 * @param source - The Markdown to render.
 * @returns The rendered HTML.
 */
function render(source: string): string {
  return addPreviewSyntax(new MarkdownIt({html: true})).render(source);
}

describe('addPreviewSyntax', () => {
  test('renders an unchecked task as a disabled, unchecked checkbox', () => {
    expect(render('- [ ] Write tests\n')).toBe(
      '<ul class="task-list-container">\n' +
        '<li class="task-list-item"><label class="task-list-item-label">' +
        '<input type="checkbox" class="task-list-item-checkbox" disabled="disabled">' +
        ' Write tests</label></li>\n' +
        '</ul>\n',
    );
  });

  test.each(['x', 'X'])(
    'renders a task marked "%s" as a disabled, checked checkbox',
    (mark) => {
      expect(render(`- [${mark}] Write tests\n`)).toContain(
        '<input type="checkbox" class="task-list-item-checkbox" ' +
          'checked="checked" disabled="disabled">',
      );
    },
  );

  test('renders tasks in ordered and nested lists', () => {
    const html = render('1. [ ] First\n   - [x] Nested\n');

    expect(html).toContain('<ol class="task-list-container">');
    expect(html).toContain('<ul class="task-list-container">');
    expect(html.match(/<input /g)).toHaveLength(2);
  });

  test('leaves list items without a task marker unchanged', () => {
    expect(render('- [ ] Task\n- Plain item\n')).toContain(
      '<li>Plain item</li>',
    );
  });

  test.each([
    ['a paragraph', '[x] Not a task\n'],
    ['a code fence', '```markdown\n- [ ] Not a task\n```\n'],
    ['inline code', '- `[ ] Not a task`\n'],
    ['a marker without a following space', '- [x]Not a task\n'],
  ])('leaves task syntax in %s unrendered', (_, source) => {
    expect(render(source)).toBe(new MarkdownIt({html: true}).render(source));
  });

  test('renders a note alert with its title, icon, and content', () => {
    expect(render('> [!NOTE]\n> Read **this**.\n')).toBe(
      '<div class="markdown-alert markdown-alert-note">\n' +
        `<p class="markdown-alert-title">${octicon('info')}Note</p>\n` +
        '<p>Read <strong>this</strong>.</p>\n' +
        '</div>\n',
    );
  });

  test.each([
    ['NOTE', 'note', 'Note', 'info'],
    ['TIP', 'tip', 'Tip', 'light-bulb'],
    ['IMPORTANT', 'important', 'Important', 'report'],
    ['WARNING', 'warning', 'Warning', 'alert'],
    ['CAUTION', 'caution', 'Caution', 'stop'],
  ])(
    'renders an alert marked %s with its own class, title, and Octicon',
    (marker, type, title, icon) => {
      expect(render(`> [!${marker}]\n> Text.\n`)).toContain(
        `<div class="markdown-alert markdown-alert-${type}">\n` +
          `<p class="markdown-alert-title">${octicon(icon)}${title}</p>\n`,
      );
    },
  );

  test('renders an alert marker in lowercase', () => {
    expect(render('> [!warning]\n> Text.\n')).toContain(
      '<div class="markdown-alert markdown-alert-warning">\n' +
        `<p class="markdown-alert-title">${octicon('alert')}Warning</p>\n`,
    );
  });

  test('renders every paragraph of an alert inside it', () => {
    expect(render('> [!CAUTION]\n> First.\n>\n> Second.\n')).toContain(
      '<p>First.</p>\n<p>Second.</p>\n</div>\n',
    );
  });

  test.each([
    ['an unknown alert type', '> [!INFO]\n> Text.\n'],
    ['a marker in the middle of a quote', '> Text with [!NOTE] inside.\n'],
    ['a marker followed by text', '> [!NOTE] Text.\n'],
    ['a code fence', '```markdown\n> [!NOTE]\n> Text.\n```\n'],
    ['a list item', '- > [!NOTE]\n  > Text.\n'],
    ['a block quote', '> > [!NOTE]\n> > Text.\n'],
  ])('leaves alert syntax in %s unrendered', (_, source) => {
    expect(render(source)).toBe(new MarkdownIt({html: true}).render(source));
  });

  test('renders a footnote reference and its note at the end', () => {
    expect(
      render('A claim.[^source]\n\n[^source]: The source.\n\nEnd.\n'),
    ).toBe(
      '<p>A claim.<sup class="footnote-ref"><a href="#footnote1">1</a>' +
        '<a class="footnote-anchor" id="footnote-ref1"></a></sup></p>\n' +
        '<p>End.</p>\n' +
        '<hr class="footnotes-sep">\n' +
        '<section class="footnotes">\n' +
        '<ol class="footnotes-list">\n' +
        '<li id="footnote1" class="footnote-item"><p>The source. ' +
        '<a href="#footnote-ref1" class="footnote-backref" ' +
        `aria-label="Back to reference 1">${BACK_ARROW}</a></p>\n` +
        '</li>\n' +
        '</ol>\n' +
        '</section>\n',
    );
  });

  test('numbers footnotes in the order of their first reference', () => {
    const html = render('A.[^b] B.[^a]\n\n[^a]: Note a.\n\n[^b]: Note b.\n');

    expect(html).toContain('<a href="#footnote1">1</a>');
    expect(html).toContain('<a href="#footnote2">2</a>');
    expect(html).toMatch(
      /<li id="footnote1" class="footnote-item"><p>Note b\..*<li id="footnote2" class="footnote-item"><p>Note a\./s,
    );
  });

  test('gives every reference to a note the same number and a back link', () => {
    const html = render('A.[^note] B.[^note]\n\n[^note]: The note.\n');

    expect(html.match(/<a href="#footnote1">1<\/a>/g)).toHaveLength(2);
    expect(html).toContain(
      '<p>The note. ' +
        '<a href="#footnote-ref1" class="footnote-backref" ' +
        `aria-label="Back to reference 1">${BACK_ARROW}</a> ` +
        '<a href="#footnote-ref1:1" class="footnote-backref" ' +
        `aria-label="Back to reference 1-2">${BACK_ARROW}<sup>2</sup></a></p>`,
    );
  });

  test('links each back link to an element with its target ID', () => {
    const html = render(
      'A.[^one] B.[^two] C.[^one]\n\n[^one]: One.\n\n[^two]: Two.\n',
    );
    const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
    const targets = [...html.matchAll(/ href="#([^"]+)"/g)].map((m) => m[1]);

    expect(targets).toHaveLength(6);
    for (const target of targets) {
      expect(ids).toContain(target);
    }
  });

  test('puts the back link in the last paragraph of a long note', () => {
    expect(render('A.[^long]\n\n[^long]: First.\n\n    Second.\n')).toContain(
      '<p>First.</p>\n' +
        '<p>Second. <a href="#footnote-ref1" class="footnote-backref" ' +
        `aria-label="Back to reference 1">${BACK_ARROW}</a></p>\n`,
    );
  });

  test('omits a note that nothing references', () => {
    expect(render('Text.\n\n[^unused]: Unused.\n')).toBe('<p>Text.</p>\n');
  });

  test.each([
    ['a reference without a note', 'Text.[^missing]\n'],
    ['an inline footnote', 'Text.^[An inline note.]\n'],
    ['a code fence', '```markdown\nText.[^note]\n\n[^note]: Note.\n```\n'],
    ['inline code', '`Text.[^note]`\n\n```text\n[^note]: Note.\n```\n'],
  ])('leaves footnote syntax in %s unrendered', (_, source) => {
    expect(render(source)).toBe(new MarkdownIt({html: true}).render(source));
  });
});

/**
 * Returns the inline SVG that an alert title starts with.
 *
 * @param name - The Octicon's name, such as `info`.
 * @returns The 16-pixel Octicon from `@primer/octicons`, marked as decorative
 *   and filled with the title's text color.
 */
function octicon(name: string): string {
  const svg = readFileSync(
    fileURLToPath(
      import.meta.resolve(`@primer/octicons/build/svg/${name}-16.svg`),
    ),
    'utf8',
  );
  return svg.replace(
    '<svg ',
    `<svg class="octicon octicon-${name}" aria-hidden="true" fill="currentColor" `,
  );
}
