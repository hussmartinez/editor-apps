import { readFile } from "node:fs/promises";
import { expect, expectSecurityHeaders, test } from "@editor-apps/build-config/playwright";

const RATE = 44_100;

/** A tenth of a second of a 440 Hz tone, as 16-bit mono PCM: a real WAV file, made here. */
function recording(): Buffer {
  const frames = RATE / 10;
  const wav = Buffer.alloc(44 + frames * 2);
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(RATE, 24);
  wav.writeUInt32LE(RATE * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(frames * 2, 40);
  for (let frame = 0; frame < frames; frame++) {
    const sample = Math.sin((frame * 440 * 2 * Math.PI) / RATE) * 16_000;
    wav.writeInt16LE(Math.round(sample), 44 + frame * 2);
  }
  return wav;
}

// The `problems` fixture fails either test on a console error, a policy
// violation, a failed response or a request to another origin.

test("the page is served with its headers, and has the shell's landmarks", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expectSecurityHeaders(response?.headers() ?? {});
  expect(response?.headers()["content-security-policy"]).toContain("worker-src 'self'");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\//);
});

test("a recording opens and exports as a WAV file, with the SDK's worker from this origin", async ({
  page,
  problems,
}) => {
  await page.goto("/");

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Choose a file" }).click();
  await (await chooser).setFiles({ name: "tone.wav", mimeType: "audio/wav", buffer: recording() });
  await expect(page.getByRole("slider", { name: "Playhead" })).toBeVisible();

  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export WAV" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/\.wav$/);
  const wav = await readFile(await download.path());
  expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
  expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
  expect(wav.length).toBeGreaterThan(44);

  // The engine and the processor each start the worker, from this origin.
  const origin = new URL(page.url()).origin;
  const workers = problems.requests.filter((url) => url.endsWith("/audio/audio.worker.js"));
  expect(workers.length).toBeGreaterThan(0);
  for (const worker of workers) {
    expect(worker).toMatch(new RegExp(`^${origin}/audio-sdk/[\\d.]+/audio/audio\\.worker\\.js$`));
  }
});
