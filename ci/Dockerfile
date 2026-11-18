# The browser test image: Playwright's, with the browsers and their system
# libraries preinstalled (docs/adr/0003). CI's per-app jobs run in it, and
# hm-in-image runs local browser tests in it. Nothing builds this file: CI
# reads the image from the FROM line, which is its only copy. Its tag must
# equal the Playwright version in the pnpm catalog, which
# hm-check-playwright-image checks.
FROM mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579
