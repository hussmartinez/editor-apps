import { readFile } from "node:fs/promises";
import {
  expect,
  expectSdkAssets,
  expectSecurityHeaders,
  test,
} from "@editor-apps/build-config/playwright";
import { appConfig } from "../src/app.config.ts";
import { blankPdf } from "./fixture.ts";

// The `problems` fixture fails either test on a console error, a policy
// violation, a failed response or a request to another origin. The local
// build has no analytics key, so it sends nothing. A deployment may have
// one: its events are answered in the browser, and never reach the provider.
test.use({ analyticsOrigins: [appConfig.analyticsHost] });

test("the page is served with its headers, and has the shell's landmarks", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const headers = response?.headers() ?? {};
  expectSecurityHeaders(headers);
  expect(headers["content-security-policy"]).toContain("worker-src 'self'");
  // connect-src allows this origin, and the analytics host only when the build has a key.
  const connect = /connect-src ([^;]*)/.exec(headers["content-security-policy"] ?? "")?.[1] ?? "";
  const sources = connect.split(" ");
  expect(sources).toContain("'self'");
  for (const source of sources) {
    expect(["'self'", new URL(appConfig.analyticsHost).origin]).toContain(source);
  }

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
