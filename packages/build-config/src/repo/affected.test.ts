import { describe, expect, it } from "vitest";
import { affectedApps } from "./affected.ts";

const apps = ["video", "pdf", "audio", "image"];

describe("affectedApps", () => {
  it("selects only the app whose SDK is upgraded", () => {
    // An exact pin means the upgrade changes the app's own package.json,
    // next to the lockfile... which on its own would select every app.
    expect(affectedApps(["apps/pdf/package.json"], apps)).toEqual(["pdf"]);
  });

  it("selects the apps whose folders changed, sorted", () => {
    expect(affectedApps(["apps/video/src/App.tsx", "apps/audio/e2e/smoke.spec.ts"], apps)).toEqual([
      "audio",
      "video",
    ]);
  });

  it.each([
    "packages/app-shell/src/AppShell.tsx",
    "packages/build-config/src/headers.ts",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "package.json",
    "biome.json",
    "tsconfig.base.json",
    "ci/Dockerfile",
    ".github/workflows/ci.yml",
    ".node-version",
  ])("selects every app when %s changes", (file) => {
    expect(affectedApps([file], apps)).toEqual(["audio", "image", "pdf", "video"]);
  });

  it("selects none for documentation", () => {
    expect(affectedApps(["README.md", "docs/adr/0004-ci.md", "NEXT_STEPS.md"], apps)).toEqual([]);
  });

  it("doesn't confuse an app with one whose name it starts", () => {
    expect(affectedApps(["apps/pdf-tools/src/main.tsx"], ["pdf", "pdf-tools"])).toEqual([
      "pdf-tools",
    ]);
  });

  it("ignores a folder under apps/ that isn't an app", () => {
    expect(affectedApps(["apps/.gitkeep"], apps)).toEqual([]);
  });
});
