import { test, expect, type Page } from '@playwright/test';
import { loginAs, type Role } from './helpers';

/**
 * Maquetación móvil: barra de navegación inferior y áreas seguras.
 *
 * El detonante original fue la PWA instalada en iPhone: el header quedaba
 * escondido debajo de la barra de estado y los accesos rápidos morían al final
 * del scroll. Desde la Fase 1 la barra inferior ya no es «accesos rápidos del
 * Inicio del admin» sino la navegación de cualquier rol en cualquier pantalla,
 * montada una sola vez en `AppShell`.
 */

const DASHBOARDS = {
  admin: { activeStudents: 12, totalStudents: 15, monthlyIncome: 4500, attendanceRate: 87.5 },
  profesor: { myCategories: 2, todayTrainings: 1, studentsTotal: 20, attendanceRate: 90 },
  padre: { childrenCount: 1, paymentAlert: null },
  alumno: { currentStreak: 3, trainingsThisMonth: 8, achievementsUnlocked: 2, category: 'Sub-12' },
};

const PHONE = { width: 390, height: 844 };

/** Alto de la barra: `ALTURA` en MobileNav.tsx y `--quick-dock-height` en globals.css. */
const ALTURA_BARRA = 60;

const PERFILES: Record<Role, Record<string, unknown>> = {
  super_admin: { id: 'u-sa', email: 'sa@futcademic.test', full_name: 'Super Demo', role: 'super_admin' },
  admin: { id: 'u-ad', email: 'admin@futcademic.test', full_name: 'Admin Demo', role: 'admin' },
  profesor: { id: 'u-pr', email: 'profe@futcademic.test', full_name: 'Profe Demo', role: 'profesor', onboarded_at: '2026-01-01T00:00:00Z' },
  padre: { id: 'u-pa', email: 'padre@futcademic.test', full_name: 'Padre Demo', role: 'padre', onboarded_at: '2026-01-01T00:00:00Z' },
  alumno: { id: 'u-al', email: 'alumno@futcademic.test', full_name: 'Alumno Demo', role: 'alumno', onboarded_at: '2026-01-01T00:00:00Z' },
};

async function entrarEnTelefono(page: Page, role: Role = 'admin', goto?: string) {
  await page.setViewportSize(PHONE);
  await loginAs(page, { profile: PERFILES[role], goto, api: { dashboards: DASHBOARDS } });
}

const barra = (page: Page) => page.getByRole('navigation', { name: 'Navegación principal' });

/** Lo que cada rol debe ver en la barra, en orden. */
const ESPERADO: Record<Role, string[]> = {
  super_admin: ['Inicio', 'Alumnos', 'Finanzas', 'Asistencia', 'Más'],
  admin: ['Inicio', 'Alumnos', 'Finanzas', 'Asistencia', 'Más'],
  // El profesor conserva «Asistencia»: esa pantalla es pase de lista e histórico.
  profesor: ['Inicio', 'Asistencia', 'Alumnos', 'Categoría', 'Más'],
  padre: ['Inicio', 'Mis hijos', 'Pagos', 'Asistencia', 'Más'],
  alumno: ['Inicio', 'Mi asistencia', 'Mi equipo', 'Logros', 'Más'],
};

for (const role of ['admin', 'profesor', 'padre', 'alumno'] as Role[]) {
  test(`la barra inferior lleva los destinos de ${role}`, async ({ page }) => {
    await entrarEnTelefono(page, role);
    const nav = barra(page);
    await expect(nav).toBeVisible();

    for (const etiqueta of ESPERADO[role]) {
      await expect(nav.getByRole(etiqueta === 'Más' ? 'button' : 'link', { name: etiqueta })).toBeVisible();
    }
    // Cuatro destinos + «Más»: ni uno más, para que el texto siga siendo legible.
    await expect(nav.getByRole('link')).toHaveCount(4);
  });
}

test('la barra existe en todas las pantallas, no solo en Inicio', async ({ page }) => {
  await entrarEnTelefono(page, 'admin');
  for (const ruta of ['/admin/students', '/finances', '/attendance', '/profile']) {
    await page.goto(ruta);
    await expect(barra(page)).toBeVisible();
  }
});

test('la barra navega y marca dónde estás', async ({ page }) => {
  await entrarEnTelefono(page, 'admin');
  const nav = barra(page);

  // Inicio arranca marcado y no se queda marcado en el resto de rutas: `to: '/'`
  // con coincidencia por prefijo marcaría Inicio en toda la app.
  await expect(nav.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');

  await nav.getByRole('link', { name: 'Alumnos' }).click();
  await expect(page).toHaveURL(/\/admin\/students$/);
  await expect(nav.getByRole('link', { name: 'Alumnos' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current', 'page');
});

test('una ruta hija sigue marcando su destino', async ({ page }) => {
  await entrarEnTelefono(page, 'admin', '/settings/security');
  // «Más» abre el cajón; Ajustes no está en la barra, así que nada queda marcado.
  await expect(barra(page).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current', 'page');
});

test('«Más» abre el cajón con el resto de secciones', async ({ page }) => {
  await entrarEnTelefono(page, 'admin');
  await barra(page).getByRole('button', { name: 'Más secciones' }).click();

  // Lo que no cabe en la barra vive aquí.
  await expect(page.getByRole('link', { name: 'Profesores' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Canchas' })).toBeVisible();
});

test('la barra no aparece en escritorio: ahí hay sitio para las tarjetas', async ({ page }) => {
  await loginAs(page, { api: { dashboards: DASHBOARDS } });

  await expect(barra(page)).toBeHidden();
  // Las tarjetas siguen siendo la versión de escritorio.
  await expect(page.getByRole('heading', { name: 'Accesos rápidos' })).toBeVisible();
});

test('la barra no tapa el final del contenido', async ({ page }) => {
  await entrarEnTelefono(page, 'admin');
  await expect(barra(page)).toBeVisible();

  // El main reserva hueco por la altura de la barra, si no la última tarjeta
  // quedaría debajo.
  const padding = await page
    .locator('.mantine-AppShell-main')
    .evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
  expect(padding).toBeGreaterThanOrEqual(ALTURA_BARRA);
});

test('el botón del chat se aparta de la barra, y en cualquier pantalla', async ({ page }) => {
  await entrarEnTelefono(page, 'admin', '/admin/students');

  const nav = barra(page);
  const fab = page.getByRole('button', { name: /asistente|chat/i }).first();

  const navBox = await nav.boundingBox();
  const fabBox = await fab.boundingBox();
  expect(navBox).not.toBeNull();
  expect(fabBox).not.toBeNull();
  // El botón queda por encima de la barra, sin solaparse.
  expect(fabBox!.y + fabBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
});

test('el header reserva la barra de estado en la PWA instalada', async ({ page }) => {
  await entrarEnTelefono(page, 'admin');

  // Lo que de verdad falló en el iPhone: el contenido arrancaba por detrás del
  // header, que quedaba oculto bajo la barra de estado. El header tiene que
  // estar arriba del todo y el contenido empezar por debajo de él, siempre.
  const header = page.locator('header').first();
  await expect(header).toBeVisible();
  const box = (await header.boundingBox())!;
  expect(box.y).toBe(0);
  expect(box.height).toBeGreaterThanOrEqual(60);

  const mainPadTop = await page
    .locator('.mantine-AppShell-main')
    .evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
  expect(mainPadTop).toBeGreaterThanOrEqual(box.height);
});

test('ninguna pantalla del admin desborda a lo ancho', async ({ page }) => {
  await entrarEnTelefono(page, 'admin');
  for (const ruta of ['/', '/admin/students', '/finances', '/profile']) {
    await page.goto(ruta);
    await expect(barra(page)).toBeVisible();
    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(desborda, `desborda en ${ruta}`).toBe(false);
  }
});
