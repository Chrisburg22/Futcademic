import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Fase 3 — Experiencia Padre: dashboard endpoint, vincular/desvincular hijo,
 * account-statement real, sidebar "Mis hijos", finanzas con estado de cuenta.
 */

const PARENT_PROFILE = {
  id: 'padre-1',
  email: 'padre@test.com',
  full_name: 'María López',
  role: 'padre' as const,
  school_id: 'school-1',
  school: { name: 'Academia Demo', logo_url: null },
  onboarded_at: '2025-01-01',
};

const CHILDREN = [
  {
    id: 's1',
    full_name: 'Carlos López',
    category: { id: 'cat1', name: 'Sub-12' },
    status: 'activo',
    avatar_url: null,
  },
];

const ACCOUNT_STATEMENT = {
  studentName: 'Carlos López',
  category: 'Sub-12',
  monthlyFee: 500,
  pendingAmount: 0,
  hasPaidThisMonth: true,
  totalPayments: 3000,
  movements: [],
};

const API_FX = {
  students: CHILDREN,
  notifications: [],
  dashboards: {
    padre: { children: CHILDREN, paymentAlert: 'Tienes 1 pago pendiente.' },
  },
  extra: {
    '/payments/account-statement/s1': ACCOUNT_STATEMENT,
  } as Record<string, any>,
};

test('padre: dashboard muestra alerta de pago', async ({ page }) => {
  await loginAs(page, { profile: PARENT_PROFILE, api: API_FX });
  await expect(page.getByText('Tienes 1 pago pendiente.')).toBeVisible();
  await expect(page.getByText('Carlos López')).toBeVisible();
});

test('padre: sidebar tiene "Mis hijos"', async ({ page }) => {
  await loginAs(page, { profile: PARENT_PROFILE, api: API_FX });
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'Mis hijos' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Finanzas' })).toBeVisible();
  // No admin items
  await expect(nav.getByRole('link', { name: 'Profesores' })).toBeHidden();
});

test('padre: página mis hijos y vincular', async ({ page }) => {
  await loginAs(page, { profile: PARENT_PROFILE, api: API_FX });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Mis hijos' }).click();
  await expect(page).toHaveURL(/\/children/);
  await expect(page.getByText('Carlos López')).toBeVisible();
  // Botón vincular
  await expect(page.getByRole('button', { name: 'Vincular hijo' })).toBeVisible();
  // Open link modal
  await page.getByRole('button', { name: 'Vincular hijo' }).click();
  await expect(page.getByText('Código del alumno')).toBeVisible();
});

test('padre: finanzas con estado de cuenta', async ({ page }) => {
  await loginAs(page, { profile: PARENT_PROFILE, api: API_FX });
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Finanzas' }).click();
  await expect(page.getByText('Estado de cuenta de tus hijos')).toBeVisible();
});
