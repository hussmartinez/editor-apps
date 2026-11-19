import { parseAllDocuments } from "yaml";

/**
 * Finds packages that an app would bundle in more than one version
 * (docs/adr/0001). Two copies of ui or React in one page break their
 * providers and hooks.
 *
 * Each app's own dependencies must agree, and the apps must agree with each
 * other on ui and sdk-core, which app-shell runs on in every app.
 */

interface Lockfile {
  readonly importers?: Readonly<Record<string, Dependencies>>;
  readonly snapshots?: Readonly<Record<string, Dependencies>>;
}

interface Dependencies {
  readonly dependencies?: Readonly<Record<string, string | { readonly version: string }>>;
  readonly optionalDependencies?: Readonly<Record<string, string | { readonly version: string }>>;
}

/** A package to check: the SDK family's, and React. */
export function mustBeSingle(name: string): boolean {
  return name.startsWith("@hussmartinez/") || name === "react" || name === "react-dom";
}

/** The packages every app must have in the same version: app-shell's peers from the family. */
export const SHARED_ACROSS_APPS = ["@hussmartinez/sdk-core", "@hussmartinez/ui"] as const;

/**
 * @param lockfile - The text of `pnpm-lock.yaml`.
 * @param importer - The app, as the lockfile names it, such as `apps/pdf`.
 * @returns Each offending package with its versions, sorted. Empty when
 *   the app is fine.
 * @throws `Error` if the lockfile doesn't have the importer.
 */
export function duplicateCopies(lockfile: string, importer: string): Record<string, string[]> {
  const duplicates: Record<string, string[]> = {};
  for (const [name, found] of Object.entries(bundledVersions(lockfile, importer))) {
    if (found.length > 1) duplicates[name] = found;
  }
  return duplicates;
}

/**
 * @param lockfile - The text of `pnpm-lock.yaml`.
 * @param importers - The apps, as the lockfile names them, such as `apps/pdf`.
 * @returns Each package of {@link SHARED_ACROSS_APPS} that the apps bundle in
 *   different versions, with each app's versions. Empty when they agree. An
 *   app that doesn't bundle a package doesn't count for it.
 * @throws `Error` if the lockfile doesn't have one of the importers.
 */
export function differentAcrossApps(
  lockfile: string,
  importers: readonly string[],
): Record<string, Record<string, string>> {
  const bundled = importers.map(
    (importer) => [importer, bundledVersions(lockfile, importer)] as const,
  );
  const differences: Record<string, Record<string, string>> = {};
  for (const name of SHARED_ACROSS_APPS) {
    const byApp: Record<string, string> = {};
    for (const [importer, versions] of bundled) {
      const found = versions[name];
      if (found) byApp[importer] = found.join(" and ");
    }
    if (new Set(Object.values(byApp)).size > 1) differences[name] = byApp;
  }
  return differences;
}

/**
 * @returns Every version the app bundles of each package that
 *   {@link mustBeSingle} names, sorted, by package name.
 */
function bundledVersions(lockfile: string, importer: string): Record<string, string[]> {
  // pnpm writes two documents: one for the package manager itself, then the
  // project's. The project's is the one with the importer.
  const lock = parseAllDocuments(lockfile)
    .map((document) => {
      // Unlike parse(), parseAllDocuments() keeps errors instead of throwing,
      // and toJS() would quietly use whatever it could read.
      const [error] = document.errors;
      if (error) throw new Error(`pnpm-lock.yaml can't be read: ${error.message}`);
      return document.toJS() as Lockfile | null;
    })
    .find((candidate) => candidate?.importers?.[importer]);
  const root = lock?.importers?.[importer];
  if (!lock || !root) throw new Error(`pnpm-lock.yaml has no importer ${importer}.`);

  const versions = new Map<string, Set<string>>();
  const seen = new Set<string>();
  // Only what ships: an importer's devDependencies never reach the bundle.
  const queue: [from: string, deps: Dependencies][] = [[importer, root]];
  for (let next = queue.pop(); next; next = queue.pop()) {
    const [from, deps] = next;
    for (const [name, entry] of Object.entries({
      ...deps.dependencies,
      ...deps.optionalDependencies,
    })) {
      const version = typeof entry === "string" ? entry : entry.version;
      if (version.startsWith("link:")) {
        // A workspace package: follow it as another importer.
        const linked = joinPath(from, version.slice("link:".length));
        const target = lock.importers?.[linked];
        if (target && !seen.has(linked)) {
          seen.add(linked);
          queue.push([linked, target]);
        }
        continue;
      }
      // "1.2.3(react@19.0.0)" differs from "1.2.3" only in its peers.
      const plain = version.replace(/\(.*$/, "");
      if (mustBeSingle(name)) {
        versions.set(name, (versions.get(name) ?? new Set()).add(plain));
      }
      const key = `${name}@${version}`;
      const snapshot = lock.snapshots?.[key];
      if (snapshot && !seen.has(key)) {
        seen.add(key);
        queue.push([from, snapshot]);
      }
    }
  }

  const bundled: Record<string, string[]> = {};
  for (const name of [...versions.keys()].sort()) {
    bundled[name] = [...(versions.get(name) ?? [])].sort();
  }
  return bundled;
}

/** Resolves a lockfile's relative link, such as `../../packages/app-shell` from `apps/pdf`. */
function joinPath(from: string, relative: string): string {
  const parts = from.split("/");
  for (const part of relative.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}
