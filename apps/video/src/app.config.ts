import type { Engine } from "@editor-apps/build-config/playwright";

/**
 * What this app declares about itself. With `wrangler.jsonc`, it's the only
 * place the app's domain appears (docs/adr/0001).
 */
export const appConfig = {
  /** The app's public address, for its canonical link. */
  url: "https://video.forfreedom.app/",
  /**
   * The browsers the app is tested in. The SDK decodes and encodes with
   * WebCodecs, and the test's VP8 and Opus fixture is one Chromium decodes.
   */
  engines: ["chromium"] satisfies Engine[],
} as const;
