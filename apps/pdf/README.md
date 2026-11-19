# PDF editor

Merge, reorder, rotate and delete pages, fill forms and annotate PDFs in the browser. Files never leave the device.

The app is a thin shell around [`@hussmartinez/pdf-sdk`](https://github.com/ie-huss-martinez/pdf-sdk): the SDK's `PdfEditor` opens, edits and saves, and the app adds its header, theme, response headers and deployment.

## Analytics

Analytics is off unless the build has a `VITE_POSTHOG_KEY` (see `.env.example`). Without a key, no analytics code is loaded, nothing is sent, and the Content Security Policy allows no other origin.

With a key, the app forwards the SDK's anonymous usage events to PostHog, and nothing else:

- **Nothing from a file:** the events carry no file name, content, text or form value.
- **Nothing that identifies a person:** no cookie, no storage, and no automatic capture of clicks, pages, errors or recordings.
- **One origin:** the policy allows PostHog's host in `connect-src` only. Its client is bundled, so no script comes from another origin.

The key is a public client key: it's in the built JavaScript by nature. It's set as a build variable in Workers Builds, never committed.

## Develop

From the repository's root, with Node 24:

```sh
pnpm --filter @editor-apps/pdf dev
pnpm --filter @editor-apps/pdf build
pnpm --filter @editor-apps/pdf test:e2e    # needs the build, and Docker
```

The smoke test checks what the app adds: its response headers, that the SDK's workers and data files load from the app's own origin, and that a PDF opens and downloads as a PDF file. Editing itself is the SDK's to test. Its PDF is written in the test, so the repository holds no binary fixture.

## History

The app was imported from its own private repository, which is archived. Its earlier history stays there.
