import { existsSync, readdirSync } from "node:fs";

/** The apps: every folder under `apps/` with a `package.json`. */
export function listApps(): string[] {
  if (!existsSync("apps")) return [];
  return readdirSync("apps", { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(`apps/${entry.name}/package.json`))
    .map((entry) => entry.name)
    .sort();
}
