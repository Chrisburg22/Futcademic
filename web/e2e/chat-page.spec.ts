import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Página del asistente (/admin/chat).
 *
 * Dos contratos que se rompieron al rediseñar y que conviene dejar clavados:
 *   1. El widget flotante no debe montarse aquí: duplicaba la conversación y
 *      tapaba el composer.
 *   2. La página debe seguir siendo usable de punta a punta: elegir una
 *      conversación del historial y enviar un mensaje nuevo.
 */

const now = new Date().toISOString();

const CONVERSATION = {
  id: 'conv-1',
  title: 'Pagos pendientes',
  status: 'active',
  created_at: now,
  updated_at: now,
};

const MESSAGES = [
  {
    id: 'm1',
    role: 'user',
    content: [{ type: 'text', text: '¿Quién debe la mensualidad?' }],
    created_at: now,
  },
  {
    id: 'm2',
    role: 'assistant',
    content: [{ type: 'text', text: 'Hay dos familias con adeudo.' }],
    created_at: now,
  },
];

const SSE = [
  'event: conversation\ndata: {"id":"conv-1","title":"Pagos pendientes"}\n\n',
  'event: text_delta\ndata: {"text":"Son 2 pagos pendientes."}\n\n',
  'event: done\ndata: {}\n\n',
].join('');

test('la página del asistente no monta el widget flotante y permite conversar', async ({
  page,
}) => {
  await loginAs(page, {
    goto: '/admin/chat',
    api: {
      extra: {
        '/chat/conversations': [CONVERSATION],
        '/chat/conversations/conv-1/messages': {
          conversation: CONVERSATION,
          messages: MESSAGES,
          feedback: {},
        },
      },
    },
  });

  // El historial tiene su propio panel; el FAB sobra y estorba.
  await expect(page.getByRole('button', { name: 'Abrir asistente IA' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Asistente IA' })).toBeVisible();

  await page.getByRole('button', { name: 'Conversación: Pagos pendientes' }).click();
  await expect(page.getByText('Hay dos familias con adeudo.')).toBeVisible();

  // El mock del stream se registra al final para tener prioridad sobre el
  // harness. Al terminar, el contexto invalida la conversación y vuelve a
  // pedir los mensajes: esa respuesta ya debe incluir el turno nuevo, como
  // haría el backend real.
  let replied = false;
  await page.route('http://localhost:3000/api/chat/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (request.method() === 'GET' && path.endsWith('/messages')) {
      const messages = replied
        ? [
            ...MESSAGES,
            {
              id: 'm3',
              role: 'user',
              content: [{ type: 'text', text: '¿Cuántos son?' }],
              created_at: now,
            },
            {
              id: 'm4',
              role: 'assistant',
              content: [{ type: 'text', text: 'Son 2 pagos pendientes.' }],
              created_at: now,
            },
          ]
        : MESSAGES;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ conversation: CONVERSATION, messages, feedback: {} }),
      });
    }

    if (request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CONVERSATION]),
      });
    }

    replied = true;
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: SSE,
    });
  });

  await page.getByPlaceholder('Escribe una orden o pregunta…').fill('¿Cuántos son?');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByText('Son 2 pagos pendientes.')).toBeVisible();
});
