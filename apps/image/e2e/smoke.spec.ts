import { readFile } from "node:fs/promises";
import {
  expect,
  expectSdkAssets,
  expectSecurityHeaders,
  test,
} from "@editor-apps/build-config/playwright";
import { gradientPng, pngSize } from "./fixture.ts";

// The `problems` fixture fails either test on a console error, a policy
// violation, a failed response or a request to another origin.

test("the page is served with its headers, and has the shell's landmarks", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const headers = response?.headers() ?? {};
  expectSecurityHeaders(headers);
  expect(headers["content-security-policy"]).toContain("worker-src 'self'");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\//);
});

test("an image opens and exports as a PNG file, with the SDK's workers from this origin", async ({
  page,
  problems,
}) => {
  await page.goto("/");

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Choose an image" }).first().click();
  await (await chooser).setFiles({
    name: "gradient.png",
    mimeType: "image/png",
    buffer: gradientPng(64, 48),
  });
  // The first render starts the SDK's worker.
  await expect(page.getByRole("img", { name: /^Edited image preview/ })).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole("button", { name: "Export", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export image" });
  await dialog.getByRole("button", { name: "Export", exact: true }).click();
  const save = dialog.getByRole("button", { name: "Download" });
  await expect(save).toBeVisible({ timeout: 30_000 });
  const saving = page.waitForEvent("download");
  await save.click();
  const png = await readFile(await (await saving).path());
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(pngSize(png)).toEqual({ width: 64, height: 48 });

  expectSdkAssets(problems, page, "@hussmartinez/image-sdk");
});
