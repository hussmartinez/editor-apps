/** Build variables, set in Workers Builds. Both are public: they end up in the bundle. */
interface ImportMetaEnv {
  /** PostHog's project key. Without it, no analytics code is loaded and nothing is sent. */
  readonly VITE_POSTHOG_KEY?: string;
  /** PostHog's host, when it isn't the default. It must be an https origin. */
  readonly VITE_POSTHOG_HOST?: string;
}
