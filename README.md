# Markdown Reader

Markdown Reader is a VS Code extension that styles the built-in Markdown preview
and notebook Markdown cells for comfortable reading. It uses system fonts,
reading-focused spacing, and GitHub-style structure, with colors from your VS
Code theme.

## Status

Markdown Reader is in development and has no release. Every feature in the
[Features](#features) section works in the Markdown preview and in notebook
Markdown cells.

## Features

In the Markdown preview, Markdown Reader adds the following:

- Typography and spacing for reading, with system fonts and a comfortable line
  length
- GitHub-style structure: heading dividers, code block backgrounds, table
  borders with alternating row backgrounds, and block quote borders
- Task lists, shown as checkboxes that you can't toggle
- GitHub alerts of the types `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, and
  `CAUTION`
- Footnotes, with links from each reference to its note and back

In notebook Markdown cells, Markdown Reader applies the same typography and
structure but adds no syntax. Task lists, alerts, and footnotes appear as VS
Code shows them without the extension, because GitHub's notebook viewer doesn't
render them either.

Colors come from the active VS Code theme, including high-contrast themes.
Markdown Reader doesn't change your Markdown files, and it works offline.

Markdown Reader sets the text size by changing the defaults of the following
settings, so your own values for those settings still apply:

| Where                   | Font size setting               | Line height setting                 |
| ----------------------- | ------------------------------- | ----------------------------------- |
| Markdown preview        | `markdown.preview.fontSize`: 17 | `markdown.preview.lineHeight`: 1.65 |
| Notebook Markdown cells | `notebook.markup.fontSize`: 17  | `notebook.markdown.lineHeight`: 28  |

The font sizes are in pixels. The notebook line height is in pixels, and the
preview line height is a multiple of the font size.

## Install from Source

Markdown Reader has no release, so you build it from source and install the
package. You need VS Code 1.146 or later, Git, and Node.js 22.18 or later.

To build and install Markdown Reader, follow these steps:

1. Clone the repository:

   ```sh
   git clone https://github.com/nolaskyni/vscode-markdown-reader.git
   ```

2. Go to the repository's folder:

   ```sh
   cd vscode-markdown-reader
   ```

3. Install the dependencies:

   ```sh
   npm ci
   ```

   npm might warn that a development tool needs a later release of Node.js, or
   that it didn't run some install scripts. The build doesn't need that tool or
   those scripts.

4. Build Markdown Reader, and package it as a VSIX file, the package format of
   VS Code extensions:

   ```sh
   npx vsce package
   ```

   The command writes the `markdown-reader-0.1.0.vsix` file to the repository's
   folder.

5. Install the package:

   ```sh
   code --install-extension markdown-reader-0.1.0.vsix
   ```

   If the `code` command isn't available, install the package from VS Code
   instead. In the Command Palette, run **Extensions: Install from VSIX...**,
   and select the `markdown-reader-0.1.0.vsix` file.

For more information about the changes in each version, see the
[changelog](CHANGELOG.md).

## AI Usage

AI assists with designing, writing, reviewing, and testing the extension, with
human review.

## License

Markdown Reader is licensed under the [MIT License](LICENSE).
