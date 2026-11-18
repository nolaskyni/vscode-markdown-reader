# Markdown Reader Fixture

This file exercises every feature the extension styles or renders. Each section
states what a correct rendering shows, so you can check a preview against it
without reading the extension's code.

## Text and Links

A paragraph with **bold**, _italic_, ~~strikethrough~~, and `inline code`. It
links to [an external site](https://code.visualstudio.com), to the
[Tables](#tables) section in this file, and to
[the notebook fixture](sample.ipynb).

Expected: every link is styled as a link and can be reached with the keyboard.

## Task Lists

The following list mixes checked and unchecked tasks:

- [x] A checked task
- [ ] An unchecked task
- A plain item that isn't a task
  - [ ] A nested unchecked task
  - [x] A nested checked task

Expected: the first two items and the nested items show checkboxes that can't be
toggled. The plain item shows no checkbox.

The following paragraph uses the same syntax outside a list:

[x] This paragraph starts with brackets.

Expected: the brackets stay as literal text.

## Alerts

<!-- markdownlint-disable no-blanks-blockquote -->

> [!NOTE]
> A note alert with **formatting** and a
> [link to an example site](https://example.com).

> [!TIP]
> A tip alert.

> [!IMPORTANT]
> An important alert.

> [!WARNING]
> A warning alert.

> [!CAUTION]
> A caution alert.
>
> It has a second paragraph.

Expected: each of the preceding five blocks is an alert with its type's title
and icon.

> [!INFO]
> An unknown alert type.

> An ordinary block quote with [!NOTE] in the middle of its text.

<!-- markdownlint-enable no-blanks-blockquote -->

Expected: the preceding two block quotes stay ordinary block quotes.

## Footnotes

A sentence with a footnote.[^first] Another sentence reuses it.[^first] A third
sentence has a long footnote.[^long]

Expected: each reference is a superscript link to its note at the end of the
document, and each note links back to every reference to it.

[^first]: The first footnote.

[^long]: A long footnote with two paragraphs.

    The second paragraph of the long footnote.

## Code

The following Python block has syntax highlighting:

```python
def mean(values: list[float]) -> float:
    return sum(values) / len(values)
```

The following block has a line longer than any preview is wide:

```text
0123456789 0123456789 0123456789 0123456789 0123456789 0123456789 0123456789 0123456789 0123456789 0123456789
```

Expected: the long line scrolls inside its block, not the whole preview.

The following block contains syntax examples:

```markdown
- [x] A task inside a code block

> [!NOTE]
> An alert inside a code block.

A footnote reference inside a code block.[^first]
```

Expected: the block shows its source as written, with no checkbox, alert, or
footnote link.

## Tables

| Feature    | Preview | Notebook | Notes                                                                    |
| ---------- | ------- | -------- | ------------------------------------------------------------------------ |
| Task lists | Yes     | No       | Display only                                                             |
| Alerts     | Yes     | No       | Five GitHub types                                                        |
| Footnotes  | Yes     | No       | A very long cell that makes the table wider than a narrow preview window |

Expected: the table has borders and alternating row backgrounds, and a table
wider than the preview scrolls horizontally.

## Block Quotes

> An ordinary block quote.
>
> > A nested block quote.

## Math

Inline math, $e^{i\pi} + 1 = 0$, and display math:

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

Expected: both render with KaTeX, through VS Code's built-in math support.

## Mermaid

```mermaid
flowchart LR
    source[Markdown source] --> parser[markdown-it] --> preview[Preview]
```

Expected: a diagram renders, through VS Code's built-in Mermaid support.

## Images

![A gray rectangle labeled "Sample image"](images/sample-image.svg)

Expected: the local image renders.
