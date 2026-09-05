import { defineConfig, devices } from '@playwright/test';

/**
 * Harness de PWA.
 *
 * A diferencia de `playwright.config.ts` (que corre contra `vite dev`), aquí
 * hace falta un **build de producción** servido por `vite preview`: el service
 * worker solo se genera en build (`devOptions.enabled: false`).
 *
 * El backend sigue mockeado con `page.route` + `context.route` (ver
 * e2e/helpers.ts). El mock a nivel de contexto es imprescindible: las peticiones
 * que lanza el service worker no pasan por `page.route`.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'pwa.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    video: 'on',
    viewport: { width: 1280, height: 800 },
    serviceWorkers: 'allow',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build -- --mode test && npx vite preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
