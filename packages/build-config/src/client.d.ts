/**
 * What the `editorApp` Vite plugin gives an app's browser code. An app adds
 * `"@editor-apps/build-config/client"` to its tsconfig's `types`.
 */

/** Where the app serves its SDK's assets, for the SDK's `assetsUrl`. Empty without assets. */
declare const __SDK_ASSETS_URL__: string;

/** The theme stylesheet from the `themeStylesheet` plugin. */
declare module "virtual:theme.css";

/** Build variables, set in Workers Builds. Both are public: they end up in the bundle. */
interface ImportMetaEnv {
  /** PostHog's public project key. Without it, no analytics code loads and nothing is sent. */
  readonly VITE_POSTHOG_KEY?: string;
  /** PostHog's host, when it isn't the app's default. It must be an https origin. */
  readonly VITE_POSTHOG_HOST?: string;
}
