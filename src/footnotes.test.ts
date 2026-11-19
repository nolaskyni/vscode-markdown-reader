/**
 * @file Checks footnotes, using a plain markdown-it instance with HTML enabled.
 *   The tests in `test/vscode/` check them in VS Code's own renderer.
 */

import MarkdownIt from 'markdown-it';
import type {Env} from 'markdown-it';
import {describe, expect, test} from 'vitest';
import {addFootnotes} from './footnotes.ts';

/**
 * The text of a footnote's back link: a leftwards arrow with hook, followed by
 * the variation selector that asks for text rather than emoji presentation.
 */
const BACK_ARROW = '\u21A9\uFE0E';

/**
 * Renders Markdown with footnotes added.
 *
 * @param source - The Markdown to render.
 * @returns The rendered HTML.
 */
function render(source: string): string {
  return new MarkdownIt({html: true}).use(addFootnotes).render(source);
}

describe('addFootnotes', () => {
  test('renders a footnote reference and its note at the end', () => {
    expect(
      render('A claim.[^source]\n\n[^source]: The source.\n\nEnd.\n'),
    ).toBe(
      '<p>A claim.<sup class="footnote-ref"><a href="#footnote1">1</a>' +
        '<a class="footnote-anchor" id="footnote-ref1"></a></sup></p>\n' +
        '<p>End.</p>\n' +
        '<hr class="footnotes-sep">\n' +
        '<section class="footnotes">\n' +
        '<h2 class="footnotes-heading">Footnotes</h2>\n' +
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

  test('renders an inline footnote when `areInlineFootnotesRendered` is true', () => {
    const html = new MarkdownIt({html: true})
      .use(addFootnotes, {areInlineFootnotesRendered: () => true})
      .render('Text.^[An inline note.]\n');

    expect(html).toContain(
      '<p>Text.<sup class="footnote-ref"><a href="#footnote1">1</a>' +
        '<a class="footnote-anchor" id="footnote-ref1"></a></sup></p>\n',
    );
    expect(html).toContain(
      '<li id="footnote1" class="footnote-item"><p>An inline note. ' +
        '<a href="#footnote-ref1" class="footnote-backref" ' +
        `aria-label="Back to reference 1">${BACK_ARROW}</a></p>\n`,
    );
  });

  test('passes the render environment to `areInlineFootnotesRendered`', () => {
    const markdownIt = new MarkdownIt({html: true}).use(addFootnotes, {
      areInlineFootnotesRendered: (environment: Env) =>
        environment['isObsidian'] === true,
    });
    const source = 'Text.^[An inline note.]\n';

    expect(markdownIt.render(source, {isObsidian: true})).toContain(
      '<sup class="footnote-ref">',
    );
    expect(markdownIt.render(source, {isObsidian: false})).toBe(
      new MarkdownIt({html: true}).render(source),
    );
  });
});
