// ui's stylesheet first, then the SDK's, then the brand theme and the shell's.
import "@hussmartinez/ui/styles.css";
import "@hussmartinez/video-sdk/styles.css";
import "virtual:theme.css";
import "@editor-apps/app-shell/styles.css";
import { AppShell, startApp, useAnalytics } from "@editor-apps/app-shell";
import { VideoEditor } from "@hussmartinez/video-sdk/react";
import { appConfig } from "./app.config.ts";

/**
 * video-sdk's `VideoEditor` in the shared shell (docs/adr/0002). Its
 * workers come from the app's own origin (vite.config.ts), and its
 * anonymous events go to the app's analytics (docs/adr/0005).
 */
function App() {
  const analytics = useAnalytics();
  return (
    <AppShell title={appConfig.title} tagline={appConfig.tagline}>
      <VideoEditor
        className="app-editor"
        assetsUrl={__SDK_ASSETS_URL__}
        onEvent={analytics.editorEvent}
      />
    </AppShell>
  );
}

startApp({
  app: appConfig.app,
  analytics: {
    key: import.meta.env.VITE_POSTHOG_KEY,
    host: import.meta.env.VITE_POSTHOG_HOST || appConfig.analyticsHost,
  },
  render: () => <App />,
});
