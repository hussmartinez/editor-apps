import { editorApp, sdkPackageAssets, themeStylesheet } from "@editor-apps/build-config/vite";
import { themeToCss } from "@hussmartinez/ui";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { appConfig } from "./src/app.config.ts";
import { brandDark, brandLight } from "./src/theme.ts";

export default defineConfig(({ mode }) => {
  // Analytics is on only when a key is set at build time. Only then does the
  // policy allow its origin, in connect-src and nowhere else (docs/adr/0005).
  const env = loadEnv(mode, import.meta.dirname, "VITE_");
  const analytics = env.VITE_POSTHOG_KEY
    ? { connect: [env.VITE_POSTHOG_HOST || appConfig.analyticsHost] }
    : undefined;

  return {
    plugins: [
      react(),
      // The SDK's workers, WebAssembly and data files come from the app's own
      // origin. It renders pages as images it holds in the page.
      editorApp({
        canonicalUrl: appConfig.url,
        policy: { wasm: true, inlineImages: true, ...(analytics ? { analytics } : {}) },
        sdkAssets: sdkPackageAssets("@hussmartinez/pdf-sdk", import.meta.url),
      }),
      themeStylesheet(themeToCss({ light: brandLight, dark: brandDark })),
    ],
    server: { port: 5176 },
  };
});
