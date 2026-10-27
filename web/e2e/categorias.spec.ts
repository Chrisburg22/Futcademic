import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Módulo Categorías: listado con búsqueda y estados, asistente de creación con
 * validación visible, archivado y lo que ve cada rol.
 */

const CATEGORIES = [
  {
    id: 'cat1',
    school_id: 'school-1',
    name: 'Sub-12',
    description: 'Generación mixta',
    birth_year: '2012-2013',
    color: '#1971c2',
    monthly_fee: 500,
    max_students: 20,
    status: 'activa',
    students_count: 12,
    coaches_count: 2,
    teacher: 'Prof. García',
    teacher_id: 't1',
    all_teachers: [
      { id: 't1', full_name: 'Prof. García' },
      { id: 't2', full_name: 'Prof. Ruiz' },
    ],
  },
  {
    id: 'cat2',
    school_id: 'school-1',
    name: 'Sub-8',
    birth_year: '2017',
    color: '#e8590c',
    monthly_fee: 400,
    status: 'activa',
    students_count: 0,
    coaches_count: 0,
    all_teachers: [],
  },
  {
    id: 'cat3',
    school_id: 'school-1',
    name: 'Sub-20 (temporada pasada)',
    birth_year: 'Porteros',
    status: 'archivada',
    students_count: 3,
    coaches_count: 0,
    all_teachers: [],
  },
];

const TEACHERS = [
  { id: 't1', full_name: 'Prof. García', email: 'garcia@test.com', role: 'profesor' },
  { id: 't2', full_name: 'Prof. Ruiz', email: 'ruiz@test.com', role: 'profesor' },
];

const PERMISOS_SIN_GESTION = {
  can_take_attendance: true,
  can_manage_events: false,
  can_view_finances: false,
  can_manage_students: true,
  can_manage_payments: false,
  can_manage_categories: false,
};

const API = {
  categories: CATEGORIES,
  teachers: TEACHERS,
  users: TEACHERS,
  venues: [{ id: 'v1', name: 'Cancha 1' }],
  notifications: [],
};

test('la lista muestra plantel, entrenadores, mensualidad y estado', async ({ page }) => {
  await loginAs(page, { api: API, goto: '/admin/categories' });

  const fila = page.getByRole('row', { name: /Sub-12/ });
  await expect(fila).toBeVisible();
  // La generación se muestra tal como la escribió la academia.
  await expect(fila.getByText('2012-2013')).toBeVisible();
  await expect(fila.getByText('12/20')).toBeVisible();
  await expect(fila.getByText('$500')).toBeVisible();
  await expect(fila.getByText('Activa')).toBeVisible();

  // Por defecto las archivadas no aparecen.
  await expect(page.getByRole('row', { name: /temporada pasada/ })).toHaveCount(0);
});

test('la búsqueda filtra el listado', async ({ page }) => {
  await loginAs(page, { api: API, goto: '/admin/categories' });

  await page.getByLabel('Buscar').fill('Sub-8');
  await expect(page.getByRole('row', { name: /Sub-8/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Sub-12/ })).toHaveCount(0);
});

test('el filtro de estado deja ver las archivadas', async ({ page }) => {
  await loginAs(page, { api: API, goto: '/admin/categories' });

  await page.getByRole('textbox', { name: 'Estado' }).click();
  await page.getByRole('option', { name: 'Archivada' }).click();

  await expect(page.getByRole('row', { name: /temporada pasada/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Sub-12/ })).toHaveCount(0);
});

test('el asistente valida el nombre antes de avanzar', async ({ page }) => {
  await loginAs(page, { api: API, goto: '/admin/categories' });

  await page.getByRole('button', { name: 'Nueva categoría' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('button', { name: 'Continuar' }).click();

  // El error se ve y el asistente no pasa de paso: antes no había validación
  // y el 400 del backend se perdía en silencio.
  await expect(modal.getByText('El nombre necesita al menos 2 caracteres')).toBeVisible();
  await expect(modal.getByLabel('Nombre')).toBeVisible();
});

test('el asistente crea una categoría con horario', async ({ page }) => {
  await loginAs(page, { api: API, goto: '/admin/categories' });

  await page.getByRole('button', { name: 'Nueva categoría' }).click();
  const modal = page.getByRole('dialog');

  await modal.getByLabel('Nombre').fill('Sub-14');
  await modal.getByLabel('Generación').fill('2011-2012');
  await modal.getByRole('button', { name: 'Continuar' }).click();

  await modal.getByLabel('Entrenadores').click();
  await page.getByRole('option', { name: 'Prof. García' }).click();
  await page.keyboard.press('Escape');
  await modal.getByRole('button', { name: 'Continuar' }).click();

  await modal.getByRole('checkbox', { name: 'Lun' }).check();
  await modal.getByLabel('Hora de inicio').fill('18:00');
  await expect(modal.getByText(/Se generarán 12 entrenamientos/)).toBeVisible();

  await modal.getByRole('button', { name: 'Crear categoría' }).click();
  await expect(page.getByText(/Categoría creada con 12 entrenamientos/)).toBeVisible();
});

test('editar conserva la generación aunque no sea un año', async ({ page }) => {
  await loginAs(page, { api: API, goto: '/admin/categories' });

  // Con filtros por defecto las archivadas no salen, así que pedimos todas.
  await page.getByRole('textbox', { name: 'Estado' }).click();
  await page.getByRole('option', { name: 'Todas' }).click();

  await page.getByRole('row', { name: /Porteros/ }).getByRole('button', { name: 'Editar' }).click();

  // El campo antes era un Select de años sueltos: "Porteros" no coincidía con
  // ninguna opción, salía vacío y al guardar se perdía la etiqueta.
  await expect(page.getByRole('dialog').getByLabel('Generación')).toHaveValue('Porteros');
});

test('archivar pide confirmación explícita', async ({ page }) => {
  await loginAs(page, { api: API, goto: '/admin/categories' });

  const fila = page.getByRole('row', { name: /Sub-12/ });
  await fila.getByRole('button', { name: 'Archivar' }).click();

  const confirmacion = page.getByRole('dialog');
  await expect(confirmacion.getByText(/saldrá del listado/)).toBeVisible();
  // Avisa de los jugadores que seguirán generando mensualidad.
  await expect(confirmacion.getByText(/12 jugadores/)).toBeVisible();

  await confirmacion.getByRole('button', { name: 'Archivar' }).click();
  await expect(page.getByText('Categoría archivada')).toBeVisible();
});

test('el detalle trae métricas y pestañas sin pedir toda la lista', async ({ page }) => {
  await loginAs(page, {
    api: { ...API, categoryDetail: { ...CATEGORIES[0], sessions_count: 24, upcoming_sessions_count: 6, schedule: [{ id: 'ev1', name: 'Entrenamiento', start_time: '18:00', venue: 'Cancha 1' }] } },
    goto: '/admin/categories/cat1',
  });

  await expect(page.getByRole('heading', { name: 'Sub-12' })).toBeVisible();
  await expect(page.getByText('12/20')).toBeVisible();
  await expect(page.getByText('24')).toBeVisible();

  // Mantine deja montados todos los paneles, así que hay que acotar al panel.
  await page.getByRole('tab', { name: 'Entrenadores' }).click();
  await expect(page.getByLabel('Entrenadores').getByText('Prof. Ruiz')).toBeVisible();

  await page.getByRole('tab', { name: 'Resumen' }).click();
  await expect(page.getByLabel('Resumen').getByText('Cancha 1')).toBeVisible();
});

test('el profesor sin permiso solo ve sus categorías, en lectura', async ({ page }) => {
  await loginAs(page, {
    profile: {
      id: 'prof-1',
      email: 'profe@test.com',
      full_name: 'Prof. García',
      role: 'profesor',
      school_id: 'school-1',
      onboarded_at: '2025-01-01',
    },
    api: { ...API, permissions: PERMISOS_SIN_GESTION },
    goto: '/admin/categories',
  });

  await expect(page.getByRole('row', { name: /Sub-12/ })).toBeVisible();
  // `can_manage_categories` en false: ni crear ni editar.
  await expect(page.getByRole('button', { name: 'Nueva categoría' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0);
});

test('el profesor con permiso puede crear', async ({ page }) => {
  await loginAs(page, {
    profile: {
      id: 'prof-1',
      email: 'profe@test.com',
      full_name: 'Prof. García',
      role: 'profesor',
      school_id: 'school-1',
      onboarded_at: '2025-01-01',
    },
    api: { ...API, permissions: { ...PERMISOS_SIN_GESTION, can_manage_categories: true } },
    goto: '/admin/categories',
  });

  await expect(page.getByRole('button', { name: 'Nueva categoría' })).toBeVisible();
});

test('el sidebar ofrece Categorías al profesor', async ({ page }) => {
  await loginAs(page, {
    profile: {
      id: 'prof-1',
      email: 'profe@test.com',
      full_name: 'Prof. García',
      role: 'profesor',
      school_id: 'school-1',
      onboarded_at: '2025-01-01',
    },
    api: {
      ...API,
      permissions: PERMISOS_SIN_GESTION,
      dashboards: { profesor: { categoriesCount: 1, myCategories: CATEGORIES } },
    },
  });

  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Categorías' }),
  ).toBeVisible();
});

test('el padre no ve el módulo en el sidebar', async ({ page }) => {
  await loginAs(page, {
    profile: {
      id: 'padre-1',
      email: 'padre@test.com',
      full_name: 'María López',
      role: 'padre',
      school_id: 'school-1',
      onboarded_at: '2025-01-01',
    },
    api: { ...API, dashboards: { padre: { children: [] } } },
  });

  // Su vista de la categoría vive en "Mis hijos", no en el módulo de gestión.
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Categorías' }),
  ).toHaveCount(0);
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Mis hijos' })).toBeVisible();
});
