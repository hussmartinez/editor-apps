# Video editor

Trim, split and export videos in the browser. Videos never leave the device.

The app is a thin shell around [`@hussmartinez/video-sdk`](https://github.com/ie-huss-martinez/video-sdk): the SDK's `VideoEditor` opens, edits and exports, and the app adds its header, theme, response headers and deployment.

## Develop

From the repository's root, with Node 24:

```sh
pnpm --filter @editor-apps/video dev
pnpm --filter @editor-apps/video build
pnpm --filter @editor-apps/video test:e2e    # needs the build, and Docker
```

The smoke test checks what the app adds: its response headers, that the SDK's workers load from the app's own origin, and that a video opens and exports as a video file. Editing itself is the SDK's to test.

Its fixture, `e2e/fixtures/clip.webm`, is one second of FFmpeg's synthetic test pattern and tone, never a recording. `e2e/make-fixture.sh` regenerates it.

## History

The app was imported from its own private repository, which is archived. Its earlier history stays there.
