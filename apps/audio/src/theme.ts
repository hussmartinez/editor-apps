import { createTheme } from "@hussmartinez/ui";

/**
 * The app's brand on ui's tokens: the navy, cyan, amber and coral of the
 * earlier Signal / Cut interface in dark mode, and a teal accent in light
 * mode. Everything else stays ui's.
 *
 * vite.config.ts writes these as a static stylesheet with `themeToCss`, so
 * the page needs no inline `<style>` and the Content Security Policy needs
 * no nonce. The shared app shell will replace this file (docs/adr/0002).
 */
export const brandTheme = {
  light: createTheme({
    extends: "light",
    tokens: {
      "color-accent": "#0b6b7d",
      "color-accent-hover": "#095a69",
      "color-accent-active": "#074a57",
      "color-on-accent": "#ffffff",
      "color-accent-subtle": "#d9f3f7",
      "color-accent-text": "#0b6b7d",
      "focus-ring-color": "#0b6b7d",
    },
  }),
  dark: createTheme({
    extends: "dark",
    tokens: {
      "color-bg": "#071522",
      "color-surface": "#0a1d2b",
      "color-surface-raised": "#10283a",
      "color-surface-sunken": "#06111b",
      "color-text": "#dce8ea",
      "color-text-muted": "#9db3bc",
      "color-border": "#244357",
      "color-border-strong": "#6f95a8",
      "color-control": "#10283a",
      "color-control-hover": "#173549",
      "color-control-active": "#1e4259",
      "color-accent": "#31d7e8",
      "color-accent-hover": "#5fe1ee",
      "color-accent-active": "#8ceaf3",
      "color-on-accent": "#06202b",
      "color-accent-subtle": "#0d3442",
      "color-accent-text": "#31d7e8",
      "color-warning-text": "#f0b35a",
      "color-danger-text": "#ff9d94",
      "focus-ring-color": "#31d7e8",
    },
  }),
};
