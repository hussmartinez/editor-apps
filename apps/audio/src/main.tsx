// ui's stylesheet first, then the SDK's, then the brand theme and the shell's.
import "@hussmartinez/ui/styles.css";
import "@hussmartinez/audio-sdk/styles.css";
import "virtual:theme.css";
import "@editor-apps/app-shell/styles.css";
import { AppShell, startApp, type UnsavedAfter, useEditorEvents } from "@editor-apps/app-shell";
import type { AudioSessionEvent } from "@hussmartinez/audio-sdk";
import { AudioEditor } from "@hussmartinez/audio-sdk/react";
import { appConfig } from "./app.config.ts";

/**
 * What audio-sdk's events mean for the leave guard (docs/adr/0002): an
 * edit arms it; an export, or opening or closing a recording, clears it.
 * A failure changes nothing. The export event comes when the file is
 * ready in the export dialog, before its Download button is pressed.
 */
const unsavedAfter: UnsavedAfter<AudioSessionEvent> = (event) => {
  switch (event.type) {
    case "recording_inserted":
    case "command":
    case "undo":
    case "redo":
      return true;
    case "recording_opened":
    case "recording_exported":
    case "recording_closed":
      return false;
    default:
      return undefined;
  }
};

/**
 * audio-sdk's `AudioEditor` in the shared shell (docs/adr/0002). Its worker
 * comes from the app's own origin (vite.config.ts), and its anonymous
 * events go to the app's analytics (docs/adr/0005) and to the leave guard.
 */
function App() {
  const editor = useEditorEvents(unsavedAfter);
  return (
    <AppShell title={appConfig.title} tagline={appConfig.tagline} unsaved={editor.unsaved}>
      <AudioEditor className="app-editor" assetsUrl={__SDK_ASSETS_URL__} onEvent={editor.onEvent} />
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
