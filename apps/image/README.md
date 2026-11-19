# Image editor

Crop, rotate, adjust, redact and export images in the browser. Nothing is uploaded.

The app is a thin shell around [`@hussmartinez/image-sdk`](https://github.com/ie-huss-martinez/image-sdk): the SDK's `ImageEditor` opens, edits and exports, and the app adds its header, theme, response headers and deployment.

## Analytics

Anonymous, through PostHog, and only when the build has `VITE_POSTHOG_KEY` (see `.env.example`). Without a key, no analytics code loads, nothing is sent, and the Content Security Policy allows no other origin ([ADR 0005](../../docs/adr/0005-analytics-and-consent.md)).

With a key, the app sends two things, each tagged `app: "image"`:

- **One page view per load,** with the page's path only, never its query string or fragment.
- **The image-sdk's anonymous usage events,** such as an image opened or exported, or an edit's command type, and whether it succeeded. They never carry a file name, contents or pixels, text or metadata.

And nothing else:

- **Nothing from a file,** and nothing typed into the editor.
- **Nothing that identifies a person:** no cookie, no storage, no person profile, no referrer, and no automatic capture of clicks, errors or recordings. PostHog's own properties, such as the browser, operating system and screen size, come with each event.
- **One origin:** the policy allows PostHog's host in `connect-src` only. Its client is bundled, so no script comes from another origin.
- **Nothing at all** when the browser sends Global Privacy Control or Do Not Track.

The key is a public client key: it's in the built JavaScript by nature. It's set as a build variable in Workers Builds, never committed.

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
