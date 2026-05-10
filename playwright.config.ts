import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

const webServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER
  ? undefined
  : {
      command: "pnpm dev",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ...(process.env as Record<string, string>),
        NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS:
          process.env.NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS ?? "",
      },
    };

/**
 * E2E — Playwright starts the dev server locally unless `PLAYWRIGHT_SKIP_WEBSERVER=1`
 * or `CI` with an external server (`PLAYWRIGHT_BASE_URL`).
 * Install browsers once: `pnpm exec playwright install chromium`
 */
export default defineConfig({
  testDir: "./tests/e2e",
  /** Serialized runner avoids flaky Better Auth “first user” races against shared Postgres. */
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ...(process.env.CI
      ? []
      : [{ name: "mobile", use: { ...devices["Pixel 5"] } }]),
  ],
  ...(webServer ? { webServer } : {}),
});
