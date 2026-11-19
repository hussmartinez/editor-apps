import { createAnalytics } from "@editor-apps/analytics";
import { appConfig } from "./app.config.ts";

/**
 * The app's analytics (docs/adr/0005): a page view per load and the
 * pdf-sdk's anonymous events, to PostHog, tagged `app: "pdf"`. Without
 * `VITE_POSTHOG_KEY` at build time, nothing loads and nothing is sent.
 */
export const analytics = createAnalytics({
  app: appConfig.app,
  key: import.meta.env.VITE_POSTHOG_KEY,
  host: import.meta.env.VITE_POSTHOG_HOST || appConfig.analyticsHost,
});
