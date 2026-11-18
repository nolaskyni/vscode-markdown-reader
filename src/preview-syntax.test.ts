/**
 * @file Checks the syntax that Markdown Reader adds to the Markdown preview,
 *   using a plain markdown-it instance with HTML enabled. The tests in
 *   `test/vscode/` check the same syntax in VS Code's own renderer.
 */

import MarkdownIt from 'markdown-it';
import {describe, expect, test} from 'vitest';
import {addPreviewSyntax} from './preview-syntax.ts';

/**
 * Renders Markdown with the preview syntax added.
 *
 * @param source - The Markdown to render.
 * @returns The rendered HTML.
 */
function render(source: string): string {
  return addPreviewSyntax(new MarkdownIt({html: true})).render(source);
}

describe('addPreviewSyntax', () => {
  test('renders an unchecked task as a disabled, unchecked checkbox', () => {
    expect(render('- [ ] Write tests\n')).toBe(
      '<ul class="task-list-container">\n' +
        '<li class="task-list-item"><label class="task-list-item-label">' +
        '<input type="checkbox" class="task-list-item-checkbox" disabled="disabled">' +
        ' Write tests</label></li>\n' +
        '</ul>\n',
    );
  });

  test.each(['x', 'X'])(
    'renders a task marked "%s" as a disabled, checked checkbox',
    (mark) => {
      expect(render(`- [${mark}] Write tests\n`)).toContain(
        '<input type="checkbox" class="task-list-item-checkbox" ' +
          'checked="checked" disabled="disabled">',
      );
    },
  );

  test('renders tasks in ordered and nested lists', () => {
    const html = render('1. [ ] First\n   - [x] Nested\n');

    expect(html).toContain('<ol class="task-list-container">');
    expect(html).toContain('<ul class="task-list-container">');
    expect(html.match(/<input /g)).toHaveLength(2);
  });

  test('leaves list items without a task marker unchanged', () => {
    expect(render('- [ ] Task\n- Plain item\n')).toContain(
      '<li>Plain item</li>',
    );
  });

  test.each([
    ['a paragraph', '[x] Not a task\n'],
    ['a code fence', '```markdown\n- [ ] Not a task\n```\n'],
    ['inline code', '- `[ ] Not a task`\n'],
    ['a marker without a following space', '- [x]Not a task\n'],
  ])('leaves task syntax in %s unrendered', (_, source) => {
    expect(render(source)).toBe(new MarkdownIt({html: true}).render(source));
  });
});
