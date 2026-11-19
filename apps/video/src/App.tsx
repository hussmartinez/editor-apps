import { VideoEditor } from "@hussmartinez/video-sdk/react";
import { ErrorBoundary } from "./ErrorBoundary";

/**
 * The app: its header and the SDK's editor filling the rest of the window.
 * The SDK's workers come from the app's own origin (vite.config.ts).
 * Everything happens on this device, so the app sends no analytics.
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
          <VideoEditor className="app-editor" assetsUrl={__SDK_ASSETS_URL__} />
        </ErrorBoundary>
      </main>
    </div>
  );
}
