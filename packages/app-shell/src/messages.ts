import { createMessages, defineMessages, sdkCoreMessages } from "@hussmartinez/sdk-core";
import { uiMessages } from "@hussmartinez/ui";

/**
 * The shell's own text, never inline (docs/adr/0002), with sdk-core's and
 * ui's catalogues for the ui components the shell renders. The app's name
 * and tagline come from its configuration.
 */
const catalogue = defineMessages({
  ...sdkCoreMessages,
  ...uiMessages,
  "shell.skip": "Skip to the editor",
  "shell.crash.title": "The editor stopped unexpectedly",
  "shell.crash.body":
    "Your file never left this device and is untouched, but unsaved edits are lost. Reload the page to start again.",
  "shell.crash.reload": "Reload the page",
  "shell.ad.placeholder": "Your ad here",
});

export const messages = createMessages(catalogue, { locale: "en" });
