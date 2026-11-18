/**
 * Which apps a change affects, from the paths it touches (docs/adr/0004).
 * CI builds and tests only those.
 *
 * Paths are enough, without reading the lockfile's graph, because every app
 * pins its SDK exactly: an SDK upgrade always changes that app's own
 * `package.json`.
 */

/** Paths that every app depends on. A change to one affects all apps. */
const SHARED = [
  /^packages\//,
  /^ci\//,
  /^\.github\//,
  /^pnpm-workspace\.yaml$/,
  /^pnpm-lock\.yaml$/,
  /^package\.json$/,
  /^biome\.json$/,
  /^tsconfig\.base\.json$/,
  /^\.node-version$/,
];

/**
 * @param changed - The changed files, as paths from the repository's root.
 * @param apps - The names of the folders under `apps/`.
 * @returns The affected apps, sorted. Documentation alone affects none.
 */
export function affectedApps(changed: readonly string[], apps: readonly string[]): string[] {
  if (changed.some((file) => SHARED.some((pattern) => pattern.test(file)))) {
    return [...apps].sort();
  }
  return apps.filter((app) => changed.some((file) => file.startsWith(`apps/${app}/`))).sort();
}
