/**
 * @file Records which Markdown flavor each preview render uses, and gates
 *   markdown-it rules by it. VS Code's built-in preview shares one markdown-it
 *   instance among all documents, so each flavor's rules are always registered
 *   and check the flavor while they parse.
 */

import type {Env, MarkdownIt, Ruler, StateCore} from 'markdown-it';

/** The flavors that the `markdownReader.preview.flavor` setting offers. */
export const PREVIEW_FLAVORS = ['github', 'obsidian'] as const;

/** The name of the core rule that records each render's flavor. */
const FLAVOR_RULE_NAME = 'markdown_reader_flavor';

/** The key under which a render's environment holds its flavor. */
const FLAVOR_KEY = Symbol('markdownReaderFlavor');

/** A Markdown flavor that the preview renders. */
export type PreviewFlavor = (typeof PREVIEW_FLAVORS)[number];

/** Returns whether a render, given its environment, uses some syntax. */
export type RenderPredicate = (environment: Env) => boolean;

/** Options for `addFlavorRule`. */
export interface FlavorRuleOptions {
  /** Returns the flavor of a render, given its environment. */
  readonly flavorOf: (environment: Env) => PreviewFlavor;
}

/**
 * Returns whether a value is one of the preview flavors.
 *
 * @param value - The value to check, such as a setting's value.
 * @returns Whether `value` is in `PREVIEW_FLAVORS`.
 */
export function isPreviewFlavor(value: unknown): value is PreviewFlavor {
  return PREVIEW_FLAVORS.some((flavor) => flavor === value);
}

/**
 * Adds a core rule that records each render's flavor in its environment before
 * any other rule runs, so that `renderFlavor` can read it. `flavorOf` runs once
 * for each render rather than each time a gated rule checks the flavor.
 *
 * @param markdownIt - The instance to extend, which this function changes.
 * @param options - The function that returns a render's flavor.
 */
export function addFlavorRule(
  markdownIt: MarkdownIt,
  {flavorOf}: FlavorRuleOptions,
): void {
  markdownIt.core.ruler.before(
    'normalize',
    FLAVOR_RULE_NAME,
    (state: StateCore): void => {
      state.env[FLAVOR_KEY] = flavorOf(state.env);
    },
  );
}

/**
 * Returns the flavor that `addFlavorRule` recorded for a render.
 *
 * @param environment - The render's environment.
 * @returns The render's flavor.
 * @throws {Error} If the environment holds no flavor, because the instance has
 *   no rule from `addFlavorRule`.
 */
export function renderFlavor(environment: Env): PreviewFlavor {
  const flavor = environment[FLAVOR_KEY];
  if (!isPreviewFlavor(flavor)) {
    throw new Error('Expected `addFlavorRule` to record the render flavor');
  }
  return flavor;
}

/**
 * Makes a block or inline rule run only in the renders for which a predicate is
 * true. In other renders, the rule reports no match, so its syntax stays text.
 * The rule keeps its place and the rule chains it can interrupt.
 *
 * A rule's function is available only through `Ruler.__rules__`, which
 * markdown-it's types mark as internal.
 *
 * @param ruler - The ruler that holds the rule, such as
 *   `markdownIt.inline.ruler`.
 * @param name - The rule's name.
 * @param isEnabled - Returns whether the rule runs in a render.
 * @throws {Error} If `ruler` has no rule named `name`.
 */
export function gateRule<Arguments extends [{env: Env}, ...unknown[]]>(
  ruler: Ruler<Arguments, boolean>,
  name: string,
  isEnabled: RenderPredicate,
): void {
  // oxlint-disable-next-line eslint/no-underscore-dangle -- markdown-it names it.
  const rule = ruler.__rules__.find((candidate) => candidate.name === name);
  if (rule === undefined) {
    throw new Error(
      `Expected a markdown-it rule named ${JSON.stringify(name)}`,
    );
  }
  const {fn: parse, alt: chains} = rule;
  ruler.at(
    name,
    (...parameters: Arguments): boolean =>
      isEnabled(parameters[0].env) && parse(...parameters),
    {alt: chains},
  );
}
