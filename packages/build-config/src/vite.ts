import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { headersFile, type PolicyOptions, securityHeaders } from "./headers.ts";

/**
 * What an app tells the build about itself. Everything else is the same in
 * every app.
 */
export interface EditorAppOptions {
  /** What the app's Content Security Policy must open (docs/adr/0005). */
  readonly policy?: PolicyOptions;
  /**
   * The SDK's assets, such as its workers, served from the app's own origin
   * so the policy needs no `blob:` worker.
   */
  readonly sdkAssets?: {
    /** The directory to copy, usually the SDK's `dist/assets`. */
    readonly from: string;
    /**
     * Where the app serves it, such as `/pdf-sdk/1.2.3/`. Put the SDK's
     * version in it: the path is cached as immutable, and an SDK refuses a
     * worker from another version.
     */
    readonly url: string;
  };
}

/**
 * The Vite plugin every app uses. It writes `_headers` into the build for
 * Cloudflare's static assets, sends the same headers from `vite preview`,
 * so tests run under production's policy, and copies the SDK's assets.
 *
 * The dev server sends none of them: Vite's own client needs inline code
 * there, which the policy forbids.
 */
export function editorApp(options: EditorAppOptions = {}): Plugin {
  const headers = securityHeaders(options.policy);
  const assets = options.sdkAssets;
  if (assets && (!/^\/[\w.-]+(\/[\w.-]+)*\/$/.test(assets.url) || /\/\.\.?\//.test(assets.url))) {
    throw new TypeError(
      `sdkAssets.url must be a path such as /pdf-sdk/1.2.3/: ${JSON.stringify(assets.url)}`,
    );
  }
  let outDir = "dist";

  return {
    name: "editor-apps:app",
    config: () => ({ preview: { headers } }),
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "_headers",
        source: headersFile(headers, ["/assets/*", ...(assets ? [`${assets.url}*`] : [])]),
      });
    },
    closeBundle() {
      if (!assets || this.environment.config.command !== "build") return;
      if (!existsSync(assets.from)) {
        throw new Error(`sdkAssets.from doesn't exist: ${assets.from}`);
      }
      cpSync(assets.from, path.join(outDir, assets.url), { recursive: true });
    },
  };
}
