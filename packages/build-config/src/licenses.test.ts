import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bundledTwice, LICENSES_FILE, licensesText, packageRoot } from "./licenses.ts";
import { editorApp } from "./vite.ts";

describe("packageRoot", () => {
  it("finds a package, and a scoped package, under node_modules", () => {
    expect(packageRoot("/repo/node_modules/react/index.js")).toBe("/repo/node_modules/react");
    expect(packageRoot("/repo/node_modules/@scope/pkg/dist/a.js")).toBe(
      "/repo/node_modules/@scope/pkg",
    );
  });

  it("uses the last node_modules, as pnpm nests them", () => {
    expect(packageRoot("/repo/node_modules/.pnpm/x@1/node_modules/x/i.js")).toBe(
      "/repo/node_modules/.pnpm/x@1/node_modules/x",
    );
  });

  it("reads Windows paths, with either slash", () => {
    expect(packageRoot("C:/repo/node_modules/react/index.js")).toBe("C:/repo/node_modules/react");
    expect(packageRoot("C:\\repo\\node_modules\\@scope\\pkg\\a.js")).toBe(
      "C:/repo/node_modules/@scope/pkg",
    );
  });

  it("ignores query strings and virtual-module markers", () => {
    expect(packageRoot("\0/repo/node_modules/react/index.js?commonjs-proxy")).toBe(
      "/repo/node_modules/react",
    );
  });

  it("finds no package for the app's own code, or a relative path", () => {
    expect(packageRoot("/repo/apps/pdf/src/main.tsx")).toBeUndefined();
    expect(packageRoot("dist/assets/x")).toBeUndefined();
  });
});

describe("bundledTwice", () => {
  it("names a family package or React bundled in two versions", () => {
    expect(
      bundledTwice([
        { name: "@hussmartinez/ui", version: "0.14.4" },
        { name: "@hussmartinez/ui", version: "0.11.0" },
        { name: "react", version: "19.3.1" },
        { name: "posthog-js", version: "1.0.0" },
        { name: "posthog-js", version: "2.0.0" },
      ]),
    ).toEqual(["@hussmartinez/ui (0.11.0, 0.14.4)"]);
  });

  it("accepts one version of each", () => {
    expect(bundledTwice([{ name: "react", version: "19.3.1" }])).toEqual([]);
  });
});

describe("licensesText", () => {
  it("lists packages sorted, with their licence and files word for word", () => {
    const text = licensesText([
      {
        name: "zeta",
        version: "2.0.0",
        license: "MIT",
        files: [{ name: "LICENSE", text: "Zeta licence" }],
      },
      { name: "@a/b", version: "1.0.0", license: "", files: [] },
    ]);
    expect(text).toContain("there are 2.");
    expect(text.indexOf("@a/b@1.0.0")).toBeLessThan(text.indexOf("zeta@2.0.0"));
    expect(text).toContain(
      "@a/b@1.0.0\nLicense: not declared\n\n(The package ships no licence file.)",
    );
    expect(text).toContain("zeta@2.0.0\nLicense: MIT\n\n--- LICENSE ---\n\nZeta licence");
  });
});

describe("the licences file in a build", () => {
  let root: string;

  beforeAll(async () => {
    root = mkdtempSync(path.join(tmpdir(), "licenses-"));
    const pkg = (name: string, files: Record<string, string>) => {
      const dir = path.join(root, "node_modules", ...name.split("/"));
      mkdirSync(dir, { recursive: true });
      for (const [file, text] of Object.entries(files)) writeFileSync(path.join(dir, file), text);
    };
    pkg("bundled-lib", {
      "package.json": JSON.stringify({
        name: "bundled-lib",
        version: "1.2.3",
        license: "MIT",
        main: "index.js",
      }),
      "index.js": 'export function value() { return String(Math.random()) + "bundled"; }',
      LICENSE: "The bundled licence.",
      "NOTICE.md": "A notice to keep.",
      "README.md": "Not a licence.",
    });
    pkg("@scope/lazy-lib", {
      "package.json": JSON.stringify({
        name: "@scope/lazy-lib",
        version: "3.0.0",
        license: "ISC",
        main: "index.js",
      }),
      "index.js": 'export function lazy() { return String(Math.random()) + "lazy"; }',
      "LICENSE.txt": "The lazy licence.",
    });
    pkg("dual-lib", {
      "package.json": JSON.stringify({
        name: "dual-lib",
        version: "4.0.0",
        license: "MIT OR Apache-2.0",
        main: "index.js",
      }),
      "index.js": 'export function dual() { return String(Math.random()) + "dual"; }',
      "LICENSE-MIT": "The MIT half.",
      "LICENSE-APACHE": "The Apache half.",
    });
    pkg("unused-lib", {
      "package.json": JSON.stringify({ name: "unused-lib", version: "9.9.9", license: "GPL-3.0" }),
      "index.js": "export const unused = 1;",
    });
    pkg("the-sdk", {
      "package.json": JSON.stringify({ name: "the-sdk", version: "0.1.0", license: "Apache-2.0" }),
      LICENSE: "The SDK's licence.",
    });
    mkdirSync(path.join(root, "node_modules", "the-sdk", "dist", "assets"), { recursive: true });
    writeFileSync(
      path.join(root, "node_modules", "the-sdk", "dist", "assets", "w.js"),
      "// worker",
    );
    writeFileSync(
      path.join(root, "index.html"),
      '<!doctype html><title>Fixture</title><script type="module" src="/main.js"></script>',
    );
    writeFileSync(
      path.join(root, "main.js"),
      'import { value } from "bundled-lib";\nimport { dual } from "dual-lib";\ndocument.title = value() + dual();\nimport("@scope/lazy-lib").then((m) => console.log(m.lazy()));\n',
    );
    await build({
      root,
      logLevel: "silent",
      configFile: false,
      plugins: [
        editorApp({
          sdkAssets: {
            from: path.join(root, "node_modules", "the-sdk", "dist", "assets"),
            url: "/the-sdk/0.1.0/",
          },
        }),
      ],
    });
  });

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("lists what the build bundles, its lazy chunks and the SDK's copied assets, and nothing else", () => {
    const text = readFileSync(path.join(root, "dist", LICENSES_FILE), "utf8");
    expect(text).toContain("bundled-lib@1.2.3\nLicense: MIT");
    expect(text).toContain("The bundled licence.");
    expect(text).toContain("--- NOTICE.md ---\n\nA notice to keep.");
    expect(text).not.toContain("Not a licence.");
    expect(text).toContain("@scope/lazy-lib@3.0.0\nLicense: ISC");
    expect(text).toContain("The lazy licence.");
    expect(text).toContain("the-sdk@0.1.0\nLicense: Apache-2.0");
    expect(text).toContain("dual-lib@4.0.0\nLicense: MIT OR Apache-2.0");
    expect(text).toContain("--- LICENSE-APACHE ---\n\nThe Apache half.");
    expect(text).toContain("--- LICENSE-MIT ---\n\nThe MIT half.");
    expect(text).not.toContain("unused-lib");
    expect(text).toContain("there are 4.");
  });

  it("lists the SDK whose assets it copies when the directory is given relatively", async () => {
    const out = path.join(root, "dist-relative");
    // As an app's config would give it: relative to the app's folder.
    const cwd = process.cwd();
    process.chdir(root);
    try {
      await build({
        root,
        logLevel: "silent",
        configFile: false,
        build: { outDir: out },
        plugins: [
          editorApp({
            sdkAssets: { from: "node_modules/the-sdk/dist/assets", url: "/the-sdk/0.1.0/" },
          }),
        ],
      });
    } finally {
      process.chdir(cwd);
    }
    expect(readFileSync(path.join(out, LICENSES_FILE), "utf8")).toContain("the-sdk@0.1.0");
  });
});
