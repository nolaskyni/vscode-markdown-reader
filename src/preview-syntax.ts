/**
 * @file Adds the syntax that Markdown Reader renders in the Markdown preview
 *   but not in notebook Markdown cells.
 */

import {alert} from '@mdit/plugin-alert';
import {footnote} from '@mdit/plugin-footnote';
import {tasklist} from '@mdit/plugin-tasklist';
import alertSVG from '@primer/octicons/build/svg/alert-16.svg' with {type: 'text'};
import infoSVG from '@primer/octicons/build/svg/info-16.svg' with {type: 'text'};
import lightBulbSVG from '@primer/octicons/build/svg/light-bulb-16.svg' with {type: 'text'};
import reportSVG from '@primer/octicons/build/svg/report-16.svg' with {type: 'text'};
import stopSVG from '@primer/octicons/build/svg/stop-16.svg' with {type: 'text'};
import type {
  Env,
  MarkdownIt,
  MarkdownItOptions,
  Renderer,
  Token,
} from 'markdown-it';

/**
 * The HTML that starts each alert's title, keyed by the lowercase alert type.
 * The titles and Octicons match the ones GitHub shows.
 */
const ALERT_TITLES: ReadonlyMap<string, string> = new Map([
  ['note', alertTitle('Note', 'info', infoSVG)],
  ['tip', alertTitle('Tip', 'light-bulb', lightBulbSVG)],
  ['important', alertTitle('Important', 'report', reportSVG)],
  ['warning', alertTitle('Warning', 'alert', alertSVG)],
  ['caution', alertTitle('Caution', 'stop', stopSVG)],
]);

/**
 * The text of a footnote's back link: a leftwards arrow with hook, followed by
 * the variation selector that asks for text rather than emoji presentation, as
 * in the footnote plugin's own back links.
 */
const BACK_ARROW = '\u21A9\uFE0E';

/** Where a footnote reference or back link sits among the document's notes. */
interface FootnotePosition {
  /** The note's zero-based position among the notes. */
  readonly id: number;
  /** The number of earlier references to the same note. */
  readonly subId: number;
}

/**
 * Adds Markdown Reader's preview syntax to a markdown-it instance.
 *
 * Task lists render as disabled checkboxes, which the reader can't toggle. Each
 * checkbox and its text share a `<label>`, which gives the checkbox an
 * accessible name.
 *
 * GitHub alerts, such as `> [!NOTE]`, render as `<div>` elements with GitHub's
 * classes, whose title starts with an Octicon. Alerts nested in lists or block
 * quotes stay block quotes, as on GitHub.
 *
 * Footnote references, such as `[^1]`, render as superscript links numbered in
 * order of first reference, as on GitHub. The notes follow the document, and
 * each note links back to every reference to it. Inline footnotes, such as
 * `^[text]`, stay text, because GitHub doesn't render them.
 *
 * @param markdownIt - The instance to extend, which this function changes.
 * @returns The same instance, so that callers can chain further calls.
 */
export function addPreviewSyntax(markdownIt: MarkdownIt): MarkdownIt {
  markdownIt
    .use(tasklist, {disabled: true, label: true})
    .use(alert, {
      alertNames: [...ALERT_TITLES.keys()],
      titleRenderer: renderAlertTitle,
    })
    .use(footnote);
  markdownIt.inline.ruler.disable('footnoteInline');
  markdownIt.renderer.rules['footnote_caption'] = renderFootnoteCaption;
  markdownIt.renderer.rules['footnote_anchor'] = renderFootnoteBackLink;
  return markdownIt;
}

/**
 * Returns the HTML inside an alert's title paragraph.
 *
 * @param title - The text that follows the icon, such as `Note`.
 * @param iconName - The Octicon's name, such as `info`.
 * @param svg - The Octicon's SVG file.
 * @returns The icon, marked as decorative and filled with the title's text
 *   color, followed by the title.
 */
function alertTitle(title: string, iconName: string, svg: string): string {
  const icon = svg
    .trim()
    .replace(
      '<svg ',
      `<svg class="octicon octicon-${iconName}" aria-hidden="true" fill="currentColor" `,
    );
  return icon + title;
}

/**
 * Renders an alert's title paragraph. Unlike the plugin's default renderer, it
 * keeps the token's attributes, which include the line attributes that VS Code
 * uses to sync scrolling.
 *
 * @param tokens - The document's tokens.
 * @param index - The position of the `alert_title` token in `tokens`.
 * @param _options - The markdown-it options, which this renderer doesn't use.
 * @param _environment - The render environment, which this renderer doesn't
 *   use.
 * @param renderer - The renderer, which formats the attributes.
 * @returns The title paragraph's HTML.
 * @throws {Error} If `tokens[index]` isn't a known alert type's title.
 */
function renderAlertTitle(
  tokens: readonly Token[],
  index: number,
  _options: unknown,
  _environment: unknown,
  renderer: Renderer,
): string {
  const token = tokens[index];
  const title = token && ALERT_TITLES.get(token.markup);
  if (token === undefined || title === undefined) {
    throw new Error(
      `Expected an alert title token at index ${index}, got ` +
        JSON.stringify(token?.markup),
    );
  }
  return `<p${renderer.renderAttrs(token)}>${title}</p>\n`;
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
