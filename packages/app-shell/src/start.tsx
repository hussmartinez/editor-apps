import { createAnalytics } from "@editor-apps/analytics";
import { type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AnalyticsContext } from "./analytics.ts";

export interface StartOptions {
  /** The app's name, which every analytics event carries as `app` (docs/adr/0005). */
  readonly app: string;
  /** PostHog's public key and host, from the app's build. Without a key, nothing is sent. */
  readonly analytics: { readonly key: string | undefined; readonly host: string };
  /** Renders the app: usually {@link AppShell} around the SDK's editor. */
  readonly render: () => ReactNode;
  /** Where to render. Defaults to `#root`. */
  readonly root?: HTMLElement;
}

/**
 * Starts an app the same way in every app: its analytics, with one page
 * view per load, then the app, in React's strict mode, with the analytics
 * in context for {@link useAnalytics} and the error boundary.
 */
export function startApp({ app, analytics: { key, host }, render, root }: StartOptions): void {
  const analytics = createAnalytics({ app, key, host });
  analytics.pageView();
  const element = root ?? document.getElementById("root");
  if (!element) throw new Error("The page has no #root element.");
  createRoot(element).render(
    <StrictMode>
      <AnalyticsContext.Provider value={analytics}>{render()}</AnalyticsContext.Provider>
    </StrictMode>,
  );
}
