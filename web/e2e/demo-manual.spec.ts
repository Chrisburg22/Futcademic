import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * DEMO MANUAL DE USUARIO — Recorrido completo de Futcademic Web.
 *
 * Cada test es una "sección" del manual. Se ejecutan en orden (serial) y
 * Playwright graba video de cada uno. Luego se concatenan en un solo MP4.
 *
 * Secciones:
 *   1. Pantalla de login
 *   2. Admin — Dashboard
 *   3. Admin — Gestión de alumnos
 *   4. Admin — Detalle de alumno (stats + equipo)
 *   5. Admin — Gestión de profesores + permisos
 *   6. Admin — Categorías
 *   7. Admin — Agenda (eventos/entrenamientos)
 *   8. Admin — Canchas (venues)
 *   9. Admin — Finanzas (pagos + pendientes)
 *  10. Admin — Asistencias (pase de lista)
 *  11. Admin — Configuración (perfil, academia, export, seguridad)
 *  12. Admin — Notificaciones
 *  13. Profesor — Dashboard + sidebar
 *  14. Profesor — Asistencias
 *  15. Padre — Dashboard + alerta de pago
 *  16. Padre — Mis hijos + vincular
 *  17. Padre — Finanzas (estado de cuenta)
 *  18. Alumno — Login de alumno
 *  19. Alumno — Dashboard + sidebar
 *  20. Alumno — Logros
 *  21. Alumno — Mi equipo
 *  22. Alumno — Estadísticas
 */

// Slow down interactions so the video is watchable.
test.use({ actionTimeout: 3000 });

// ═══════════════════════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════════════════════

const STUDENTS = [
  {
    id: 's1', full_name: 'Carlos López', email: 'carlos@futcademic.com',
    birth_date: '2012-05-10', category_id: 'cat1', status: 'activo',
    category: { id: 'cat1', name: 'Sub-12' }, uniform_delivered: true,
  },
  {
    id: 's2', full_name: 'Ana Torres', email: 'ana@futcademic.com',
    birth_date: '2013-01-15', category_id: 'cat1', status: 'becado',
    category: { id: 'cat1', name: 'Sub-12' }, uniform_delivered: false,
  },
  {
    id: 's3', full_name: 'Diego Ramírez', email: 'diego@futcademic.com',
    birth_date: '2011-08-20', category_id: 'cat2', status: 'activo',
    category: { id: 'cat2', name: 'Sub-14' }, uniform_delivered: true,
  },
];

const CATEGORIES = [
  { id: 'cat1', name: 'Sub-12', birth_year: '2012-2013', color: '#3498db', monthly_fee: 500, teacher_id: 't1', teacher: { id: 't1', full_name: 'Prof. García' } },
  { id: 'cat2', name: 'Sub-14', birth_year: '2010-2011', color: '#e74c3c', monthly_fee: 600, teacher_id: 't2', teacher: { id: 't2', full_name: 'Prof. Martínez' } },
];

const TEACHERS = [
  { id: 't1', full_name: 'Prof. García', email: 'garcia@futcademic.com', role: 'profesor', phone: '555-1234' },
  { id: 't2', full_name: 'Prof. Martínez', email: 'martinez@futcademic.com', role: 'profesor', phone: '555-5678' },
];

const VENUES = [
  { id: 'v1', name: 'Cancha Central', address: 'Av. Principal #100', surface_type: 'artificial', capacity: 60, has_lighting: true, is_covered: false },
  { id: 'v2', name: 'Campo Norte', address: 'Calle 5 #200', surface_type: 'natural', capacity: 40, has_lighting: false, is_covered: false },
];

const EVENTS = [
  { id: 'e1', category_id: 'cat1', date: '2025-07-01', start_time: '17:00', type: 'entrenamiento', category: { id: 'cat1', name: 'Sub-12' } },
  { id: 'e2', category_id: 'cat2', date: '2025-07-02', start_time: '18:00', type: 'partido', category: { id: 'cat2', name: 'Sub-14' } },
];

const PAYMENTS = [
  { id: 'p1', type: 'mensualidad', amount: 500, payment_date: '2025-06-15', description: 'Mensualidad junio', student: STUDENTS[0] },
  { id: 'p2', type: 'mensualidad', amount: 500, payment_date: '2025-06-16', description: 'Mensualidad junio', student: STUDENTS[2] },
  { id: 'p3', type: 'pago_profesor', amount: 3000, payment_date: '2025-06-20', description: 'Nómina junio', teacher: TEACHERS[0] },
];

const NOTIFS = [
  { id: 'n1', title: 'Pago registrado', body: 'Carlos López — $500 mensualidad', is_read: false, created_at: new Date().toISOString() },
  { id: 'n2', title: 'Nuevo alumno', body: 'Diego Ramírez se registró en Sub-14', is_read: false, created_at: new Date(Date.now() - 3600_000).toISOString() },
  { id: 'n3', title: 'Entrenamiento mañana', body: 'Sub-12 entrena a las 17:00', is_read: true, created_at: new Date(Date.now() - 86_400_000).toISOString() },
];

const DASHBOARD_ADMIN = { activeStudents: 3, totalStudents: 3, monthlyIncome: 4500, pendingPayments: 1, attendanceRate: 87.5, upcomingEvents: EVENTS };
const DASHBOARD_PROF = { categoriesCount: 1, myCategories: [CATEGORIES[0]], nextSession: 'Mañana 17:00 — Cancha Central', todayTrainings: [] };
const DASHBOARD_PADRE = { children: [STUDENTS[0]], paymentAlert: 'Carlos tiene 1 pago pendiente de julio.', nextTraining: 'Martes 17:00' };
const DASHBOARD_ALUMNO = { studentName: 'Carlos López', category: 'Sub-12', currentStreak: 7, trainingsThisMonth: 10, achievementsUnlocked: 4, nextTraining: 'Martes 17:00 — Cancha Central' };

const PERMISSIONS = { can_take_attendance: true, can_manage_events: true, can_view_finances: false, can_manage_students: true, can_manage_payments: false, can_manage_categories: false };

const ACHIEVEMENTS = {
  achievements: [
    { id: 'a1', name: 'Primera clase', description: 'Asiste a tu primer entrenamiento', icon: '⚽', unlocked: true, unlocked_at: '2025-03-01' },
    { id: 'a2', name: 'Racha de 5', description: '5 asistencias consecutivas', icon: '🔥', unlocked: true, unlocked_at: '2025-04-10' },
    { id: 'a3', name: 'Racha de 10', description: '10 asistencias consecutivas', icon: '💪', unlocked: false, unlocked_at: null },
    { id: 'a4', name: 'Goleador', description: 'Anota en 3 partidos seguidos', icon: '🏆', unlocked: true, unlocked_at: '2025-05-20' },
    { id: 'a5', name: 'Mes perfecto', description: 'Asiste a todos los entrenamientos del mes', icon: '⭐', unlocked: true, unlocked_at: '2025-06-01' },
    { id: 'a6', name: 'MVP', description: 'Nominado como mejor jugador', icon: '👑', unlocked: false, unlocked_at: null },
  ],
  unlockedCount: 4, totalCount: 6,
};

const TEAM = {
  teamName: 'Sub-12', color: '#3498db', birthYear: 2012,
  teammates: [
    { id: 's2', full_name: 'Ana Torres', avatar_url: null },
    { id: 's4', full_name: 'Sofía Herrera', avatar_url: null },
    { id: 's5', full_name: 'Pablo Mendoza', avatar_url: null },
  ],
  teachers: [{ id: 't1', full_name: 'Prof. García', avatar_url: null }],
  schedules: [
    { day: 'Martes', start_time: '17:00', venue: 'Cancha Central' },
    { day: 'Jueves', start_time: '17:00', venue: 'Cancha Central' },
    { day: 'Sábado', start_time: '10:00', venue: 'Campo Norte' },
  ],
};

const STATS = { currentStreak: 7, maxStreak: 15, trainingsThisMonth: 10, attendedThisMonth: 9, achievementsUnlocked: 4, totalAchievements: 6 };

const STATEMENT = { studentName: 'Carlos López', category: 'Sub-12', monthlyFee: 500, pendingAmount: 500, hasPaidThisMonth: false, totalPayments: 3000, movements: PAYMENTS.slice(0, 2) };

const FULL_API = {
  students: STUDENTS,
  categories: CATEGORIES,
  teachers: TEACHERS,
  users: [...TEACHERS, { id: 'padre-1', full_name: 'María López', email: 'maria@test.com', role: 'padre' }],
  venues: VENUES,
  events: EVENTS,
  payments: PAYMENTS,
  pendingPayments: [{ student_id: 's2', full_name: 'Ana Torres', month: 6 }],
  notifications: NOTIFS,
  achievements: ACHIEVEMENTS,
  permissions: PERMISSIONS,
  dashboards: { admin: DASHBOARD_ADMIN, profesor: DASHBOARD_PROF, padre: DASHBOARD_PADRE, alumno: DASHBOARD_ALUMNO },
  extra: {
    '/students/s1': STUDENTS[0],
    '/students/s1/stats': STATS,
    '/students/s1/team': TEAM,
    '/students/alumno-1/stats': STATS,
    '/students/alumno-1/team': TEAM,
    '/users/teachers/t1': { ...TEACHERS[0], avatar_url: null, categories: [CATEGORIES[0]], permissions: PERMISSIONS },
    '/payments/account-statement/s1': STATEMENT,
  } as Record<string, any>,
};

const ADMIN_PROFILE = {
  id: 'admin-1', email: 'director@futcademic.com', full_name: 'Roberto Sánchez',
  role: 'admin' as const, school_id: 'school-1',
  school: { name: 'Academia Futcademic', logo_url: null }, onboarded_at: '2025-01-01',
};

const pause = (ms = 800) => new Promise((r) => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════════
// 1. PANTALLA DE LOGIN
// ═══════════════════════════════════════════════════════════

test('01 — Pantalla de inicio de sesión', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Futcademic')).toBeVisible();
  await expect(page.getByLabel('Correo')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Registra tu academia' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Acceso alumno' })).toBeVisible();
  await pause(1500);
});

// ═══════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════

test('02 — Admin: Dashboard con estadísticas', async ({ page }) => {
  await loginAs(page, { profile: ADMIN_PROFILE, api: FULL_API });
  await expect(page.getByText('Academia Futcademic')).toBeVisible();
  await expect(page.getByText('Alumnos activos')).toBeVisible();
  await expect(page.getByText('Ingreso mensual')).toBeVisible();
  await pause(1500);
  // Shortcut cards
  await expect(page.getByRole('main').getByRole('link', { name: 'Alumnos' })).toBeVisible();
  await pause(1000);
});

test('03 — Admin: Gestión de alumnos', async ({ page }) => {
  await loginAs(page, { profile: ADMIN_PROFILE, api: FULL_API, goto: '/admin/students' });
  await expect(page.getByRole('heading', { name: 'Alumnos' })).toBeVisible();
  await pause(500);
  // Tabla con 3 alumnos
  await expect(page.getByText('Carlos López')).toBeVisible();
  await expect(page.getByText('Ana Torres')).toBeVisible();
  await expect(page.getByText('Diego Ramírez')).toBeVisible();
  await pause(500);
  // Columnas visibles
  await expect(page.getByText('Status')).toBeVisible();
  await expect(page.getByText('Uniforme')).toBeVisible();
  await pause(500);
  // Botón nuevo alumno
  await page.getByRole('button', { name: 'Nuevo alumno' }).click();
  await expect(page.getByText('Nombre completo')).toBeVisible();
  await pause(1000);
  await page.keyboard.press('Escape');
  await pause(500);
});

test('04 — Admin: Detalle de alumno (stats + equipo)', async ({ page }) => {
  await loginAs(page, { profile: ADMIN_PROFILE, api: FULL_API, goto: '/admin/students' });
  await page.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(page).toHaveURL(/\/admin\/students\/s1/);
  await pause(500);
  // Perfil
  await expect(page.getByRole('heading', { name: 'Carlos López' })).toBeVisible();
  await pause(500);
  // Stats
  await expect(page.getByText('Racha actual')).toBeVisible();
  await expect(page.getByText('Racha máxima')).toBeVisible();
  await expect(page.getByText('Este mes')).toBeVisible();
  await expect(page.getByText('Logros')).toBeVisible();
  await pause(800);
  // Equipo
  await expect(page.getByText('Compañeros')).toBeVisible();
  await expect(page.getByText('Ana Torres')).toBeVisible();
  await expect(page.getByText('Prof. García')).toBeVisible();
  await pause(800);
  // Historial
  await expect(page.getByText('Historial de asistencia')).toBeVisible();
  await pause(1000);
});

test('05 — Admin: Profesores + permisos granulares', async ({ page }) => {
  await loginAs(page, { profile: ADMIN_PROFILE, api: FULL_API, goto: '/admin/teachers' });
  await expect(page.getByRole('heading', { name: 'Profesores' })).toBeVisible();
  await pause(500);
  await expect(page.getByText('Prof. García')).toBeVisible();
  await expect(page.getByText('Prof. Martínez')).toBeVisible();
  await pause(500);
  // Botones
  await expect(page.getByRole('button', { name: 'Invitar profesor' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Invitar admin' })).toBeVisible();
  await pause(500);
  // Navegar a detalle
  await page.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(page).toHaveURL(/\/admin\/teachers\/t1/);
  await pause(500);
  await expect(page.getByRole('heading', { name: 'Prof. García' })).toBeVisible();
  await expect(page.getByText('Sub-12')).toBeVisible();
  // Permisos
  await expect(page.getByText('Tomar asistencia')).toBeVisible();
  await expect(page.getByText('Gestionar eventos')).toBeVisible();
  await expect(page.getByText('Ver finanzas')).toBeVisible();
  await expect(page.getByText('Gestionar alumnos')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar permisos' })).toBeVisible();
  await pause(1500);
});

test('06 — Admin: Categorías', async ({ page }) => {
  await loginAs(page, { profile: ADMIN_PROFILE, api: FULL_API, goto: '/admin/categories' });
  await expect(page.getByRole('heading', { name: 'Categorías' })).toBeVisible();
  await pause(500);
  await expect(page.getByText('Sub-12')).toBeVisible();
  await expect(page.getByText('Sub-14')).toBeVisible();
  await pause(500);
  await page.getByRole('button', { name: 'Nueva categoría' }).click();
  await expect(page.getByText('Años de nacimiento')).toBeVisible();
  await pause(1000);
  await page.keyboard.press('Escape');
  await pause(500);
});

test('07 — Admin: Agenda (eventos y entrenamientos)', async ({ page }) => {
  await loginAs(page, { profile: ADMIN_PROFILE, api: FULL_API, goto: '/admin/events' });
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
  await expect(page.getByText('Entrenamientos y partidos')).toBeVisible();
  await pause(500);
  // Tabs
  await expect(page.getByRole('tab', { name: 'Día seleccionado' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Eventos base' })).toBeVisible();
  await pause(500);
  await page.getByRole('tab', { name: 'Eventos base' }).click();
  await pause(800);
  // Create event modal
  await page.getByRole('button', { name: 'Nuevo evento' }).click();
  await expect(page.getByText('Cancha (opcional)')).toBeVisible();
  await pause(1000);
  await page.keyboard.press('Escape');
  await pause(500);
});

test('08 — Admin: Canchas (venues)', async ({ page }) => {
  await loginAs(page, { profile: ADMIN_PROFILE, api: FULL_API, goto: '/admin/venues' });
  await expect(page.getByRole('heading', { name: 'Canchas' })).toBeVisible();
  await expect(page.getByText('Lugares de entrenamiento')).toBeVisible();
  await pause(500);
  await expect(page.getByText('Cancha Central')).toBeVisible();
  await expect(page.getByText('Campo Norte')).toBeVisible();
  await pause(500);
  await page.getByRole('button', { name: 'Nueva cancha' }).click();
  await expect(page.getByRole('textbox', { name: 'Superficie' })).toBeVisible();
  await expect(page.getByText('Iluminación')).toBeVisible();
  await pause(1000);
  await page.keyboard.press('Escape');
  await pause(500);
});

test('09 — Admin: Finanzas (pagos y pendientes)', async ({ page }) => {
  await loginAs(page, { profile: ADMIN_PROFILE, api: FULL_API, goto: '/finances' });
  await expect(page.getByRole('heading', { name: 'Finanzas' })).toBeVisible();
  await pause(500);
  // Tabs
  await expect(page.getByRole('tab', { name: 'Alumnos' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Profesores' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Pendientes' })).toBeVisible();
  await pause(500);
  // Pendientes tab
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await pause(500);
  await expect(page.getByText('Ana Torres')).toBeVisible();
  await pause(500);
  // Botón registrar pago
  await page.getByRole('button', { name: 'Registrar pago' }).click();
  await pause(1000);
  await page.keyboard.press('Escape');
  await pause(500);
});

test('10 — Admin: Pase de lista (asistencias)', async ({ page }) => {
  await loginAs(page, { profile: ADMIN_PROFILE, api: FULL_API });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Asistencias' }).click();
  await expect(page.getByRole('heading', { name: 'Asistencias' })).toBeVisible();
  await pause(500);
  // Seleccionar categoría
  await page.getByRole('textbox', { name: 'Categoría' }).click();
  await page.getByRole('option', { name: 'Sub-12' }).click();
  await pause(800);
  // Alumnos aparecen
  await expect(page.getByText('Carlos López')).toBeVisible();
  await pause(1000);
});

test('11 — Admin: Configuración (perfil, academia, export)', async ({ page }) => {
  await loginAs(page, { profile: ADMIN_PROFILE, api: FULL_API });
  const nav = page.getByRole('navigation');
  // Perfil
  await nav.getByRole('link', { name: 'Mi perfil' }).click();
  await pause(500);
  await expect(page.getByLabel('Nombre completo')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Subir foto' })).toBeVisible();
  await pause(800);
  // Academia
  await nav.getByRole('link', { name: 'Academia' }).click();
  await pause(500);
  await expect(page.getByLabel('Nombre')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Subir logo' })).toBeVisible();
  await pause(800);
  // Seguridad
  await nav.getByRole('link', { name: 'Seguridad' }).click();
  await pause(800);
});

test('12 — Admin: Centro de notificaciones', async ({ page }) => {
  await loginAs(page, { profile: ADMIN_PROFILE, api: FULL_API });
  await pause(500);
  // Badge de no leídas
  const header = page.locator('header');
  await expect(header.getByText('2')).toBeVisible();
  await pause(500);
  // Abrir dropdown
  await header.getByRole('button', { name: 'Notificaciones' }).click();
  await expect(page.getByText('Pago registrado')).toBeVisible();
  await expect(page.getByText('Nuevo alumno')).toBeVisible();
  await expect(page.getByText('Entrenamiento mañana')).toBeVisible();
  await pause(1500);
  // Marcar todas
  await page.getByRole('button', { name: 'Marcar todas' }).click();
  await pause(1000);
});

// ═══════════════════════════════════════════════════════════
// PROFESOR
// ═══════════════════════════════════════════════════════════

const PROF_PROFILE = {
  id: 'prof-1', email: 'garcia@futcademic.com', full_name: 'Prof. García',
  role: 'profesor' as const, school_id: 'school-1',
  school: { name: 'Academia Futcademic', logo_url: null }, onboarded_at: '2025-01-01',
};

test('13 — Profesor: Dashboard', async ({ page }) => {
  await loginAs(page, { profile: PROF_PROFILE, api: FULL_API });
  await expect(page.getByText('Mis categorías')).toBeVisible();
  await expect(page.getByText('Sub-12')).toBeVisible();
  await expect(page.getByText('Sesiones de hoy')).toBeVisible();
  await pause(1000);
  // Sidebar correcto
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'Inicio' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Asistencias' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Alumnos' })).toBeVisible();
  await pause(1000);
});

test('14 — Profesor: Tomar asistencia', async ({ page }) => {
  await loginAs(page, { profile: PROF_PROFILE, api: FULL_API });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Asistencias' }).click();
  await expect(page.getByRole('heading', { name: 'Asistencias' })).toBeVisible();
  await pause(500);
  await page.getByRole('textbox', { name: 'Categoría' }).click();
  await page.getByRole('option', { name: 'Sub-12' }).click();
  await pause(500);
  await expect(page.getByText('Carlos López')).toBeVisible();
  await pause(1000);
});

// ═══════════════════════════════════════════════════════════
// PADRE
// ═══════════════════════════════════════════════════════════

const PADRE_PROFILE = {
  id: 'padre-1', email: 'maria@futcademic.com', full_name: 'María López',
  role: 'padre' as const, school_id: 'school-1',
  school: { name: 'Academia Futcademic', logo_url: null }, onboarded_at: '2025-01-01',
};

test('15 — Padre: Dashboard con alerta de pago', async ({ page }) => {
  await loginAs(page, { profile: PADRE_PROFILE, api: FULL_API });
  await expect(page.getByText('Carlos tiene 1 pago pendiente')).toBeVisible();
  await expect(page.getByText('Carlos López')).toBeVisible();
  await pause(1000);
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'Mis hijos' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Finanzas' })).toBeVisible();
  await pause(1000);
});

test('16 — Padre: Mis hijos + vincular', async ({ page }) => {
  await loginAs(page, { profile: PADRE_PROFILE, api: FULL_API });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Mis hijos' }).click();
  await expect(page.getByRole('heading', { name: 'Mis hijos' })).toBeVisible();
  await pause(500);
  await expect(page.getByText('Carlos López')).toBeVisible();
  await pause(500);
  // Vincular nuevo hijo
  await page.getByRole('button', { name: 'Vincular hijo' }).click();
  await expect(page.getByText('Código del alumno')).toBeVisible();
  await pause(1000);
  await page.keyboard.press('Escape');
  await pause(500);
});

test('17 — Padre: Estado de cuenta (finanzas)', async ({ page }) => {
  await loginAs(page, { profile: PADRE_PROFILE, api: FULL_API });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Finanzas' }).click();
  await expect(page.getByText('Estado de cuenta de tus hijos')).toBeVisible();
  await pause(1500);
});

// ═══════════════════════════════════════════════════════════
// ALUMNO
// ═══════════════════════════════════════════════════════════

const ALUMNO_PROFILE = {
  id: 'alumno-1', email: 'carlos@futcademic.com', full_name: 'Carlos López',
  role: 'alumno' as const, school_id: 'school-1',
  school: { name: 'Academia Futcademic', logo_url: null }, onboarded_at: '2025-01-01',
};

test('18 — Alumno: Pantalla de login de alumno', async ({ page }) => {
  await page.goto('/student-login');
  await expect(page.getByText('Acceso Alumno')).toBeVisible();
  await expect(page.getByLabel('Usuario')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Inicia aquí' })).toBeVisible();
  await pause(1500);
});

test('19 — Alumno: Dashboard', async ({ page }) => {
  await loginAs(page, { profile: ALUMNO_PROFILE, api: FULL_API });
  await expect(page.getByText('Racha')).toBeVisible();
  await expect(page.getByText('Este mes')).toBeVisible();
  await pause(800);
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'Mi equipo' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Logros' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Estadísticas' })).toBeVisible();
  await pause(1000);
});

test('20 — Alumno: Logros', async ({ page }) => {
  await loginAs(page, { profile: ALUMNO_PROFILE, api: FULL_API });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Logros' }).click();
  await expect(page.getByRole('heading', { name: 'Logros' })).toBeVisible();
  await expect(page.getByText('4 de 6 desbloqueados')).toBeVisible();
  await pause(500);
  await expect(page.getByText('Primera clase', { exact: true })).toBeVisible();
  await expect(page.getByText('Racha de 5', { exact: true })).toBeVisible();
  await expect(page.getByText('Goleador', { exact: true })).toBeVisible();
  await expect(page.getByText('Mes perfecto', { exact: true })).toBeVisible();
  // Locked ones
  await expect(page.getByText('Racha de 10', { exact: true })).toBeVisible();
  await expect(page.getByText('MVP', { exact: true })).toBeVisible();
  await pause(1500);
});

test('21 — Alumno: Mi equipo', async ({ page }) => {
  await loginAs(page, { profile: ALUMNO_PROFILE, api: FULL_API });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Mi equipo' }).click();
  await expect(page.getByRole('heading', { name: 'Mi equipo' })).toBeVisible();
  await pause(500);
  // Nombre del equipo
  await expect(page.getByText('Sub-12').first()).toBeVisible();
  await pause(500);
  // Compañeros
  await expect(page.getByText('Compañeros')).toBeVisible();
  await expect(page.getByText('Ana Torres')).toBeVisible();
  await expect(page.getByText('Sofía Herrera')).toBeVisible();
  await expect(page.getByText('Pablo Mendoza')).toBeVisible();
  await pause(500);
  // Profesores
  await expect(page.getByText('Prof. García')).toBeVisible();
  await pause(500);
  // Horarios
  await expect(page.getByText('Martes — 17:00 (Cancha Central)')).toBeVisible();
  await expect(page.getByText('Jueves — 17:00 (Cancha Central)')).toBeVisible();
  await expect(page.getByText('Sábado — 10:00 (Campo Norte)')).toBeVisible();
  await pause(1500);
});

test('22 — Alumno: Mis estadísticas', async ({ page }) => {
  await loginAs(page, { profile: ALUMNO_PROFILE, api: FULL_API });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Estadísticas' }).click();
  await expect(page.getByRole('heading', { name: 'Mis estadísticas' })).toBeVisible();
  await pause(500);
  await expect(page.getByText('Racha actual')).toBeVisible();
  await expect(page.getByText('Racha máx')).toBeVisible();
  await expect(page.getByText('Este mes')).toBeVisible();
  await pause(500);
  await expect(page.getByText('Historial de asistencia')).toBeVisible();
  await pause(1500);
});
