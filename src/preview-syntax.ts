/**
 * @file Adds the syntax that Markdown Reader renders in the Markdown preview
 *   but not in notebook Markdown cells.
 */

import {tasklist} from '@mdit/plugin-tasklist';
import type {MarkdownIt} from 'markdown-it';
import {addAlerts} from './alerts.ts';
import {addFootnotes} from './footnotes.ts';

/**
 * Adds Markdown Reader's preview syntax to a markdown-it instance: task lists,
 * GitHub alerts, and footnotes.
 *
 * Task lists render as disabled checkboxes, which the reader can't toggle. Each
 * checkbox and its text share a `<label>`, which gives the checkbox an
 * accessible name. `addAlerts` and `addFootnotes` describe the other syntax.
 *
 * @param markdownIt - The instance to extend, which this function changes.
 * @returns The same instance, so that callers can chain further calls.
 */
export function addPreviewSyntax(markdownIt: MarkdownIt): MarkdownIt {
  return markdownIt
    .use(tasklist, {disabled: true, label: true})
    .use(addAlerts)
    .use(addFootnotes);
}
