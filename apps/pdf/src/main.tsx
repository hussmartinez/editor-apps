import { PdfEditor, type PdfEditorChange } from "@hussmartinez/pdf-sdk/react";
import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import "@hussmartinez/ui/styles.css";
import "@hussmartinez/pdf-sdk/styles.css";
import "virtual:theme.css";
import "./styles.css";
import { trackEditorEvent } from "./analytics";
import { ErrorBoundary } from "./error-boundary";

/** The limits the app had before the SDK: warn at 100 MB, refuse over 300 MB. */
const FILE_POLICY = {
  maxFileSize: { maximum: 300e6, warning: 100e6 },
  maxSessionSize: 600e6,
} as const;

type DocumentStatus = { fileName?: string | undefined; pageCount: number };

function describe({ fileName, pageCount }: DocumentStatus): string {
  if (pageCount === 0) return "No document open";
  const pages = `${pageCount} ${pageCount === 1 ? "page" : "pages"}`;
  return fileName ? `${fileName} · ${pages}` : pages;
}

function App() {
  const [status, setStatus] = useState<DocumentStatus>({ pageCount: 0 });

  // The file name comes only with `open`; edits keep it, closing clears it.
  const handleChange = useCallback((change: PdfEditorChange) => {
    setStatus((previous) =>
      change.reason === "open"
        ? { fileName: change.fileName, pageCount: change.pageCount }
        : change.reason === "close"
          ? { pageCount: 0 }
          : { ...previous, pageCount: change.pageCount },
    );
  }, []);

  return (
    <div className="app-shell">
      <header className="masthead">
        <div>
          <span className="eyebrow">Private workspace</span>
          <h1>PDF Editor</h1>
        </div>
        {/* The name comes from the file, so it's rendered only as text. */}
        <output className="status">{describe(status)}</output>
      </header>
      <main className="workspace">
        <ErrorBoundary>
          <PdfEditor
            assetsUrl={__SDK_ASSETS_URL__}
            filePolicy={FILE_POLICY}
            onChange={handleChange}
            onEvent={trackEditorEvent}
          />
        </ErrorBoundary>
      </main>
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
