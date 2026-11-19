import { createTheme } from "@hussmartinez/ui";

/** The app's brand on ui's tokens: forest ink on a sage page, and its dark counterpart. */
export const brandLight = createTheme({
  extends: "light",
  tokens: {
    "color-bg": "#e9ece4",
    "color-surface": "#f6f7f3",
    "color-surface-sunken": "#dde2d6",
    "color-text": "#17211b",
    "color-text-muted": "#4a554e",
    "color-accent": "#2d5a43",
    "color-accent-hover": "#24493a",
    "color-accent-active": "#1b3a2d",
    "color-accent-text": "#2d5a43",
    "color-accent-subtle": "#d3e4d9",
    "color-on-accent": "#ffffff",
  },
});

export const brandDark = createTheme({
  extends: "dark",
  tokens: {
    "color-bg": "#111713",
    "color-surface": "#18201b",
    "color-surface-raised": "#212b24",
    "color-surface-sunken": "#0d120f",
    "color-text": "#e9ece4",
    "color-text-muted": "#a9b3ac",
    "color-accent": "#8cc2a4",
    "color-accent-hover": "#a3d0b6",
    "color-accent-active": "#b8dcc7",
    "color-accent-text": "#8cc2a4",
    "color-accent-subtle": "#223a2d",
    "color-on-accent": "#0e1511",
  },
});
