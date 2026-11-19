import "@hussmartinez/ui/styles.css";
import "@hussmartinez/image-sdk/styles.css";
import "virtual:theme.css";
import "./styles.css";
import { ImageEditor } from "@hussmartinez/image-sdk/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./ErrorBoundary";

function App() {
  // A new key remounts the editor, which recreates the SDK's engine, processor and session.
  const [editorKey, setEditorKey] = useState(0);
  const [hasImage, setHasImage] = useState(false);
  const restart = () => {
    setHasImage(false);
    setEditorKey((key) => key + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">Browser darkroom</p>
          <h1>Image editor</h1>
        </div>
        <p className="app-status">
          {hasImage
            ? "Your edits stay on this device until you export."
            : "Open an image to crop, rotate, adjust and export it. Nothing is uploaded."}
        </p>
      </header>
      <main className="app-main">
        <ErrorBoundary onReset={restart}>
          <ImageEditor
            key={editorKey}
            className="app-editor"
            assetsUrl={__SDK_ASSETS_URL__}
            onChange={() => setHasImage(true)}
          />
        </ErrorBoundary>
      </main>
    </div>
  );
}

// React logs every error a boundary catches to the console by default. The
// boundary records nothing, because an error can carry text from the image's
// metadata, so the root records nothing either.
createRoot(document.getElementById("root") as HTMLElement, {
  onCaughtError: () => {},
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
