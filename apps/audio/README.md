# Audio editor

Open a recording, cut and trim it, and export a WAV file, in the browser. Audio never leaves the device.

The app is a thin shell around [`@hussmartinez/audio-sdk`](https://github.com/ie-huss-martinez/audio-sdk), which decodes, edits, plays and exports.

## The editor is temporary

audio-sdk publishes its headless core only so far: its React editor is designed, but not built. Until it ships, `src/editor/` holds a small editor of the app's own.

- **It has no editing logic.** Every edit is a session command, playback is the SDK's output, and export is `session.export()`. The app only draws and wires.
- **Don't grow it.** A missing feature belongs in the SDK's editor. When that ships, delete the folder and the `editor.` messages, and render the SDK's component in `src/App.tsx`.

## Develop

From the repository's root, with Node 24:

```sh
pnpm --filter @editor-apps/audio dev
pnpm --filter @editor-apps/audio build
pnpm --filter @editor-apps/audio test:e2e    # needs the build, and Docker
```

The smoke test checks what the app adds: its response headers, that the SDK's worker loads from the app's own origin, and that a recording opens and exports as a WAV file. Editing itself is the SDK's to test.

## History

The app was imported from its own private repository, which is archived. Its earlier history stays there.
