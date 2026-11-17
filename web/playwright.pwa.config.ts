import { defineConfig, devices } from '@playwright/test';

/**
 * Harness de PWA.
 *
 * A diferencia de `playwright.config.ts` (que corre contra `next dev`), aquí
 * hace falta un build de producción: el service worker solo se registra en
 * producción (ver `ServiceWorkerRegistration`, que en desarrollo desinstala
 * cualquiera que haya quedado para no romper el HMR).
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
    command: 'npm run build && npx next start -H 127.0.0.1 -p 4173',
    url: 'http://127.0.0.1:4173',
    // Un service worker de una corrida anterior contaminaría la siguiente.
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3000/api',
      NEXT_PUBLIC_SUPABASE_URL: 'https://stub.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
});
