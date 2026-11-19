import { VideoEditor } from "@hussmartinez/video-sdk/react";
import { analytics } from "./analytics.ts";
import { ErrorBoundary } from "./ErrorBoundary";

/**
 * The app: its header and the SDK's editor filling the rest of the window.
 * The SDK's workers come from the app's own origin (vite.config.ts).
 * Videos never leave this device: analytics is a page view and the SDK's
 * anonymous events, with nothing from the files (docs/adr/0005).
 */
export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="app-mark" aria-hidden="true">
            V<span>/</span>E
          </span>
          Video Editor
        </h1>
        <p className="app-tagline">Videos stay on your device.</p>
      </header>
      <main className="app-main">
        <ErrorBoundary>
          <VideoEditor
            className="app-editor"
            assetsUrl={__SDK_ASSETS_URL__}
            onEvent={analytics.editorEvent}
          />
        </ErrorBoundary>
      </main>
    </div>
  );
}
