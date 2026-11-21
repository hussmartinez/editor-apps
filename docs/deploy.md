# Deploying the apps

Each app is a Cloudflare Worker that serves static assets. Cloudflare's [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) deploys an app when a push to `main` changes one of its watch paths. GitHub Actions never deploys, and nothing in GitHub holds a Cloudflare credential ([ADR 0004](adr/0004-ci-deploys-and-review-tiers.md)).

## Workers Builds settings

Every app's Worker is connected to this repository with the same settings. Only `<app>` differs: the app's folder under `apps/`, such as `pdf`.

| Setting                      | Value                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Git repository               | `ie-huss-martinez/editor-apps`                                                                                           |
| Root directory               | `/`                                                                                                                      |
| Build command                | `pnpm --filter @editor-apps/<app> run build`                                                                             |
| Deploy command               | `pnpm --filter @editor-apps/<app> run deploy`                                                                            |
| Build watch paths            | `apps/<app>/*`, `packages/*`, `pnpm-workspace.yaml`, `package.json`                                                      |
| Production branch            | `main`                                                                                                                   |
| Non-production branch builds | off                                                                                                                      |
| Build variables              | `VITE_POSTHOG_KEY`, PostHog's public project key, the same for every app ([ADR 0005](adr/0005-analytics-and-consent.md)) |

- **The Worker's name in the dashboard is the `name` in the app's `wrangler.jsonc`,** such as `pdf-editor`. It isn't the folder's name.
- **Node and pnpm need no variables.** The build image reads Node 24 from `.node-version` and pnpm from `packageManager` in `package.json`, and installs the locked dependencies before the build command.
- **An app's `deploy` script only deploys,** with the wrangler version pinned in the pnpm catalog. Workers Builds has just built.
- **Watch paths use `*`, not `**`.** Cloudflare's watch paths take `*` at the start or end of a rule, matching any characters, slashes included; `**` isn't documented. `package.json` and `pnpm-workspace.yaml` are static paths from the repository's root, so they match only the root files.
- **The app's route is in its `wrangler.jsonc`.** The domain appears there and in the app's `src/app.config.ts`, and nowhere else ([ADR 0001](adr/0001-one-repository-and-its-layout.md)).

## What redeploys

| A merge that changes                                           | Redeploys |
| -------------------------------------------------------------- | --------- |
| `apps/<app>/*`, which includes an upgrade of the app's SDK     | that app  |
| `packages/*`, `pnpm-workspace.yaml` or the root `package.json` | every app |
| `pnpm-lock.yaml` alone                                         | nothing   |
| Documentation, CI or tooling configuration                     | nothing   |

**Large pushes build every app.** Cloudflare ignores the watch paths for a push with no changed files, with 3,000 changed files or more, or with 20 commits or more: it then builds every app. A squash merge pushes one commit, so only a change of that size, documentation included, does it, and it redeploys each app from the same source.

**A lockfile-only merge deploys nothing by itself.** It's a transitive update: CI has tested every app with it, and the reviewer starts a build of each app in the Workers Builds dashboard, so production runs what `main` locks.

## Checks before merging

CI runs these on every pull request. To run them locally, with Node 24:

```sh
pnpm install --frozen-lockfile
pnpm verify
```

`pnpm verify` runs Biome, the typecheck, the unit tests and the repository's own checks. Each app's browser test runs in the pinned image of `ci/Dockerfile`, which needs Docker and a build of the app:

```sh
pnpm --filter @editor-apps/<app> run build
pnpm --filter @editor-apps/<app> run test:e2e
```

That tests in Chromium. For every browser the app supports, as CI runs nightly, set `SMOKE_ENGINES=all`. `hm-in-image` passes it into the image, with `SMOKE_BASE_URL` and `SMOKE_ANALYTICS`:

```sh
SMOKE_ENGINES=all pnpm --filter @editor-apps/<app> run test:e2e
```

Browser tests refuse to start outside the image and CI: on a host, Docker's network changes make them fail at random (sdk-core ADR 0049). To debug with a headed browser on your machine, set `HM_ALLOW_HOST_BROWSER=1` for that one run, never to check a change.

To check a deployment instead of the local build, set `SMOKE_BASE_URL` to the app's address, the same way. No build or server is needed then. If the deployment has an analytics key, its events are answered in the browser by the test and never reach the provider; add `SMOKE_ANALYTICS=on` so the test expects the analytics host in the app's policy, which it can't see from here.

```sh
SMOKE_BASE_URL=https://<the app's address> pnpm --filter @editor-apps/<app> run test:e2e
```

## Deploying by hand

Workers Builds is the normal path. As a fallback, build and deploy one app from a checkout, with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment of that one shell. Don't write them to a file in the repository.

```sh
pnpm --filter @editor-apps/<app> run build
pnpm --filter @editor-apps/<app> run deploy
```

Add `--dry-run` to the deploy to check the configuration and the assets without credentials. It uploads nothing.

## Settings outside the repository

These can't be read from the code, so they're recorded here.

- **Branch protection on `main`:** the `ci` status check is required and must be up to date; history is linear; merges are squash merges; force pushes and deletions are off.
- **Actions:** workflows from first-time contributors need approval; the default token is read-only.
- **Dependabot:** version updates are on. Only development tools, actions, documentation and tests merge automatically on a green `ci`.
- **Workers Builds:** one connection per app, with the settings above.
