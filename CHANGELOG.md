# Changelog

This file lists the notable changes to Markdown Reader. Its format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and Markdown Reader
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Typography and spacing for reading in the Markdown preview and in notebook
  Markdown cells, with system fonts and a comfortable line length
- GitHub-style structure: heading dividers, code block backgrounds, table
  borders with alternating row backgrounds, and block quote borders
- Task lists in the Markdown preview, shown as checkboxes that you can't toggle
- GitHub alerts in the Markdown preview, of the types `NOTE`, `TIP`,
  `IMPORTANT`, `WARNING`, and `CAUTION`
- Footnotes in the Markdown preview, with links from each reference to its note
  and back, and a heading that only screen readers announce
- Colors from the active VS Code theme, including high-contrast themes, with
  alert titles and checkbox borders that meet the contrast minimums of the Web
  Content Accessibility Guidelines (WCAG) in VS Code's built-in themes
- Default text sizes for the Markdown preview and notebook Markdown cells, set
  through VS Code's own font size and line height settings
- Support for Restricted Mode, so that untrusted workspaces get the same
  rendering

[unreleased]: https://github.com/nolaskyni/vscode-markdown-reader/commits/main
