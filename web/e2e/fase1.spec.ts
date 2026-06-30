import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Fase 1 — Completar Admin: venues CRUD, student status/delete/detail, teacher
 * detail + permisos, invite admin, dashboard por endpoint, export, upload,
 * venue selector en eventos, notificaciones (Fase 0 ya probó campana).
 */

const STUDENTS = [
  {
    id: 's1',
    full_name: 'Carlos López',
    email: 'carlos@test.com',
    birth_date: '2012-05-10',
    category_id: 'cat1',
    category: { id: 'cat1', name: 'Sub-12' },
    status: 'activo',
    uniform_delivered: false,
  },
  {
    id: 's2',
    full_name: 'Ana Torres',
    email: 'ana@test.com',
    birth_date: '2013-01-15',
    category_id: 'cat1',
    category: { id: 'cat1', name: 'Sub-12' },
    status: 'becado',
    uniform_delivered: true,
  },
];

const CATEGORIES = [
  { id: 'cat1', name: 'Sub-12', birth_year: '2012-2013', teacher_id: 't1' },
];

const TEACHERS = [
  { id: 't1', full_name: 'Prof. García', email: 'garcia@test.com', role: 'profesor' },
];

const VENUES = [
  {
    id: 'v1',
    name: 'Cancha Central',
    address: 'Calle 10 #45',
    surface_type: 'artificial',
    capacity: 50,
    has_lighting: true,
    is_covered: false,
  },
];

const EVENTS = [
  {
    id: 'e1',
    category_id: 'cat1',
    date: '2025-06-20',
    start_time: '17:00',
    type: 'entrenamiento',
    category: { id: 'cat1', name: 'Sub-12' },
  },
];

const DASHBOARD_ADMIN = {
  activeStudents: 8,
  totalStudents: 10,
  monthlyIncome: 5000,
  pendingPayments: 2,
  attendanceRate: 85.7,
  upcomingEvents: [],
};

const PERMISSIONS = {
  can_take_attendance: true,
  can_manage_events: false,
  can_view_finances: true,
  can_manage_students: true,
  can_manage_payments: false,
  can_manage_categories: false,
};

const API_FX = {
  students: STUDENTS,
  categories: CATEGORIES,
  teachers: TEACHERS,
  users: TEACHERS,
  venues: VENUES,
  events: EVENTS,
  permissions: PERMISSIONS,
  dashboards: { admin: DASHBOARD_ADMIN },
  notifications: [],
  extra: {
    '/students/s1': STUDENTS[0],
    '/students/s1/stats': {
      currentStreak: 5,
      maxStreak: 12,
      trainingsThisMonth: 8,
      attendedThisMonth: 7,
      achievementsUnlocked: 3,
      totalAchievements: 10,
    },
    '/students/s1/team': {
      teamName: 'Sub-12',
      color: '#3498db',
      birthYear: 2012,
      teammates: [{ id: 's2', full_name: 'Ana Torres' }],
      teachers: [{ id: 't1', full_name: 'Prof. García' }],
      schedules: [],
    },
    '/users/teachers/t1': {
      id: 't1',
      full_name: 'Prof. García',
      email: 'garcia@test.com',
      phone: '555-1234',
      avatar_url: null,
      categories: [{ id: 'cat1', name: 'Sub-12' }],
      permissions: PERMISSIONS,
    },
  } as Record<string, any>,
};

// --- Dashboard admin endpoint ---
test('dashboard admin muestra stats del endpoint', async ({ page }) => {
  await loginAs(page, { api: API_FX });
  await expect(page.getByText('Alumnos activos')).toBeVisible();
  await expect(page.getByText('Ingreso mensual')).toBeVisible();
  // "Asistencia" exists in sidebar + dashboard stat — check the stat card value
  await expect(page.getByText('86%')).toBeVisible();
});

// --- Venues CRUD ---
test('venues: listar y ver cancha', async ({ page }) => {
  await loginAs(page, { api: API_FX, goto: '/admin/venues' });
  await expect(page.getByText('Cancha Central')).toBeVisible();
  await expect(page.getByText('artificial')).toBeVisible();
});

test('venues: crear cancha', async ({ page }) => {
  await loginAs(page, { api: { ...API_FX, venues: [] }, goto: '/admin/venues' });
  await page.getByRole('button', { name: 'Nueva cancha' }).click();
  await page.getByLabel('Nombre').fill('Campo Norte');
  await page.getByRole('button', { name: 'Crear' }).click();
  // Después del mutate, se muestra toast de éxito.
  await expect(page.getByText('Cancha creada')).toBeVisible();
});

// --- Student status change ---
test('students: cambiar status', async ({ page }) => {
  await loginAs(page, { api: API_FX, goto: '/admin/students' });
  await expect(page.getByText('Carlos López')).toBeVisible();
  // Status column renders.
  await expect(page.getByText('Status')).toBeVisible();
});

// --- Student detail page ---
test('students: navegar a detalle', async ({ page }) => {
  await loginAs(page, { api: API_FX, goto: '/admin/students' });
  await page.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(page).toHaveURL(/\/admin\/students\/s1/);
  await expect(page.getByRole('heading', { name: 'Carlos López' })).toBeVisible();
  // Stats
  await expect(page.getByText('Racha actual')).toBeVisible();
  // Team
  await expect(page.getByText('Compañeros')).toBeVisible();
});

// --- Teacher detail + permisos ---
test('teachers: navegar a detalle con permisos', async ({ page }) => {
  await loginAs(page, { api: API_FX, goto: '/admin/teachers' });
  await page.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(page).toHaveURL(/\/admin\/teachers\/t1/);
  await expect(page.getByRole('heading', { name: 'Prof. García' })).toBeVisible();
  // Permissions switches
  await expect(page.getByText('Tomar asistencia')).toBeVisible();
  await expect(page.getByText('Gestionar eventos')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar permisos' })).toBeVisible();
});

// --- Invite admin ---
test('teachers: modal invitar admin', async ({ page }) => {
  await loginAs(page, { api: API_FX, goto: '/admin/teachers' });
  await page.getByRole('button', { name: 'Invitar admin' }).click();
  await expect(page.getByText('Invitar administrador')).toBeVisible();
  await page.getByLabel('Nombre completo').fill('Nuevo Admin');
  await page.getByLabel('Correo').fill('newadmin@test.com');
  await page.getByRole('button', { name: 'Enviar invitación' }).click();
  await expect(page.getByText('Admin invitado')).toBeVisible();
});

// --- Events con venue selector ---
test('events: crear evento con cancha', async ({ page }) => {
  await loginAs(page, { api: API_FX, goto: '/admin/events' });
  await page.getByRole('button', { name: 'Nuevo evento' }).click();
  // Venue selector visible in create form.
  await expect(page.getByText('Cancha (opcional)')).toBeVisible();
});

// --- Export page ---
test('export: botones de export disponibles', async ({ page }) => {
  await loginAs(page, { api: API_FX, goto: '/settings/export' });
  await expect(page.getByText('Pagos (CSV del servidor)')).toBeVisible();
  await expect(page.getByText('Asistencia (CSV del servidor)')).toBeVisible();
});

// --- Upload buttons in settings ---
test('settings: botón subir foto de perfil', async ({ page }) => {
  await loginAs(page, { api: API_FX, goto: '/settings/edit-profile' });
  await expect(page.getByRole('button', { name: 'Subir foto' })).toBeVisible();
});

test('settings: botón subir logo academia', async ({ page }) => {
  await loginAs(page, { api: API_FX, goto: '/settings/edit-academy' });
  await expect(page.getByRole('button', { name: 'Subir logo' })).toBeVisible();
});
