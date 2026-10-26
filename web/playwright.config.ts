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
  // e2e/smoke/ golpea PRODUCCIÓN y crea academias reales. Vive en
  // playwright.smoke.config.ts y solo se ejecuta a propósito.
  // pwa.spec.ts requiere service worker; la PWA está diferida en la migración a
  // Next (ver playwright.pwa.config.ts).
  testIgnore: ['smoke/**', 'pwa.spec.ts'],
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
    command: 'npm run dev -- -H 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3000/api',
      NEXT_PUBLIC_SUPABASE_URL: 'https://stub.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
});
