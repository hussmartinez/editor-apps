/**
 * Keeps the apps' domain out of everything but their configuration
 * (docs/adr/0001), so changing domain is a configuration change per app.
 */

/** The only files that may name a domain the apps are served from. */
export function mayNameDomains(file: string): boolean {
  return /^apps\/[^/]+\/(wrangler\.jsonc|src\/app\.config\.ts)$/.test(file);
}

/** The hostnames an app is routed at, from the text of its `wrangler.jsonc`. */
export function routedHosts(wrangler: string): string[] {
  const hosts = [...wrangler.matchAll(/"pattern"\s*:\s*"([^"/*]+)[^"]*"/g)].map(
    (match) => match[1] ?? "",
  );
  return [...new Set(hosts.filter((host) => host.includes(".")))];
}

/**
 * The names to look for: each host, and the domain it's under, taken as
 * its last two labels. That's too short for a suffix such as `co.uk`,
 * where it only makes the check stricter.
 */
export function namesToFind(hosts: readonly string[]): string[] {
  const names = new Set<string>();
  for (const host of hosts) {
    names.add(host.toLowerCase());
    names.add(host.toLowerCase().split(".").slice(-2).join("."));
  }
  return [...names].sort();
}

export interface DomainMention {
  readonly file: string;
  readonly line: number;
  readonly name: string;
}

/**
 * @param files - Each tracked file's path and text.
 * @param names - From {@link namesToFind}.
 * @returns Every mention outside the files that may name a domain.
 */
export function domainMentions(
  files: Iterable<readonly [path: string, text: string]>,
  names: readonly string[],
): DomainMention[] {
  const mentions: DomainMention[] = [];
  for (const [file, text] of files) {
    if (mayNameDomains(file)) continue;
    text.split("\n").forEach((content, index) => {
      const lower = content.toLowerCase();
      const name = names.find((candidate) => lower.includes(candidate));
      if (name) mentions.push({ file, line: index + 1, name });
    });
  }
  return mentions;
}
