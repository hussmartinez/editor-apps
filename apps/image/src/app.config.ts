import type { Engine } from "@editor-apps/build-config/playwright";

/**
 * What this app declares about itself. With `wrangler.jsonc`, it's the only
 * place the app's domain appears (docs/adr/0001).
 */
export const appConfig = {
  /** The app's public address, for its canonical link. */
  url: "https://image.forfreedom.app/",
  /**
   * The browsers the app supports and is tested in. The first is the one
   * pull requests test in.
   */
  engines: ["chromium", "firefox", "webkit"] satisfies Engine[],
} as const;
