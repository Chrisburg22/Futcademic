import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Contexto de pantalla del asistente.
 *
 * Lo que se prueba aquí es el contrato completo: la ficha registra el alumno,
 * el widget lo muestra ("Viendo: …") y el cuerpo del mensaje que sale hacia el
 * backend lleva ese contexto. Sin esto, el modelo solo ve "este alumno" y no
 * sabe de quién se habla.
 */

const STUDENT = {
  id: 's1',
  full_name: 'Carlos López',
  email: 'carlos@test.com',
  category_id: 'cat1',
  category: { id: 'cat1', name: 'Sub-12' },
  status: 'activo',
  birth_date: '2012-05-01',
  phone: '555-0101',
};

const SSE = [
  'event: conversation\ndata: {"id":"conv-1","title":"prueba"}\n\n',
  'event: text_delta\ndata: {"text":"Tiene una cuota pendiente."}\n\n',
  'event: done\ndata: {}\n\n',
].join('');

test('la ficha del alumno viaja en el mensaje del chat', async ({ page }) => {
  await loginAs(page, {
    goto: '/admin/students/s1',
    api: {
      students: [STUDENT],
      extra: { '/students/s1': STUDENT },
    },
  });

  await expect(page.getByRole('heading', { name: 'Carlos López' })).toBeVisible();

  // El mock del chat se registra después del harness para tener prioridad.
  let body: any = null;
  await page.route('http://localhost:3000/api/chat/**', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: SSE,
    });
  });

  await page.getByRole('button', { name: 'Abrir asistente IA' }).click();
  await expect(page.getByText('Viendo: Ficha del alumno · Carlos López')).toBeVisible();

  await page.getByPlaceholder('Escribe una orden o pregunta…').fill('¿Debe algo este alumno?');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect.poll(() => body).not.toBeNull();
  expect(body.message).toBe('¿Debe algo este alumno?');
  expect(body.context).toEqual({
    screen: 'Ficha del alumno',
    entity: { type: 'alumno', id: 's1', name: 'Carlos López' },
  });
});

test('fuera de una ficha, la ruta da un contexto genérico', async ({ page }) => {
  await loginAs(page, { goto: '/finances' });

  await page.getByRole('button', { name: 'Abrir asistente IA' }).click();
  await expect(page.getByText('Viendo: Finanzas')).toBeVisible();
});

test('finanzas manda el mes que está seleccionado', async ({ page }) => {
  await loginAs(page, { goto: '/finances' });
  await expect(page.getByRole('heading', { name: 'Finanzas' })).toBeVisible();

  let body: any = null;
  await page.route('http://localhost:3000/api/chat/**', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: SSE,
    });
  });

  await page.getByRole('button', { name: 'Abrir asistente IA' }).click();
  await page.getByPlaceholder('Escribe una orden o pregunta…').fill('¿Cuánto se cobró?');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect.poll(() => body).not.toBeNull();
  const now = new Date();
  const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  expect(body.context).toEqual({
    screen: 'Finanzas',
    filters: [
      { label: 'Mes', value: mes },
      { label: 'Vista', value: 'pagos de alumnos' },
    ],
  });
});
