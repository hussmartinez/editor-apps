import type { EditorEvent } from "@editor-apps/analytics";
import { useCallback, useEffect, useState } from "react";
import { useAnalytics } from "./analytics.ts";

/**
 * While `armed`, asks the browser to confirm before the page is left,
 * reloaded or closed, with its own prompt: browsers ignore a page's text.
 * The listener exists only while armed, so an untouched page stays
 * eligible for the back/forward cache.
 */
export function useLeaveGuard(armed: boolean): void {
  useEffect(() => {
    if (!armed) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [armed]);
}

/**
 * Says what an SDK event means for the person's work: `true` after an
 * edit, `false` once the work is exported or the document is opened anew
 * or closed, and `undefined` when the event changes nothing, such as a
 * failure. Each app writes its own, from its SDK's events.
 */
export type UnsavedAfter<E extends EditorEvent> = (event: E) => boolean | undefined;

/**
 * The handler for the SDK editor's `onEvent`: it forwards every event to
 * the app's analytics (docs/adr/0005), and tracks with `unsavedAfter`
 * whether there is work the leave guard should protect. Pass `unsaved`
 * to {@link AppShell}. Give a function that keeps its identity, such as
 * one declared at module level.
 */
export function useEditorEvents<E extends EditorEvent>(
  unsavedAfter: UnsavedAfter<E>,
): { readonly unsaved: boolean; readonly onEvent: (event: E) => void } {
  const { editorEvent } = useAnalytics();
  const [unsaved, setUnsaved] = useState(false);
  const onEvent = useCallback(
    (event: E) => {
      editorEvent(event);
      const next = unsavedAfter(event);
      if (next !== undefined) setUnsaved(next);
    },
    [editorEvent, unsavedAfter],
  );
  return { unsaved, onEvent };
}
