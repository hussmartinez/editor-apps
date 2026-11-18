import { editorApp, sdkPackageAssets, themeStylesheet } from "@editor-apps/build-config/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { appConfig } from "./src/app.config.ts";
import { themeCss } from "./src/theme.ts";

export default defineConfig({
  plugins: [
    react(),
    // The SDK's workers come from the app's own origin. The editor shows
    // frames and plays media it holds in the page, as blob: and data: URLs.
    editorApp({
      canonicalUrl: appConfig.url,
      policy: { inlineImages: true, inlineMedia: true },
      sdkAssets: sdkPackageAssets("@hussmartinez/video-sdk", import.meta.url),
    }),
    themeStylesheet(themeCss()),
  ],
  server: { port: 5174 },
  build: {
    target: "es2022",
    rollupOptions: {
      // The SDK's client entries say "use client", which a browser-only bundle
      // ignores: expected here, not a problem to report.
      onwarn(warning, warn) {
        if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning);
      },
    },
  },
});
