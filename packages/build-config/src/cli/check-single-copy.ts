/**
 * Fails when an app would bundle two versions of an SDK-family package or
 * of React (docs/adr/0001). Run it from the repository's root.
 */
import { readFileSync } from "node:fs";
import { duplicateCopies } from "../repo/single-copy.ts";
import { listApps } from "./apps.ts";

const apps = listApps();
const lockfile = apps.length > 0 ? readFileSync("pnpm-lock.yaml", "utf8") : "";
let failed = false;
for (const app of apps) {
  for (const [name, versions] of Object.entries(duplicateCopies(lockfile, `apps/${app}`))) {
    failed = true;
    process.stderr.write(`apps/${app} would bundle ${name} in ${versions.join(" and ")}.\n`);
  }
}
if (failed) {
  process.stderr.write("Each app needs one version of each. Align the app's pins with its SDK.\n");
  process.exit(1);
}
process.stdout.write(`One copy of each shared package in ${apps.length} app(s).\n`);
