import { parse } from "yaml";

/**
 * Finds packages that an app would bundle in more than one version
 * (docs/adr/0001). Two copies of ui or React in one page break their
 * providers and hooks.
 *
 * It's checked for each app, not for the whole lockfile: apps may differ
 * from each other while their SDKs need different ui versions, but one
 * app's own dependencies must agree.
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

/**
 * @param lockfile - The text of `pnpm-lock.yaml`.
 * @param importer - The app, as the lockfile names it, such as `apps/pdf`.
 * @returns Each offending package with its versions, sorted. Empty when
 *   the app is fine.
 * @throws `Error` if the lockfile doesn't have the importer.
 */
export function duplicateCopies(lockfile: string, importer: string): Record<string, string[]> {
  const lock = parse(lockfile) as Lockfile;
  const root = lock.importers?.[importer];
  if (!root) throw new Error(`pnpm-lock.yaml has no importer ${importer}.`);

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

  const duplicates: Record<string, string[]> = {};
  for (const name of [...versions.keys()].sort()) {
    const found = versions.get(name) ?? new Set();
    if (found.size > 1) duplicates[name] = [...found].sort();
  }
  return duplicates;
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
