/**
 * The page around every app's editor (docs/adr/0002). An app's entry is:
 *
 * ```tsx
 * startApp({
 *   app: appConfig.app,
 *   analytics: { key: import.meta.env.VITE_POSTHOG_KEY, host: appConfig.analyticsHost },
 *   render: () => <App />,
 * });
 * ```
 *
 * and its `App` renders `<AppShell>` around its SDK's editor. The editor's
 * `onEvent` comes from `useEditorEvents(unsavedAfter)`, which forwards the
 * events to analytics and gives `<AppShell unsaved>` for the leave guard.
 */

export { AdSlot, type AdSlotProps } from "./AdSlot.tsx";
export { AppShell, type AppShellProps } from "./AppShell.tsx";
export { AnalyticsContext, useAnalytics } from "./analytics.ts";
export { ErrorBoundary } from "./ErrorBoundary.tsx";
export { type UnsavedAfter, useEditorEvents, useLeaveGuard } from "./leave-guard.ts";
export { type StartOptions, startApp } from "./start.tsx";
