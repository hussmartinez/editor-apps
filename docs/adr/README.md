# Architecture decision records

Significant decisions about this repository, one per file. A record is never rewritten once accepted: a later record supersedes it, and says so.

| Record | Decision |
| --- | --- |
| [0001](0001-one-repository-and-its-layout.md) | One public repository for the four editor apps, and its layout |
| [0002](0002-app-shell-and-shared-look.md) | One app shell, so the four apps look and behave alike |
| [0003](0003-testing-and-playwright.md) | Test the app, not the SDK; Playwright in one pinned image |
| [0004](0004-ci-deploys-and-review-tiers.md) | CI on every pull request, deploys in Workers Builds, and review tiers |
| [0005](0005-analytics-and-consent.md) | Anonymous analytics through one adapter, and consent only where needed |
| [0006](0006-ads-in-an-isolated-origin.md) | Ads only in a sandboxed frame from another origin |

Each record has a status, a date, the context, the decision, the alternatives considered and the consequences.
