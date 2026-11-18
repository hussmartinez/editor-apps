import { editorApp, sdkPackageAssets, themeStylesheet } from "@editor-apps/build-config/vite";
import { themeToCss } from "@hussmartinez/ui";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { appConfig } from "./src/app.config.ts";
import { brandTheme } from "./src/theme.ts";

export default defineConfig({
  plugins: [
    react(),
    // The SDK decodes and exports in a worker, served from the app's own
    // origin. It needs nothing else opened in the policy.
    editorApp({
      canonicalUrl: appConfig.url,
      sdkAssets: sdkPackageAssets("@hussmartinez/audio-sdk", import.meta.url),
    }),
    themeStylesheet(themeToCss(brandTheme)),
  ],
  server: { port: 5173 },
});
