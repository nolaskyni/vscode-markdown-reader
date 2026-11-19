/**
 * @file Adds the syntax that Markdown Reader renders in the Markdown preview
 *   but not in notebook Markdown cells.
 */

import {tasklist} from '@mdit/plugin-tasklist';
import type {Env, MarkdownIt} from 'markdown-it';
import {addAlerts} from './alerts.ts';
import {addFlavorRule, renderFlavor} from './flavor.ts';
import type {PreviewFlavor} from './flavor.ts';
import {addFootnotes} from './footnotes.ts';

/** Options for `addPreviewSyntax`. */
export interface PreviewSyntaxOptions {
  /**
   * Returns the flavor of a render, given its environment. By default, every
   * render uses the GitHub flavor.
   */
  readonly flavorOf?: (environment: Env) => PreviewFlavor;
}

/**
 * Adds Markdown Reader's preview syntax to a markdown-it instance: task lists,
 * GitHub alerts, and footnotes, plus the syntax of the render's flavor. The
 * Obsidian flavor adds inline footnotes.
 *
 * Task lists render as disabled checkboxes, which the reader can't toggle. Each
 * checkbox and its text share a `<label>`, which gives the checkbox an
 * accessible name. `addAlerts` and `addFootnotes` describe the other syntax.
 *
 * @param markdownIt - The instance to extend, which this function changes.
 * @param options - The function that returns each render's flavor.
 * @returns The same instance, so that callers can chain further calls.
 */
export function addPreviewSyntax(
  markdownIt: MarkdownIt,
  {flavorOf = (): PreviewFlavor => 'github'}: PreviewSyntaxOptions = {},
): MarkdownIt {
  addFlavorRule(markdownIt, {flavorOf});
  return markdownIt
    .use(tasklist, {disabled: true, label: true})
    .use(addAlerts)
    .use(addFootnotes, {areInlineFootnotesRendered: isObsidian});
}

/**
 * Returns whether a render uses the Obsidian flavor.
 *
 * @param environment - The render's environment.
 * @returns Whether `addFlavorRule` recorded the Obsidian flavor.
 */
function isObsidian(environment: Env): boolean {
  return renderFlavor(environment) === 'obsidian';
}
