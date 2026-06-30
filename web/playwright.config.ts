import { defineConfig, devices } from '@playwright/test';

/**
 * E2E harness for the Futcademic web app.
 *
 * Tests run against a fully MOCKED backend (Supabase REST + auth and the Express
 * `/api`) via `page.route` interception (see e2e/helpers.ts). No live Supabase or
 * backend is needed — deterministic and runnable anywhere. Video is recorded for
 * every test so each phase produces a watchable artifact.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
    video: 'on',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --mode test --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
