This note exercises the syntax that the Obsidian flavor renders. The vault's `.vscode/settings.json` file sets `markdownReader.preview.flavor` to `obsidian`. Each section states what a correct rendering shows, so you can check a preview against it without reading the extension's code.

# Inline Footnotes

A sentence with an inline footnote.^[An inline note with **formatting**.] Another sentence has a reference footnote.[^reference]

Expected: both footnotes are superscript links, numbered 1 and 2 in order. The notes at the end of the document show "An inline note with **formatting**." and "A reference note." Each note links back to its reference.

[^reference]: A reference note.

# Code

The following inline code and code block hold footnote syntax: `Text.^[Not a note.]`

```markdown
Text.^[Not a note.]
```

Expected: both stay literal text, with their carets and brackets.
