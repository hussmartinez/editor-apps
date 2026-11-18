import { describe, expect, it } from "vitest";
import { domainMentions, mayNameDomains, namesToFind, routedHosts } from "./domains.ts";

const wrangler = `{
  // The custom domain.
  "name": "one-editor",
  "routes": [{ "pattern": "one.editors.example", "custom_domain": true }],
  "assets": { "directory": "./dist" }
}`;

describe("routedHosts", () => {
  it("reads the hostnames of an app's routes", () => {
    expect(routedHosts(wrangler)).toEqual(["one.editors.example"]);
  });

  it("takes the host of a route with a path, and nothing from a config without routes", () => {
    expect(routedHosts('{ "routes": [{ "pattern": "one.editors.example/*" }] }')).toEqual([
      "one.editors.example",
    ]);
    expect(routedHosts('{ "name": "one-editor" }')).toEqual([]);
  });
});

describe("namesToFind", () => {
  it("looks for each host and the domain it's under", () => {
    expect(namesToFind(["one.editors.example", "two.editors.example"])).toEqual([
      "editors.example",
      "one.editors.example",
      "two.editors.example",
    ]);
  });
});

describe("domainMentions", () => {
  const names = namesToFind(routedHosts(wrangler));

  it("allows a domain only in an app's wrangler.jsonc and app.config.ts", () => {
    expect(mayNameDomains("apps/one/wrangler.jsonc")).toBe(true);
    expect(mayNameDomains("apps/one/src/app.config.ts")).toBe(true);
    expect(mayNameDomains("apps/one/src/App.tsx")).toBe(false);
    expect(mayNameDomains("packages/app-shell/src/app.config.ts")).toBe(false);
    expect(mayNameDomains("README.md")).toBe(false);
  });

  it("reports every other mention, with its line", () => {
    const files: [string, string][] = [
      ["apps/one/wrangler.jsonc", wrangler],
      ["apps/one/src/app.config.ts", 'export const url = "https://one.editors.example/";'],
      ["packages/app-shell/src/Footer.tsx", 'const home = "https://Editors.Example";\n'],
      ["README.md", "# Apps\n\nSee one.editors.example.\n"],
      ["docs/deploy.md", "Nothing here."],
    ];
    expect(domainMentions(files, names)).toEqual([
      { file: "packages/app-shell/src/Footer.tsx", line: 1, name: "editors.example" },
      { file: "README.md", line: 3, name: "editors.example" },
    ]);
  });

  it("reports nothing when no app is routed anywhere", () => {
    expect(domainMentions([["README.md", "anything.example"]], namesToFind([]))).toEqual([]);
  });
});
