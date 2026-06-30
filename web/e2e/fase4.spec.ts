import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Fase 4 — Experiencia Alumno: login username, dashboard, equipo, logros,
 * stats, sidebar items.
 */

const STUDENT_PROFILE = {
  id: 'alumno-1',
  email: 'carlos@test.com',
  full_name: 'Carlos López',
  role: 'alumno' as const,
  school_id: 'school-1',
  school: { name: 'Academia Demo', logo_url: null },
  onboarded_at: '2025-01-01',
};

const DASHBOARD_ALUMNO = {
  studentName: 'Carlos López',
  category: 'Sub-12',
  currentStreak: 5,
  trainingsThisMonth: 8,
  achievementsUnlocked: 3,
  nextTraining: 'Mañana 17:00 — Sub-12',
};

const ACHIEVEMENTS = {
  achievements: [
    { id: 'a1', name: 'Primera clase', description: 'Asistir a tu primera clase', unlocked: true, unlocked_at: '2025-03-01' },
    { id: 'a2', name: 'Racha de 10', description: '10 entrenamientos seguidos', unlocked: false, unlocked_at: null },
  ],
  unlockedCount: 1,
  totalCount: 2,
};

const TEAM = {
  teamName: 'Sub-12',
  color: '#3498db',
  birthYear: 2012,
  teammates: [{ id: 's2', full_name: 'Ana Torres' }],
  teachers: [{ id: 't1', full_name: 'Prof. García' }],
  schedules: [{ day: 'Martes', start_time: '17:00', venue: 'Cancha Central' }],
};

const STATS = {
  currentStreak: 5,
  maxStreak: 12,
  trainingsThisMonth: 8,
  attendedThisMonth: 7,
  achievementsUnlocked: 1,
  totalAchievements: 2,
};

const API_FX = {
  notifications: [],
  achievements: ACHIEVEMENTS,
  dashboards: { alumno: DASHBOARD_ALUMNO },
  extra: {
    '/students/alumno-1/team': TEAM,
    '/students/alumno-1/stats': STATS,
  } as Record<string, any>,
};

// --- Student login page exists ---
test('student-login: página de acceso alumno renderiza', async ({ page }) => {
  await page.goto('/student-login');
  await expect(page.getByText('Acceso Alumno')).toBeVisible();
  await expect(page.getByLabel('Usuario')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
});

// --- Login page has link to student-login ---
test('login page tiene link "Acceso alumno"', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('link', { name: 'Acceso alumno' })).toBeVisible();
});

// --- Alumno dashboard ---
test('alumno: dashboard muestra stats', async ({ page }) => {
  await loginAs(page, { profile: STUDENT_PROFILE, api: API_FX });
  await expect(page.getByText('Racha')).toBeVisible();
  await expect(page.getByText('Mañana 17:00 — Sub-12')).toBeVisible();
});

// --- Sidebar items alumno ---
test('alumno: sidebar con equipo, logros, estadísticas', async ({ page }) => {
  await loginAs(page, { profile: STUDENT_PROFILE, api: API_FX });
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'Mi equipo' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Logros' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Estadísticas' })).toBeVisible();
  // No admin items
  await expect(nav.getByRole('link', { name: 'Profesores' })).toBeHidden();
});

// --- Achievements page ---
test('alumno: página de logros', async ({ page }) => {
  await loginAs(page, { profile: STUDENT_PROFILE, api: API_FX });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Logros' }).click();
  await expect(page).toHaveURL(/\/achievements/);
  await expect(page.getByText('Primera clase', { exact: true })).toBeVisible();
  await expect(page.getByText('Racha de 10', { exact: true })).toBeVisible();
  await expect(page.getByText('1 de 2 desbloqueados')).toBeVisible();
});

// --- Team page ---
test('alumno: página de equipo', async ({ page }) => {
  await loginAs(page, { profile: STUDENT_PROFILE, api: API_FX });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Mi equipo' }).click();
  await expect(page).toHaveURL(/\/team/);
  await expect(page.getByText('Ana Torres')).toBeVisible();
  await expect(page.getByText('Prof. García')).toBeVisible();
});

// --- Stats page ---
test('alumno: página de estadísticas', async ({ page }) => {
  await loginAs(page, { profile: STUDENT_PROFILE, api: API_FX });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Estadísticas' }).click();
  await expect(page).toHaveURL(/\/stats/);
  await expect(page.getByText('Racha actual')).toBeVisible();
  await expect(page.getByText('Historial de asistencia')).toBeVisible();
});
