# Agent Instructions

This repository contains Markdown Reader, a VS Code extension that styles the
Markdown preview and notebook Markdown cells. Keep instructions for agents
working in this repository in this file.

## Before You Begin

Before proposing changes, read the files that you plan to change and, if one
exists, the plan in `plans/`. Git ignores the `plans/` folder, so a clone might
not have one. Check the working tree and preserve unrelated changes. Limit
changes to the requested work, and report unrelated issues without fixing them
unless the user approves.

Use the following skills from the
[`nolaskyni/skills`](https://github.com/nolaskyni/skills) repository:

- For building or changing the extension, follow `collaborative-coding`. It
  defines how to clarify scope, plan, check in, and report results.
- For code, Markdown, and configuration, follow `coding-standards` and its
  relevant language references.
- For documentation prose, including comments and commit messages, follow
  `technical-writing-guidelines`.

To install the skills, run the following command:

```sh
npx skills add nolaskyni/skills
```

## Follow the Approved Design

The following rules record decisions that the user approved. Ask the user before
changing them:

- In notebook Markdown cells, add styling only. Don't render syntax there that
  GitHub's notebook viewer doesn't render, such as task lists, alerts, and
  footnotes.
- Take colors from the active VS Code theme through `--vscode-*` CSS variables,
  including in high-contrast themes. Don't hard-code a palette.
- Render task lists as checkboxes that can't be toggled. Never change Markdown
  source.
- Use system fonts. Don't bundle fonts or load remote assets.
- Don't weaken VS Code's preview security settings or run untrusted HTML or
  scripts.
- Prefer VS Code's built-in features and existing markdown-it plugins to new
  parsing code.

## Verify Changes

Check changes as follows:

- Write a failing test before changing how syntax renders.
- Check the Markdown preview and notebook Markdown cells separately, because
  they use different renderers. Each section of the `fixtures/sample.md` file
  and each cell of the `fixtures/sample.ipynb` file states what a correct
  rendering shows.
- Run the formatter, linter, and other checks that `coding-standards` names for
  each changed file.
- Report which checks ran, what they establish, and what remains unverified.
  Don't describe untested behavior as working.

## Update the Changelog

Record each change that users notice in the `CHANGELOG.md` file, under the
"Unreleased" heading, by following
[Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). Give a version
its own heading and date only when it's released.

## Write Commit Messages

Follow `commit-message-guidelines` for commit messages. Don't add agent
co-author trailers to commits. The README's "AI Usage" section discloses how
agents contribute to this repository.
