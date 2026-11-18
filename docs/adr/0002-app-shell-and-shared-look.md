# 0002. One app shell, so the four apps look and behave alike

- **Status:** Proposed
- **Date:** 2026-11-18

## Context

Each app wraps its SDK's editor in a page of its own. The four pages were written separately, and they differ in ways nobody chose:

- **Structure:** some have a header and a tagline, some only the editor. Not all have exactly one `<h1>`, a `<main>` landmark and a skip link.
- **Theme:** each has its own brand colours on ui's tokens, built in its own way: a virtual stylesheet in one app, a build script in another.
- **Failure:** each has its own error boundary, with its own wording.
- **Text:** shell strings are written inline in some apps, and in a message catalogue in others.

People who use one editor should recognise the next. And features that are coming, such as consent, analytics, a leave guard and an ad slot, belong around the editor, the same way in every app.

## Decision

`packages/app-shell` provides the page around the editor. Each app renders `<AppShell>` with its SDK's editor inside, and passes its configuration.

### What the shell owns

- **The page's structure:** a skip link to the editor, a header with the app's name as the only `<h1>`, the `<main>` landmark that holds the editor at full height, and a footer.
- **The error boundary:** a crashed editor is replaced by a short explanation and a way to reload, never a blank page or a stack trace. It says plainly that unsaved edits are lost and that the file on the device is untouched.
- **The theme:** one set of brand tokens on ui's, with `createTheme`, in light and dark, following the system. Every app has the same look, apart from an accent colour it may set. The build writes the theme as a static stylesheet with `themeToCss`, so pages need no inline `<style>` and the Content Security Policy needs no nonce.
- **ui's providers,** once: messages and the announcer.
- **Consent, analytics and the ad slot,** as [ADR 0005](0005-analytics-and-consent.md) and [ADR 0006](0006-ads-in-an-isolated-origin.md) decide.
- **The leave guard:** a warning before leaving the page with unsaved edits. The app tells the shell whether there are any, from its SDK's change events.
- **The shell's text,** in a message catalogue built with sdk-core's `createMessages`, never inline. The header, the footer, the error boundary, the consent banner and the leave guard take their words from it.

### What an app owns

- **`app.config.ts`:** the app's name and tagline, its canonical URL, its accent colour, its analytics provider, the browsers it supports, and where its SDK's assets are served.
- **`App.tsx`:** the SDK's editor, with the props that SDK needs, inside the shell.
- **Anything specific to its file type,** such as accepted formats.

The shell never imports an SDK. It knows nothing about PDFs or audio: an app hands it a React node and a few callbacks.

### Rules for the shell

- **It's built from ui's components and tokens,** with plain CSS in its own cascade layer. It adds no styling library.
- **It uses ui, sdk-core and React as peer dependencies,** so it runs on each app's own copy ([ADR 0001](0001-one-repository-and-its-layout.md)).
- **It makes no network request and sets no cookie by itself.** Only the analytics adapter and the ad slot can, and only when an app configures them.
- **It meets WCAG 2.2 AA:** landmarks, one `<h1>`, a visible focus ring, a skip link, text from the catalogue, and no motion that ignores `prefers-reduced-motion`.
- **It contains no domain.** Links and URLs come from the app's configuration.
- **Errors shown to people come from a message catalogue by error code,** never from an error's `message`.

### Keeping the apps alike

Screenshot tests of the shell, in light and dark, run for every app against its built output ([ADR 0003](0003-testing-and-playwright.md)). They cover the shell's own states: the empty page, the error boundary and the consent banner. A change to the shell that alters one app's look alters four sets of screenshots in the same pull request, which is the point.

## Alternatives considered

- **A shared stylesheet only:** it aligns colours, and leaves structure, the error boundary and consent to be written four times.
- **Publishing the shell to npm:** useful to others only in theory, and it would put a release between a shell change and the apps.
- **Putting the shell into ui:** ui is the design system of the SDKs, and knows nothing about consent, analytics or ads, which are these apps' business.
- **Each app keeping its own brand:** four small brands for one family of tools, and four themes to keep at AA contrast.

## Consequences

- **A person moving between the editors finds the same page,** with the same header, footer, theme and wording.
- **Shell features are built once,** and an app gets them by upgrading nothing.
- **A shell bug is in four apps at once,** so shell changes get the fuller review tier and the screenshot tests.
- **An app can't restyle its page freely.** A need that the shell doesn't cover becomes a shell option, or a new record.
