// @vitest-environment happy-dom

import type {RendererApi, RendererContext} from 'vscode-notebook-renderer';
import {afterEach, describe, expect, test, vi} from 'vitest';
import {activate} from './renderer.ts';

type GetRenderer = RendererContext<unknown>['getRenderer'];

/**
 * Returns a renderer context whose `getRenderer` resolves to
 * `markdownRenderer`.
 */
function contextWith(
  markdownRenderer: RendererApi | undefined,
  getRenderer: GetRenderer = async () => markdownRenderer,
): RendererContext<unknown> {
  return {
    getRenderer,
    getState: () => undefined,
    setState: () => {},
    workspace: {isTrusted: true},
  };
}

afterEach(() => {
  document.head.replaceChildren();
});

describe('activate', () => {
  test('requests the built-in Markdown renderer', async () => {
    const getRenderer = vi.fn<GetRenderer>(async (): Promise<RendererApi> => ({
      renderOutputItem: () => {},
    }));

    await activate(contextWith(undefined, getRenderer));

    expect(getRenderer).toHaveBeenCalledWith('vscode.markdown-it-renderer');
  });

  test('adds a style template that links the stylesheet next to it', async () => {
    await activate(contextWith({renderOutputItem: () => {}}));

    const templates = document.head.querySelectorAll<HTMLTemplateElement>(
      'template.markdown-style',
    );
    expect(templates).toHaveLength(1);
    const links = templates[0]?.content.querySelectorAll('link') ?? [];
    expect(links).toHaveLength(1);
    expect(links[0]?.rel).toBe('stylesheet');
    // In a DOM environment, Vite rewrites `new URL(path, import.meta.url)` to
    // a URL that it serves from the project root, so this path shows that the
    // stylesheet is in the module's folder. The VS Code tests check that the
    // build puts it there.
    const stylesheetPath = new URL(links[0]?.getAttribute('href') ?? '')
      .pathname;
    expect(stylesheetPath).toBe('/src/notebook/notebook.css');
  });

  test('adds no markdown-it plugins', async () => {
    const extendMarkdownIt = vi.fn<() => void>();

    await activate(contextWith({renderOutputItem: () => {}, extendMarkdownIt}));

    expect(extendMarkdownIt).not.toHaveBeenCalled();
  });

  test('throws when the built-in Markdown renderer is missing', async () => {
    await expect(activate(contextWith(undefined))).rejects.toThrow(
      'Could not load the "vscode.markdown-it-renderer" notebook renderer',
    );
    expect(document.head.children).toHaveLength(0);
  });
});
