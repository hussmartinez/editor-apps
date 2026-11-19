// ui's stylesheet first, then the SDK's, then the brand theme and the shell's.
import "@hussmartinez/ui/styles.css";
import "@hussmartinez/video-sdk/styles.css";
import "virtual:theme.css";
import "@editor-apps/app-shell/styles.css";
import { AppShell, startApp, type UnsavedAfter, useEditorEvents } from "@editor-apps/app-shell";
import type { VideoSessionEvent } from "@hussmartinez/video-sdk";
import { VideoEditor } from "@hussmartinez/video-sdk/react";
import { AdArt } from "./AdArt.tsx";
import { appConfig } from "./app.config.ts";

/**
 * What video-sdk's events mean for the leave guard (docs/adr/0002): any
 * edit, adding clips included, arms it, and an export clears it. Failed
 * and cancelled steps change nothing. The export event comes when the file
 * is ready in the export dialog, before its Download button is pressed.
 */
const unsavedAfter: UnsavedAfter<VideoSessionEvent> = ({ type, outcome }) => {
  if (outcome !== "done") return undefined;
  return type !== "export";
};

/**
 * video-sdk's `VideoEditor` in the shared shell (docs/adr/0002). Its
 * workers come from the app's own origin (vite.config.ts), and its
 * anonymous events go to the app's analytics (docs/adr/0005) and set
 * the leave guard.
 */
function App() {
  const editor = useEditorEvents(unsavedAfter);
  return (
    <AppShell
      title={appConfig.title}
      tagline={appConfig.tagline}
      unsaved={editor.unsaved}
      ad={<AdArt />}
    >
      <VideoEditor className="app-editor" assetsUrl={__SDK_ASSETS_URL__} onEvent={editor.onEvent} />
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
