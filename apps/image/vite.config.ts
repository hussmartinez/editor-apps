import { editorApp, sdkPackageAssets, themeStylesheet } from "@editor-apps/build-config/vite";
import { themeToCss } from "@hussmartinez/ui";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { appConfig } from "./src/app.config.ts";
import { brandTheme } from "./src/theme.ts";

export default defineConfig({
  plugins: [
    react(),
    // The SDK's workers come from the app's own origin, under a path with
    // the SDK's version, so pages and workers of two releases never mix.
    editorApp({
      canonicalUrl: appConfig.url,
      sdkAssets: sdkPackageAssets("@hussmartinez/image-sdk", import.meta.url),
    }),
    themeStylesheet(themeToCss(brandTheme)),
  ],
  server: { port: 5175 },
});
