import type { CaptureResult, PostHog } from "posthog-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAnalytics, pathOnly, posthogConfig, sanitize } from "./index.ts";

afterEach(() => vi.unstubAllGlobals());

/** Lets the module's promise chains settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function fakePostHog() {
  const posthog = { init: vi.fn(), capture: vi.fn() };
  return { posthog, load: vi.fn(async () => ({ default: posthog as unknown as PostHog })) };
}

describe("createAnalytics", () => {
  it("loads nothing and sends nothing without a key", async () => {
    const { posthog, load } = fakePostHog();
    const analytics = createAnalytics({ app: "pdf", key: "", host: "https://ph.example", load });
    analytics.pageView();
    analytics.editorEvent({ type: "document_opened" });
    await settle();
    expect(load).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it.each([
    ["Global Privacy Control", { globalPrivacyControl: true }],
    ["Do Not Track", { doNotTrack: "1" }],
  ])("loads nothing when the browser sends %s", async (_name, signals) => {
    vi.stubGlobal("navigator", signals);
    const { load } = fakePostHog();
    const analytics = createAnalytics({
      app: "pdf",
      key: "phc_test",
      host: "https://ph.example",
      load,
    });
    analytics.pageView();
    await settle();
    expect(load).not.toHaveBeenCalled();
  });

  it("sends a page view and the editor's events, loading the client once", async () => {
    const { posthog, load } = fakePostHog();
    const analytics = createAnalytics({
      app: "audio",
      key: "phc_test",
      host: "https://ph.example",
      load,
    });
    analytics.pageView();
    analytics.editorEvent({ type: "recording_opened", durationSeconds: 3500 } as { type: string });
    analytics.event("component_error");
    await settle();
    expect(load).toHaveBeenCalledTimes(1);
    const { before_send: _before, ...options } = posthogConfig("audio", "https://ph.example");
    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ ...options, before_send: expect.any(Function) }),
    );
    expect(posthog.capture.mock.calls).toEqual([
      ["$pageview", undefined],
      ["recording_opened", { durationSeconds: 3500 }],
      ["component_error", undefined],
    ]);
  });

  it("survives a client that fails to load, and tries again on the next event", async () => {
    const { posthog } = fakePostHog();
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("the chunk failed to load"))
      .mockResolvedValue({ default: posthog });
    const analytics = createAnalytics({
      app: "pdf",
      key: "phc_test",
      host: "https://ph.example",
      load,
    });

    // Vitest fails the run on an unhandled rejection, so this also checks there is none.
    analytics.event("first");
    await settle();
    expect(posthog.capture).not.toHaveBeenCalled();

    analytics.event("second");
    await settle();
    expect(posthog.capture).toHaveBeenCalledWith("second", undefined);
  });

  it("keeps a failing capture away from the editor", async () => {
    const { posthog, load } = fakePostHog();
    posthog.capture.mockImplementation(() => {
      throw new Error("capture failed");
    });
    const analytics = createAnalytics({
      app: "pdf",
      key: "phc_test",
      host: "https://ph.example",
      load,
    });
    expect(() => analytics.event("anything")).not.toThrow();
    await settle();
  });
});

describe("posthogConfig", () => {
  it("captures nothing on its own, stores nothing and loads nothing from elsewhere", () => {
    const { before_send, ...options } = posthogConfig("image", "https://ph.example");
    expect(typeof before_send).toBe("function");
    expect(options).toEqual({
      api_host: "https://ph.example",
      persistence: "memory",
      disable_persistence: true,
      person_profiles: "never",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_exceptions: false,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      capture_performance: false,
      rageclick: false,
      disable_session_recording: true,
      disable_external_dependency_loading: true,
      disable_surveys: true,
      disable_web_experiments: true,
      disable_product_tours: true,
      disable_conversations: true,
      advanced_disable_flags: true,
      save_referrer: false,
      save_campaign_params: false,
      disable_capture_url_hashes: true,
      respect_dnt: true,
    });
  });
});

describe("sanitize", () => {
  const event = (properties: Record<string, unknown>, extra: Partial<CaptureResult> = {}) =>
    ({ uuid: "1", event: "$pageview", properties, ...extra }) as CaptureResult;

  it("sends the page's path only, never its query string or fragment", () => {
    const result = sanitize("video")(
      event({
        $current_url: "https://app.example/edit?file=secret.mp4&token=abc#section",
        $initial_current_url: "https://app.example/?q=1",
        $pathname: "/edit",
      }),
    );
    expect(result?.properties).toEqual({
      $current_url: "https://app.example/edit",
      $pathname: "/edit",
      app: "video",
    });
  });

  it("tags every event with the app, and drops referrers and person properties", () => {
    const result = sanitize("pdf")(
      event(
        {
          $referrer: "https://other.example/search?q=private",
          $referring_domain: "other.example",
          $initial_referrer: "https://other.example/",
          $initial_referring_domain: "other.example",
          pageCount: 3,
        },
        { $set: { name: "x" }, $set_once: { first: "y" }, $unset: ["z"] },
      ),
    );
    expect(result).toEqual({
      uuid: "1",
      event: "$pageview",
      properties: { pageCount: 3, app: "pdf" },
    });
  });

  it("drops session-entry attribution and campaign parameters, which carry the query", () => {
    const result = sanitize("image")(
      event({
        $session_entry_url: "https://app.example/?token=abc",
        $session_entry_referrer: "https://other.example/?q=private",
        $session_entry_referring_domain: "other.example",
        $session_entry_utm_source: "newsletter",
        $session_entry_gclid: "Cj0KCQ",
        $initial_utm_campaign: "launch",
        utm_source: "newsletter",
        gclid: "Cj0KCQ",
        fbclid: "IwAR",
        $browser: "Chrome",
        commands: ["image.rotate"],
      }),
    );
    expect(result?.properties).toEqual({
      $browser: "Chrome",
      commands: ["image.rotate"],
      app: "image",
    });
  });

  it("cuts any other address to its path, whatever the property", () => {
    const result = sanitize("audio")(event({ $somewhere_url: "https://app.example/x?y=1#z" }));
    expect(result?.properties).toEqual({ $somewhere_url: "https://app.example/x", app: "audio" });
  });

  it("drops an address it can't parse rather than send it", () => {
    expect(pathOnly("not a url")).toBe("");
  });
});
