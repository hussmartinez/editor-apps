import {
  test as base,
  defineConfig,
  devices,
  expect,
  type PlaywrightTestConfig,
} from "@playwright/test";

/**
 * The smoke tests' shared setup (docs/adr/0003): every app's tests run
 * against its built output, served with production's headers, and fail on
 * anything the app must never do.
 */

export type Engine = "chromium" | "firefox" | "webkit";

const DEVICES: Record<Engine, string> = {
  chromium: "Desktop Chrome",
  firefox: "Desktop Firefox",
  webkit: "Desktop Safari",
};

export interface SmokeOptions {
  /** A port of the app's own, so two apps' tests can run at once. */
  readonly port: number;
  /** The browsers the app supports. Its SDK decides: a codec or an API may be missing in one. */
  readonly engines: readonly Engine[];
}

/**
 * An app's Playwright configuration. Chromium alone by default; with
 * `SMOKE_ENGINES=all`, as CI sets nightly and when the shared packages
 * change, every engine the app supports.
 *
 * Build the app first: the server is `vite preview`, which serves `dist`
 * with the headers of the `editorApp` plugin.
 */
export function smokeConfig({ port, engines }: SmokeOptions): PlaywrightTestConfig {
  const run = process.env.SMOKE_ENGINES === "all" ? engines : engines.slice(0, 1);
  const url = `http://127.0.0.1:${port}`;
  return defineConfig({
    testDir: "e2e",
    forbidOnly: Boolean(process.env.CI),
    retries: 0,
    reporter: process.env.CI ? "line" : "list",
    use: { baseURL: url, trace: "retain-on-failure" },
    projects: run.map((engine) => ({ name: engine, use: { ...devices[DEVICES[engine]] } })),
    webServer: {
      command: `pnpm exec vite preview --host 127.0.0.1 --port ${port} --strictPort`,
      url,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  });
}

/** What a page did that an app must never do. Empty when all is well. */
export interface Problems {
  /** Console errors, uncaught errors, policy violations and failed responses. */
  readonly errors: string[];
  /** Requests to an origin other than the app's own. */
  readonly foreign: string[];
  /** Every request's URL, for asserting where an asset came from. */
  readonly requests: string[];
}

/**
 * Playwright's `test`, with a `problems` fixture that every test gets
 * whether it asks or not: it records console errors, uncaught errors,
 * Content Security Policy violations, HTTP errors, failed requests and
 * requests to another origin, and fails the test if there were any.
 *
 * A test that expects one, such as an analytics request, removes it from
 * `problems` before it ends.
 */
export const test = base.extend<{ problems: Problems }>({
  problems: [
    async ({ page, baseURL }, use) => {
      const problems: Problems = { errors: [], foreign: [], requests: [] };
      const own = new URL(baseURL ?? "http://127.0.0.1").origin;
      page.on("console", (message) => {
        if (message.type() === "error") problems.errors.push(`console: ${message.text()}`);
      });
      page.on("pageerror", (error) => problems.errors.push(`uncaught: ${error.message}`));
      // On the context, not the page, so the SDK's workers' requests count too.
      // An HTTP error completes as a response; a transport failure, such as
      // a blocked or reset request, emits only requestfailed.
      page.context().on("response", (response) => {
        if (response.status() >= 400) {
          problems.errors.push(`${response.status()} ${response.url()}`);
        }
      });
      page.context().on("requestfailed", (request) => {
        const url = request.url();
        // A blob: or data: URL never touches the network: a download from
        // one may be reported as aborted once the browser takes it over.
        if (/^(blob|data):/.test(url)) return;
        problems.errors.push(`failed: ${url} ${request.failure()?.errorText ?? "unknown error"}`);
      });
      page.context().on("request", (request) => {
        const url = request.url();
        problems.requests.push(url);
        if (!/^(blob|data):/.test(url) && new URL(url).origin !== own) problems.foreign.push(url);
      });
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (event) => {
          console.error(`Policy violation: ${event.violatedDirective} ${event.blockedURI}`);
        });
      });

      await use(problems);

      expect(problems.foreign, "requests to another origin").toEqual([]);
      expect(problems.errors, "errors in the page").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** The headers every app's pages must be served with, checked on a response. */
export function expectSecurityHeaders(headers: Record<string, string>): void {
  const policy = headers["content-security-policy"] ?? "";
  expect(policy).toContain("default-src 'none'");
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).not.toMatch(/'unsafe-inline'|'unsafe-eval'/);
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("camera=()");
}
