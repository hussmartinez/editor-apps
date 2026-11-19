import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build, createServer, preview } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "./headers.ts";
import { editorApp } from "./vite.ts";

let root: string;

beforeAll(async () => {
  root = mkdtempSync(path.join(tmpdir(), "editor-app-"));
  writeFileSync(
    path.join(root, "index.html"),
    '<!doctype html><title>Fixture</title><script type="module" src="/main.js"></script>',
  );
  writeFileSync(path.join(root, "main.js"), "document.title = 'Built';");
  mkdirSync(path.join(root, "sdk/workers"), { recursive: true });
  writeFileSync(path.join(root, "sdk/workers/worker.js"), "// a worker");
  await build({
    root,
    logLevel: "silent",
    configFile: false,
    plugins: [
      editorApp({
        policy: { wasm: true },
        sdkAssets: { from: path.join(root, "sdk"), url: "/sdk/1.2.3/" },
      }),
    ],
  });
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("editorApp", () => {
  it("writes _headers with the policy and the immutable paths", () => {
    const headers = readFileSync(path.join(root, "dist/_headers"), "utf8");
    expect(headers).toContain(
      `  Content-Security-Policy: ${contentSecurityPolicy({ wasm: true })}\n`,
    );
    expect(headers).toContain(
      "\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n",
    );
    expect(headers).toContain(
      "\n/sdk/1.2.3/*\n  Cache-Control: public, max-age=31536000, immutable\n",
    );
  });

  it("copies the SDK's assets to the path the app serves them from", () => {
    expect(readFileSync(path.join(root, "dist/sdk/1.2.3/workers/worker.js"), "utf8")).toBe(
      "// a worker",
    );
  });

  it("serves the built app with the same headers from vite preview", async () => {
    const server = await preview({
      root,
      logLevel: "silent",
      configFile: false,
      preview: { port: 0, host: "127.0.0.1" },
      plugins: [editorApp({ policy: { wasm: true } })],
    });
    try {
      const url = server.resolvedUrls?.local[0];
      const response = await fetch(String(url));
      expect(response.status).toBe(200);
      expect(response.headers.get("content-security-policy")).toBe(
        contentSecurityPolicy({ wasm: true }),
      );
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    } finally {
      await server.close();
    }
  });

  it("serves the SDK's assets from the dev server at the same path, and nothing outside them", async () => {
    const server = await createServer({
      root,
      logLevel: "silent",
      configFile: false,
      server: { port: 0, host: "127.0.0.1" },
      plugins: [editorApp({ sdkAssets: { from: path.join(root, "sdk"), url: "/sdk/1.2.3/" } })],
    });
    try {
      await server.listen();
      const base = String(server.resolvedUrls?.local[0]).replace(/\/$/, "");
      const worker = await fetch(`${base}/sdk/1.2.3/workers/worker.js`);
      expect(await worker.text()).toBe("// a worker");
      expect(worker.headers.get("content-type")).toBe("text/javascript");
      const outside = await fetch(`${base}/sdk/1.2.3/..%2Fmain.js`);
      expect(await outside.text()).not.toContain("document.title");
    } finally {
      await server.close();
    }
  });

  it("passes a malformed URL on to Vite, and keeps serving", async () => {
    const server = await createServer({
      root,
      logLevel: "silent",
      configFile: false,
      server: { port: 0, host: "127.0.0.1" },
      plugins: [editorApp({ sdkAssets: { from: path.join(root, "sdk"), url: "/sdk/1.2.3/" } })],
    });
    try {
      await server.listen();
      const base = String(server.resolvedUrls?.local[0]).replace(/\/$/, "");
      // %E0 starts a UTF-8 sequence that never ends, so decodeURIComponent throws on it.
      const malformed = await fetch(`${base}/sdk/1.2.3/%E0`);
      expect(malformed.status).not.toBe(500);
      const worker = await fetch(`${base}/sdk/1.2.3/workers/worker.js`);
      expect(await worker.text()).toBe("// a worker");
    } finally {
      await server.close();
    }
  });

  it("refuses an assets path that isn't a plain directory path", () => {
    for (const url of ["sdk/", "/sdk", "/sdk/../", "/sdk/*/", "https://cdn.example/sdk/"]) {
      expect(() => editorApp({ sdkAssets: { from: ".", url } })).toThrow(TypeError);
    }
  });
});
