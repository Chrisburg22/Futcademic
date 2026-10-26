import { defineConfig, devices } from '@playwright/test';

/**
 * Graba el recorrido del panel que se publica en la sección Demo del landing.
 * Mismo arnés de mocks que las capturas: nada real se toca.
 *
 *   npm run demo      (graba y convierte a MP4)
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'demo.spec.ts',
  outputDir: '../test-results-demo',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    headless: true,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    // El viewport de devices['Desktop Chrome'] es 1280×720: el video va igual
    // para que no aparezcan bandas grises.
    video: { mode: 'on', size: { width: 1280, height: 720 } },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // El panel web es Next.js. Se sirve un build de producción (`next start`)
    // para que el video no incluya el indicador de desarrollo de Next.
    // Las variables NEXT_PUBLIC_* se inlinean en build: hay que pasarlas aquí.
    command:
      'cd ../../web && NEXT_PUBLIC_SUPABASE_URL=https://stub.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=stub-anon-key NEXT_PUBLIC_API_URL=http://localhost:3000/api npx next build && NEXT_PUBLIC_SUPABASE_URL=https://stub.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=stub-anon-key NEXT_PUBLIC_API_URL=http://localhost:3000/api npx next start -H 127.0.0.1 -p 5174',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
