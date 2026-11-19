/**
 * @file Styles notebook Markdown cells. VS Code loads this module in the
 *   notebook webview, because `package.json` contributes it as a notebook
 *   renderer that extends the built-in Markdown renderer. It adds styling only,
 *   no markdown-it plugins, because GitHub's notebook viewer renders no task
 *   lists, alerts, or footnotes.
 */

import type {RendererContext} from 'vscode-notebook-renderer';

/** The ID of the built-in Markdown renderer that this module extends. */
const MARKDOWN_RENDERER_ID = 'vscode.markdown-it-renderer';

/**
 * The notebook stylesheet. The notebook webview loads a renderer's files only
 * from the folder of its entry point, so the build copies `media/notebook.css`
 * next to the bundle.
 */
const STYLESHEET_URL = new URL('notebook.css', import.meta.url);

/**
 * Activates the renderer. The built-in Markdown renderer renders each cell into
 * its own shadow root, which document styles don't reach. When it creates a
 * cell, it copies the content of every `<template class="markdown-style">`
 * element in the document's head into the shadow root, in document order.
 *
 * @param context - The context that VS Code passes to notebook renderers.
 * @throws {Error} If VS Code can't load the built-in Markdown renderer.
 */
export async function activate(
  context: RendererContext<unknown>,
): Promise<void> {
  // Waiting for the built-in renderer lets it add its own style template
  // first, so the notebook stylesheet wins ties in specificity.
  const markdownRenderer = await context.getRenderer(MARKDOWN_RENDERER_ID);
  if (markdownRenderer === undefined) {
    throw new Error(
      `Could not load the ${JSON.stringify(MARKDOWN_RENDERER_ID)} notebook renderer`,
    );
  }
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = STYLESHEET_URL.href;
  const template = document.createElement('template');
  template.classList.add('markdown-style');
  template.content.append(stylesheet);
  document.head.append(template);
}
