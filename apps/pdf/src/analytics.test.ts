import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock("posthog-js");
  vi.resetModules();
});

/** Lets the module's promise chains settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

it("sends nothing and loads nothing without a key", async () => {
  vi.stubEnv("VITE_POSTHOG_KEY", "");
  const factory = vi.fn(() => ({ default: { init: vi.fn(), capture: vi.fn() } }));
  vi.doMock("posthog-js", factory);
  const { trackEvent } = await import("./analytics.ts");
  trackEvent("document_opened");
  await settle();
  expect(factory).not.toHaveBeenCalled();
});

it("survives a client that fails to load, and tries again on the next event", async () => {
  vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
  const capture = vi.fn();
  let attempts = 0;
  vi.doMock("posthog-js", () => {
    attempts += 1;
    if (attempts === 1) throw new Error("the chunk failed to load");
    return { default: { init: vi.fn(), capture } };
  });
  const { trackEvent } = await import("./analytics.ts");

  // Vitest fails the run on an unhandled rejection, so this also checks there is none.
  trackEvent("first");
  await settle();
  expect(capture).not.toHaveBeenCalled();

  trackEvent("second");
  await settle();
  expect(capture).toHaveBeenCalledWith("second", undefined);
});
