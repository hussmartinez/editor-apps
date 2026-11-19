import "@hussmartinez/ui/styles.css";
import "@hussmartinez/audio-sdk/styles.css";
import "virtual:theme.css";
import "./app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { analytics } from "./analytics.ts";

analytics.pageView();

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
