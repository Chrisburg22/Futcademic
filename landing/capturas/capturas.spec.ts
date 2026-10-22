import { test, type Page } from '@playwright/test';
import { loginAs } from '../../web/e2e/helpers';
import { API, CATEGORIES, DASH, EVENTS, ONBOARDED, STUDENTS } from './datos';

/**
 * Capturas reales del panel para el landing.
 * Salida: `landing/public/capturas/*.png`
 */

const OUT = 'public/capturas';

async function asentar(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  // Deja que Mantine termine transiciones y que Recharts dibuje.
  await page.waitForTimeout(1200);
}

async function tomar(page: Page, nombre: string, alto?: number) {
  await asentar(page);
  // Las pantallas de rol ocupan poco: se recorta el blanco sobrante.
  if (alto) await page.setViewportSize({ width: 1280, height: alto });
  await page.screenshot({ path: `${OUT}/${nombre}.png` });
}

test.describe.configure({ mode: 'serial' });

test('dashboard admin', async ({ page }) => {
  await loginAs(page, { api: API });
  await tomar(page, 'dashboard-admin');
});

test('alumnos', async ({ page }) => {
  await loginAs(page, { api: API, goto: '/admin/students' });
  await tomar(page, 'alumnos');
});

test('asistencias', async ({ page }) => {
  await loginAs(page, { api: API, goto: '/attendance' });
  // Sin categoría seleccionada la pantalla muestra el estado vacío.
  await asentar(page);
  await page.getByPlaceholder('Selecciona').first().click();
  await page.getByRole('option', { name: 'Sub-12' }).click();
  await tomar(page, 'asistencias');
});

test('finanzas', async ({ page }) => {
  await loginAs(page, { api: API, goto: '/finances' });
  await tomar(page, 'finanzas');
});

test('agenda', async ({ page }) => {
  await loginAs(page, { api: API, goto: '/admin/events' });
  await tomar(page, 'agenda');
});

test('dashboard profesor', async ({ page }) => {
  // Solo sus categorías, con los alumnos que las integran (`c.students`).
  const misCategorias = [
    { ...CATEGORIES[0], students: STUDENTS.filter((a) => a.category_id === 'cat1') },
  ];
  await loginAs(page, {
    profile: { id: 'user-prof-1', email: 'garcia@academia.mx', onboarded_at: ONBOARDED, full_name: 'Luis García', role: 'profesor' },
    api: {
      ...API,
      categories: misCategorias,
      events: EVENTS.filter((e) => e.category_id === 'cat1'),
      trainings: EVENTS.filter((e) => e.category_id === 'cat1' && e.type === 'entrenamiento'),
      dashboards: { ...DASH, profesor: { ...DASH.profesor, myCategories: misCategorias } },
    },
  });
  await tomar(page, 'dashboard-profesor', 520);
});

test('dashboard padre', async ({ page }) => {
  // Un padre ve solo a sus hijos: la fixture se recorta a dos hermanos.
  const hijos = [STUDENTS[0], STUDENTS[1]];
  await loginAs(page, {
    profile: { id: 'user-padre-1', email: 'maria@correo.mx', onboarded_at: ONBOARDED, full_name: 'María López', role: 'padre' },
    api: { ...API, students: hijos, dashboards: { ...DASH, padre: { ...DASH.padre, children: hijos } } },
  });
  await tomar(page, 'dashboard-padre', 520);
});

test('dashboard alumno', async ({ page }) => {
  await loginAs(page, {
    profile: { id: 'user-alumno-1', email: 'carlos@academia.mx', onboarded_at: ONBOARDED, full_name: 'Carlos López', role: 'alumno' },
    api: API,
  });
  await tomar(page, 'dashboard-alumno', 560);
});
