# 0001. One public repository for the four editor apps, and its layout

- **Status:** Accepted
- **Date:** 2026-11-18

## Context

There are four editor apps, for PDF, audio, image and video files. Each is a thin shell around one SDK of the `@hussmartinez` family, and each lived in its own private repository: `pdf-editor`, `audio-editor`, `image-editor` and `video-editor`.

The four repositories had grown apart while solving the same problems:

- **The same code, written four times:** an error boundary, a theme built with ui's `createTheme`, a Content Security Policy, a `_headers` file, a Vite plugin that self-hosts the SDK's assets, and a Playwright smoke test.
- **Different answers to the same question.** The four policies differ in `default-src`, in `Permissions-Policy` and in cache headers, with no reason behind the differences. Vite is at major 7 in two apps and 8 in two; the React plugin and wrangler versions differ too.
- **No continuous integration.** Private repositories pay for GitHub Actions minutes, so every check ran on one machine, by hand.
- **Shared features are coming:** a common header and footer, analytics, a consent banner, a guard against losing unsaved edits, and later ads. Each would be built four times.

## Decision

### One repository, public

The four apps move to this repository, `editor-apps`, which is public.

- **Public, so that CI is free** and runs on every pull request ([ADR 0004](0004-ci-deploys-and-review-tiers.md)). The SDKs are already open source, and the apps add little to them.
- **No secrets in the repository,** now or in its history. Cloudflare credentials stay in Workers Builds. An analytics key is a public client key, and comes from a build variable ([ADR 0005](0005-analytics-and-consent.md)).
- **Fresh history.** The old repositories' histories are not imported: they were written as private, and hold host paths, runner names and account details. Each app arrives as one import commit, whose message names the private repository and the commit it came from, without a link, such as `Imported from the private pdf-editor repository at 39eb96f`.
- **Everything imported is reviewed as public text first:** READMEs, next-step notes, comments and fixtures. Machine paths, credential file locations, self-hosted runner details and Cloudflare Access policy names don't come along.
- **The old repositories are archived, not deleted,** once this repository deploys all four apps. They stay private.
- **The old widget code is not carried over.** Each old repository still has a frozen `packages/widget` and an embedding example, which the SDKs replaced.

### Layout

```
apps/
  pdf/  audio/  image/  video/    one app each
    src/            main.tsx, App.tsx, app.config.ts
    public/         favicon and other static files
    e2e/            the app's own smoke test
    index.html  vite.config.ts  wrangler.jsonc  package.json
  ads/                            later: the ad frame (ADR 0006)
packages/
  app-shell/        header, footer, skip link, main landmark, error boundary,
                    theme, consent, analytics, ad slot, leave guard, messages
  build-config/     Vite preset, CSP builder, _headers generator,
                    Playwright presets, the base tsconfig
docs/
  adr/              these records
  deploy.md         the Workers Builds settings
ci/Dockerfile       the pinned Playwright image
.github/            workflows/ci.yml, dependabot.yml, CODEOWNERS
biome.json  tsconfig.base.json  pnpm-workspace.yaml  package.json
.node-version  README.md  NEXT_STEPS.md
```

- **An app is a folder under `apps/`,** named for what it edits: `apps/pdf`, not `apps/pdf-editor`. Its Cloudflare Worker keeps its existing name, such as `pdf-editor`, so deployments carry on.
- **`app-shell` and `build-config` are private workspace packages.** They're never published. An app depends on them with `workspace:*`.
- **`app-shell` is what runs in the browser; `build-config` is what runs at build and test time.** Neither imports the other's kind of code, so a build helper never reaches a bundle.
- **An app's `src/` stays small:** it renders the shell around its SDK's editor, and declares its configuration. Anything two apps need goes to a package.

### Nothing is named after a domain

The domain the apps are served from is configuration, not identity.

- **No domain in the repository's name, in a package name, in a folder name, or in `app-shell`.** Package names use the repository's own scope, such as `@editor-apps/pdf` and `@editor-apps/app-shell`.
- **A domain appears only in an app's own configuration:** the route in its `wrangler.jsonc`, its canonical URL in `app.config.ts`, and the origins its Content Security Policy is built from.
- **Changing domain is then one configuration change per app,** with no rename and no change to shared code. A check in CI fails if a domain appears outside those files.

### Versions

- **Node 24,** from `.node-version`. **pnpm 12.18.0,** from `packageManager`.
- **Shared tools are pinned once,** in the pnpm catalog of `pnpm-workspace.yaml`: React, Vite and its React plugin, wrangler, TypeScript, Biome and Playwright. Packages refer to them with `catalog:`.
- **Each app pins its own SDK exactly,** and moves to a new version in its own pull request.
- **One copy of `sdk-core`, `ui` and React in each app's bundle,** checked per app by `pnpm check:single-copy`. Two copies of ui in one page break its providers.
- **One version of ui across the repository is the aim, not yet the rule.** Today the SDKs need different ui minors, which a `0.x` caret range keeps apart: pdf-sdk 0.4.0 needs `^0.8.0`, image-sdk 0.6.0 needs `^0.10.0`, video-sdk 0.1.2 needs `^0.7.0`, and audio-sdk 0.5.0 has no editor and so no ui. Until they converge:
  - each app installs the ui version its SDK needs;
  - `app-shell` lists ui, `sdk-core` and React as peer dependencies, so it uses the app's copy, and it uses only what every one of those ui versions has;
  - nobody forces a version with an override, which would run an SDK against a ui it wasn't tested with.
- **Supply-chain settings** are the SDK family's: install scripts blocked unless allowlisted, a one-day minimum release age except for `@hussmartinez/*`, and no trust downgrades.

## Alternatives considered

- **Keeping four repositories, with a shared package published to npm:** every shell change would need a release and four upgrade pull requests, and the four policies and toolchains would keep drifting between upgrades.
- **A private monorepo:** it would fix the duplication, but not the cost of CI, which is why checks ran by hand.
- **Importing the full histories:** it keeps blame, at the price of publishing history that was written as private and auditing all of it for secrets and personal details. The archived repositories keep that history.
- **Naming the repository after the domain:** the domain may change, and a rename would then ripple through package names and imports.
- **Forcing one ui version now with a pnpm override:** it satisfies the rule on paper and breaks an SDK's stated requirement.

## Consequences

- **One change reaches four apps,** for the shell, the policy and the tooling. A mistake reaches four apps too, which the review tiers in [ADR 0004](0004-ci-deploys-and-review-tiers.md) answer.
- **The apps' source becomes public.** That's a decision that can't be undone once made: anything pushed must be fit to publish.
- **`app-shell` is limited to what the oldest ui in use offers,** until the SDKs converge on one minor. Converging is tracked in `NEXT_STEPS.md`.
- **A domain change is configuration only.**
- **The repository needs a licence** before the apps are imported. Without one, the code is public but all rights are reserved.

## Amendments

- **2026-11-18, with the scaffold:** the single-copy check is named as the repository's own, `pnpm check:single-copy`. `hm-check-single-copy` checks a whole lockfile, and can't allow apps to differ from each other.
- **2026-11-19:** the repository moved from the owner's account to the `ie-huss-martinez` organisation, as `ie-huss-martinez/editor-apps`, beside the SDKs. Its name and everything in it stay the same; GitHub redirects the old address.
- **2026-11-19, ui convergence:** every SDK now needs ui `^0.15.0`, and every app installs ui 0.15.0 and sdk-core 0.4.4. One version of ui and of sdk-core across the apps is now the rule, not only the aim: `pnpm check:single-copy` also fails when the apps bundle different versions of either, since `app-shell` runs on each app's copy. `app-shell`'s ui range is `>=0.15.0 <0.16.0`, so it may use all of ui 0.15, and the limit to the oldest ui in use ends. An SDK upgrade that needs a new ui minor now moves every app's ui in the same pull request.
- **2026-11-20, ui and sdk-core in the catalog:** both are pinned once, in the pnpm catalog of `pnpm-workspace.yaml`, and every app and `app-shell`'s development copy use `catalog:`. A ui or sdk-core upgrade is one line, and moves every app. `pnpm check:single-copy` stays, as a guard against an app pinning its own. Each app still pins its own SDK exactly, and moves it on its own schedule within the catalog's ui.
