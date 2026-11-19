// @vitest-environment happy-dom
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAnalytics } from "./analytics.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const analytics = { pageView: vi.fn(), editorEvent: vi.fn(), event: vi.fn() };
const createAnalytics = vi.fn(() => analytics);
vi.mock("@editor-apps/analytics", () => ({ createAnalytics }));

/** What the app saw from useAnalytics(). */
const seen: { value?: unknown } = {};

function App() {
  seen.value = useAnalytics();
  return <p>app</p>;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("startApp", () => {
  it("starts analytics with one page view, then renders the app with it in context", async () => {
    const { startApp } = await import("./start.tsx");
    const root = document.createElement("div");
    root.id = "root";
    document.body.append(root);

    await act(async () =>
      startApp({
        app: "video",
        analytics: { key: "phc_test", host: "https://ph.example" },
        render: () => <App />,
      }),
    );

    expect(createAnalytics).toHaveBeenCalledWith({
      app: "video",
      key: "phc_test",
      host: "https://ph.example",
    });
    expect(analytics.pageView).toHaveBeenCalledTimes(1);
    expect(root.textContent).toBe("app");
    expect(seen.value).toBe(analytics);
  });

  it("fails clearly when the page has no root element", async () => {
    const { startApp } = await import("./start.tsx");
    expect(() =>
      startApp({
        app: "pdf",
        analytics: { key: undefined, host: "https://ph.example" },
        render: () => null,
      }),
    ).toThrow(/no #root/);
  });
});
