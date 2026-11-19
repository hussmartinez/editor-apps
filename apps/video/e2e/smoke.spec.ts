import { readFile } from "node:fs/promises";
import {
  expect,
  expectSdkAssets,
  expectSecurityHeaders,
  test,
} from "@editor-apps/build-config/playwright";

/** One second of a test pattern and a tone, from FFmpeg's synthetic sources (make-fixture.sh). */
const fixture = new URL("./fixtures/clip.webm", import.meta.url);

// The `problems` fixture fails either test on a console error, a policy
// violation, a failed response or a request to another origin.

test("the page is served with its headers, and has the shell's landmarks", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const headers = response?.headers() ?? {};
  expectSecurityHeaders(headers);
  expect(headers["content-security-policy"]).toContain("worker-src 'self'");
  expect(headers["content-security-policy"]).toContain("media-src 'self' blob:");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\//);
});

test("a video opens and exports as a video file, with the SDK's workers from this origin", async ({
  page,
  problems,
}) => {
  await page.goto("/");

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Choose files" }).click();
  await (await chooser).setFiles({
    name: "clip.webm",
    mimeType: "video/webm",
    buffer: await readFile(fixture),
  });
  await expect(page.getByRole("listbox", { name: "Clips" }).getByRole("option")).toHaveCount(1);

  await page.getByRole("button", { name: "Export the video", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export the video" });
  await dialog.getByRole("button", { name: "Export", exact: true }).click();
  const download = dialog.getByRole("button", { name: /^Download/ });
  await expect(download).toBeEnabled({ timeout: 90_000 });
  const saving = page.waitForEvent("download");
  await download.click();
  const video = await readFile(await (await saving).path());

  // A WebM or MP4 file, with a video track. Only the type is checked: the
  // frames are video-sdk's to test.
  const webm = video.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  const mp4 = video.toString("ascii", 4, 8) === "ftyp";
  expect(webm || mp4, "a WebM or MP4 file").toBe(true);
  expect(hasVideoTrack(video), "a video track").toBe(true);
  expect(video.byteLength).toBeGreaterThan(1_000);

  expectSdkAssets(problems, page, "@hussmartinez/video-sdk");
});

/**
 * Whether a WebM or MP4 file declares a video track: WebM names its codec
 * with a codec ID such as `V_VP8`, and MP4's track handler is `vide`, eight
 * bytes after the `hdlr` box's type. Whole names, so a stray pair of bytes
 * in compressed data can't pass for one.
 */
function hasVideoTrack(file: Buffer): boolean {
  if (["V_VP8", "V_VP9", "V_AV1", "V_MPEG4/ISO/AVC"].some((codec) => file.includes(codec))) {
    return true;
  }
  for (let at = file.indexOf("hdlr"); at !== -1; at = file.indexOf("hdlr", at + 1)) {
    if (file.toString("ascii", at + 12, at + 16) === "vide") return true;
  }
  return false;
}
