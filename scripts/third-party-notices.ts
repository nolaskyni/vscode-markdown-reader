/**
 * @file Collects the third-party packages that esbuild bundles into the
 *   extension and formats their license notices, in the layout of the
 *   `ThirdPartyNotices.txt` files in Microsoft's VS Code extensions.
 */

import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';

// The separator that Microsoft's notices files put between packages.
const SEPARATOR = '-'.repeat(57);

const HEADER =
  'NOTICES AND INFORMATION\n\n' +
  'Markdown Reader includes the following third-party packages in\n' +
  '`dist/extension.js`. Each package keeps its own copyright notice\n' +
  'and license, which follow.\n';

// Matches `LICENSE`, `LICENCE`, and names with an extension, such as
// `LICENSE.md` or `LICENSE.APACHE`.
const LICENSE_FILE_PATTERN = /^licen[cs]e(\..+)?$/i;

/** A bundled package and the license text that its notice reproduces. */
export interface BundledPackage {
  readonly name: string;
  readonly version: string;
  /** The `license` field of the package's `package.json` file, if any. */
  readonly license: string | undefined;
  /** The package's homepage, or its repository if it has no homepage. */
  readonly url: string | undefined;
  readonly licenseText: string;
}

/**
 * Lists the package folders that bundled files come from.
 *
 * @param inputPaths - The paths of the files that esbuild bundled, as the keys
 *   of its metafile's `inputs` give them.
 * @returns Each package folder once, sorted.
 */
export function bundledPackageDirectories(
  inputPaths: Iterable<string>,
): string[] {
  const directories = new Set<string>();
  for (const inputPath of inputPaths) {
    const directory = packageDirectory(inputPath);
    if (directory !== undefined) {
      directories.add(directory);
    }
  }
  return [...directories].toSorted();
}

/**
 * Reads the name, version, and license of a bundled package.
 *
 * @param directory - The package's folder.
 * @returns The package's notice details.
 * @throws {TypeError} If the `name` or `version` field of the package's
 *   `package.json` file isn't a string.
 * @throws {Error} If the folder has no license file.
 */
export async function readBundledPackage(
  directory: string,
): Promise<BundledPackage> {
  const manifestPath = join(directory, 'package.json');
  const manifest: unknown = JSON.parse(await readFile(manifestPath, 'utf8'));
  const name = requiredStringField(manifest, 'name', manifestPath);
  const version = requiredStringField(manifest, 'version', manifestPath);

  const licenseFiles = (await readdir(directory))
    .filter((fileName) => LICENSE_FILE_PATTERN.test(fileName))
    .toSorted();
  if (licenseFiles.length === 0) {
    throw new Error(`${directory}: expected a license file, found none`);
  }
  const licenseTexts = await Promise.all(
    licenseFiles.map(async (fileName) =>
      (await readFile(join(directory, fileName), 'utf8')).trim(),
    ),
  );

  return {
    name,
    version,
    license: stringField(manifest, 'license'),
    url: stringField(manifest, 'homepage') ?? repositoryURL(manifest),
    licenseText: licenseTexts.join('\n\n'),
  };
}

/**
 * Formats the notices file for bundled packages.
 *
 * @param packages - The packages, in the order the file lists them.
 * @returns The text of the `ThirdPartyNotices.txt` file.
 */
export function thirdPartyNotices(packages: readonly BundledPackage[]): string {
  const sections = packages.map((bundledPackage) => {
    const title =
      `${bundledPackage.name} ${bundledPackage.version}` +
      (bundledPackage.license === undefined
        ? ''
        : ` - ${bundledPackage.license}`);
    const urlLine =
      bundledPackage.url === undefined ? '' : `${bundledPackage.url}\n`;
    return `${title}\n${urlLine}\n${bundledPackage.licenseText}\n\n${SEPARATOR}\n`;
  });
  return [HEADER, `${SEPARATOR}\n`, ...sections].join('\n');
}

/**
 * Returns the package folder that a bundled file belongs to.
 *
 * @param inputPath - A bundled file's path.
 * @returns The innermost `node_modules` package folder, or `undefined` for a
 *   file outside `node_modules`.
 */
function packageDirectory(inputPath: string): string | undefined {
  const marker = 'node_modules/';
  const markerIndex = inputPath.lastIndexOf(marker);
  if (markerIndex === -1) {
    return undefined;
  }
  const segments = inputPath.slice(markerIndex + marker.length).split('/');
  const nameSegmentCount = segments[0]?.startsWith('@') ? 2 : 1;
  return (
    inputPath.slice(0, markerIndex + marker.length) +
    segments.slice(0, nameSegmentCount).join('/')
  );
}

/**
 * Returns a string field that a parsed `package.json` file must have.
 *
 * @param manifest - The parsed file.
 * @param field - The field's name.
 * @param manifestPath - The file's path, which error messages start with.
 * @returns The field's value.
 * @throws {TypeError} If the field is missing or isn't a string.
 */
function requiredStringField(
  manifest: unknown,
  field: string,
  manifestPath: string,
): string {
  const value: unknown =
    typeof manifest === 'object' && manifest !== null
      ? Reflect.get(manifest, field)
      : undefined;
  if (typeof value !== 'string') {
    throw new TypeError(
      `${manifestPath}: \`${field}\` must be a string, ` +
        `got ${JSON.stringify(value) ?? 'undefined'}`,
    );
  }
  return value;
}

/**
 * Returns a string field of a parsed `package.json` file.
 *
 * @param manifest - The parsed file.
 * @param field - The field's name.
 * @returns The field's value, or `undefined` if it's missing or not a string.
 */
function stringField(manifest: unknown, field: string): string | undefined {
  if (typeof manifest !== 'object' || manifest === null) {
    return undefined;
  }
  const value: unknown = Reflect.get(manifest, field);
  return typeof value === 'string' ? value : undefined;
}

/**
 * Returns a package's repository as a web address.
 *
 * @param manifest - The parsed `package.json` file.
 * @returns The `repository.url` field without its `git+` prefix and `.git`
 *   suffix, or `undefined` if the field is missing.
 */
function repositoryURL(manifest: unknown): string | undefined {
  const repository =
    typeof manifest === 'object' && manifest !== null
      ? Reflect.get(manifest, 'repository')
      : undefined;
  return stringField(repository, 'url')
    ?.replace(/^git\+/, '')
    .replace(/\.git$/, '');
}
