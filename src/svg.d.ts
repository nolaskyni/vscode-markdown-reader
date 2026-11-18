/**
 * @file Types SVG files that are imported as text, with `with {type: 'text'}`.
 *   esbuild and the Vitest configuration both load them as strings.
 */

declare module '*.svg' {
  /** The SVG file's contents. */
  const contents: string;
  // oxlint-disable-next-line import/no-default-export -- Text imports have only a default export.
  export default contents;
}
