# Next steps

What's planned, in order. One pull request at a time. The decisions behind each step are in `docs/adr/`.

## Done

- [x] **The decision records** (2026-11-18): `docs/adr/0001` to `0006`.
- [x] **The scaffold** (2026-11-18): the workspace and its pinned tools, `packages/build-config` with the response headers, the Vite plugin and the repository's checks, the CI workflow, Dependabot and the code owners.

## Before the first app

- [ ] **A licence.** The repository is public without one, so all rights are reserved. It's the owner's choice.
- [ ] **Branch protection on `main`,** with `ci` as the required check, as `docs/deploy.md` lists. It's a repository setting.

## Import the apps

One pull request per app, each as one import commit that names the private repository and the commit it came from.

- [ ] **audio,** then **video**, **image** and **pdf**.

For each app:

- **Review every file as public text first.** Machine paths, credential file locations, runner details and Cloudflare Access policy names don't come along.
- **Leave the old widget code behind.**
- **Move it onto `build-config`:** the `editorApp` Vite plugin replaces the app's own `_headers`, headers code and asset copying.
- **Trim its tests to the rule in ADR 0003,** and list in the pull request what was dropped and why.
- **It must build, pass its smoke test in the pinned image, and pass `wrangler deploy --dry-run`.**

The first import also adds what needs an app to be tested: the Playwright smoke preset in `build-config`, and the `test:e2e` script that CI's per-app job calls.

After the imports, the reviewer points each Worker's Workers Builds connection at this repository, and the old repositories are archived.

## Then

- [ ] **`packages/app-shell`:** the shared page, theme, error boundary and messages in all four apps, with screenshot tests (ADR 0002).
- [ ] **The analytics adapter** (ADR 0005). The pdf app keeps PostHog; the others send nothing until the owner chooses.
- [ ] **The leave guard:** a warning before leaving with unsaved edits.
- [ ] **The ad frame** (ADR 0006), when ads start. It needs a domain on a separate site first.

## One ui version for every app

Each app installs the ui version its SDK needs, and today those differ: the pdf, image and video SDKs each require a different `0.x` minor. One copy per app is the rule; one version for the repository is the aim (ADR 0001).

- [ ] **When the SDKs converge on one ui minor,** move ui and sdk-core into the pnpm catalog, and drop the limit that `app-shell` may use only what the oldest ui has. The SDKs' maintainers are moving them to the current minor. It doesn't block the steps above.
