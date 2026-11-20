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

/**
 * Sustituye micrófono, grabador, decodificador y worker para probar el flujo
 * de dictado sin descargar los ~100 MB del modelo real ni depender de permisos.
 */
async function stubLocalDictation(
  page: import('@playwright/test').Page,
  { transcript, failModel = false }: { transcript: string; failModel?: boolean }
) {
  await page.addInitScript(
    ({ text, shouldFail }) => {
      const stream = { getTracks: () => [{ stop() {} }] };
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: async () => stream },
      });

      class FakeRecorder {
        static isTypeSupported() {
          return false;
        }

        state = 'inactive';
        mimeType = 'audio/webm';
        ondataavailable: ((event: { data: Blob }) => void) | null = null;
        onstop: (() => void) | null = null;
        onerror: (() => void) | null = null;

        start() {
          this.state = 'recording';
        }

        stop() {
          this.state = 'inactive';
          this.ondataavailable?.({
            data: new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' }),
          });
          this.onstop?.();
        }
      }
      Object.defineProperty(window, 'MediaRecorder', {
        configurable: true,
        value: FakeRecorder,
      });

      class FakeAudioContext {
        async decodeAudioData() {
          const data = new Float32Array(16000);
          for (let i = 0; i < data.length; i += 1) {
            data[i] = 0.2 * Math.sin(i / 10);
          }
          return {
            duration: 1,
            numberOfChannels: 1,
            sampleRate: 16000,
            length: data.length,
            getChannelData: () => data,
          };
        }

        async close() {}
      }
      Object.defineProperty(window, 'AudioContext', {
        configurable: true,
        value: FakeAudioContext,
      });

      const NativeWorker = window.Worker;
      class FakeSpeechWorker {
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: ErrorEvent) => void) | null = null;

        constructor(url: URL | string, options?: { name?: string }) {
          // Cualquier otro worker (HMR y demás) sigue usando el real.
          if (options?.name !== 'futcademic-dictation') {
            return new NativeWorker(url as string | URL, options);
          }
        }

        postMessage(message: { type: string; id?: number }) {
          if (message.type === 'warmup') {
            window.setTimeout(() => {
              this.onmessage?.({
                data: shouldFail
                  ? { type: 'error', stage: 'model' }
                  : { type: 'ready' },
              } as MessageEvent);
            }, 10);
            return;
          }

          if (message.type === 'transcribe') {
            if (shouldFail) {
              window.setTimeout(() => {
                this.onmessage?.({
                  data: { type: 'error', id: message.id, stage: 'model' },
                } as MessageEvent);
              }, 10);
              return;
            }

            window.setTimeout(() => {
              this.onmessage?.({
                data: { type: 'transcribing', id: message.id },
              } as MessageEvent);
            }, 10);
            window.setTimeout(() => {
              this.onmessage?.({
                data: { type: 'result', id: message.id, text },
              } as MessageEvent);
            }, 40);
          }
        }

        terminate() {}
      }
      Object.defineProperty(window, 'Worker', {
        configurable: true,
        value: FakeSpeechWorker,
      });
    },
    { text: transcript, shouldFail: failModel }
  );
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

test('en móvil el widget termina antes de la barra de navegación', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAs(page, { goto: '/' });

  const barra = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(barra).toBeVisible();
  const barraBox = (await barra.boundingBox())!;

  await page.getByRole('button', { name: 'Abrir asistente IA' }).click();
  const panel = widgetPanel(page);
  const panelBox = (await panel.boundingBox())!;
  expect(panelBox.y).toBeLessThanOrEqual(16);
  // Contra la barra, no contra un número: su alto se ajusta en un sitio.
  expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(barraBox.y + 1);
  await expect(page.getByPlaceholder('Escribe una orden o pregunta…')).toBeVisible();
});

test('el micrófono dicta dentro del composer', async ({ page }) => {
  await stubLocalDictation(page, { transcript: ' doce alumnos activos ' });

  await loginAs(page, { goto: '/finances' });
  await page.getByRole('button', { name: 'Abrir asistente IA' }).click();

  const input = page.getByPlaceholder('Escribe una orden o pregunta…');
  await page.getByRole('button', { name: 'Dictar mensaje' }).click();
  await expect(page.getByRole('button', { name: 'Detener dictado' })).toBeVisible();
  await expect(page.getByText(/Grabando 0:0/)).toBeVisible();

  await page.getByRole('button', { name: 'Detener dictado' }).click();
  await expect(input).toHaveValue('doce alumnos activos');
  await expect(page.getByRole('button', { name: 'Enviar mensaje' })).toBeEnabled();
});

test('si el modelo no carga, el aviso explica la descarga', async ({ page }) => {
  await stubLocalDictation(page, { transcript: '', failModel: true });

  await loginAs(page, { goto: '/finances' });
  await page.getByRole('button', { name: 'Abrir asistente IA' }).click();

  await page.getByRole('button', { name: 'Dictar mensaje' }).click();
  await page.getByRole('button', { name: 'Detener dictado' }).click();

  const alert = page.getByRole('alert').filter({ hasText: 'dictado' });
  await expect(alert).toContainText('No se pudo cargar el dictado');
  await expect(alert).toContainText('~100 MB');
});

test('sin grabadora el composer sigue funcionando', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'MediaRecorder', {
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
