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
  /** The app's name, which every analytics event carries as `app` (docs/adr/0005). */
  app: "image",
  /** Where analytics events go when the build has a key (docs/adr/0005). */
  analyticsHost: "https://eu.i.posthog.com",
} as const;
