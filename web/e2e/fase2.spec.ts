import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Fase 2 — Experiencia Profesor: dashboard por endpoint, asistencia como
 * profesor, mis categorías en sidebar, onboarding redirect.
 */

const TEACHER_PROFILE = {
  id: 'prof-1',
  email: 'garcia@test.com',
  full_name: 'Prof. García',
  role: 'profesor' as const,
  school_id: 'school-1',
  school: { name: 'Academia Demo', logo_url: null },
  onboarded_at: '2025-01-01',
};

const CATEGORIES = [
  { id: 'cat1', name: 'Sub-12', birth_year: 2012 },
];

const DASHBOARD_PROF = {
  categoriesCount: 1,
  myCategories: [{ id: 'cat1', name: 'Sub-12' }],
  nextSession: 'Mañana 17:00',
  todayTrainings: [],
};

const STUDENTS = [
  {
    id: 's1',
    full_name: 'Carlos López',
    email: 'carlos@test.com',
    category_id: 'cat1',
    category: { id: 'cat1', name: 'Sub-12' },
  },
];

const API_FX = {
  categories: CATEGORIES,
  students: STUDENTS,
  notifications: [],
  dashboards: { profesor: DASHBOARD_PROF },
  extra: {} as Record<string, any>,
};

test('profesor: dashboard muestra categorías y próxima sesión', async ({ page }) => {
  await loginAs(page, { profile: TEACHER_PROFILE, api: API_FX });
  await expect(page.getByText('Mis categorías')).toBeVisible();
  await expect(page.getByText('Sub-12')).toBeVisible();
  await expect(page.getByText('Sesiones de hoy')).toBeVisible();
});

test('profesor: puede navegar a asistencias', async ({ page }) => {
  await loginAs(page, { profile: TEACHER_PROFILE, api: API_FX });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Asistencias' }).click();
  await expect(page).toHaveURL(/\/attendance/);
  // RollCallView renders the "Asistencias" title in the page header.
  await expect(page.getByRole('heading', { name: 'Asistencias' })).toBeVisible();
});

test('profesor: sidebar muestra items correctos', async ({ page }) => {
  await loginAs(page, { profile: TEACHER_PROFILE, api: API_FX });
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'Inicio' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Asistencias' })).toBeVisible();
  // Admin-only items hidden for profesor.
  await expect(nav.getByRole('link', { name: 'Profesores' })).toBeHidden();
  await expect(nav.getByRole('link', { name: 'Canchas' })).toBeHidden();
});

test('profesor sin onboarding es redirigido a /onboarding', async ({ page }) => {
  const unboarded = { ...TEACHER_PROFILE, onboarded_at: null };
  await loginAs(page, { profile: unboarded, api: API_FX });
  await expect(page).toHaveURL(/\/onboarding/);
  await expect(page.getByText('Completa tu perfil')).toBeVisible();
});

test('onboarding: completar y redirigir', async ({ page }) => {
  const unboarded = { ...TEACHER_PROFILE, onboarded_at: null };
  await loginAs(page, { profile: unboarded, api: API_FX });
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel('Nombre').fill('Juan');
  await page.getByLabel('Apellido').fill('García');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('¡Bienvenido!')).toBeVisible();
});
