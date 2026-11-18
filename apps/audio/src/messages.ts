import { audioMessages } from "@hussmartinez/audio-sdk";
import { createMessages, defineMessages, plural } from "@hussmartinez/sdk-core";
import { uiMessages } from "@hussmartinez/ui";

/**
 * All of the app's text: the SDK's catalogue (errors by code, warnings and
 * key names), ui's, and the app's own under `app.` and `editor.`. Errors are
 * always shown with `messages.error(error)`, never from `error.message`.
 *
 * The `editor.` keys belong to the temporary editor in `editor/`, and go
 * when the SDK's own `AudioEditor` replaces it.
 */
const catalogue = defineMessages({
  ...audioMessages,
  ...uiMessages,
  "app.title": "Signal / Cut",
  "app.tagline": "Edit audio in your browser. Files never leave this device.",
  "app.crash.title": "The editor stopped unexpectedly",
  "app.crash.body":
    "Your file is untouched on your device, but unsaved edits are lost. Reload the page to start again.",
  "app.crash.reload": "Reload the page",
  "editor.label": "Audio editor",
  "editor.empty.title": "Open a recording to edit",
  "editor.empty.formats": "WAV, AIFF, FLAC, MP3, AAC, M4A, Ogg or WebM",
  "editor.rejected.type":
    "That file doesn't look like audio. Choose a WAV, AIFF, FLAC, MP3, AAC, M4A, Ogg or WebM file.",
  "editor.rejected.count": "Open one file at a time.",
  "editor.rejected.directory": "Folders can't be opened. Choose an audio file.",
  "editor.dismiss": "Dismiss",
  "editor.cancel": "Cancel",
  "editor.opening": "Opening the recording",
  "editor.opened": "Opened {name}",
  "editor.summary": plural("channels", {
    one: "{name}: {duration}, {sampleRate, number} Hz, {channels} channel",
    other: "{name}: {duration}, {sampleRate, number} Hz, {channels} channels",
  }),
  "editor.tools": "Editing tools",
  "editor.tools.file": "File",
  "editor.tools.history": "History",
  "editor.tools.selection": "Selection",
  "editor.open": "Open",
  "editor.export": "Export WAV",
  "editor.undo": "Undo",
  "editor.redo": "Redo",
  "editor.undone": "Undone",
  "editor.redone": "Redone",
  "editor.setStart": "Set start",
  "editor.setEnd": "Set end",
  "editor.delete": "Delete",
  "editor.trim": "Trim to selection",
  "editor.deleted": "Deleted {start} to {end}",
  "editor.trimmed": "Trimmed to {duration}",
  "editor.transport": "Playback",
  "editor.play": "Play",
  "editor.pause": "Pause",
  "editor.toStart": "Back to start",
  "editor.playhead": "Playhead",
  "editor.time": "{position} / {duration}",
  "editor.selection": "Selected {start} to {end}",
  "editor.selection.none":
    "Nothing selected. Drag across the waveform, or press I and O at the playhead.",
  "editor.gain": "Gain",
  "editor.gain.description": "For the whole recording, from −24 to 24 dB",
  "editor.gain.value": "{db} dB",
  "editor.exporting": "Exporting the WAV file",
  "editor.exported": "{name} is ready ({size, fileSize}). The download starts by itself.",
  "editor.download": "Download again",
});

export const messages = createMessages(catalogue, { locale: "en" });
