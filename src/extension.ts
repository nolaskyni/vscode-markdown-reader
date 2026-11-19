/**
 * @file Activates Markdown Reader and gives the built-in Markdown preview its
 *   markdown-it hook.
 */

import type {Env, MarkdownIt} from 'markdown-it';
import * as vscode from 'vscode';
import {isPreviewFlavor} from './flavor.ts';
import type {PreviewFlavor} from './flavor.ts';
import {addPreviewSyntax} from './preview-syntax.ts';

/** The section that holds the preview's settings. */
const PREVIEW_SECTION = 'markdownReader.preview';

/** The setting, within `PREVIEW_SECTION`, that picks the preview's flavor. */
const FLAVOR_SETTING = 'flavor';

/** The hooks that the built-in Markdown extension reads from `activate`. */
export interface MarkdownPreviewHooks {
  /** Adds this extension's plugins to the preview's markdown-it instance. */
  readonly extendMarkdownIt: (markdownIt: MarkdownIt) => MarkdownIt;
}

/**
 * Activates the extension. VS Code calls this when it first renders a Markdown
 * preview, because `package.json` contributes `markdown.markdownItPlugins`.
 *
 * @param context - The extension's context, which disposes of the setting
 *   listener when VS Code deactivates the extension.
 * @returns The hooks that the built-in Markdown preview calls.
 */
export function activate(
  context: vscode.ExtensionContext,
): MarkdownPreviewHooks {
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(`${PREVIEW_SECTION}.${FLAVOR_SETTING}`)) {
        // The built-in renderer caches the tokens of the last document that it
        // rendered, and the cache doesn't depend on this setting. The command
        // clears the cache and re-renders open previews.
        void vscode.commands.executeCommand('markdown.preview.refresh');
      }
    }),
  );
  return {
    extendMarkdownIt: (markdownIt) =>
      addPreviewSyntax(markdownIt, {flavorOf: previewFlavor}),
  };
}

/**
 * Returns the flavor that the `markdownReader.preview.flavor` setting picks for
 * a render. The built-in renderer passes the rendered document's URI as
 * `currentDocument`, so a workspace folder's own value applies to its
 * documents. A render of a string has no document and uses the workspace or
 * user value.
 *
 * @param environment - The render's environment.
 * @returns The setting's flavor, or `"github"` if the value isn't a flavor. VS
 *   Code already marks such a value as invalid in the settings file.
 */
function previewFlavor(environment: Env): PreviewFlavor {
  const document = environment['currentDocument'];
  const flavor = vscode.workspace
    .getConfiguration(
      PREVIEW_SECTION,
      document instanceof vscode.Uri ? document : undefined,
    )
    .get<unknown>(FLAVOR_SETTING);
  return isPreviewFlavor(flavor) ? flavor : 'github';
}
