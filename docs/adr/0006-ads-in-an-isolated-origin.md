# 0006. Ads only in a sandboxed frame from another origin

- **Status:** Accepted; the slot's placeholder superseded by [ADR 0007](0007-the-ad-slot-contract.md)
- **Date:** 2026-11-18

## Context

The apps are free, and may carry ads later. Ad code is the least trustworthy code a page can run: it comes from third parties, changes without notice, loads more scripts from more origins, and sets cookies. An editor's page holds the user's files in memory.

- **An ad script in the editor's origin could read the open file,** through the same DOM and the same JavaScript realm.
- **The editors' Content Security Policy allows no other origin** today. Ad networks need many, and can't list them in advance.
- **Ads need consent** in the EEA and the UK, which the editors otherwise don't ([ADR 0005](0005-analytics-and-consent.md)).

Ads haven't started. This record decides their shape first, so the shell and the policy have the right place for them.

## Decision

### Ads never run in an editor's origin

- **An ad is shown only inside an `<iframe>`** whose document comes from a separate origin, served by its own app, `apps/ads`.
- **That origin is a different site from the editors',** not only a different subdomain of the same site, so that browsers partition its storage and cookies from the editors' and it can't share theirs. Which hostname that is belongs to configuration ([ADR 0001](0001-one-repository-and-its-layout.md)).
- **The frame is sandboxed:** `sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"`. `allow-same-origin` lets the frame keep its own origin, which ad networks need, and is safe only because that origin is never an editor's. It never gets `allow-top-navigation`, `allow-forms`, `allow-downloads` or `allow-modals`, and its `allow` attribute grants no feature.
- **The editor's policy gains exactly one entry:** `frame-src` with the ad frame's origin. `script-src`, `connect-src` and `img-src` don't change. The ad networks' origins are in the ad frame's own policy, never in an editor's.
- **The frame's page may only be framed by the editors:** its own `frame-ancestors` lists them.

### What crosses the boundary

- **Into the frame, in its URL:** which app and which slot, and the consent choice. Nothing about the user's file, and nothing that identifies a person.
- **Out of the frame, by `postMessage`:** only "an ad is shown" or "no ad", so the shell can collapse an empty slot. The shell checks the message's origin and its shape, and ignores anything else.
- **Nothing else.** The frame can't reach the editor's DOM, storage or memory, and the editor never reads the frame.

### The slot

- **`<AdSlot>` is part of the shell,** placed outside the editor's area, with a fixed size reserved so the page never jumps.
- **Until ads start, it renders nothing,** adds nothing to the policy, and `apps/ads` doesn't exist.
- **It never covers the editor,** never appears in a dialog, and never interrupts an export.
- **It's labelled as advertising,** for sighted users and for screen readers, and it's skipped by the skip link.
- **Without consent where consent is required, no frame is created.** An app without ads configured behaves as it does today.

### Consent

Ads are the reason the shell has a consent component. Where the law requires consent for ad storage and personalisation, the frame is created only after it's given, and the choice is passed to the ad network through the frame. Analytics doesn't change: it stays as [ADR 0005](0005-analytics-and-consent.md) has it, and never shares anything with the ad frame.

## Alternatives considered

- **Ad scripts in the editor's page:** the usual way, and it gives third-party code the user's open files and forces an open-ended policy.
- **A frame on a subdomain of the editors' own site:** isolated by origin, but the same site, so cookies and storage rules treat it as first-party to the editors. A separate site removes the question.
- **A frame with `srcdoc` or a `blob:` URL:** it inherits the editor's origin unless sandboxed without `allow-same-origin`, and then ad networks reject it as an opaque origin.
- **No ads, ever:** not this record's decision to make. It keeps that option free: nothing is built until ads start.

## Consequences

- **Ad code can't read a user's file,** whatever it does, and the editors' policy stays almost closed.
- **Some ad formats won't work** in a sandboxed, cross-site frame: those that expand over the page, or need the top page's URL. That's accepted.
- **Revenue per view may be lower** than with first-party ad scripts, for the same reason.
- **One more app to deploy and one more origin to own,** when ads start. Until then this record costs one empty component.
- **The "separate site" requirement is a constraint on the choice of domain** for the ad frame, and should be settled before that domain is configured.
