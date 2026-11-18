/**
 * @file Checks how the build finds bundled packages and formats their license
 *   notices.
 */

import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {
  type BundledPackage,
  bundledPackageDirectories,
  readBundledPackage,
  thirdPartyNotices,
} from './third-party-notices.ts';

const MIT_LICENSE = 'The MIT License (MIT)\n\nCopyright (c) 2026 Example\n';

describe('bundledPackageDirectories', () => {
  test('returns the folder of each unscoped and scoped package', () => {
    expect(
      bundledPackageDirectories([
        'node_modules/semver/index.js',
        'node_modules/@mdit/helper/dist/index.js',
      ]),
    ).toEqual(['node_modules/@mdit/helper', 'node_modules/semver']);
  });

  test('returns the innermost package of a nested dependency', () => {
    expect(
      bundledPackageDirectories([
        'node_modules/@mdit/plugin-tasklist/node_modules/@mdit/helper/a.js',
      ]),
    ).toEqual(['node_modules/@mdit/plugin-tasklist/node_modules/@mdit/helper']);
  });

  test('lists a package once however many of its files are bundled', () => {
    expect(
      bundledPackageDirectories([
        'node_modules/semver/a.js',
        'node_modules/semver/lib/b.js',
      ]),
    ).toEqual(['node_modules/semver']);
  });

  test("skips the project's own files", () => {
    expect(
      bundledPackageDirectories(['src/extension.ts', 'src/preview-syntax.ts']),
    ).toEqual([]);
  });
});

describe('readBundledPackage', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'notices-test-'));
  });

  afterEach(async () => {
    await rm(directory, {recursive: true, force: true});
  });

  test('reads the name, version, license, and homepage', async () => {
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({
        name: 'example',
        version: '1.2.3',
        license: 'MIT',
        homepage: 'https://example.com/docs',
        repository: {url: 'git+https://github.com/example/example.git'},
      }),
    );
    await writeFile(join(directory, 'LICENSE'), MIT_LICENSE);

    expect(await readBundledPackage(directory)).toEqual({
      name: 'example',
      version: '1.2.3',
      license: 'MIT',
      url: 'https://example.com/docs',
      licenseText: MIT_LICENSE.trim(),
    });
  });

  test('uses the repository when the package has no homepage', async () => {
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({
        name: 'example',
        version: '1.2.3',
        repository: {url: 'git+https://github.com/example/example.git'},
      }),
    );
    await writeFile(join(directory, 'LICENSE.md'), MIT_LICENSE);

    const bundledPackage = await readBundledPackage(directory);

    expect(bundledPackage.url).toBe('https://github.com/example/example');
    expect(bundledPackage.license).toBeUndefined();
  });

  test('joins every license file of a dual-licensed package', async () => {
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({name: 'example', version: '1.2.3'}),
    );
    await writeFile(join(directory, 'LICENSE.APACHE'), 'Apache text\n');
    await writeFile(join(directory, 'LICENSE.BSD'), 'BSD text\n');

    expect((await readBundledPackage(directory)).licenseText).toBe(
      'Apache text\n\nBSD text',
    );
  });

  test('throws when the package has no license file', async () => {
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({name: 'example', version: '1.2.3'}),
    );

    await expect(readBundledPackage(directory)).rejects.toThrow(
      `${directory}: expected a license file, found none`,
    );
  });

  test('throws when `package.json` has no name or version', async () => {
    await writeFile(join(directory, 'package.json'), JSON.stringify({}));
    await writeFile(join(directory, 'LICENSE'), MIT_LICENSE);

    await expect(readBundledPackage(directory)).rejects.toThrow(
      `${join(directory, 'package.json')}: \`name\` must be a string, ` +
        'got undefined',
    );
  });
});

describe('thirdPartyNotices', () => {
  const separator = '-'.repeat(57);

  test('writes a header, then each package between separators', () => {
    const packages: BundledPackage[] = [
      {
        name: 'first',
        version: '1.0.0',
        license: 'MIT',
        url: 'https://example.com/first',
        licenseText: 'First license',
      },
      {
        name: 'second',
        version: '2.0.0',
        license: undefined,
        url: undefined,
        licenseText: 'Second license',
      },
    ];

    expect(thirdPartyNotices(packages)).toBe(
      'NOTICES AND INFORMATION\n\n' +
        'Markdown Reader includes the following third-party packages in\n' +
        '`dist/extension.js`. Each package keeps its own copyright notice\n' +
        'and license, which follow.\n\n' +
        `${separator}\n\n` +
        'first 1.0.0 - MIT\nhttps://example.com/first\n\n' +
        'First license\n\n' +
        `${separator}\n\n` +
        'second 2.0.0\n\n' +
        'Second license\n\n' +
        `${separator}\n`,
    );
  });
});
