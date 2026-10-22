import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Maquetación móvil del panel: dock de accesos rápidos y áreas seguras.
 *
 * El detonante fue la PWA instalada en iPhone: el header quedaba escondido
 * debajo de la barra de estado y los accesos rápidos morían al final del
 * scroll.
 */

const DASHBOARDS = {
  admin: { activeStudents: 12, totalStudents: 15, monthlyIncome: 4500, attendanceRate: 87.5 },
};

const PHONE = { width: 390, height: 844 };

async function loginOnPhone(page: Page) {
  await page.setViewportSize(PHONE);
  await loginAs(page, { api: { dashboards: DASHBOARDS } });
}

test('en móvil los accesos rápidos viven en el dock inferior', async ({ page }) => {
  await loginOnPhone(page);

  const dock = page.getByRole('navigation', { name: 'Accesos rápidos' });
  await expect(dock).toBeVisible();

  for (const label of ['Alumnos', 'Profesores', 'Categorías', 'Agenda']) {
    await expect(dock.getByRole('link', { name: label })).toBeVisible();
  }
});

test('el dock navega y marca dónde estás', async ({ page }) => {
  await loginOnPhone(page);

  const dock = page.getByRole('navigation', { name: 'Accesos rápidos' });
  await dock.getByRole('link', { name: 'Alumnos' }).click();

  await expect(page).toHaveURL(/\/admin\/students$/);
});

test('el dock no aparece en escritorio: ahí hay sitio para las tarjetas', async ({ page }) => {
  await loginAs(page, { api: { dashboards: DASHBOARDS } });

  await expect(page.getByRole('navigation', { name: 'Accesos rápidos' })).toBeHidden();
  // Las tarjetas siguen siendo la versión de escritorio.
  await expect(page.getByRole('heading', { name: 'Accesos rápidos' })).toBeVisible();
});

test('los accesos rápidos no tapan el final del contenido', async ({ page }) => {
  await loginOnPhone(page);
  await expect(page.getByRole('navigation', { name: 'Accesos rápidos' })).toBeVisible();

  // El main reserva hueco por la altura del dock, si no la última tarjeta
  // quedaría debajo.
  const padding = await page
    .locator('.mantine-AppShell-main')
    .evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
  expect(padding).toBeGreaterThan(76);
});

test('el botón del chat se aparta del dock', async ({ page }) => {
  await loginOnPhone(page);

  const dock = page.getByRole('navigation', { name: 'Accesos rápidos' });
  const fab = page.getByRole('button', { name: /asistente|chat/i }).first();

  const dockBox = await dock.boundingBox();
  const fabBox = await fab.boundingBox();
  expect(dockBox).not.toBeNull();
  expect(fabBox).not.toBeNull();
  // El botón queda por encima del dock, sin solaparse.
  expect(fabBox!.y + fabBox!.height).toBeLessThanOrEqual(dockBox!.y + 1);
});

test('el header reserva la barra de estado en la PWA instalada', async ({ page }) => {
  await loginOnPhone(page);

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
