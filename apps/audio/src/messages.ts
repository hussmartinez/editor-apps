import { createMessages, defineMessages, sdkCoreMessages } from "@hussmartinez/sdk-core";
import { uiMessages } from "@hussmartinez/ui";

/**
 * The shell's text: the header and the error boundary. The editor's own
 * text is audio-sdk's, in `AudioEditor`. Errors are always shown by code,
 * never from `error.message`.
 */
const catalogue = defineMessages({
  ...sdkCoreMessages,
  ...uiMessages,
  "app.title": "Signal / Cut",
  "app.tagline": "Edit audio in your browser. Files never leave this device.",
  "app.crash.title": "The editor stopped unexpectedly",
  "app.crash.body":
    "Your file is untouched on your device, but unsaved edits are lost. Reload the page to start again.",
  "app.crash.reload": "Reload the page",
});

export const messages = createMessages(catalogue, { locale: "en" });
