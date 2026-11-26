# Markdown Reader

Markdown Reader styles the built-in VS Code Markdown preview and notebook
Markdown cells with system fonts, more space between lines, and colors from your
theme, including high-contrast themes. The preview also renders read-only task
lists, GitHub alerts, and footnotes. Notebook cells get styling only.

Markdown Reader has no release. [Install it from source](#install-from-source).

## Use Markdown Reader

Open a Markdown file and run **Markdown: Open Preview** from the Command
Palette. Markdown Reader styles notebook Markdown cells when they render. It
works offline and doesn't change your files.

## Settings

Your settings override these defaults:

| View     | Setting                        | Default                  |
| -------- | ------------------------------ | ------------------------ |
| Preview  | `markdown.preview.fontSize`    | 17 pixels                |
| Preview  | `markdown.preview.lineHeight`  | 1.65 times the font size |
| Notebook | `notebook.markup.fontSize`     | 17 pixels                |
| Notebook | `notebook.markdown.lineHeight` | 28 pixels                |

The `markdownReader.preview.flavor` setting applies only to the preview:

- `github` (default): Renders task lists, GitHub alerts, and footnotes.
- `obsidian`: Adds inline footnotes (`^[text]`) to `github`. Other Obsidian
  syntax, such as links to notes and callouts, appears as plain text.

To set the flavor for one workspace folder, such as an Obsidian vault, use the
folder's `.vscode/settings.json` file:

<!-- prettier-ignore -->
```json
{
    "markdownReader.preview.flavor": "obsidian"
}
```

To preserve line breaks within paragraphs in the preview, also set
`markdown.preview.breaks` to `true`.

## Install from Source

You need VS Code 1.146 or later, Git, and Node.js 22.18 or later. To install
Markdown Reader, follow these steps:

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

   On Node.js 22.18, npm can warn that Stylelint requires Node.js 22.22.2 or
   later. Packaging doesn't use Stylelint.

4. Build and package the extension:

   ```sh
   npx vsce package
   ```

5. Install the VSIX package:

   ```sh
   code --install-extension markdown-reader-0.1.0.vsix
   ```

   If `code` isn't available, run **Extensions: Install from VSIX...** from the
   Command Palette and select the `markdown-reader-0.1.0.vsix` file.

For changes by version, see the [changelog](CHANGELOG.md).

## Report a Bug

To report a rendering bug,
[open a GitHub issue](https://github.com/nolaskyni/vscode-markdown-reader/issues).
Include your VS Code version and theme, where the problem appears (the Markdown
preview or a notebook cell), and a short Markdown example that reproduces it. If
the problem is in the preview, include your `markdownReader.preview.flavor`
setting.

## AI Usage

AI assists with designing, writing, reviewing, and testing the extension, with
human review.

## License

Markdown Reader is licensed under the [MIT License](LICENSE).
