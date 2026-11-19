import { createTheme, type ThemePair } from "@hussmartinez/ui";

/**
 * The app's brand: ui's built-in themes with the darkroom teal accent.
 * Contrast is checked with ui's `checkContrast` (WCAG 2.2 AA, no failures).
 *
 * The build writes this as a static stylesheet (see `vite.config.ts`),
 * so the page needs no inline `<style>` and the CSP can stay `style-src 'self'`.
 */
export const brandTheme: ThemePair = {
  light: createTheme({
    extends: "light",
    tokens: {
      "color-accent": "#0b6b6f",
      "color-accent-hover": "#095a5d",
      "color-accent-active": "#074a4d",
      "color-accent-subtle": "#d9f3f4",
      "color-accent-text": "#0b6b6f",
      "color-on-accent": "#ffffff",
      "focus-ring-color": "#0b6b6f",
    },
  }),
  dark: createTheme({
    extends: "dark",
    tokens: {
      "color-accent": "#68d8dc",
      "color-accent-hover": "#8ae3e6",
      "color-accent-active": "#4cc4c8",
      "color-accent-subtle": "#123b3d",
      "color-accent-text": "#68d8dc",
      "color-on-accent": "#0a0d0e",
      "focus-ring-color": "#68d8dc",
    },
  }),
};
