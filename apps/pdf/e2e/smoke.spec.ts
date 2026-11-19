import { readFile } from "node:fs/promises";
import {
  analyticsOriginUnderTest,
  expect,
  expectAnalytics,
  expectPolicyOrigins,
  expectSdkAssets,
  expectSecurityHeaders,
  expectShellLook,
  expectThirdPartyLicenses,
  test,
} from "@editor-apps/build-config/playwright";
import { appConfig } from "../src/app.config.ts";
import { blankPdf } from "./fixture.ts";

// The `problems` fixture fails either test on a console error, a policy
// violation, a failed response or a request to another origin.

// With an analytics key, the app sends a page view and its SDK's events.
// They're answered in the browser and never reach the provider.
const analytics = analyticsOriginUnderTest(appConfig.analyticsHost);
test.use({ analyticsOrigins: [analytics ?? appConfig.analyticsHost] });

test("the page is served with its headers, and has the shell's landmarks", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const headers = response?.headers() ?? {};
  expectSecurityHeaders(headers);
  expect(headers["content-security-policy"]).toContain("worker-src 'self'");
  // Only the origins the app's configuration allows: PostHog's only with a key.
  expectPolicyOrigins(headers, "script-src", []);
  expectPolicyOrigins(headers, "connect-src", analytics ? [analytics] : []);

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\//);
  await expectThirdPartyLicenses(page, "@hussmartinez/pdf-sdk");
});

test("a PDF opens and downloads as a PDF file, with the SDK's assets from this origin", async ({
  page,
  problems,
}) => {
  // A query and a fragment, which analytics must never send.
  await page.goto("/?smoke=private#fragment");

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
  await expectAnalytics(problems, analytics, appConfig.app);
});

test("the shell looks as committed, in light and dark, and skips to the editor", async ({
  page,
}) => {
  await expectShellLook(page);
});
