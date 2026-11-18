/**
 * @file Activates Markdown Reader and gives the built-in Markdown preview its
 *   markdown-it hook.
 */

import type {MarkdownIt} from 'markdown-it';
import {addPreviewSyntax} from './preview-syntax.ts';

/** The hooks that the built-in Markdown extension reads from `activate`. */
export interface MarkdownPreviewHooks {
  /** Adds this extension's plugins to the preview's markdown-it instance. */
  readonly extendMarkdownIt: (markdownIt: MarkdownIt) => MarkdownIt;
}

/**
 * Activates the extension. VS Code calls this when it first renders a Markdown
 * preview, because `package.json` contributes `markdown.markdownItPlugins`.
 *
 * @returns The hooks that the built-in Markdown preview calls.
 */
export function activate(): MarkdownPreviewHooks {
  return {extendMarkdownIt: addPreviewSyntax};
}
