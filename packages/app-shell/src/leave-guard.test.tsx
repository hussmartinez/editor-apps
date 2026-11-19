// @vitest-environment happy-dom
import type { Analytics } from "@editor-apps/analytics";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell.tsx";
import { AnalyticsContext } from "./analytics.ts";
import { type UnsavedAfter, useEditorEvents } from "./leave-guard.ts";

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

/** Whether leaving now would ask first: what the browser checks on `beforeunload`. */
function leavingAsks(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

function shell(unsaved?: boolean) {
  return (
    <AppShell title="PDF Editor" tagline="t" {...(unsaved === undefined ? {} : { unsaved })}>
      {null}
    </AppShell>
  );
}

describe("the leave guard", () => {
  it("lets the page go when the app reports nothing unsaved", () => {
    act(() => root.render(shell()));
    expect(leavingAsks()).toBe(false);
  });

  it("asks while there are unsaved edits, and stops once there are none", () => {
    act(() => root.render(shell(true)));
    expect(leavingAsks()).toBe(true);
    act(() => root.render(shell(false)));
    expect(leavingAsks()).toBe(false);
  });

  it("stops asking when the shell goes away", () => {
    act(() => root.render(shell(true)));
    act(() => root.unmount());
    root = createRoot(container);
    expect(leavingAsks()).toBe(false);
  });
});

type FakeEvent = { readonly type: "edit" | "export" | "failed" };
const unsavedAfter: UnsavedAfter<FakeEvent> = ({ type }) =>
  type === "edit" ? true : type === "export" ? false : undefined;

let send: (event: FakeEvent) => void = () => {};

/** An app whose editor sends the events the test gives it. */
function App() {
  const editor = useEditorEvents(unsavedAfter);
  send = editor.onEvent;
  return (
    <AppShell title="t" tagline="t" unsaved={editor.unsaved}>
      {null}
    </AppShell>
  );
}

describe("useEditorEvents", () => {
  function setUp() {
    const analytics = { pageView: vi.fn(), editorEvent: vi.fn(), event: vi.fn() };
    act(() =>
      root.render(
        <AnalyticsContext.Provider value={analytics satisfies Analytics}>
          <App />
        </AnalyticsContext.Provider>,
      ),
    );
    return { analytics, send: (event: FakeEvent) => act(() => send(event)) };
  }

  it("arms the guard after an edit and clears it after an export", () => {
    const { send } = setUp();
    expect(leavingAsks()).toBe(false);
    send({ type: "edit" });
    expect(leavingAsks()).toBe(true);
    send({ type: "export" });
    expect(leavingAsks()).toBe(false);
  });

  it("keeps the guard as it was on an event that changes nothing", () => {
    const { send } = setUp();
    send({ type: "edit" });
    send({ type: "failed" });
    expect(leavingAsks()).toBe(true);
  });

  it("forwards every event to analytics", () => {
    const { analytics, send } = setUp();
    send({ type: "edit" });
    send({ type: "failed" });
    expect(analytics.editorEvent.mock.calls).toEqual([[{ type: "edit" }], [{ type: "failed" }]]);
  });
});
