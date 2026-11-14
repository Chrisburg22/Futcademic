import { test, expect, type Page } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Capturas de las vistas en teléfono (390×844).
 *
 * No es una prueba de regresión: sirve para ver cómo quedó el rediseño móvil
 * sin levantar la app a mano. Las imágenes van al directorio de trabajo
 * temporal, no al repo.
 */

const DIR = process.env.SHOTS_DIR || '/tmp/capturas';
const PHONE = { width: 390, height: 844 };

const CATEGORIA = { id: 'c1', name: 'Sub-12', birth_year: '2014', color: '#1971c2' };

const ASISTENCIAS = [
  { id: 'a1', date: '2026-10-07', type: 'entrenamiento', present: true },
  { id: 'a2', date: '2026-10-09', type: 'entrenamiento', present: true },
  { id: 'a3', date: '2026-10-14', type: 'partido', present: false },
  { id: 'a4', date: '2026-10-16', type: 'entrenamiento', present: true },
  { id: 'a5', date: '2026-10-21', type: 'entrenamiento', present: true },
  { id: 'a6', date: '2026-10-23', type: 'entrenamiento', present: false },
  { id: 'a7', date: '2026-10-28', type: 'partido', present: true },
  { id: 'a8', date: '2026-11-04', type: 'entrenamiento', present: true },
  { id: 'a9', date: '2026-11-06', type: 'entrenamiento', present: true },
];

const EQUIPO = {
  teamName: 'Sub-12',
  color: '#1971c2',
  birthYear: 2014,
  totalTeammates: 3,
  teachers: [{ id: 't1', name: 'Luis Hernández', avatar: null }],
  schedules: [
    { id: 'h1', name: 'Martes', time: '18:00', venue: 'Cancha 1' },
    { id: 'h2', name: 'Jueves', time: '18:00', venue: 'Cancha 1' },
  ],
  teammates: [
    { id: 's2', full_name: 'Carlos López', avatar_url: null },
    { id: 's3', full_name: 'Diana Cruz', avatar_url: null },
    { id: 's4', full_name: 'Esteban Gil', avatar_url: null },
  ],
};

const STATS = {
  currentStreak: 3,
  maxStreak: 6,
  trainingsThisMonth: 9,
  attendedThisMonth: 7,
  achievementsUnlocked: 2,
  totalAchievements: 6,
};

const LOGROS = {
  unlockedCount: 2,
  totalCount: 6,
  achievements: [
    { id: 'l1', name: 'Primer entrenamiento', description: 'Asististe por primera vez', unlocked: true, unlocked_at: '2026-02-03' },
    { id: 'l2', name: 'Racha de 5', description: 'Cinco sesiones seguidas', unlocked: true, unlocked_at: '2026-09-18' },
    { id: 'l3', name: 'Racha de 10', description: 'Diez sesiones seguidas', unlocked: false },
    { id: 'l4', name: 'Mes perfecto', description: 'No faltaste ningún día del mes', unlocked: false },
    { id: 'l5', name: 'Primer partido', description: 'Jugaste tu primer partido', unlocked: false },
    { id: 'l6', name: 'Capitán', description: 'Fuiste capitán una vez', unlocked: false },
  ],
};

const PERFIL_ALUMNO = {
  id: 'u-al',
  email: 'beatriz@alumno.futcademic.local',
  full_name: 'Beatriz Soto',
  role: 'alumno' as const,
  onboarded_at: '2026-01-01T00:00:00Z',
};

const API_ALUMNO = {
  dashboards: {
    alumno: {
      currentStreak: 3,
      trainingsThisMonth: 9,
      achievementsUnlocked: 2,
      category: 'Sub-12',
      nextTraining: 'Martes 18:00 · Cancha 1',
    },
  },
  achievements: LOGROS,
  extra: {
    '/attendances/student/u-al': ASISTENCIAS,
    '/students/u-al/stats': STATS,
    '/students/u-al/team': EQUIPO,
  },
};

const HIJOS = [
  {
    id: 's1',
    full_name: 'Beatriz Soto',
    birth_date: '2014-03-10',
    category_id: 'c1',
    category: CATEGORIA,
    status: 'activo',
  },
  {
    id: 's5',
    full_name: 'Mateo Soto',
    birth_date: '2017-08-02',
    category_id: 'c1',
    category: { ...CATEGORIA, id: 'c2', name: 'Sub-9' },
    status: 'pendiente_pago',
  },
];

const PERFIL_PADRE = {
  id: 'u-pa',
  email: 'maria@futcademic.local',
  full_name: 'María López',
  role: 'padre' as const,
  onboarded_at: '2026-01-01T00:00:00Z',
};

const API_PADRE = {
  students: HIJOS,
  dashboards: { padre: { childrenCount: 2, paymentAlert: 'Mateo tiene 1 pago pendiente de $500' } },
  payments: [
    { id: 'p1', payment_date: '2026-10-05', amount: 500, description: 'Mensualidad octubre' },
    { id: 'p2', payment_date: '2026-09-04', amount: 500, description: 'Mensualidad septiembre' },
    { id: 'p3', payment_date: '2026-08-06', amount: 500, description: 'Mensualidad agosto' },
  ],
  extra: {
    '/attendances/student/s1': ASISTENCIAS,
    '/students/s1/team': EQUIPO,
    '/payments/account-statement/s1': {
      studentName: 'Beatriz Soto',
      category: 'Sub-12',
      monthlyFee: 500,
      pendingAmount: 500,
      totalPaid: 1500,
      totalPayments: 3,
      hasPaidThisMonth: false,
      movements: [],
    },
  },
};

const alumnoAdmin = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `a${n}`,
  full_name: ['Ángel Ramírez', 'Beatriz Soto', 'Carlos López', 'Diana Cruz', 'Esteban Gil', 'Fernanda Ruiz'][n - 1],
  birth_date: '2014-03-10',
  category_id: 'c1',
  category: CATEGORIA,
  parent_id: 'p1',
  parent: { id: 'p1', full_name: 'María López', phone: '5512345678' },
  status: 'activo',
  uniform_delivered: true,
  expediente_status: 'completo',
  expediente_missing: [],
  created_at: '2026-01-10T10:00:00Z',
  ...extra,
});

const API_ADMIN = {
  students: [
    alumnoAdmin(1, { status: 'pendiente_pago' }),
    alumnoAdmin(2, { expediente_status: 'incompleto', expediente_missing: ['curp', 'acta_nacimiento'] }),
    alumnoAdmin(3, { parent_id: null, parent: null, expediente_status: 'sin_tutor', uniform_delivered: false }),
    alumnoAdmin(4, { status: 'becado' }),
    alumnoAdmin(5),
    alumnoAdmin(6),
  ],
  categories: [CATEGORIA, { id: 'c2', name: 'Sub-9', birth_year: '2017', color: '#c2255c' }],
  pendingPayments: [
    { id: 'a1', full_name: 'Ángel Ramírez', monthly_fee: 500, paid_amount: 0, pending_amount: 500 },
  ],
  users: [{ id: 'p1', full_name: 'María López', role: 'padre' }],
  dashboards: { admin: { activeStudents: 6, totalStudents: 6, monthlyIncome: 2500, attendanceRate: 88 } },
  extra: {
    '/students/a2': {
      ...alumnoAdmin(2, {
        expediente_status: 'incompleto',
        expediente_missing: ['curp', 'acta_nacimiento'],
      }),
      email: 'beatriz@alumno.futcademic.local',
      phone: '5512345678',
      medical_notes: 'Alergia a la penicilina',
    },
    '/students/a2/stats': STATS,
    '/students/a2/team': EQUIPO,
    '/attendances/student/a2': ASISTENCIAS,
    '/payments/account-statement/a2': {
      monthlyFee: 500,
      pendingAmount: 500,
      totalPaid: 1500,
      totalPayments: 3,
      movements: [
        { date: '2026-10-05', amount: 500, description: 'Mensualidad octubre' },
        { date: '2026-09-04', amount: 500, description: 'Mensualidad septiembre' },
      ],
    },
  },
};

async function captura(page: Page, nombre: string, completa = true) {
  await page.waitForLoadState('networkidle');
  // Que no salga un esqueleto a medio cargar.
  await expect(page.locator('header')).toBeVisible();
  await page.screenshot({ path: `${DIR}/${nombre}.png`, fullPage: completa });
}

test('capturas del alumno', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await loginAs(page, { profile: PERFIL_ALUMNO, api: API_ALUMNO });

  await captura(page, '01-alumno-inicio');
  await page.goto('/attendance');
  await captura(page, '02-alumno-mi-asistencia');
  await page.goto('/stats');
  await captura(page, '03-alumno-estadisticas');
  await page.goto('/team');
  await captura(page, '04-alumno-mi-equipo');
  await page.goto('/achievements');
  await captura(page, '05-alumno-logros');
  await page.goto('/profile');
  await captura(page, '06-alumno-mi-cuenta');

  // La barra inferior, sin recortar por el scroll de la página.
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${DIR}/07-alumno-barra-inferior.png`, fullPage: false });
});

test('capturas del padre', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await loginAs(page, { profile: PERFIL_PADRE, api: API_PADRE });

  await captura(page, '08-padre-inicio');
  await page.goto('/children');
  await captura(page, '09-padre-mis-hijos');

  // Hoja inferior: vincular hijo.
  await page.getByRole('button', { name: 'Vincular hijo' }).first().click();
  const hoja = page.getByRole('dialog');
  await expect(hoja).toBeVisible();
  await expect(page.getByText('Te lo da la academia')).toBeVisible();
  // La hoja entra deslizándose: sin esperar a que pare, la captura sale con el
  // panel todavía fuera de pantalla.
  await expect(async () => {
    const a = await hoja.boundingBox();
    await new Promise((r) => setTimeout(r, 100));
    const b = await hoja.boundingBox();
    expect(a?.y).toBe(b?.y);
  }).toPass();
  await page.screenshot({ path: `${DIR}/10-padre-hoja-vincular.png`, fullPage: false });
  await page.keyboard.press('Escape');

  await page.goto('/finances?student_id=s1');
  await captura(page, '11-padre-pagos');
  await page.goto('/attendance?student_id=s1');
  await captura(page, '12-padre-asistencias');
});

test('capturas del admin', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await loginAs(page, { profile: { role: 'admin' }, api: API_ADMIN });

  await captura(page, '13-admin-inicio');
  await page.goto('/admin/students');
  await captura(page, '14-admin-alumnos');
  await page.screenshot({ path: `${DIR}/15-admin-alumnos-pantalla.png`, fullPage: false });

  // Hoja de filtros.
  await page.getByRole('button', { name: 'Filtros' }).click();
  const hoja = page.getByRole('dialog');
  await expect(hoja).toBeVisible();
  await expect(async () => {
    const a = await hoja.boundingBox();
    await new Promise((r) => setTimeout(r, 100));
    const b = await hoja.boundingBox();
    expect(a?.y).toBe(b?.y);
  }).toPass();
  await page.screenshot({ path: `${DIR}/16-admin-hoja-filtros.png`, fullPage: false });
  await page.keyboard.press('Escape');

  // Selección: la barra de acción pasa a ser la de acciones masivas.
  await page.getByRole('checkbox', { name: 'Seleccionar a Ángel Ramírez' }).check();
  await page.getByRole('checkbox', { name: 'Seleccionar a Beatriz Soto' }).check();
  await page.screenshot({ path: `${DIR}/17-admin-seleccion.png`, fullPage: false });

  // Ficha del alumno.
  await page.goto('/admin/students/a2');
  await captura(page, '18-admin-ficha');
});
