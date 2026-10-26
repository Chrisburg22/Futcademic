import { defineConfig, devices } from '@playwright/test';

/**
 * Harness de PWA.
 *
 * ⚠️ DORMIDO: la PWA se difirió durante la migración a Next.js. Este config
 * todavía asume `vite preview` y un service worker generado por Vite, así que
 * no se puede ejecutar hasta reimplementar la PWA (Serwist) en `app/`.
 *
 * A diferencia de `playwright.config.ts` (que corre contra `next dev`), aquí
 * hace falta un build de producción: el service worker solo existe en build.
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
