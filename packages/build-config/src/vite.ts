import { cpSync, existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
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
  /** The app's public address, written into the page as its canonical link. */
  readonly canonicalUrl?: string;
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
    config: () => ({
      preview: { headers },
      // Where the app passes as its SDK's `assetsUrl`. Empty without assets.
      define: { __SDK_ASSETS_URL__: JSON.stringify(assets?.url ?? "") },
    }),
    // The dev server serves the SDK's assets at the same path as production.
    configureServer(server) {
      if (!assets) return;
      server.middlewares.use((request, response, next) => {
        const pathname = decodeURIComponent((request.url ?? "").split("?")[0] ?? "");
        if (!pathname.startsWith(assets.url)) return next();
        const file = path.resolve(assets.from, pathname.slice(assets.url.length));
        // Never outside the assets directory.
        if (!file.startsWith(path.resolve(assets.from) + path.sep) || !existsSync(file)) {
          return next();
        }
        const type = file.endsWith(".wasm") ? "application/wasm" : "text/javascript";
        response.setHeader("Content-Type", type);
        response.end(readFileSync(file));
      });
    },
    transformIndexHtml() {
      if (!options.canonicalUrl) return [];
      const { href } = new URL(options.canonicalUrl);
      return [{ tag: "link", attrs: { rel: "canonical", href }, injectTo: "head" }];
    },
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

/**
 * An SDK package's assets, for {@link EditorAppOptions.sdkAssets}: its
 * `dist/assets` directory, served under the package's name and version,
 * such as `/pdf-sdk/1.2.3/`.
 *
 * @param packageName - Such as `@hussmartinez/pdf-sdk`.
 * @param from - The app's `import.meta.url`, to resolve the package from.
 */
export function sdkPackageAssets(packageName: string, from: string): { from: string; url: string } {
  const manifest = createRequire(from).resolve(`${packageName}/package.json`);
  const { version } = JSON.parse(readFileSync(manifest, "utf8")) as { version: string };
  const name = packageName.split("/").pop() ?? packageName;
  return {
    from: path.join(path.dirname(manifest), "dist/assets"),
    url: `/${name}/${version}/`,
  };
}

/**
 * Serves a stylesheet made at build time, such as a theme from ui's
 * `themeToCss`, as the module `virtual:theme.css`. The page then needs no
 * inline `<style>`, which the Content Security Policy forbids.
 */
export function themeStylesheet(css: string): Plugin {
  const id = "virtual:theme.css";
  return {
    name: "editor-apps:theme",
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    load: (resolved) => (resolved === `\0${id}` ? css : undefined),
  };
}
