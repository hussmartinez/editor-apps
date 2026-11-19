import { createTheme, themeToCss } from "@hussmartinez/ui";

/**
 * The app's brand on ui's tokens: the old editor's signal orange as the
 * accent, and its ink-and-paper palette in dark mode. The light theme uses a
 * deeper orange so text on it keeps WCAG AA contrast.
 */
export const brandLight = createTheme({
  extends: "light",
  tokens: {
    "color-accent": "#c2410c",
    "color-accent-hover": "#9a3412",
    "color-accent-active": "#7c2d12",
    "color-on-accent": "#ffffff",
    "color-accent-subtle": "#ffedd5",
    "color-accent-text": "#9a3412",
  },
});

export const brandDark = createTheme({
  extends: "dark",
  tokens: {
    "color-bg": "#12131a",
    "color-surface": "#191b25",
    "color-surface-raised": "#242633",
    "color-surface-sunken": "#08090c",
    "color-border": "#3a3d4d",
    "color-text": "#e8e7e2",
    "color-text-muted": "#b4b6c0",
    "color-accent": "#ff6a3d",
    "color-accent-hover": "#ff8a63",
    "color-accent-active": "#ffa98a",
    "color-on-accent": "#12131a",
    "color-accent-subtle": "#3d1d12",
    "color-accent-text": "#ff8a63",
    "focus-ring-color": "#88a9ff",
  },
});

/**
 * The pair as a static stylesheet that follows the system's light or dark
 * mode. Written at build time, so the Content Security Policy needs no
 * inline styles.
 */
export const themeCss = (): string => themeToCss({ light: brandLight, dark: brandDark });
