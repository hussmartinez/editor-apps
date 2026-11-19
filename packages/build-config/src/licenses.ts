import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/** The file each build gets, at the root of the site. */
export const LICENSES_FILE = "third-party-licenses.txt";

/** Files a package ships that carry its licence or its own notices. */
const NOTICE_FILE = /^(licen[cs]e|notice|copying|third[-_]party[-_]notices?)(\.(md|txt))?$/i;

interface BundledPackage {
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly files: readonly { readonly name: string; readonly text: string }[];
}

/**
 * The package a bundled module belongs to: the folder after its last
 * `node_modules`, with its scope. Modules outside `node_modules`, such as
 * the app's own code and this repository's packages, belong to none.
 */
export function packageRoot(moduleId: string): string | undefined {
  const file = moduleId.replace(/^\0/, "").split("?")[0] ?? "";
  const marker = `${path.sep}node_modules${path.sep}`;
  const at = file.lastIndexOf(marker);
  if (at === -1) return undefined;
  const parts = file.slice(at + marker.length).split(path.sep);
  const depth = parts[0]?.startsWith("@") ? 2 : 1;
  if (parts.length < depth) return undefined;
  return file.slice(0, at + marker.length) + parts.slice(0, depth).join(path.sep);
}

function describe(root: string): BundledPackage | undefined {
  const manifest = path.join(root, "package.json");
  if (!existsSync(manifest)) return undefined;
  const pkg = JSON.parse(readFileSync(manifest, "utf8")) as {
    name?: string;
    version?: string;
    license?: string | { type?: string };
  };
  if (!pkg.name) return undefined;
  const license = typeof pkg.license === "string" ? pkg.license : (pkg.license?.type ?? "");
  const files = readdirSync(root)
    .filter((name) => NOTICE_FILE.test(name))
    .sort()
    .map((name) => ({ name, text: readFileSync(path.join(root, name), "utf8").trim() }));
  return { name: pkg.name, version: pkg.version ?? "", license, files };
}

/**
 * The text of the licences file: every third-party package whose code is
 * in the build, sorted, with its declared licence and the licence and
 * notice files it ships, word for word.
 */
export function licensesText(packages: Iterable<BundledPackage>): string {
  const sorted = [...packages].sort((a, b) =>
    `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`),
  );
  const rule = "=".repeat(78);
  const sections = sorted.map((pkg) => {
    const head = `${pkg.name}@${pkg.version}\nLicense: ${pkg.license || "not declared"}`;
    const files =
      pkg.files.length > 0
        ? pkg.files.map((file) => `--- ${file.name} ---\n\n${file.text}`).join("\n\n")
        : "(The package ships no licence file.)";
    return `${rule}\n${head}\n\n${files}`;
  });
  return [
    "Third-party software in this build",
    "",
    "The app's own code is under the Apache License 2.0, in the repository's",
    "LICENSE and NOTICE files. This file lists every third-party package whose",
    "code is in this build, with its licence and notices as the package ships",
    `them. It's generated at build time from the bundle; there are ${sorted.length}.`,
    "",
    ...sections,
    "",
  ].join("\n");
}

/**
 * Writes `third-party-licenses.txt` into the build, from the modules
 * actually bundled, so it can't fall out of date: a dependency that's
 * added, removed or upgraded changes the file with the next build.
 *
 * @param extraPackages - Package roots whose code ships without passing
 *   through the bundle, such as an SDK's self-hosted workers.
 */
export function thirdPartyLicenses(extraPackages: readonly string[] = []): Plugin {
  return {
    name: "editor-apps:third-party-licenses",
    apply: "build",
    generateBundle(_options, bundle) {
      const roots = new Set(extraPackages);
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk") continue;
        for (const id of output.moduleIds) {
          const root = packageRoot(id);
          if (root) roots.add(root);
        }
      }
      const packages = new Map<string, BundledPackage>();
      for (const root of roots) {
        const pkg = describe(root);
        if (pkg) packages.set(`${pkg.name}@${pkg.version}`, pkg);
      }
      this.emitFile({
        type: "asset",
        fileName: LICENSES_FILE,
        source: licensesText(packages.values()),
      });
    },
  };
}
