/**
 * @file Adds the syntax that Markdown Reader renders in the Markdown preview
 *   but not in notebook Markdown cells.
 */

import {alert} from '@mdit/plugin-alert';
import {tasklist} from '@mdit/plugin-tasklist';
import alertSVG from '@primer/octicons/build/svg/alert-16.svg' with {type: 'text'};
import infoSVG from '@primer/octicons/build/svg/info-16.svg' with {type: 'text'};
import lightBulbSVG from '@primer/octicons/build/svg/light-bulb-16.svg' with {type: 'text'};
import reportSVG from '@primer/octicons/build/svg/report-16.svg' with {type: 'text'};
import stopSVG from '@primer/octicons/build/svg/stop-16.svg' with {type: 'text'};
import type {MarkdownIt, Renderer, Token} from 'markdown-it';

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
 * @param markdownIt - The instance to extend, which this function changes.
 * @returns The same instance, so that callers can chain further calls.
 */
export function addPreviewSyntax(markdownIt: MarkdownIt): MarkdownIt {
  return markdownIt.use(tasklist, {disabled: true, label: true}).use(alert, {
    alertNames: [...ALERT_TITLES.keys()],
    titleRenderer: renderAlertTitle,
  });
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
