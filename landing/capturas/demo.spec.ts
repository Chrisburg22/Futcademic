import { test } from '@playwright/test';
import { loginAs } from '../../web/e2e/helpers';
import { API, ONBOARDED, STUDENTS } from './datos';

/**
 * Recorrido grabado del panel. Los capítulos coinciden con la lista que muestra
 * la sección Demo del landing (`src/components/sections/Demo.astro`).
 */

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

test('recorrido del panel', async ({ page }) => {
  // 1. Dar de alta un alumno y asignarlo a su categoría
  await loginAs(page, { api: API, goto: '/admin/students' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await pausa(2500);

  // 2. Pasar lista de un entrenamiento
  await page.goto('/attendance');
  await page.waitForLoadState('networkidle').catch(() => {});
  await pausa(1200);
  await page.getByPlaceholder('Selecciona').first().click();
  await page.getByRole('option', { name: 'Sub-12' }).click();
  await pausa(2500);

  // 3. Registrar un pago y avisar al padre
  await page.goto('/finances');
  await page.waitForLoadState('networkidle').catch(() => {});
  await pausa(1800);
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await pausa(2500);

  // 4. Programar entrenamientos recurrentes
  await page.goto('/admin/events');
  await page.waitForLoadState('networkidle').catch(() => {});
  await pausa(2500);

  // 5. Lo que ve el alumno cuando entra
  // La sesión de supabase-js vive en localStorage: limpiarla es "cerrar sesión".
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/login');
  await loginAs(page, {
    profile: {
      id: 'user-alumno-1',
      email: STUDENTS[0].email,
      onboarded_at: ONBOARDED,
      full_name: STUDENTS[0].full_name,
      role: 'alumno',
    },
    api: API,
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  await pausa(2500);
});
