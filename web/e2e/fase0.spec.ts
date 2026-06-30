import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Fase 0 — infraestructura: sesión/auth, AppShell por rol y la campana de
 * notificaciones (hook useNotifications + componente NotificationBell).
 */

const NOTIFS = [
  {
    id: 'notif-1',
    title: 'Pago registrado',
    body: 'Se registró el pago de mensualidad de Juan Pérez.',
    type: 'payment',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Entrenamiento mañana',
    body: 'Categoría 2012 entrena a las 17:00.',
    type: 'event',
    is_read: true,
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
];

test('usuario sin sesión es redirigido a /login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel('Correo')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

test('admin autenticado ve el AppShell con su academia', async ({ page }) => {
  await loginAs(page, { api: { notifications: NOTIFS } });

  // Header muestra el nombre de la academia (join schools del perfil).
  await expect(page.locator('header').getByText('Academia Demo')).toBeVisible();
  // Sidebar de administración disponible para rol admin.
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'Alumnos' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Categorías' })).toBeVisible();
});

test('campana de notificaciones: badge, dropdown y marcar todas', async ({ page }) => {
  await loginAs(page, { api: { notifications: NOTIFS } });

  const header = page.locator('header');
  const bell = header.getByRole('button', { name: 'Notificaciones' });
  await expect(bell).toBeVisible();

  // Badge de no-leídas = 1.
  await expect(header.getByText('1', { exact: true })).toBeVisible();

  // Abrir dropdown y ver las notificaciones.
  await bell.click();
  await expect(page.getByText('Pago registrado')).toBeVisible();
  await expect(page.getByText('Entrenamiento mañana')).toBeVisible();

  // Marcar todas como leídas -> el botón desaparece (unread llega a 0).
  const markAll = page.getByRole('button', { name: 'Marcar todas' });
  await expect(markAll).toBeVisible();
  await markAll.click();
  await expect(markAll).toBeHidden();
});
