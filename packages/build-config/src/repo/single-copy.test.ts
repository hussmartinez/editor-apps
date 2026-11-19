import { describe, expect, it } from "vitest";
import { differentAcrossApps, duplicateCopies } from "./single-copy.ts";

/** Apps on different ui versions, which each allow on their own, and a shared workspace package. */
const lockfile = `
lockfileVersion: '9.0'
importers:
  apps/one:
    dependencies:
      '@hussmartinez/one-sdk':
        specifier: 1.0.0
        version: 1.0.0(react@19.3.1)
      '@hussmartinez/ui':
        specifier: 0.8.0
        version: 0.8.0(react@19.3.1)
      '@editor-apps/app-shell':
        specifier: workspace:*
        version: link:../../packages/app-shell
      react:
        specifier: 'catalog:'
        version: 19.3.1
    devDependencies:
      '@hussmartinez/sdk-core':
        specifier: 9.9.9
        version: 9.9.9
  apps/two:
    dependencies:
      '@hussmartinez/two-sdk':
        specifier: 2.0.0
        version: 2.0.0(react@19.3.1)
      '@hussmartinez/ui':
        specifier: 0.10.0
        version: 0.10.0(react@19.3.1)
  apps/three:
    dependencies:
      '@hussmartinez/two-sdk':
        specifier: 2.0.0
        version: 2.0.0(react@19.3.1)
      '@hussmartinez/ui':
        specifier: 0.10.0
        version: 0.10.0(react@19.3.1)
  apps/broken:
    dependencies:
      '@hussmartinez/one-sdk':
        specifier: 1.0.0
        version: 1.0.0(react@19.3.1)
      '@hussmartinez/ui':
        specifier: 0.10.0
        version: 0.10.0(react@19.3.1)
  packages/app-shell:
    dependencies:
      '@hussmartinez/sdk-core':
        specifier: 0.4.4
        version: 0.4.4
snapshots:
  '@hussmartinez/one-sdk@1.0.0(react@19.3.1)':
    dependencies:
      '@hussmartinez/sdk-core': 0.4.4
      '@hussmartinez/ui': 0.8.0(react@19.3.1)
      react: 19.3.1
  '@hussmartinez/two-sdk@2.0.0(react@19.3.1)':
    dependencies:
      '@hussmartinez/sdk-core': 0.4.4
      '@hussmartinez/ui': 0.10.0(react@19.3.1)
      react: 19.3.1
  '@hussmartinez/ui@0.8.0(react@19.3.1)':
    dependencies:
      '@hussmartinez/sdk-core': 0.4.4
      react: 19.3.1
  '@hussmartinez/ui@0.10.0(react@19.3.1)':
    dependencies:
      '@hussmartinez/sdk-core': 0.4.4
      react: 19.3.1
  '@hussmartinez/sdk-core@0.4.4': {}
  '@hussmartinez/sdk-core@9.9.9': {}
  react@19.3.1: {}
`;

describe("duplicateCopies", () => {
  it("accepts an app whose dependencies agree, through its SDK and a workspace package", () => {
    expect(duplicateCopies(lockfile, "apps/one")).toEqual({});
  });

  it("lets two apps differ from each other", () => {
    expect(duplicateCopies(lockfile, "apps/two")).toEqual({});
  });

  it("reports an app whose SDK needs another ui than the app installs", () => {
    expect(duplicateCopies(lockfile, "apps/broken")).toEqual({
      "@hussmartinez/ui": ["0.10.0", "0.8.0"],
    });
  });

  it("ignores devDependencies, which never reach the bundle", () => {
    expect(duplicateCopies(lockfile, "apps/one")["@hussmartinez/sdk-core"]).toBeUndefined();
  });

  it("reads the project's document after pnpm's own, as pnpm 12 writes them", () => {
    const own = "lockfileVersion: '9.0'\nimporters:\n  .:\n    packageManagerDependencies: {}\n";
    expect(duplicateCopies(`---\n${own}---\n${lockfile}`, "apps/broken")).toEqual({
      "@hussmartinez/ui": ["0.10.0", "0.8.0"],
    });
  });

  it("rejects a lockfile with a YAML error, rather than reading part of it", () => {
    // A second snapshots mapping is a duplicate key: read leniently, it would
    // replace the first and hide apps/broken's second ui.
    expect(() => duplicateCopies(`${lockfile}snapshots: {}\n`, "apps/broken")).toThrow(
      /can't be read/,
    );
  });

  it("fails for an app the lockfile doesn't have", () => {
    expect(() => duplicateCopies(lockfile, "apps/missing")).toThrow(/no importer apps\/missing/);
  });
});

describe("differentAcrossApps", () => {
  it("accepts apps that bundle the same ui and sdk-core", () => {
    expect(differentAcrossApps(lockfile, ["apps/two", "apps/three"])).toEqual({});
  });

  it("reports apps that bundle different ui versions, with each app's", () => {
    expect(differentAcrossApps(lockfile, ["apps/one", "apps/two", "apps/three"])).toEqual({
      "@hussmartinez/ui": { "apps/one": "0.8.0", "apps/two": "0.10.0", "apps/three": "0.10.0" },
    });
  });

  it("lists both versions of an app that has two", () => {
    expect(differentAcrossApps(lockfile, ["apps/two", "apps/broken"])).toEqual({
      "@hussmartinez/ui": { "apps/two": "0.10.0", "apps/broken": "0.10.0 and 0.8.0" },
    });
  });

  it("fails for an app the lockfile doesn't have", () => {
    expect(() => differentAcrossApps(lockfile, ["apps/one", "apps/missing"])).toThrow(
      /no importer apps\/missing/,
    );
  });
});
