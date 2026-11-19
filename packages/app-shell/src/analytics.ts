import type { Analytics } from "@editor-apps/analytics";
import { createContext, useContext } from "react";

/** Does nothing: what the shell uses when no analytics was started, as in tests. */
export const noAnalytics: Analytics = {
  pageView: () => {},
  editorEvent: () => {},
  event: () => {},
};

/** The app's analytics, started by {@link startApp}. */
export const AnalyticsContext = createContext<Analytics>(noAnalytics);

/**
 * The app's analytics: pass its `editorEvent` to the SDK editor's `onEvent`
 * (docs/adr/0005). The shell sends the page view itself.
 */
export function useAnalytics(): Analytics {
  return useContext(AnalyticsContext);
}
