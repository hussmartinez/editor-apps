// ui's stylesheet first, then the SDK's, then the brand theme and the shell's.
import "@hussmartinez/ui/styles.css";
import "@hussmartinez/image-sdk/styles.css";
import "virtual:theme.css";
import "@editor-apps/app-shell/styles.css";
import { AppShell, startApp, type UnsavedAfter, useEditorEvents } from "@editor-apps/app-shell";
import type { ImageSessionEvent } from "@hussmartinez/image-sdk";
import { ImageEditor } from "@hussmartinez/image-sdk/react";
import { appConfig } from "./app.config.ts";

/**
 * What image-sdk's events mean for the leave guard (docs/adr/0002): an
 * edit arms it; an export, or opening an image, clears it. Failed and
 * cancelled steps change nothing. The export event comes when the file is
 * ready in the export dialog, before its Download button is pressed.
 */
const unsavedAfter: UnsavedAfter<ImageSessionEvent> = ({ type, outcome }) => {
  if (outcome !== "done") return undefined;
  return type !== "open" && type !== "export";
};

/**
 * image-sdk's `ImageEditor` in the shared shell (docs/adr/0002). Its
 * workers come from the app's own origin (vite.config.ts), and its
 * anonymous events go to the app's analytics (docs/adr/0005) and set
 * the leave guard.
 */
function App() {
  const editor = useEditorEvents(unsavedAfter);
  return (
    <AppShell title={appConfig.title} tagline={appConfig.tagline} unsaved={editor.unsaved}>
      <ImageEditor className="app-editor" assetsUrl={__SDK_ASSETS_URL__} onEvent={editor.onEvent} />
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
