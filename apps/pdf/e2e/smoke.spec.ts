import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { expect, expectSecurityHeaders, test } from "@editor-apps/build-config/playwright";
import { blankPdf } from "./fixture.ts";

/** The installed SDK's version, which names the path its assets must load from. */
const { version: sdkVersion } = createRequire(import.meta.url)(
  "@hussmartinez/pdf-sdk/package.json",
) as { version: string };

// The `problems` fixture fails either test on a console error, a policy
// violation, a failed response or a request to another origin. The build
// under test has no analytics key, so no other origin is allowed at all.

test("the page is served with its headers, and has the shell's landmarks", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const headers = response?.headers() ?? {};
  expectSecurityHeaders(headers);
  expect(headers["content-security-policy"]).toContain("worker-src 'self'");
  expect(headers["content-security-policy"]).toContain("connect-src 'self';");

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

  // Every SDK asset comes from this origin, under the installed SDK's version.
  const base = `${new URL(page.url()).origin}/pdf-sdk/${sdkVersion}/`;
  const assets = problems.requests.filter((url) => url.includes("/pdf-sdk/"));
  expect(assets.length).toBeGreaterThan(0);
  for (const asset of assets) expect(asset.startsWith(base), asset).toBe(true);
});
