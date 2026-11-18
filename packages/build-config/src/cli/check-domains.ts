/**
 * Fails when a domain the apps are served from appears outside an app's
 * `wrangler.jsonc` or `src/app.config.ts` (docs/adr/0001). Run it from the
 * repository's root.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { domainMentions, namesToFind, routedHosts } from "../repo/domains.ts";
import { listApps } from "./apps.ts";

const hosts = listApps().flatMap((app) => {
  try {
    return routedHosts(readFileSync(`apps/${app}/wrangler.jsonc`, "utf8"));
  } catch {
    return [];
  }
});
const names = namesToFind(hosts);

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter((file) => file && file !== "pnpm-lock.yaml");

function* texts(): Generator<[string, string]> {
  for (const file of tracked) {
    let text: string;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    // Skip binary files, such as fixtures.
    if (!text.includes("\0")) yield [file, text];
  }
}

const mentions = domainMentions(texts(), names);
for (const { file, line, name } of mentions) {
  process.stderr.write(`${file}:${line} names ${name}.\n`);
}
if (mentions.length > 0) {
  process.stderr.write(
    "A domain belongs only in an app's wrangler.jsonc and src/app.config.ts (docs/adr/0001).\n",
  );
  process.exit(1);
}
process.stdout.write(`No domain outside app configuration (${names.length} name(s) checked).\n`);
