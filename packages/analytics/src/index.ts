/**
 * Anonymous analytics for the apps, through PostHog (docs/adr/0005).
 *
 * Every app sends the same two things, tagged with its name:
 *
 * - one page view per load, with the page's path only;
 * - its SDK's anonymous usage events, from the editor's `onEvent`.
 *
 * Nothing else is captured. PostHog's client is bundled and loaded only when
 * the build has a key, it never loads scripts from another origin, and it
 * stores nothing on the device. With Global Privacy Control or Do Not Track
 * set, nothing is loaded at all.
 */
import type { BeforeSendFn, PostHog, PostHogConfig } from "posthog-js";

export interface AnalyticsOptions {
  /** The app's name, such as `pdf`. Every event carries it as `app`. */
  readonly app: string;
  /** PostHog's public project key, from the build. Without one, nothing loads. */
  readonly key: string | undefined;
  /** PostHog's host, such as `https://eu.i.posthog.com`. */
  readonly host: string;
  /** Loads PostHog's client. Tests replace it. */
  readonly load?: () => Promise<{ default: PostHog }>;
}

/** An SDK's anonymous usage event, as its editor's `onEvent` gives it. */
export interface EditorEvent {
  readonly type: string;
}

export interface Analytics {
  /** Sends one page view, with the page's path only. Call it once per load. */
  pageView(): void;
  /** Forwards one of the editor's events, whose fields are anonymous by contract. */
  editorEvent(event: EditorEvent): void;
  /** Sends one event without data from the page, such as `component_error`. */
  event(name: string): void;
}

/**
 * The page's address without its query string or fragment, which can carry
 * anything: an analytics event never sends more than the path.
 */
export function pathOnly(url: string): string {
  try {
    const { origin, pathname } = new URL(url);
    return `${origin}${pathname}`;
  } catch {
    return "";
  }
}

/**
 * Properties never sent: referrers, the first page and campaign of a person
 * or session (`$initial_…`, `$session_entry_…`, which PostHog adds whatever
 * `save_referrer` and `save_campaign_params` say), and campaign parameters
 * such as `utm_source` or `gclid`, which come from the page's query string.
 */
const DROPPED = [
  /^\$(initial_|session_entry_)/,
  /^\$(referrer|referring_domain)$/,
  /(^|_)utm_/,
  /^(gclid|gclsrc|gad_source|gbraid|wbraid|dclid|fbclid|msclkid|twclid|ttclid|li_fat_id|igshid|mc_cid|rdt_cid|epik|qclid|sccid|irclid|_kx)$/,
];

/**
 * Applied to every event before it's sent: only the path of the page's
 * address, no referrer, no person properties, and the app's name.
 */
export function sanitize(app: string): BeforeSendFn {
  return (result) => {
    const properties: Record<string, unknown> = { ...result.properties, app };
    for (const [key, value] of Object.entries(properties)) {
      if (DROPPED.some((pattern) => pattern.test(key))) {
        delete properties[key];
      } else if (typeof value === "string" && /^https?:\/\//.test(value)) {
        // Any address left, such as $current_url, goes as its path only.
        properties[key] = pathOnly(value);
      }
    }
    const { $set: _set, $set_once: _setOnce, $unset: _unset, ...rest } = result;
    return { ...rest, properties };
  };
}

/**
 * PostHog's options: cookieless and memory-only, nothing captured
 * automatically, nothing loaded from another origin, no person profiles,
 * and every event sanitized. A unit test pins them, so an upgrade that adds
 * a capture feature fails until it's switched off here.
 */
export function posthogConfig(app: string, host: string): Partial<PostHogConfig> {
  return {
    api_host: host,
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
    before_send: sanitize(app),
  };
}

/** Whether the browser asks not to be tracked, by Global Privacy Control or Do Not Track. */
export function optedOut(): boolean {
  if (typeof navigator === "undefined") return false;
  const signals = navigator as Navigator & { globalPrivacyControl?: boolean };
  return signals.globalPrivacyControl === true || signals.doNotTrack === "1";
}

/** Creates the app's analytics. Without a key, or opted out, every call does nothing. */
export function createAnalytics({
  app,
  key,
  host,
  load = () => import("posthog-js"),
}: AnalyticsOptions): Analytics {
  const enabled = Boolean(key) && !optedOut();
  let client: Promise<PostHog | undefined> | undefined;

  const ready = (): Promise<PostHog | undefined> => {
    client ??= load()
      .then(({ default: posthog }) => {
        posthog.init(key as string, posthogConfig(app, host));
        return posthog;
      })
      .catch(() => {
        // The client failed to load or start, such as a chunk lost to a
        // network change. Analytics is optional: forget the attempt, so the
        // next event tries again, and let the editor carry on.
        client = undefined;
        return undefined;
      });
    return client;
  };

  const capture = (name: string, properties?: Record<string, unknown>): void => {
    if (!enabled) return;
    void ready()
      .then((posthog) => posthog?.capture(name, properties))
      // A failing capture must never reach the editor or the console.
      .catch(() => undefined);
  };

  return {
    pageView: () => capture("$pageview"),
    editorEvent: ({ type, ...properties }) => capture(type, properties),
    event: (name) => capture(name),
  };
}
