/**
 * Fails when an app would bundle two versions of an SDK-family package or
 * of React, or when the apps bundle different versions of ui or sdk-core
 * (docs/adr/0001). Run it from the repository's root.
 */
import { readFileSync } from "node:fs";
import { differentAcrossApps, duplicateCopies } from "../repo/single-copy.ts";
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
const differences = differentAcrossApps(
  lockfile,
  apps.map((app) => `apps/${app}`),
);
for (const [name, byApp] of Object.entries(differences)) {
  const list = Object.entries(byApp).map(([app, version]) => `${app} ${version}`);
  process.stderr.write(`The apps bundle different versions of ${name}: ${list.join(", ")}.\n`);
}
if (Object.keys(differences).length > 0) {
  process.stderr.write(
    "Every app needs the same ui and sdk-core, which app-shell runs on. Move them together.\n",
  );
  process.exit(1);
}
process.stdout.write(
  `One copy of each shared package in ${apps.length} app(s), and one ui and sdk-core for all.\n`,
);
