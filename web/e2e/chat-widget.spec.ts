import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Widget flotante del asistente.
 *
 * Dos cosas que se rompieron y que conviene dejar clavadas:
 *   1. El panel tenía un tope de 600px y se veía "a medias"; debe ocupar la
 *      sección completa y dejar libre el dock en móvil.
 *   2. El composer se encogía al ancho del placeholder en vez de llenar el
 *      panel, y el dictado por voz no existía.
 */

function widgetPanel(page: import('@playwright/test').Page) {
  return page
    .locator('.mantine-Paper-root')
    .filter({ has: page.getByRole('button', { name: 'Cerrar asistente' }) });
}

test('el widget ocupa la sección y el composer llena el panel', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAs(page, { goto: '/finances' });

  await page.getByRole('button', { name: 'Abrir asistente IA' }).click();
  const panel = widgetPanel(page);
  await expect(panel).toBeVisible();

  const panelBox = (await panel.boundingBox())!;
  // Arranca debajo del header y termina a 16px del borde inferior.
  expect(panelBox.y).toBeGreaterThanOrEqual(60);
  expect(panelBox.y).toBeLessThanOrEqual(80);
  expect(panelBox.y + panelBox.height).toBeGreaterThanOrEqual(880);

  const input = page.getByPlaceholder('Escribe una orden o pregunta…');
  await expect(input).toBeVisible();
  const inputBox = (await input.boundingBox())!;
  expect(inputBox.width).toBeGreaterThan(panelBox.width * 0.85);
  await expect(page.getByRole('button', { name: 'Enviar mensaje' })).toBeVisible();
});

test('en móvil el widget termina antes del dock', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAs(page, { goto: '/' });

  const dock = page.getByRole('navigation', { name: 'Accesos rápidos' });
  await expect(dock).toBeVisible();

  await page.getByRole('button', { name: 'Abrir asistente IA' }).click();
  const panel = widgetPanel(page);
  const panelBox = (await panel.boundingBox())!;
  expect(panelBox.y).toBeLessThanOrEqual(16);
  expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(768);
  await expect(page.getByPlaceholder('Escribe una orden o pregunta…')).toBeVisible();
});

test('el micrófono dicta dentro del composer', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeSpeechRecognition {
      lang = '';
      continuous = false;
      interimResults = false;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;

      start() {
        const results = [{ isFinal: true, 0: { transcript: 'doce alumnos activos' } }];
        window.setTimeout(() => {
          this.onresult?.({ resultIndex: 0, results });
          this.onend?.();
        }, 20);
      }

      stop() {
        this.onend?.();
      }

      abort() {
        this.onend?.();
      }
    }

    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
  });

  await loginAs(page, { goto: '/finances' });
  await page.getByRole('button', { name: 'Abrir asistente IA' }).click();

  const input = page.getByPlaceholder('Escribe una orden o pregunta…');
  await page.getByRole('button', { name: 'Dictar mensaje' }).click();
  await expect(input).toHaveValue('doce alumnos activos');
  await expect(page.getByRole('button', { name: 'Enviar mensaje' })).toBeEnabled();
});

test('sin reconocimiento de voz el composer sigue funcionando', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: undefined,
    });
  });

  await loginAs(page, { goto: '/finances' });
  await page.getByRole('button', { name: 'Abrir asistente IA' }).click();

  await expect(page.getByRole('button', { name: 'Dictar mensaje' })).toHaveCount(0);
  const input = page.getByPlaceholder('Escribe una orden o pregunta…');
  await input.fill('¿Cuánto se cobró?');
  await expect(page.getByRole('button', { name: 'Enviar mensaje' })).toBeEnabled();
});
