# Next steps

What's planned, in order. One pull request at a time. The decisions behind each step are in `docs/adr/`.

## Done

- [x] **The decision records** (2026-11-18): `docs/adr/0001` to `0006`.
- [x] **The scaffold** (2026-11-18): the workspace and its pinned tools, `packages/build-config` with the response headers, the Vite plugin and the repository's checks, the CI workflow, Dependabot and the code owners.

## Before the first app

- [x] **A licence** (2026-11-19): Apache-2.0, in `LICENSE`, with the copyright in `NOTICE`.
- [x] **Branch protection on `main`,** with `ci` as the required check (2026-11-18).

## Import the apps

One pull request per app, each as one import commit that names the private repository and the commit it came from.

- [x] **audio** (2026-11-19)
- [x] **video** (2026-11-19)
- [x] **image** (2026-11-19)
- [x] **pdf** (2026-11-19)

For each app:

- **Review every file as public text first.** Machine paths, credential file locations, runner details and Cloudflare Access policy names don't come along.
- **Leave the old widget code behind.**
- **Move it onto `build-config`:** the `editorApp` Vite plugin replaces the app's own `_headers`, headers code and asset copying.
- **Trim its tests to the rule in ADR 0003,** and list in the pull request what was dropped and why.
- **It must build, pass its smoke test in the pinned image, and pass `wrangler deploy --dry-run`.**

After the imports, the reviewer points each Worker's Workers Builds connection at this repository, and the old repositories are archived.

## Then

- [x] **`packages/app-shell`:** the shared page, error boundary and messages in all four apps, with screenshot tests of its header (ADR 0002).
- [ ] **The leave guard,** in the shell: the browser's own warning before leaving with unsaved edits.
- [ ] **The ad slot,** in the shell: a fixed-size placeholder now; the isolated frame of ADR 0006 when ads start, which needs a domain on a separate site first.

## One ui version for every app

Each app installs the ui version its SDK needs, and today those differ: the pdf, image and video SDKs each require a different `0.x` minor. One copy per app is the rule; one version for the repository is the aim (ADR 0001).

- [ ] **When the SDKs converge on one ui minor,** move ui and sdk-core into the pnpm catalog, and drop the limit that `app-shell` may use only what the oldest ui has. The SDKs' maintainers are moving them to the current minor. It doesn't block the steps above.
