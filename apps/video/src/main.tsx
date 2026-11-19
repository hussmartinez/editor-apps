// ui's stylesheet first, then the SDK's, then the brand theme and the shell.
import "@hussmartinez/ui/styles.css";
import "@hussmartinez/video-sdk/styles.css";
import "virtual:theme.css";
import "./app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { analytics } from "./analytics.ts";

analytics.pageView();

const root = document.getElementById("root");
if (!root) throw new Error("The page has no #root element.");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
