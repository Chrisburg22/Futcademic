import { defineConfig, devices } from '@playwright/test';

/**
 * Generador de capturas del landing.
 *
 * Levanta el panel web (`../web`) con un build de producción y el backend
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
    // El panel web es Next.js. Se sirve un build de producción (`next start`)
    // para que las capturas no incluyan el indicador de desarrollo de Next.
    // Las variables NEXT_PUBLIC_* se inlinean en build: hay que pasarlas aquí.
    command:
      'cd ../../web && NEXT_PUBLIC_SUPABASE_URL=https://stub.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=stub-anon-key NEXT_PUBLIC_API_URL=http://localhost:3000/api npx next build && NEXT_PUBLIC_SUPABASE_URL=https://stub.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=stub-anon-key NEXT_PUBLIC_API_URL=http://localhost:3000/api npx next start -H 127.0.0.1 -p 5174',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
