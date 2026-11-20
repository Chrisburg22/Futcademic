import { test, expect, type Page } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Lo que ven en el teléfono las familias: alumno y padre.
 *
 * Dos de estas pruebas son de regresión de defectos reales, no de diseño:
 *  · el alumno que entraba a `/attendance` aterrizaba en el pase de lista del
 *    profesor, con selector de categoría y switches para marcar a sus compañeros;
 *  · el padre que tocaba «Asistencias» en Inicio llegaba con `?student_id=` en la
 *    URL a un selector vacío, porque la pantalla nunca leía la query.
 */

const PHONE = { width: 390, height: 844 };

const HIJO = {
  id: 's1',
  full_name: 'Beatriz Soto',
  birth_date: '2014-03-10',
  category_id: 'c1',
  category: { id: 'c1', name: 'Sub-12', color: '#1971c2' },
  status: 'activo',
};

const ASISTENCIAS = [
  { id: 'a1', date: '2026-11-02', type: 'entrenamiento', present: true },
  { id: 'a2', date: '2026-11-04', type: 'entrenamiento', present: false },
  { id: 'a3', date: '2026-11-06', type: 'partido', present: true },
];

const PERFIL_PADRE = {
  id: 'u-pa',
  email: 'padre@futcademic.test',
  full_name: 'María López',
  role: 'padre' as const,
  onboarded_at: '2026-01-01T00:00:00Z',
};

const PERFIL_ALUMNO = {
  id: 'u-al',
  email: 'alumno@futcademic.test',
  full_name: 'Beatriz Soto',
  role: 'alumno' as const,
  onboarded_at: '2026-01-01T00:00:00Z',
};

const API_PADRE = {
  students: [HIJO],
  dashboards: { padre: { childrenCount: 1, paymentAlert: null } },
  extra: {
    '/attendances/student/s1': ASISTENCIAS,
    '/payments/account-statement/s1': {
      studentName: HIJO.full_name,
      category: 'Sub-12',
      monthlyFee: 500,
      pendingAmount: 500,
      totalPaid: 1000,
      totalPayments: 2,
      hasPaidThisMonth: false,
      movements: [{ date: '2026-10-05', amount: 500, description: 'Mensualidad octubre' }],
    },
  },
};

const API_ALUMNO = {
  dashboards: {
    alumno: {
      currentStreak: 3,
      trainingsThisMonth: 8,
      achievementsUnlocked: 2,
      category: 'Sub-12',
      nextTraining: 'Martes 18:00, Cancha 1',
    },
  },
  achievements: {
    unlockedCount: 2,
    totalCount: 6,
    achievements: [
      { id: 'l1', name: 'Primer entrenamiento', description: 'Asististe por primera vez', unlocked: true, unlocked_at: '2026-02-01' },
      { id: 'l2', name: 'Racha de 5', description: 'Cinco sesiones seguidas', unlocked: false },
    ],
  },
  extra: {
    '/attendances/student/u-al': ASISTENCIAS,
    '/students/u-al/stats': {
      currentStreak: 3,
      maxStreak: 5,
      trainingsThisMonth: 8,
      attendedThisMonth: 6,
      achievementsUnlocked: 2,
      totalAchievements: 6,
    },
    '/students/u-al/team': {
      teamName: 'Sub-12',
      color: '#1971c2',
      birthYear: 2014,
      totalTeammates: 2,
      teachers: [{ id: 't1', name: 'Luis Entrenador', avatar: null }],
      schedules: [{ id: 'h1', name: 'Martes', time: '18:00', venue: 'Cancha 1' }],
      teammates: [{ id: 's2', full_name: 'Carlos López', avatar_url: null }],
    },
  },
};

const entrar = async (page: Page, perfil: object, api: object, goto?: string) => {
  await page.setViewportSize(PHONE);
  await loginAs(page, { profile: perfil, api, goto });
};

const sinDesborde = async (page: Page, ruta: string) => {
  const desborda = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(desborda, `desborda a lo ancho en ${ruta}`).toBe(false);
};

test('el alumno ve su propia asistencia, no el pase de lista del profesor', async ({ page }) => {
  await entrar(page, PERFIL_ALUMNO, API_ALUMNO, '/attendance');

  await expect(page.getByRole('heading', { name: 'Mi asistencia' })).toBeVisible();
  // Lo que delataba el bug: el pase de lista pide elegir categoría y pinta un
  // switch por alumno.
  await expect(page.getByLabel('Categoría')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Guardar asistencias' })).toHaveCount(0);
  await expect(page.getByText('Selecciona una categoría para mostrar alumnos.')).toHaveCount(0);

  // Y sí ve lo suyo: cuántas sesiones hay y cuántas asistió.
  await expect(page.getByText('de 3 sesiones')).toBeVisible();
  await expect(page.getByText('Últimas sesiones')).toBeVisible();
  await sinDesborde(page, '/attendance');
});

test('el padre que llega con un hijo en la URL ve su historial, sin selector', async ({ page }) => {
  await entrar(page, PERFIL_PADRE, API_PADRE, '/attendance?student_id=s1');

  // Con un solo hijo el selector no aporta nada y no debe pedir que elija.
  await expect(page.getByText('Selecciona un hijo/a para ver su historial.')).toHaveCount(0);
  await expect(page.getByText(/Beatriz Soto/).first()).toBeVisible();
  await sinDesborde(page, '/attendance?student_id=s1');
});

test('desde Inicio, el padre llega al hijo correcto', async ({ page }) => {
  await entrar(page, PERFIL_PADRE, API_PADRE);

  // Por su etiqueta exacta: «Asistencias» a secas también está en el cajón
  // lateral, que en móvil queda fuera del viewport pero sigue en el DOM.
  await page.getByRole('link', { name: 'Asistencias de Beatriz Soto' }).click();
  await expect(page).toHaveURL(/student_id=s1/);
  await expect(page.getByText('Selecciona un hijo/a para ver su historial.')).toHaveCount(0);
});

test('ninguna pantalla del alumno desborda a lo ancho', async ({ page }) => {
  await entrar(page, PERFIL_ALUMNO, API_ALUMNO);
  for (const ruta of ['/', '/attendance', '/stats', '/team', '/achievements', '/profile']) {
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');
    await sinDesborde(page, ruta);
  }
});

test('ninguna pantalla del padre desborda a lo ancho', async ({ page }) => {
  await entrar(page, PERFIL_PADRE, API_PADRE);
  for (const ruta of ['/', '/children', '/finances', '/attendance', '/profile']) {
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');
    await sinDesborde(page, ruta);
  }
});

test('si la API falla, cada pantalla ofrece reintentar', async ({ page }) => {
  await entrar(page, PERFIL_ALUMNO, API_ALUMNO);

  // Playwright resuelve las rutas en orden inverso al de registro, así que esta
  // gana sobre el mock de `loginAs`.
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' }),
  );

  for (const ruta of ['/attendance', '/stats', '/team', '/achievements']) {
    await page.goto(ruta);
    await expect(
      page.getByRole('button', { name: 'Intentar de nuevo' }),
      `sin reintento en ${ruta}`,
    ).toBeVisible();
  }
});
