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
 * and its `App` renders `<AppShell>` around its SDK's editor, passing
 * `useAnalytics().editorEvent` to the editor's `onEvent`.
 */

export { AppShell, type AppShellProps } from "./AppShell.tsx";
export { AnalyticsContext, useAnalytics } from "./analytics.ts";
export { ErrorBoundary } from "./ErrorBoundary.tsx";
export { type StartOptions, startApp } from "./start.tsx";
