import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Botón "Instalar app" del inicio.
 *
 * Chromium no dispara `beforeinstallprompt` en automatización, así que lo
 * sintetizamos. Eso igualmente ejercita lo que importa: que el listener esté
 * registrado antes del primer render, que el botón aparezca al recibir el
 * evento y que al pulsarlo se llame a `prompt()`.
 */

const DASHBOARDS = {
  admin: { activeStudents: 1, totalStudents: 1, monthlyIncome: 500, attendanceRate: 90 },
  alumno: { studentName: 'Carlos López', category: 'Sub-12', currentStreak: 1 },
  padre: { children: [] },
  profesor: { categories: [] },
};

/** Dispara el evento que el navegador emitiría en una página instalable. */
async function fireInstallPrompt(page: Page) {
  await page.evaluate(() => {
    const evt = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string }>;
    };
    evt.prompt = () => {
      (window as any).__promptCalled = true;
      return Promise.resolve();
    };
    evt.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(evt);
  });
}

test('se ve en cualquier página, no solo en el inicio', async ({ page }) => {
  await loginAs(page, { api: { dashboards: DASHBOARDS }, goto: '/profile' });
  await fireInstallPrompt(page);
  await expect(page.getByRole('button', { name: 'Instalar app' })).toBeVisible();
});

test('se puede instalar desde el login, sin iniciar sesión', async ({ page }) => {
  await page.goto('/login');
  await fireInstallPrompt(page);
  await expect(page.getByRole('button', { name: 'Instalar app' })).toBeVisible();
});

test('el botón aparece cuando el navegador ofrece instalar', async ({ page }) => {
  await loginAs(page, { api: { dashboards: DASHBOARDS } });

  // Antes del evento no hay botón: no se promete algo que el navegador no ofrece.
  await expect(page.getByRole('button', { name: 'Instalar app' })).toBeHidden();

  await fireInstallPrompt(page);
  await expect(page.getByRole('button', { name: 'Instalar app' })).toBeVisible();
});

test('al pulsarlo se abre el diálogo nativo y el botón desaparece', async ({ page }) => {
  await loginAs(page, { api: { dashboards: DASHBOARDS } });
  await fireInstallPrompt(page);

  await page.getByRole('button', { name: 'Instalar app' }).click();

  expect(await page.evaluate(() => (window as any).__promptCalled)).toBe(true);
  await expect(page.getByText('Futcademic instalada')).toBeVisible();
  // El evento solo se puede consumir una vez.
  await expect(page.getByRole('button', { name: 'Instalar app' })).toBeHidden();
});

// Un test por rol: cada uno necesita su propia página, porque loginAs arranca
// desde /login y una sesión ya activa redirige fuera.
for (const role of ['alumno', 'padre', 'profesor', 'super_admin'] as const) {
  test(`cualquier rol puede instalar: ${role}`, async ({ page }) => {
    await loginAs(page, {
      profile: {
        id: `${role}-1`,
        email: `${role}@test.com`,
        full_name: 'Usuario Demo',
        role,
        onboarded_at: '2025-01-01',
      },
      api: { dashboards: DASHBOARDS },
    });

    await fireInstallPrompt(page);
    await expect(page.getByRole('button', { name: 'Instalar app' })).toBeVisible();
  });
}

test('en iOS se explican los pasos, porque no hay diálogo nativo', async ({ browser }) => {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  await loginAs(page, { api: { dashboards: DASHBOARDS } });

  // Sin sintetizar ningún evento: en iOS nunca llega.
  await page.getByRole('button', { name: 'Instalar app' }).click();
  await expect(page.getByText('Añadir a pantalla de inicio')).toBeVisible();

  await context.close();
});

test('si la app ya está instalada no se ofrece instalarla otra vez', async ({ page }) => {
  // display-mode: standalone es lo que ve una PWA abierta desde su icono.
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = ((q: string) =>
      q.includes('display-mode: standalone')
        ? ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} } as any)
        : original(q)) as typeof window.matchMedia;
  });

  await loginAs(page, { api: { dashboards: DASHBOARDS } });
  await fireInstallPrompt(page);

  await expect(page.getByRole('button', { name: 'Instalar app' })).toBeHidden();
});
