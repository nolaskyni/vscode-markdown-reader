/**
 * @file Checks GitHub alerts, using a plain markdown-it instance with HTML
 *   enabled. The tests in `test/vscode/` check them in VS Code's own renderer.
 */

import MarkdownIt from 'markdown-it';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe, expect, test} from 'vitest';
import {addAlerts} from './alerts.ts';

/**
 * Renders Markdown with alerts added.
 *
 * @param source - The Markdown to render.
 * @returns The rendered HTML.
 */
function render(source: string): string {
  return new MarkdownIt({html: true}).use(addAlerts).render(source);
}

describe('addAlerts', () => {
  test('renders a note alert with its title, icon, and content', () => {
    expect(render('> [!NOTE]\n> Read **this**.\n')).toBe(
      '<div class="markdown-alert markdown-alert-note">\n' +
        `<p class="markdown-alert-title">${octicon('info')}Note</p>\n` +
        '<p>Read <strong>this</strong>.</p>\n' +
        '</div>\n',
    );
  });

  test.each([
    ['NOTE', 'note', 'Note', 'info'],
    ['TIP', 'tip', 'Tip', 'light-bulb'],
    ['IMPORTANT', 'important', 'Important', 'report'],
    ['WARNING', 'warning', 'Warning', 'alert'],
    ['CAUTION', 'caution', 'Caution', 'stop'],
  ])(
    'renders an alert marked %s with its own class, title, and Octicon',
    (marker, type, title, icon) => {
      expect(render(`> [!${marker}]\n> Text.\n`)).toContain(
        `<div class="markdown-alert markdown-alert-${type}">\n` +
          `<p class="markdown-alert-title">${octicon(icon)}${title}</p>\n`,
      );
    },
  );

  test('renders an alert marker in lowercase', () => {
    expect(render('> [!warning]\n> Text.\n')).toContain(
      '<div class="markdown-alert markdown-alert-warning">\n' +
        `<p class="markdown-alert-title">${octicon('alert')}Warning</p>\n`,
    );
  });

  test('renders every paragraph of an alert inside it', () => {
    expect(render('> [!CAUTION]\n> First.\n>\n> Second.\n')).toContain(
      '<p>First.</p>\n<p>Second.</p>\n</div>\n',
    );
  });

  test.each([
    ['an unknown alert type', '> [!INFO]\n> Text.\n'],
    ['a marker in the middle of a quote', '> Text with [!NOTE] inside.\n'],
    ['a marker followed by text', '> [!NOTE] Text.\n'],
    ['a code fence', '```markdown\n> [!NOTE]\n> Text.\n```\n'],
    ['a list item', '- > [!NOTE]\n  > Text.\n'],
    ['a block quote', '> > [!NOTE]\n> > Text.\n'],
  ])('leaves alert syntax in %s unrendered', (_, source) => {
    expect(render(source)).toBe(new MarkdownIt({html: true}).render(source));
  });
});

/**
 * Returns the inline SVG that an alert title starts with.
 *
 * @param name - The Octicon's name, such as `info`.
 * @returns The 16-pixel Octicon from `@primer/octicons`, marked as decorative
 *   and filled with the title's text color.
 */
function octicon(name: string): string {
  const svg = readFileSync(
    fileURLToPath(
      import.meta.resolve(`@primer/octicons/build/svg/${name}-16.svg`),
    ),
    'utf8',
  );
  return svg.replace(
    '<svg ',
    `<svg class="octicon octicon-${name}" aria-hidden="true" fill="currentColor" `,
  );
}
