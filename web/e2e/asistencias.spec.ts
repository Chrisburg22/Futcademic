import { test, expect, type Page } from '@playwright/test';
import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import { loginAs } from './helpers';

// La app formatea fechas en español (src/lib/dates.ts); el test compara con
// esos mismos textos.
dayjs.locale('es');

/**
 * Sección de asistencias: pase de lista (sesión del día, tri-estado, filtros,
 * guardado) e histórico (por alumno y por sesión). Backend simulado.
 */

const HOY = dayjs().format('YYYY-MM-DD');

const CATEGORIAS = [
  { id: 'c1', name: 'Sub-12', birth_year: '2014' },
  { id: 'c2', name: 'Sub-14', birth_year: '2012' },
];

const ALUMNOS = [
  {
    id: 's1',
    full_name: 'Ana Ruiz',
    birth_date: '2014-04-02',
    category_id: 'c1',
    category: CATEGORIAS[0],
    status: 'activo',
    parent_id: 'p1',
    parent: { id: 'p1', full_name: 'María López', phone: '5512345678' },
  },
  {
    id: 's2',
    full_name: 'Bruno Díaz',
    birth_date: '2014-09-15',
    category_id: 'c1',
    category: CATEGORIAS[0],
    status: 'activo',
    medical_notes: 'Asma leve',
  },
  {
    id: 's3',
    full_name: 'Carla Soto',
    birth_date: '2014-01-20',
    category_id: 'c1',
    category: CATEGORIAS[0],
    status: 'activo',
  },
  {
    id: 's4',
    full_name: 'Diego Luna',
    birth_date: '2014-06-06',
    category_id: 'c1',
    category: CATEGORIAS[0],
    status: 'inactivo',
  },
];

/** Una marca de asistencia hace `n` días. */
const marca = (id: string, studentId: string, dias: number, present: boolean) => ({
  id,
  student_id: studentId,
  category_id: 'c1',
  training_id: null,
  date: dayjs().subtract(dias, 'day').format('YYYY-MM-DD'),
  type: 'entrenamiento',
  present,
  created_at: dayjs().subtract(dias, 'day').toISOString(),
  student: { full_name: studentId === 's1' ? 'Ana Ruiz' : 'Bruno Díaz' },
});

// Ana viene casi siempre; Bruno lleva tres faltas seguidas (en riesgo);
// Carla no tiene historial y Diego está inactivo.
const ASISTENCIAS = [
  ...[3, 6, 9, 12, 15].map((d, i) => marca(`a${i}`, 's1', d, true)),
  ...[18].map((d, i) => marca(`a5${i}`, 's1', d, false)),
  ...[3, 6, 9].map((d, i) => marca(`b${i}`, 's2', d, false)),
  ...[12, 15, 18].map((d, i) => marca(`b3${i}`, 's2', d, true)),
];

const SESIONES = [
  {
    id: 't1',
    date: HOY,
    start_time: '18:00:00',
    type: 'entrenamiento',
    is_completed: false,
    category: { name: 'Sub-12' },
    event: { name: 'Entrenamiento Sub-12' },
    venue: { name: 'Cancha 1' },
  },
];

async function abrirAsistencias(page: Page, ruta = '/attendance?categoria=c1') {
  await loginAs(page, {
    goto: ruta,
    api: {
      students: ALUMNOS,
      categories: CATEGORIAS,
      attendances: ASISTENCIAS,
      trainings: SESIONES,
    },
  });
  await expect(page.getByRole('heading', { name: 'Asistencias' })).toBeVisible();
}

test.describe('Pase de lista', () => {
  test('arranca en hoy, con la sesión agendada y la lista sin marcar', async ({ page }) => {
    await abrirAsistencias(page);

    await expect(page.getByRole('textbox', { name: 'Categoría' })).toHaveValue('Sub-12');
    // La sesión del calendario aporta hora y sede.
    await expect(page.getByText('18:00')).toBeVisible();
    await expect(page.getByText('Cancha 1')).toBeVisible();

    // Diego está inactivo: fuera de la lista mientras nadie lo marque.
    await expect(page.getByText('3 de 4 alumnos')).toBeVisible();
    await expect(page.getByText('Diego Luna')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Incluir inactivos (1)' })).toBeVisible();

    // Nada marcado todavía: no hay nada que guardar.
    await expect(page.getByRole('button', { name: 'Guardar pase de lista' })).toBeDisabled();
  });

  test('marca, desmarca y avisa de los alumnos sin marcar al guardar', async ({ page }) => {
    await abrirAsistencias(page);

    await page.getByLabel('Presente: Ana Ruiz').click();
    await expect(page.getByLabel('Presente: Ana Ruiz')).toHaveAttribute('aria-pressed', 'true');
    await page.getByLabel('Ausente: Bruno Díaz').click();
    await expect(page.getByText(/1 de 3 presentes/)).toBeVisible();
    await expect(page.getByText('Cambios sin guardar')).toBeVisible();

    // Un segundo clic en la misma marca la quita (vuelve a «sin marcar»).
    await page.getByLabel('Ausente: Bruno Díaz').click();
    await expect(page.getByLabel('Ausente: Bruno Díaz')).toHaveAttribute('aria-pressed', 'false');

    await page.getByRole('button', { name: 'Guardar pase de lista' }).click();
    await expect(page.getByText('2 alumnos sin marcar')).toBeVisible();
    await page.getByRole('button', { name: 'Guardar como ausentes' }).click();
    await expect(page.getByText('Pase de lista guardado')).toBeVisible();
  });

  test('las acciones masivas solo tocan a los alumnos filtrados', async ({ page }) => {
    await abrirAsistencias(page);

    await page.getByLabel('Buscar alumno').fill('bruno');
    await expect(page.getByText('1 de 4 alumnos')).toBeVisible();
    await page.getByRole('button', { name: 'Todos presentes' }).click();

    await page.getByLabel('Borrar búsqueda').click();
    await expect(page.getByLabel('Presente: Bruno Díaz')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel('Presente: Ana Ruiz')).toHaveAttribute('aria-pressed', 'false');
  });

  test('el historial previo de cada alumno se ve junto a su marca', async ({ page }) => {
    await abrirAsistencias(page);

    const bruno = page.getByRole('row', { name: /Bruno Díaz/ });
    await expect(bruno.getByLabel('3 faltas seguidas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'En riesgo (1)' })).toBeVisible();

    // Filtrar por riesgo deja solo a quien hay que atender.
    await page.getByRole('button', { name: 'En riesgo (1)' }).click();
    await expect(page.getByText('1 de 4 alumnos')).toBeVisible();
  });
});

test.describe('Histórico', () => {
  test('resume la categoría, señala el riesgo y guarda la vista en la URL', async ({ page }) => {
    await abrirAsistencias(page);
    await page.getByRole('tab', { name: 'Histórico' }).click();

    await expect(page.getByText('Asistencia media')).toBeVisible();
    await expect(page.getByText(/dejando de venir/)).toBeVisible();

    await page.getByRole('textbox', { name: 'Periodo' }).click();
    await page.getByRole('option', { name: 'Todo el historial' }).click();
    await expect(page).toHaveURL(/vista=historico/);
    await expect(page).toHaveURL(/periodo=todo/);

    // Por alumno: Bruno (50%) antes que Ana, porque ordena peor primero.
    const filas = page.getByRole('row');
    await expect(filas.filter({ hasText: 'Bruno Díaz' })).toBeVisible();
    await expect(filas.filter({ hasText: 'Ana Ruiz' })).toBeVisible();
  });

  test('por sesión agrupa cada día y permite abrir su pase de lista', async ({ page }) => {
    await abrirAsistencias(page, '/attendance?categoria=c1&vista=historico');

    await page.getByLabel('Forma de ver el histórico').getByText('Por sesión').click();
    const sesion = dayjs().subtract(3, 'day').format('ddd DD MMM YYYY');
    await page.getByRole('button', { name: new RegExp(sesion, 'i') }).click();
    const panel = page.getByRole('region');
    await expect(panel.getByText('Asistieron (1)')).toBeVisible();
    await expect(panel.getByText('Faltaron (1)')).toBeVisible();

    await panel.getByRole('button', { name: 'Abrir pase de lista de este día' }).click();
    await expect(page.getByRole('tab', { name: 'Pase de lista' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});

test('El padre ve el porcentaje de asistencia de su hijo', async ({ page }) => {
  await loginAs(page, {
    goto: '/attendance',
    profile: {
      id: 'p1',
      role: 'padre',
      full_name: 'María López',
      email: 'padre@futcademic.test',
      onboarded_at: '2026-01-01',
    },
    api: { students: [ALUMNOS[0]], attendances: ASISTENCIAS },
  });

  await expect(page.getByRole('heading', { name: 'Asistencias' })).toBeVisible();
  // Con un solo hijo no hay nada que elegir: su historial sale directo.
  await expect(page.getByText('Sesiones registradas')).toBeVisible();
  await expect(page.getByText('83%')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Asistió' }).first()).toBeVisible();
});
