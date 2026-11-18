/**
 * Prints the apps a change affects, as a JSON array, for CI's per-app jobs
 * (docs/adr/0004). Run it from the repository's root:
 *
 *   node packages/build-config/src/cli/affected-apps.ts <base> [<head>]
 *   node packages/build-config/src/cli/affected-apps.ts --all
 *
 * It uses only Node and git, so CI runs it before installing anything.
 */
import { execFileSync } from "node:child_process";
import { affectedApps } from "../repo/affected.ts";
import { listApps } from "./apps.ts";

const [base, head = "HEAD"] = process.argv.slice(2);
if (!base) {
  process.stderr.write("Usage: affected-apps.ts <base> [<head>] | --all\n");
  process.exit(2);
}

const apps = listApps();
if (base === "--all") {
  process.stdout.write(`${JSON.stringify(apps)}\n`);
} else {
  // Three dots: what the head changed since it left the base.
  const changed = execFileSync("git", ["diff", "--name-only", "-z", `${base}...${head}`], {
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
  process.stdout.write(`${JSON.stringify(affectedApps(changed, apps))}\n`);
}
