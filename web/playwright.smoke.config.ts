import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke de PRODUCCIÓN.
 *
 * Estos tests registran una academia real en https://futcademic.vercel.app en
 * cada ejecución. Antes vivían en `playwright.config.ts` y se arrastraban con
 * cada `npm run test:e2e`, ensuciando producción sin que nadie lo pidiera.
 *
 * Ahora hay que pedirlo explícitamente:
 *   ALLOW_PROD_SMOKE=yes npm run test:smoke
 */
if (process.env.ALLOW_PROD_SMOKE !== 'yes') {
  throw new Error(
    'Estos tests crean datos reales en producción.\n' +
      'Si es lo que quieres, ejecútalos así:\n\n' +
      '  ALLOW_PROD_SMOKE=yes npm run test:smoke\n',
  );
}

export default defineConfig({
  testDir: './e2e/smoke',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? 'https://futcademic.vercel.app',
    headless: true,
    video: 'off',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Sin `webServer`: corre contra un despliegue ya existente.
});
