/**
 * @file Checks how the preview records each render's flavor and gates
 *   markdown-it rules, using plain markdown-it instances.
 */

import MarkdownIt from 'markdown-it';
import type {Env} from 'markdown-it';
import {describe, expect, test} from 'vitest';
import {
  addFlavorRule,
  gateRule,
  isPreviewFlavor,
  renderFlavor,
} from './flavor.ts';
import type {PreviewFlavor} from './flavor.ts';

describe('isPreviewFlavor', () => {
  test.each(['github', 'obsidian'])('accepts "%s"', (flavor) => {
    expect(isPreviewFlavor(flavor)).toBe(true);
  });

  test.each([['Obsidian'], ['pandoc'], [''], [undefined], [1]])(
    'rejects %j',
    (value) => {
      expect(isPreviewFlavor(value)).toBe(false);
    },
  );
});

describe('addFlavorRule', () => {
  test('records the flavor once for each render', () => {
    const environments: Env[] = [];
    const markdownIt = new MarkdownIt();
    addFlavorRule(markdownIt, {
      flavorOf: (environment): PreviewFlavor => {
        environments.push(environment);
        return 'obsidian';
      },
    });
    const environment: Env = {};

    markdownIt.render('*One* and `two`.\n\n- Three\n', environment);

    expect(environments).toEqual([environment]);
    expect(renderFlavor(environment)).toBe('obsidian');
  });

  test('records the flavor when rendering inline Markdown', () => {
    const markdownIt = new MarkdownIt();
    addFlavorRule(markdownIt, {flavorOf: () => 'obsidian'});
    const environment: Env = {};

    markdownIt.renderInline('*One*', environment);

    expect(renderFlavor(environment)).toBe('obsidian');
  });
});

describe('renderFlavor', () => {
  test('throws when no flavor was recorded', () => {
    expect(() => renderFlavor({})).toThrow(
      'Expected `addFlavorRule` to record the render flavor',
    );
  });
});

describe('gateRule', () => {
  test('runs an inline rule when the predicate is true', () => {
    const markdownIt = new MarkdownIt();
    gateRule(markdownIt.inline.ruler, 'backticks', () => true);

    expect(markdownIt.render('`code`\n')).toBe('<p><code>code</code></p>\n');
  });

  test('skips an inline rule when the predicate is false', () => {
    const markdownIt = new MarkdownIt();
    gateRule(markdownIt.inline.ruler, 'backticks', () => false);

    expect(markdownIt.render('`code`\n')).toBe('<p>`code`</p>\n');
  });

  test('passes the render environment to the predicate', () => {
    const markdownIt = new MarkdownIt();
    gateRule(
      markdownIt.inline.ruler,
      'backticks',
      (environment) => environment['isCodeRendered'] === true,
    );

    expect(markdownIt.render('`code`\n', {isCodeRendered: true})).toBe(
      '<p><code>code</code></p>\n',
    );
    expect(markdownIt.render('`code`\n', {isCodeRendered: false})).toBe(
      '<p>`code`</p>\n',
    );
  });

  test('keeps the chains in which a block rule can interrupt others', () => {
    const markdownIt = new MarkdownIt();
    gateRule(markdownIt.block.ruler, 'blockquote', () => true);

    expect(markdownIt.render('Text.\n> Quote.\n')).toBe(
      '<p>Text.</p>\n<blockquote>\n<p>Quote.</p>\n</blockquote>\n',
    );
  });

  test('throws for a rule that the ruler lacks', () => {
    const markdownIt = new MarkdownIt();

    expect(() =>
      gateRule(markdownIt.inline.ruler, 'missing', () => true),
    ).toThrow('Expected a markdown-it rule named "missing"');
  });
});
