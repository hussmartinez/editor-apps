# 0004. CI on every pull request, deploys in Workers Builds, and review tiers

- **Status:** Accepted
- **Date:** 2026-11-18

## Context

The four apps deployed with Cloudflare Workers Builds from their own repositories, by one shared convention, and had no continuous integration: checks ran by hand before a merge, because private repositories pay for Actions minutes.

This repository is public ([ADR 0001](0001-one-repository-and-its-layout.md)), so GitHub Actions is free. It also holds four deployed apps and code shared by all of them, so one merge can change four production sites. And a public repository takes pull requests from anyone, which changes what a workflow may safely do.

## Decision

### CI is the required check on `main`

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`. `main` is protected: the CI check must pass, the branch must be up to date, history is linear, and merges are squash merges with a Conventional Commit title.

- **Always:** install with the frozen lockfile, Biome, typecheck, unit tests, the check that each app bundles one copy of each shared package, `hm-check-playwright-image`, and the check that no domain appears outside app configuration.
- **Per app, when it's affected:** build, `wrangler deploy --dry-run`, and the smoke test in the pinned image ([ADR 0003](0003-testing-and-playwright.md)). Which apps are affected comes from the paths a change touches, as the next section says.
- **One summary job** depends on all the others and is the only required check, so a skipped per-app job doesn't block a merge and a failed one does.
- **Nightly:** every engine each app supports, on `main`.

### The workflow is written for a public repository

- **It never has secrets.** There are none to have: CI builds and tests, and deploys happen elsewhere. It never uses `pull_request_target`.
- **`permissions: contents: read`** at the top, and nothing wider in any job.
- **Actions are pinned to full commit SHAs,** with the version in a comment, and Dependabot updates them.
- **Pull requests from forks run the same jobs,** which is safe because the jobs hold nothing worth stealing. First-time contributors need approval before workflows run.
- **A concurrency group per branch** cancels superseded runs.
- **The container image is pinned by digest** in `ci/Dockerfile`.

### Deploys stay in Workers Builds

GitHub Actions never deploys. Each app has its own Worker, connected to this repository in Cloudflare's Workers Builds, with the same settings apart from the app's name:

| Setting                      | Value                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Root directory               | `/`                                                                          |
| Build command                | `pnpm --filter @editor-apps/<app> run build`                                 |
| Deploy command               | `pnpm --filter @editor-apps/<app> run deploy`                                |
| Build watch paths            | `apps/<app>/*`, `packages/*`, `pnpm-workspace.yaml`, the root `package.json` |
| Production branch            | `main`                                                                       |
| Non-production branch builds | off                                                                          |
| Build variables              | none, or the app's analytics key ([ADR 0005](0005-analytics-and-consent.md)) |

- **An app's `deploy` script only deploys,** with the wrangler version pinned in the catalog. It never builds: Workers Builds has just built.
- **The repository carries everything that differs:** the Worker's name and its route are in the app's `wrangler.jsonc`. `docs/deploy.md` holds this table and the manual fallback.
- **Cloudflare credentials exist only in Cloudflare.** Nothing in GitHub can deploy.
- **A merge to `main` deploys every app whose watch paths changed,** with no further gate. That's why `main` is protected and why the tiers below exist.
- **Watch paths include the root files a build reads, but not the lockfile:** `pnpm-workspace.yaml` and the root `package.json`. The next section says why.

### Which apps a change affects

An upgrade of one app's SDK must test and redeploy that app, and no other. Paths are enough to tell, with no reading of the lockfile's graph, because every app pins its SDK exactly: an upgrade always changes that app's own `package.json`.

| A change to                                                              | CI builds and tests                          | Workers Builds redeploys |
| ------------------------------------------------------------------------ | -------------------------------------------- | ------------------------ |
| `apps/<app>/*`                                                           | that app                                     | that app                 |
| `packages/*`, `pnpm-workspace.yaml`, the root `package.json`             | every app                                    | every app                |
| `biome.json`, `tsconfig.base.json`, `ci/*`, `.github/*`, `.node-version` | every app                                    | none                     |
| `pnpm-lock.yaml` alone                                                   | every app                                    | none                     |
| Documentation alone                                                      | none: the checks without a browser still run | none                     |

- **A lockfile-only change is a transitive update.** It's rare, so CI tests every app rather than work out which ones it reaches. Its merge redeploys nothing by itself: the reviewer starts the builds of the apps it affects, in Workers Builds.
- **One script decides, `affected-apps` in `build-config`,** with a test that an upgrade of one app's SDK selects only that app. It uses Node and git alone, so CI runs it before installing anything.
- **No build orchestrator, such as Turborepo, for now.** With four apps that each build in seconds, path rules do the job, and a task graph and a remote cache would be more to configure and trust than they'd save. It's worth another look when the roadmap's larger editors make builds slow.

### Review tiers

How much review a pull request gets depends on what it can break.

| Tier      | Pull requests                                                                                                                                             | Review                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Automatic | Dependabot updates of development tools and actions; documentation only; tests only                                                                       | Merged when CI is green                     |
| Short     | One app's own code or configuration                                                                                                                       | CI, and a short review of the diff          |
| Full      | Anything touching privacy, the Content Security Policy or other headers, analytics, consent, ads, `packages/`, the workflow, or the supply-chain settings | CI, and a full review against these records |

- **The tier comes from the paths changed,** not from the author's label. `CODEOWNERS` marks the paths of the full tier.
- **A Dependabot update of a runtime dependency is not automatic:** an SDK, ui, sdk-core, React or the analytics client ships to users. Dependabot opens one pull request per package, so an SDK's release is one pull request for its one app, in the short tier, or the full tier where the table says so. Only development tools are grouped.
- **Nobody merges their own pull request.** The author and the reviewer are different.
- **Automatic merges still deploy.** A documentation change outside the watch paths deploys nothing; a test-only change inside an app's folder rebuilds that app from the same source.

## Alternatives considered

- **Deploying from GitHub Actions:** one place for everything, but it puts Cloudflare credentials in a public repository's settings, within reach of a workflow mistake.
- **A manual approval before each deploy:** safer per deploy, and it turns every merge into two steps for a change CI and review already covered. A broken deploy is rolled back in Cloudflare.
- **Running every app's jobs on every pull request:** simpler, and four times the browser time for most changes.
- **One review tier for everything:** either too slow for a tooling bump or too light for a policy change.

## Consequences

- **Every change is checked the same way,** on a clean machine, before it can deploy.
- **A merge is a deploy.** The protection on `main` and the tiers are the only gates, so they must stay on.
- **Branch protection, the Dependabot auto-merge and the Workers Builds connections are settings outside the repository.** `docs/deploy.md` and `NEXT_STEPS.md` record them, since the code can't.
- **The path rules need care:** a wrong rule skips a test, and a wrong watch path skips a deploy. The script that applies them is unit-tested, and `docs/deploy.md` repeats the watch paths for the dashboard.

## Amendments

- **2026-11-18, with the scaffold:** the section "Which apps a change affects" was added, with the decision against a build orchestrator. The watch paths no longer include `pnpm-lock.yaml`, so that an SDK upgrade redeploys one app and a transitive update is redeployed by hand. The single-copy check is the repository's own, per app, because `hm-check-single-copy` checks a whole lockfile and the apps may differ from each other ([ADR 0001](0001-one-repository-and-its-layout.md)). Dependabot's one pull request per package is spelled out.
- **2026-11-19:** watch paths are written with `*`, as Cloudflare documents them, not `**`, and the commands name the apps' packages, as `docs/deploy.md` does. The repository moved to the `ie-huss-martinez` organisation; the Workers Builds connections point there.
