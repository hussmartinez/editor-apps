# Audio editor

Open recordings, edit them on tracks, and export a WAV file, in the browser. Audio never leaves the device.

The app is a thin shell around [`@hussmartinez/audio-sdk`](https://github.com/ie-huss-martinez/audio-sdk): the SDK's `AudioEditor` opens, edits, plays and exports, with a toolbar, a timeline with a lane per track, the transport, an inspector and an export dialog. The app adds its header, theme, response headers, analytics and deployment.

## Analytics

Anonymous, through PostHog, and only when the build has `VITE_POSTHOG_KEY` (see `.env.example`). Without a key, no analytics code loads, nothing is sent, and the Content Security Policy allows no other origin ([ADR 0005](../../docs/adr/0005-analytics-and-consent.md)).

With a key, the app sends two things, each tagged `app: "audio"`:

- **One page view per load,** with the page's path only, never its query string or fragment.
- **The audio-sdk's anonymous usage events,** such as a recording opened or exported, with its rounded duration and format, or an edit's command type. They never carry a file name, samples or metadata values.

And nothing else:

- **Nothing from a file,** and nothing typed into the editor.
- **Nothing that identifies a person:** no cookie, no storage, no person profile, no referrer, and no automatic capture of clicks, errors or recordings. PostHog's own properties, such as the browser, operating system and screen size, come with each event.
- **One origin:** the policy allows PostHog's host in `connect-src` only. Its client is bundled, so no script comes from another origin.
- **Nothing at all** when the browser sends Global Privacy Control or Do Not Track.

The key is a public client key: it's in the built JavaScript by nature. It's set as a build variable in Workers Builds, never committed.

## Develop

From the repository's root, with Node 24:

```sh
pnpm --filter @editor-apps/audio dev
pnpm --filter @editor-apps/audio build
pnpm --filter @editor-apps/audio test:e2e    # needs the build, and Docker
```

The smoke test checks what the app adds: its response headers, that the SDK's worker loads from the app's own origin, and that a recording opens in the SDK's editor and exports through its dialog as a WAV file. Editing itself is the SDK's to test.

## History

The app was imported from its own private repository, which is archived. Its earlier history stays there.
