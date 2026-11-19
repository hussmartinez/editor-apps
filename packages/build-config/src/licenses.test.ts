import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LICENSES_FILE, licensesText, packageRoot } from "./licenses.ts";
import { editorApp } from "./vite.ts";

describe("packageRoot", () => {
  const nm = `${path.sep}repo${path.sep}node_modules${path.sep}`;

  it("finds a package, and a scoped package, under node_modules", () => {
    expect(packageRoot(`${nm}react${path.sep}index.js`)).toBe(`${nm}react`);
    expect(packageRoot(`${nm}@scope${path.sep}pkg${path.sep}dist${path.sep}a.js`)).toBe(
      `${nm}@scope${path.sep}pkg`,
    );
  });

  it("uses the last node_modules, as pnpm nests them", () => {
    const id = `${nm}.pnpm${path.sep}x@1${path.sep}node_modules${path.sep}x${path.sep}i.js`;
    expect(packageRoot(id)).toBe(`${nm}.pnpm${path.sep}x@1${path.sep}node_modules${path.sep}x`);
  });

  it("ignores query strings and virtual-module markers", () => {
    expect(packageRoot(`\0${nm}react${path.sep}index.js?commonjs-proxy`)).toBe(`${nm}react`);
  });

  it("finds no package for the app's own code", () => {
    expect(
      packageRoot(`${path.sep}repo${path.sep}apps${path.sep}pdf${path.sep}src${path.sep}main.tsx`),
    ).toBeUndefined();
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
      'import { value } from "bundled-lib";\ndocument.title = value();\nimport("@scope/lazy-lib").then((m) => console.log(m.lazy()));\n',
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
    expect(text).not.toContain("unused-lib");
    expect(text).toContain("there are 3.");
  });
});
