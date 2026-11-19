import { AudioEditor } from "@hussmartinez/audio-sdk/react";
import { AnnouncerProvider, Button, UiMessagesProvider } from "@hussmartinez/ui/react";
import { Component, type ReactNode } from "react";
import { analytics } from "./analytics.ts";
import { messages } from "./messages";

/**
 * The app's shell around audio-sdk's `AudioEditor`: the header, the one
 * `<h1>`, the `<main>` landmark, ui's providers and an error boundary. The
 * editor's worker comes from the app's own origin (vite.config.ts), and its
 * anonymous events go to the app's analytics (docs/adr/0005). The theme is
 * a static stylesheet (theme.ts) that follows the system's light or dark
 * mode.
 */
export function App() {
  return (
    <UiMessagesProvider messages={messages}>
      <AnnouncerProvider>
        <div className="app">
          <header className="app-header">
            <h1>{messages.t("app.title")}</h1>
            <p>{messages.t("app.tagline")}</p>
          </header>
          <main className="app-main">
            <ErrorBoundary>
              <AudioEditor
                className="app-editor"
                assetsUrl={__SDK_ASSETS_URL__}
                onEvent={analytics.editorEvent}
              />
            </ErrorBoundary>
          </main>
        </div>
      </AnnouncerProvider>
    </UiMessagesProvider>
  );
}

/** Replaces a crashed editor with a way forward, never a blank page or a stack trace. */
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app-crash" role="alert">
        <h2>{messages.t("app.crash.title")}</h2>
        <p>{messages.t("app.crash.body")}</p>
        <Button variant="primary" onClick={() => location.reload()}>
          {messages.t("app.crash.reload")}
        </Button>
      </div>
    );
  }
}
