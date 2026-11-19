import type { PdfEditorProps } from "@hussmartinez/pdf-sdk/react";
import { appConfig } from "./app.config.ts";

type PostHog = typeof import("posthog-js").default;
/** The SDK's anonymous usage events: no file names, contents, form values or text. */
export type EditorEvent = Parameters<NonNullable<PdfEditorProps["onEvent"]>>[0];

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST || appConfig.analyticsHost;

let client: Promise<PostHog | undefined> | undefined;

/**
 * Loads PostHog only when a key was configured at build time. It's cookieless
 * and captures nothing on its own: no pageviews, clicks, exceptions or
 * recordings, and it never loads scripts from another origin, so the only
 * data it sends is the events passed to {@link trackEvent}.
 */
function load(): Promise<PostHog | undefined> {
  client ??= key
    ? import("posthog-js")
        .then(({ default: posthog }) => {
          posthog.init(key, {
            api_host: host,
            persistence: "memory",
            disable_persistence: true,
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
          });
          return posthog;
        })
        .catch(() => {
          // The client failed to load or start, such as a chunk lost to a
          // network change. Analytics is optional: forget the attempt, so the
          // next event tries again, and let the editor carry on.
          client = undefined;
          return undefined;
        })
    : Promise.resolve(undefined);
  return client;
}

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (!key) return;
  void load()
    .then((posthog) => posthog?.capture(name, properties))
    // A failing capture must never reach the editor or the console.
    .catch(() => undefined);
}

/** Forwards one of the editor's events, whose fields are anonymous by contract. */
export function trackEditorEvent(event: EditorEvent): void {
  const { type, ...properties } = event;
  trackEvent(type, properties);
}
