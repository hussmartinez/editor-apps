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
  /** The app's name, which every analytics event carries as `app` (docs/adr/0005). */
  app: "video",
  /** The app's name, the page's one `<h1>`, and the line under it. */
  title: "Video Editor",
  tagline: "Trim, split and export videos in your browser. Videos never leave this device.",
  /** Where analytics events go when the build has a key (docs/adr/0005). */
  analyticsHost: "https://eu.i.posthog.com",
} as const;
