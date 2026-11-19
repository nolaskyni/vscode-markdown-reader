/** @file Renders footnotes, such as `[^1]`, in the Markdown preview. */

import {footnote} from '@mdit/plugin-footnote';
import type {
  Env,
  MarkdownIt,
  MarkdownItOptions,
  Renderer,
  Token,
} from 'markdown-it';
import {gateRule} from './flavor.ts';
import type {RenderPredicate} from './flavor.ts';

/**
 * The text of a footnote's back link: a leftwards arrow with hook, followed by
 * the variation selector that asks for text rather than emoji presentation, as
 * in the footnote plugin's own back links.
 */
const BACK_ARROW = '\u21A9\uFE0E';

/** Options for `addFootnotes`. */
export interface FootnoteOptions {
  /**
   * Returns whether a render shows inline footnotes, such as `^[text]`. By
   * default, no render does.
   */
  readonly areInlineFootnotesRendered?: RenderPredicate;
}

/** Where a footnote reference or back link sits among the document's notes. */
interface FootnotePosition {
  /** The note's zero-based position among the notes. */
  readonly id: number;
  /** The number of earlier references to the same note. */
  readonly subId: number;
}

/**
 * Adds footnotes to a markdown-it instance. References render as superscript
 * links numbered in order of first reference, as on GitHub. The notes follow
 * the document, and each note links back to every reference to it. Inline
 * footnotes, such as `^[text]`, render only where `areInlineFootnotesRendered`
 * allows, because GitHub doesn't render them but Obsidian does.
 *
 * @param markdownIt - The instance to extend, which this function changes.
 * @param options - Which renders show inline footnotes.
 */
export function addFootnotes(
  markdownIt: MarkdownIt,
  {areInlineFootnotesRendered = (): boolean => false}: FootnoteOptions = {},
): void {
  markdownIt.use(footnote);
  gateRule(
    markdownIt.inline.ruler,
    'footnoteInline',
    areInlineFootnotesRendered,
  );
  markdownIt.renderer.rules['footnote_block_open'] = renderFootnoteBlockOpen;
  markdownIt.renderer.rules['footnote_caption'] = renderFootnoteCaption;
  markdownIt.renderer.rules['footnote_anchor'] = renderFootnoteBackLink;
}

/**
 * Renders the start of the notes: the plugin's separator, section, and list,
 * with a "Footnotes" heading at the start of the section, as on GitHub. The
 * stylesheet hides the heading, so that only screen readers announce it.
 *
 * @param tokens - The document's tokens.
 * @param index - The position of the `footnote_block_open` token in `tokens`.
 * @param options - The markdown-it options, whose `xhtmlOut` closes the
 *   separator as XHTML.
 * @returns The HTML that opens the notes.
 */
function renderFootnoteBlockOpen(
  tokens: readonly Token[],
  index: number,
  options: Required<MarkdownItOptions>,
): string {
  const separatorEnd = options.xhtmlOut ? ' />' : '>';
  return (
    `<hr class="footnotes-sep"${separatorEnd}\n` +
    '<section class="footnotes">\n' +
    '<h2 class="footnotes-heading">Footnotes</h2>\n' +
    '<ol class="footnotes-list">\n'
  );
}

/**
 * Renders a footnote reference's link text as the note's number, as GitHub
 * does. The plugin's default caption adds brackets and, for each later
 * reference to the same note, a suffix, such as `[1:1]`.
 *
 * @param tokens - The document's tokens.
 * @param index - The position of the `footnote_ref` token in `tokens`.
 * @returns The note's number, starting from 1.
 */
function renderFootnoteCaption(
  tokens: readonly Token[],
  index: number,
): string {
  return String(footnotePosition(tokens, index).id + 1);
}

/**
 * Renders a link from a note back to one of its references. Unlike the plugin's
 * default renderer, it gives the link an accessible name, and it numbers each
 * back link after the first, as GitHub does.
 *
 * @param tokens - The document's tokens.
 * @param index - The position of the `footnote_anchor` token in `tokens`.
 * @param options - The markdown-it options.
 * @param environment - The render environment, which can set the document ID
 *   that prefixes the link's target.
 * @param renderer - The renderer, whose `footnote_anchor_name` rule gives the
 *   name that the reference's ID uses.
 * @returns The back link's HTML, preceded by a space.
 * @throws {Error} If the renderer has no `footnote_anchor_name` rule.
 */
function renderFootnoteBackLink(
  tokens: Token[],
  index: number,
  options: Required<MarkdownItOptions>,
  environment: Env | undefined,
  renderer: Renderer,
): string {
  const anchorName = renderer.rules['footnote_anchor_name'];
  if (anchorName === undefined) {
    throw new Error(
      'Expected the footnote plugin to define `footnote_anchor_name`',
    );
  }
  const {id, subId} = footnotePosition(tokens, index);
  const name = anchorName(tokens, index, options, environment, renderer);
  const noteNumber = id + 1;
  const target =
    subId === 0 ? `footnote-ref${name}` : `footnote-ref${name}:${subId}`;
  const label = subId === 0 ? `${noteNumber}` : `${noteNumber}-${subId + 1}`;
  const text =
    subId === 0 ? BACK_ARROW : `${BACK_ARROW}<sup>${subId + 1}</sup>`;
  return (
    ` <a href="#${target}" class="footnote-backref" ` +
    `aria-label="Back to reference ${label}">${text}</a>`
  );
}

/**
 * Returns the footnote position that the plugin stores in a reference's or back
 * link's `meta`.
 *
 * @param tokens - The document's tokens.
 * @param index - The position of the footnote token in `tokens`.
 * @returns The note's position and the number of earlier references to it. The
 *   plugin omits `subId` from inline footnotes, which count as a note's first
 *   reference.
 * @throws {Error} If `tokens[index]` has no numeric `id` in its `meta`.
 */
function footnotePosition(
  tokens: readonly Token[],
  index: number,
): FootnotePosition {
  const meta = tokens[index]?.meta;
  const id = meta?.['id'];
  const subId = meta?.['subId'] ?? 0;
  if (typeof id !== 'number' || typeof subId !== 'number') {
    throw new Error(
      `Expected a footnote token at index ${index}, got ` +
        JSON.stringify(tokens[index]?.type),
    );
  }
  return {id, subId};
}
