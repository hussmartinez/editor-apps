// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppShell } from "./AppShell.tsx";

// React's act() needs this flag in a test environment.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("the ad slot", () => {
  it("isn't there when the app gives no art", () => {
    act(() =>
      root.render(
        <AppShell title="t" tagline="t">
          {null}
        </AppShell>,
      ),
    );
    expect(container.querySelector("aside")).toBeNull();
  });

  it("sits after the editor, says it's for an ad, and stays out of the way", () => {
    act(() =>
      root.render(
        <AppShell title="t" tagline="t" ad={<svg data-testid="art" />}>
          <div className="app-editor" />
        </AppShell>,
      ),
    );
    const slot = container.querySelector("aside");
    // After the editor in the page's order, outside the main landmark.
    expect(container.querySelector("main + aside")).toBe(slot);
    expect(slot?.querySelector('[data-testid="art"]')).not.toBeNull();
    expect(slot?.textContent).toBe("Your ad here");
    // Decorative: hidden from assistive technology, and never a tab stop.
    expect(slot?.getAttribute("aria-hidden")).toBe("true");
    expect(slot?.hasAttribute("inert")).toBe(true);
  });
});
