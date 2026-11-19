# 0005. Anonymous analytics through one adapter, and consent only where needed

- **Status:** Accepted
- **Date:** 2026-11-18

## Context

The apps' promise is that files never leave the device. Analytics must not weaken it, in fact or in appearance.

- **The SDKs already emit anonymous usage events** through `onEvent`: what kind of thing happened, with coarse facts such as a format or a rounded duration, and never a file name, content, text or metadata value.
- **One app sends them to PostHog today,** when a key is set at build time: cookieless, with nothing captured automatically, and with PostHog's origin as the only other origin its Content Security Policy allows. The other three send nothing.
- **Each app would otherwise wire a provider its own way,** and each wiring is a chance to capture more than intended, or to open the policy wider than needed.

## Decision

### One adapter, three providers

`packages/app-shell` has one analytics adapter. An app chooses a provider in its `app.config.ts`:

| Provider     | What it does                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `none`       | Nothing is loaded and nothing is sent. The default                                                   |
| `posthog`    | The SDK's events go to PostHog, in the cookieless setup below                                        |
| `cloudflare` | Cloudflare Web Analytics counts page views. It has no custom events, so the SDK's events aren't sent |

- **The adapter has one input: the SDK's `onEvent` events,** plus a page view. The app passes `onEvent` to its editor, and the adapter forwards it. There's no general `track()` for app code to call with arbitrary data.
- **A provider's client is loaded only when that provider is configured and has its key.** With `none`, or without a key, no analytics code is in the page's requests at all.
- **The key comes from a build variable** in Workers Builds. It's a public client key: it's in the built JavaScript by nature, and it isn't a secret.

### What is never sent

- **Nothing from a file:** no name, size beyond what the SDK's event already rounds, content, text, form value or metadata.
- **Nothing that identifies a person:** no cookie, no local storage, no user id, no fingerprint. Each page load is anonymous and unlinked to the last.
- **Nothing captured automatically:** no clicks, inputs, page text, errors with messages, recordings, heat maps or surveys.
- **No URL beyond the page's own path,** which has no file information: files are opened from the device, never from a URL.

For PostHog that means memory-only persistence, autocapture and every automatic capture off, session recording off, feature flags off, and no loading of scripts from another origin. A unit test pins these options, so an upgrade that adds a capture feature fails until it's switched off.

### The policy follows the provider

`build-config` builds each app's Content Security Policy, and takes the analytics origin from the app's provider:

- **`none`:** no other origin, anywhere in the policy.
- **`posthog`:** the configured PostHog host in `connect-src`, and nothing else. Its client is bundled, so `script-src` stays `'self'`.
- **`cloudflare`:** Cloudflare's beacon script in `script-src` and its endpoint in `connect-src`.

A host must be `https`, and the build fails otherwise. The smoke test asserts that the only requests to another origin are the provider's ([ADR 0003](0003-testing-and-playwright.md)).

### Consent

- **A banner appears only where the chosen provider needs one.** The setups above store nothing on the device and identify nobody, so they need no consent banner under the ePrivacy rules on storage, and `none` needs nothing.
- **The shell has the consent component anyway,** off by default, because ads will need it ([ADR 0006](0006-ads-in-an-isolated-origin.md)), and a provider configured to store anything would too.
- **When consent is needed, nothing loads before it's given.** Refusing is as easy as accepting, the choice is remembered on the device, and it can be changed from the footer.
- **Every app has a short privacy note,** linked from the footer, saying in plain words what is and isn't sent. It's true by construction: it's generated from the app's configuration.
- **Global Privacy Control and Do Not Track are honoured:** with either set, analytics is off.

### Changing any of this

A pull request that touches the adapter, a provider's options, the policy builder or the consent component is in the full review tier ([ADR 0004](0004-ci-deploys-and-review-tiers.md)). Choosing a provider for an app is the owner's decision, recorded in that app's configuration.

## Alternatives considered

- **No analytics at all:** the strongest promise, and no way to know which formats or features people use.
- **Each app wiring its own provider:** flexible, with four places where a default capture could slip in.
- **A general `track()` function:** convenient, and the first step to sending something that came from a file.
- **A consent banner in every app regardless:** it asks permission for something that isn't happening, and teaches people to dismiss it.
- **Self-hosted analytics on the apps' own origin:** no third party, but a server to run, for apps that otherwise have none.

## Consequences

- **"Files never leave the device" stays checkable:** the policy names every origin, and the smoke test fails on any other request.
- **Cloudflare Web Analytics gives page views only.** An app that needs the SDK's events uses PostHog.
- **The legal reading of "no consent needed" is the owner's to confirm** for the countries served. The design makes the conservative choice easy: switch the banner on, or the provider off.
- **A provider's upgrade is a privacy change,** reviewed as one.

## Amendments

- **2026-11-19: PostHog serves every app,** by Huss's decision, through one PostHog project, with each event tagged `app` (`pdf`, `audio`, `image` or `video`). Cloudflare Web Analytics was considered and set aside: its beacon is a third-party script the apps would have to allow in `script-src`, where PostHog's client is bundled and served from each app's own origin, so `script-src` stays `'self'` and only `connect-src` opens, to PostHog's host. Cloudflare's automatic injection of its beacon is excluded for the apps' hosts in Cloudflare's dashboard, which is Huss's step.
  - **The adapter is `packages/analytics`** until `packages/app-shell` exists, which will take it in. It keeps the pdf app's locked-down options and its tested retry, adds `person_profiles: "never"`, drops referrers and campaign parameters, and strips every address to its path before anything is sent.
  - **Each app sends one page view per load,** explicitly, with the path only, because automatic page views stay off, **and its SDK's anonymous events,** from the editor's `onEvent`. All four SDKs have that hook. The pdf app also sends `component_error`, with no message, when its error boundary catches a crash.
  - **Without `VITE_POSTHOG_KEY`, nothing loads,** and `connect-src` stays `'self'`. The key is the same public key for every app, set in Workers Builds.
  - **Global Privacy Control and Do Not Track** switch it off before anything loads, as this record already said.
