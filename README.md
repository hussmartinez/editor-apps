# editor-apps

Four browser-only editors, for PDF, audio, image and video files, in one repository. Files never leave the device.

Each app is a thin shell around an editor SDK of the [`@hussmartinez`](https://www.npmjs.com/org/hussmartinez) family: the SDK opens, edits and exports; the app adds its header, theme, response headers and deployment.

> Status: being set up. The workspace, its tooling and CI are here; the apps are moving in from their own repositories, one pull request each.

## Layout

| Path                     | What it holds                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/<app>/`            | One app each: `pdf`, `audio`, `image` and `video`, arriving one pull request at a time                                                               |
| `packages/build-config/` | Build and test helpers: the response headers and Content Security Policy, the Vite plugin, and the repository's own checks. Private, never published |
| `packages/analytics/`    | Anonymous analytics through PostHog, shared by the four apps: a page view per load and the SDKs' events. Private, never published                    |
| `packages/app-shell/`    | Planned: the page around every editor                                                                                                                |
| `docs/adr/`              | The decisions behind the repository                                                                                                                  |
| `docs/deploy.md`         | How the apps deploy, and the settings that live outside the repository                                                                               |
| `ci/Dockerfile`          | The pinned Playwright image for browser tests                                                                                                        |

## Develop

Use Node 24. pnpm switches to the version pinned in `package.json` by itself.

```sh
pnpm install
pnpm verify
```

`pnpm verify` runs everything CI runs without a browser:

| Step                                        | Script                        |
| ------------------------------------------- | ----------------------------- |
| Format and lint, with Biome                 | `pnpm lint`                   |
| Types                                       | `pnpm typecheck`              |
| Unit tests, with Vitest                     | `pnpm test`                   |
| One copy of each shared package in each app | `pnpm check:single-copy`      |
| No domain outside app configuration         | `pnpm check:domains`          |
| Playwright pinned to the image's version    | `pnpm check:playwright-image` |

CI also builds each app a change affects, checks that it would deploy, and runs its smoke test in the pinned image. `pnpm affected <base>` prints which apps those are. To run an app's smoke test locally, build it, then run `pnpm --filter @editor-apps/<app> test:e2e`, which needs Docker.

## Rules

- **Nothing is named after a domain.** A domain appears only in an app's `wrangler.jsonc` and `src/app.config.ts`.
- **No secrets, ever.** The repository is public, and deploy credentials exist only in Cloudflare.
- **Shared tools are pinned once,** in the catalog of `pnpm-workspace.yaml`. Each app pins its own SDK exactly.
- **Test what the app adds, not what its SDK does** ([ADR 0003](docs/adr/0003-testing-and-playwright.md)).
- **Pull requests are small, with a Conventional Commit title,** and are squash-merged once the `ci` check is green. See [NEXT_STEPS.md](NEXT_STEPS.md) for what's planned.

## License

[Apache-2.0](LICENSE). See [NOTICE](NOTICE).
