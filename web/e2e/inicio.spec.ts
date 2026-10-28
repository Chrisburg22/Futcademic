import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Inicio del administrador: tablero de la jornada. Lo que se comprueba aquí es
 * que los indicadores digan qué significan y que cada aviso lleve al listado
 * ya filtrado, no que se vea bonito.
 */

// Fecha local, no UTC: el componente compara contra el día del navegador y
// con `toISOString()` la agenda diría "Mañana" después de las 18:00 en México.
const HOY = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const CATEGORIAS = [{ id: 'c1', name: 'Sub-12', birth_year: '2014', color: '#1971c2' }];

const ALUMNOS = [
  {
    id: 's1',
    full_name: 'Ángel Ramírez',
    birth_date: '2014-03-10',
    category_id: 'c1',
    category: CATEGORIAS[0],
    parent_id: 'p1',
    parent: { id: 'p1', full_name: 'María López' },
    status: 'activo',
    uniform_delivered: true,
    expediente_status: 'completo',
    expediente_missing: [],
    emergency_contact_phone: '55 9999 8888',
    created_at: `${HOY}T09:00:00Z`,
  },
  {
    id: 's2',
    full_name: 'Carlos López',
    birth_date: '2014-05-02',
    category_id: 'c1',
    category: CATEGORIAS[0],
    parent_id: null,
    parent: null,
    status: 'activo',
    uniform_delivered: false,
    expediente_status: 'sin_tutor',
    expediente_missing: [],
    created_at: '2026-01-10T10:00:00Z',
  },
];

const DASHBOARDS = {
  admin: {
    activeStudents: 2,
    totalStudents: 2,
    monthlyIncome: 4500,
    pendingPayments: 1,
    attendanceRate: 85.7,
    upcomingEvents: [
      {
        id: 'e1',
        date: HOY,
        start_time: '18:00:00',
        type: 'entrenamiento',
        description: 'Técnica individual',
        category: { name: 'Sub-12' },
      },
    ],
  },
};

const COBRANZA = [
  { id: 's1', full_name: 'Ángel Ramírez', monthly_fee: 500, paid_amount: 0, pending_amount: 500 },
];

const api = {
  students: ALUMNOS,
  categories: CATEGORIAS,
  pendingPayments: COBRANZA,
  dashboards: DASHBOARDS,
  users: [{ id: 'p1', full_name: 'María López', role: 'padre' }],
};

test('los indicadores de Inicio dicen qué significan', async ({ page }) => {
  await loginAs(page, { api });

  await expect(page.getByText('Alumnos activos')).toBeVisible();
  await expect(page.getByText('de 2 en la academia')).toBeVisible();
  await expect(page.getByText('86%')).toBeVisible();
  await expect(page.getByRole('link', { name: /Por cobrar/ })).toContainText(
    '1 alumno con adeudo',
  );
  await expect(page.getByText('Ingreso mensual')).toBeVisible();

  await page.screenshot({ path: '/private/tmp/claude-501/shots/inicio.png', fullPage: true });
});

test('cada aviso de «Por atender» abre el listado ya filtrado', async ({ page }) => {
  await loginAs(page, { api });

  const aviso = page.getByRole('link', { name: /sin tutor asignado/ });
  await expect(aviso).toBeVisible();
  await aviso.click();

  await expect(page).toHaveURL(/\/admin\/students\?tutor=sin/);
  await expect(page.getByText('1 de 2 alumnos')).toBeVisible();
  await expect(page.getByRole('table')).toContainText('Carlos López');
});

test('la agenda muestra lo de esta semana y las altas recientes', async ({ page }) => {
  await loginAs(page, { api });

  await expect(page.getByText('Próximos 7 días')).toBeVisible();
  await expect(page.getByText('Técnica individual')).toBeVisible();
  await expect(page.getByText('Hoy', { exact: true })).toBeVisible();

  const altas = page.getByRole('link', { name: 'Abrir ficha de Ángel Ramírez' });
  await expect(altas).toBeVisible();
});
