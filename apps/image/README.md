# Image editor

Crop, rotate, adjust, redact and export images in the browser. Nothing is uploaded.

The app is a thin shell around [`@hussmartinez/image-sdk`](https://github.com/ie-huss-martinez/image-sdk): the SDK's `ImageEditor` opens, edits and exports, and the app adds its header, theme, response headers and deployment.

## Develop

From the repository's root, with Node 24:

```sh
pnpm --filter @editor-apps/image dev
pnpm --filter @editor-apps/image build
pnpm --filter @editor-apps/image test:e2e    # needs the build, and Docker
```

The smoke test checks what the app adds: its response headers, that the SDK's workers load from the app's own origin, and that an image opens and exports as a PNG file. Editing itself is the SDK's to test. Its image is generated in the test, so the repository holds no binary fixture.

## History

The app was imported from its own private repository, which is archived. Its earlier history stays there.
