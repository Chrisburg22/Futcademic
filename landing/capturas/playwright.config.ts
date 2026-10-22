import { defineConfig, devices } from '@playwright/test';

/**
 * Generador de capturas del landing.
 *
 * Levanta el panel web (`../web`) en modo dev con Supabase y el backend
 * apuntando a hosts stub, y lo recorre con el mismo arnés de mocks que usa
 * `web/e2e` (`page.route`). No toca ningún servicio real: las capturas salen
 * del producto de verdad con datos de demostración.
 *
 *   npm run capturas
 */
export default defineConfig({
  testDir: '.',
  // El recorrido grabado tiene su propia config (demo.config.ts).
  testIgnore: ['demo.spec.ts'],
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    headless: true,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      'VITE_SUPABASE_URL=https://stub.supabase.co VITE_SUPABASE_ANON_KEY=stub-anon-key VITE_API_URL=http://localhost:3000/api npm --prefix ../../web run dev -- --host 127.0.0.1 --port 5174',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
