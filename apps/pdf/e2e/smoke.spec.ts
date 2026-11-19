import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  expect,
  expectSdkAssets,
  expectSecurityHeaders,
  test,
} from "@editor-apps/build-config/playwright";
import { loadEnv } from "vite";
import { appConfig } from "../src/app.config.ts";
import { blankPdf } from "./fixture.ts";

/**
 * The analytics origin the build under test allows, or `undefined` for a
 * build without a key. For the local build, it's read from the same
 * variables Vite builds with. A deployment's build variables aren't visible
 * from here, so whoever tests one says it has a key with
 * `SMOKE_ANALYTICS=on` (and `VITE_POSTHOG_HOST` for another host).
 */
function analyticsOrigin(): string | undefined {
  const env = process.env.SMOKE_BASE_URL
    ? {
        VITE_POSTHOG_KEY: process.env.SMOKE_ANALYTICS === "on" ? "set" : "",
        VITE_POSTHOG_HOST: process.env.VITE_POSTHOG_HOST,
      }
    : loadEnv("production", fileURLToPath(new URL("..", import.meta.url)), "VITE_");
  if (!env.VITE_POSTHOG_KEY) return undefined;
  return new URL(env.VITE_POSTHOG_HOST || appConfig.analyticsHost).origin;
}

// The `problems` fixture fails either test on a console error, a policy
// violation, a failed response or a request to another origin. The local
// build has no analytics key, so it sends nothing. A deployment may have
// one: its events are answered in the browser, and never reach the provider.
// The same origin the header test expects, which may be a custom host.
test.use({ analyticsOrigins: [analyticsOrigin() ?? appConfig.analyticsHost] });

test("the page is served with its headers, and has the shell's landmarks", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const headers = response?.headers() ?? {};
  expectSecurityHeaders(headers);
  expect(headers["content-security-policy"]).toContain("worker-src 'self'");
  // connect-src allows this origin, plus the analytics host only when the build has a key.
  const connect = /connect-src ([^;]*)/.exec(headers["content-security-policy"] ?? "")?.[1];
  const analytics = analyticsOrigin();
  expect(connect?.split(" ")).toEqual(analytics ? ["'self'", analytics] : ["'self'"]);

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\//);
});

test("a PDF opens and downloads as a PDF file, with the SDK's assets from this origin", async ({
  page,
  problems,
}) => {
  await page.goto("/");

  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({ name: "blank.pdf", mimeType: "application/pdf", buffer: blankPdf() });
  // The app's own status line, fed by the SDK's change events.
  await expect(page.locator("header output")).toHaveText("blank.pdf · 1 page");

  const saving = page.waitForEvent("download");
  await page
    .getByRole("toolbar", { name: "PDF tools" })
    .getByRole("button", { name: "Download" })
    .click();
  const pdf = await readFile(await (await saving).path());
  expect(pdf.toString("ascii", 0, 5)).toBe("%PDF-");
  expect(pdf.byteLength).toBeGreaterThan(100);

  expectSdkAssets(problems, page, "@hussmartinez/pdf-sdk");
});
