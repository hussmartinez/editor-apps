# 0003. Test the app, not the SDK; Playwright in one pinned image

- **Status:** Accepted, amended 2026-11-21
- **Date:** 2026-11-18

## Context

Each app is a thin consumer of an SDK that has its own unit, browser and end-to-end tests. The apps' test suites didn't reflect that:

- **Some repeat the SDK's tests.** One app has dozens of specs for editing features that are the SDK's. Another checks keyboard editing step by step, and the samples of the exported file.
- **They're slow and brittle for what they protect,** because they fail when an SDK changes its interface, which is the SDK's to test.
- **They ran on one machine.** Browser tests there need a pinned container image, because the host's own browsers aren't reliable.

What only the app can get wrong is small: its response headers, where it serves the SDK's assets, its shell, and whether the SDK is wired in at all.

## Decision

### The rule: don't test what the SDK already does

An app's tests cover only what the app adds.

| An app tests                                                                        | An app doesn't test                                             |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| The page loads with its Content Security Policy and other headers                   | Editing features: tools, undo, keyboard paths inside the editor |
| No policy violation, console error, failed response or request to another origin    | Pixels, pages or audio of the SDK's output                      |
| The SDK's assets load from the app's own self-hosted path                           | Formats and codecs the SDK supports                             |
| One minimal round trip: open a file, export, and get a valid file of the right type | The content of the exported file beyond its type                |
| The shell: header, footer, theme, error boundary, consent, ad slot, leave guard     | ui's components                                                 |
| Analytics events reach the configured provider, and nothing else does               | The SDK's event contents                                        |

- **The round trip proves the wiring,** not the feature: the worker starts under the policy, a file opens, and an export downloads. One fixture per app, as small as possible, generated in the test or committed when it can't be.
- **The existing suites are trimmed on import.** Tests of SDK behaviour are dropped, after checking that the SDK has an equivalent. One that doesn't is reported to the SDK's repository as a gap, not kept here.
- **A bug found in an app gets a test where the fault was:** here if the app's wiring caused it, in the SDK if the SDK did.

### Kinds of test

- **Unit tests,** with Vitest, for the packages' pure logic: the CSP builder, the `_headers` generator, the analytics adapter, the consent state. They run in Node.
- **Smoke tests,** with Playwright, one file per app in `apps/<app>/e2e/`, against the app's **built** output served with its production headers. They share a preset from `build-config` that fails a test on any console error, policy violation, failed response or foreign request, so no app can forget those checks.
- **Screenshot tests** of the shell's states, in light and dark, in Chromium only ([ADR 0002](0002-app-shell-and-shared-look.md)). The editor's own area is masked: it's the SDK's.
- **Accessibility:** the smoke test runs axe on the shell's states.

### Playwright

- **One version, in the pnpm catalog, equal to the tag of the image in `ci/Dockerfile`.** `hm-check-playwright-image` fails the build when they differ.
- **Browser tests always run in that image.** In CI, the job runs in it as a `container:` job. Locally, `pnpm test:e2e` goes through `hm-in-image`, which needs Docker and no browser on the host. So a screenshot taken locally matches CI's.
- **Each app declares the browsers it supports** in its `app.config.ts`, since the SDKs differ: a codec or an API may be missing in one engine.
- **Pull requests run the smoke tests in Chromium.** Every engine an app supports runs nightly, and on any change to `packages/`.
- **A job runs only for an app that changed,** or when `packages/`, the lockfile or the tooling changed ([ADR 0004](0004-ci-deploys-and-review-tiers.md)).
- **No retries, and no test is skipped silently.** A flaky test is fixed or removed, with the reason in the pull request.

## Alternatives considered

- **Keeping each app's full suite:** the most coverage on paper, most of it duplicated, at the cost of slow CI and of failures that belong to another repository.
- **No browser tests in the apps, trusting the SDKs:** the apps' own mistakes, such as a policy that blocks the worker, show only in a browser against the built output.
- **Playwright's browsers installed on the runner:** faster to start, but screenshots and codec support then differ between CI and local runs.
- **All engines on every pull request:** three times the browser time for failures that are almost always the SDK's.

## Consequences

- **CI is fast,** and a red check means the app is broken, not that an SDK changed a label.
- **An SDK regression can reach an app untested here.** The SDK's own suite and the round trip are the guard, and upgrades are one pull request per app.
- **Local browser tests need Docker.**
- **Trimming the suites is a judgement** made once per app, recorded in that app's import pull request with the list of what was dropped and why.

## Amendments

- **2026-11-21, strict screenshots and the image guard:** the shell's screenshots are compared with sdk-config's `visualComparison` (sdk-core ADR 0054): a pixel differs when its colour is more than one level from the baseline's, and none may. Until then they used Playwright's default threshold of 0.2 by accident, under which a colour token one step off passed. The committed baselines pass the strict comparison in the image unchanged. `smokeConfig` also has sdk-config's `require-image` global setup, so browser tests refuse to start outside the image and CI.
