import { test, expect, type Page, type Route } from '@playwright/test';
import { loginAs, mockApi, mockSupabase } from './helpers';

/**
 * DEMO PWA — Futcademic Web.
 *
 * Corre contra el build de producción servido por `vite preview`
 * (ver playwright.pwa.config.ts), que es donde existe el service worker.
 *
 * Secciones:
 *   1. Manifest, iconos y meta tags de instalación
 *   2. Service worker activo y app shell precacheada
 *   3. Uso normal con conexión (la caché de datos se persiste)
 *   4. Sin conexión: la app sigue viva y muestra datos guardados
 *   5. Vuelta a la conexión
 *   6. Cerrar sesión borra la caché (aislamiento entre academias)
 *   7. Cola de escrituras: pase de lista sin red, reenvío al volver
 */

const ADMIN_PROFILE = {
  id: 'admin-1',
  email: 'director@futcademic.com',
  full_name: 'Roberto Sánchez',
  role: 'admin' as const,
  school_id: 'school-1',
  school: { name: 'Academia Futcademic', logo_url: null },
};

const STUDENTS = [
  { id: 's1', full_name: 'Carlos López', email: 'carlos@futcademic.com', birth_date: '2012-05-10', category_id: 'cat1', status: 'activo', category: { id: 'cat1', name: 'Sub-12' }, uniform_delivered: true },
  { id: 's2', full_name: 'Ana Torres', email: 'ana@futcademic.com', birth_date: '2013-01-15', category_id: 'cat1', status: 'becado', category: { id: 'cat1', name: 'Sub-12' }, uniform_delivered: false },
  { id: 's3', full_name: 'Diego Ramírez', email: 'diego@futcademic.com', birth_date: '2011-08-20', category_id: 'cat2', status: 'activo', category: { id: 'cat2', name: 'Sub-14' }, uniform_delivered: true },
];

const CATEGORIES = [
  { id: 'cat1', name: 'Sub-12', birth_year: '2012-2013', color: '#3498db', monthly_fee: 500, teacher_id: 't1', teacher: { id: 't1', full_name: 'Prof. García' } },
  { id: 'cat2', name: 'Sub-14', birth_year: '2010-2011', color: '#e74c3c', monthly_fee: 600, teacher_id: 't2', teacher: { id: 't2', full_name: 'Prof. Martínez' } },
];

const EVENTS = [
  { id: 'e1', category_id: 'cat1', date: '2025-07-01', start_time: '17:00', type: 'entrenamiento', category: { id: 'cat1', name: 'Sub-12' } },
];

const API = {
  students: STUDENTS,
  categories: CATEGORIES,
  events: EVENTS,
  notifications: [],
  dashboards: {
    admin: { activeStudents: 3, totalStudents: 3, monthlyIncome: 4500, pendingPayments: 1, attendanceRate: 87.5, upcomingEvents: EVENTS },
  },
};

const pause = (ms = 900) => new Promise((r) => setTimeout(r, ms));

/**
 * Los mocks de `page.route` NO alcanzan a las peticiones que origina el service
 * worker. Registramos los mismos handlers en el contexto para que la app siga
 * respondiendo con el SW en medio.
 */
async function mockAtContextLevel(page: Page) {
  const ctx = page.context() as unknown as Page;
  await mockSupabase(ctx, ADMIN_PROFILE);
  await mockApi(ctx, API);
}

/** Rótulo sobreimpreso para que el video se entienda sin narración. */
async function caption(page: Page, text: string, ms = 2200) {
  await page.evaluate((t) => {
    document.getElementById('pwa-caption')?.remove();
    const el = document.createElement('div');
    el.id = 'pwa-caption';
    el.textContent = t;
    el.setAttribute(
      'style',
      [
        'position:fixed', 'left:50%', 'bottom:28px', 'transform:translateX(-50%)',
        'z-index:2147483647', 'background:rgba(0,44,21,.94)', 'color:#fff',
        'font:600 17px/1.4 -apple-system,Segoe UI,Roboto,sans-serif',
        'padding:12px 22px', 'border-radius:10px', 'max-width:78%',
        'text-align:center', 'box-shadow:0 8px 24px rgba(0,0,0,.35)',
        'pointer-events:none',
      ].join(';'),
    );
    document.body.appendChild(el);
  }, text);
  await pause(ms);
}

/** Espera a que el service worker quede activo y controlando la página. */
async function waitForServiceWorker(page: Page) {
  await page.waitForFunction(
    async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return reg?.active?.state === 'activated';
    },
    null,
    { timeout: 30_000 },
  );
  // `clientsClaim: true` hace que el SW controle la pestaña ya abierta, sin
  // necesidad de recargar.
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15_000 });
}

// ═══════════════════════════════════════════════════════════
// 1. INSTALABLE
// ═══════════════════════════════════════════════════════════

test('01 — Manifest, iconos y meta tags de instalación', async ({ page }) => {
  await mockAtContextLevel(page);
  await mockSupabase(page, ADMIN_PROFILE);
  await mockApi(page, API);

  await page.goto('/login');
  await caption(page, 'Futcademic ahora es una PWA instalable', 1800);

  // El plugin inyecta el <link rel="manifest">.
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#006d35');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);

  const manifest = await page.evaluate(async () => {
    const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!.href;
    return (await fetch(href)).json();
  });

  expect(manifest.name).toBe('Futcademic');
  expect(manifest.display).toBe('standalone');
  expect(manifest.theme_color).toBe('#006d35');
  expect(manifest.icons).toHaveLength(3);
  expect(manifest.icons.some((i: any) => i.purpose === 'maskable')).toBe(true);

  // Los iconos existen de verdad (no basta con declararlos en el manifest).
  for (const icon of manifest.icons) {
    const status = await page.evaluate(async (src) => (await fetch(src)).status, icon.src);
    expect(status, `icono ${icon.src}`).toBe(200);
  }

  // Muestra en pantalla el manifest y los iconos para que se vea en el video.
  await page.evaluate((m) => {
    const box = document.createElement('div');
    box.setAttribute(
      'style',
      'position:fixed;inset:0;z-index:2147483646;background:#fff;display:flex;' +
        'flex-direction:column;align-items:center;justify-content:center;gap:28px;' +
        'font:15px/1.6 -apple-system,Segoe UI,Roboto,monospace',
    );
    const icons = m.icons
      .map(
        (i: any) =>
          `<figure style="margin:0;text-align:center">
             <img src="${i.src}" style="width:104px;height:104px;border-radius:18px;box-shadow:0 6px 18px rgba(0,0,0,.18)">
             <figcaption style="margin-top:10px;color:#555;font-size:13px">${i.sizes} · ${i.purpose}</figcaption>
           </figure>`,
      )
      .join('');
    box.innerHTML =
      `<h2 style="margin:0;font:700 26px -apple-system,Segoe UI,Roboto;color:#006d35">manifest.webmanifest</h2>` +
      `<div style="display:flex;gap:36px">${icons}</div>` +
      `<pre style="margin:0;background:#f4f6f5;padding:18px 24px;border-radius:10px;color:#213">` +
      `name:         ${m.name}\ndisplay:      ${m.display}\ntheme_color:  ${m.theme_color}\nstart_url:    ${m.start_url}\norientation:  ${m.orientation}</pre>`;
    document.body.appendChild(box);
  }, manifest);
  await caption(page, 'Manifest servido, 3 iconos (incluido maskable) y theme-color de marca', 3000);
});

// ═══════════════════════════════════════════════════════════
// 2. SERVICE WORKER
// ═══════════════════════════════════════════════════════════

test('02 — Service worker activo y app shell precacheada', async ({ page }) => {
  await mockAtContextLevel(page);
  await mockSupabase(page, ADMIN_PROFILE);
  await mockApi(page, API);

  await page.goto('/login');
  await caption(page, 'Al primer acceso se registra el service worker…', 1500);

  await waitForServiceWorker(page);

  const sw = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const names = await caches.keys();
    let entries = 0;
    for (const n of names) entries += (await (await caches.open(n)).keys()).length;
    return { state: reg!.active!.state, scope: reg!.scope, controlled: !!navigator.serviceWorker.controller, names, entries };
  });

  expect(sw.state).toBe('activated');
  expect(sw.controlled).toBe(true);
  expect(sw.entries).toBeGreaterThan(10); // JS, CSS, HTML e iconos precacheados

  await caption(
    page,
    `Service worker activado · ${sw.entries} archivos precacheados en ${sw.names.length} caché(s)`,
    3000,
  );
});

// ═══════════════════════════════════════════════════════════
// 3-6. OFFLINE
// ═══════════════════════════════════════════════════════════

/** El alumno de prueba, en la fila de la tabla (no en la tarjeta de teléfono). */
const alumnoEnTabla = (page: Page) =>
  page.getByRole('cell', { name: 'Abrir ficha de Carlos López' });

test('03 — Con conexión: la app carga y guarda la caché de datos', async ({ page }) => {
  await mockAtContextLevel(page);
  await loginAs(page, { profile: ADMIN_PROFILE, api: API });
  await waitForServiceWorker(page);

  await caption(page, 'Sesión iniciada. Navegamos con conexión normal.', 1800);
  await expect(page.locator('header')).toBeVisible();

  await page.goto('/admin/students');
  // Por la celda de la tabla: el listado monta también las tarjetas de teléfono,
  // así que el nombre aparece dos veces en el DOM y `getByText` sería ambiguo.
  await expect(alumnoEnTabla(page)).toBeVisible();
  await caption(page, 'Los datos que consultas se guardan en caché para leerlos sin conexión', 2600);

  // El persister escribe con throttle de 1 s.
  await page.waitForFunction(() => !!localStorage.getItem('futcademic-query-cache'), null, {
    timeout: 15_000,
  });

  const cached = await page.evaluate(() => {
    const raw = localStorage.getItem('futcademic-query-cache')!;
    const parsed = JSON.parse(raw);
    return {
      bytes: raw.length,
      keys: parsed.clientState.queries.map((q: any) => JSON.stringify(q.queryKey)),
    };
  });
  expect(cached.keys.length).toBeGreaterThan(0);
  await caption(page, `Caché persistida: ${cached.keys.length} consultas (${Math.round(cached.bytes / 1024)} KB)`, 2600);
});

test('04 — Sin conexión: la app sigue funcionando con datos guardados', async ({ page, context }) => {
  await mockAtContextLevel(page);
  await loginAs(page, { profile: ADMIN_PROFILE, api: API });
  await waitForServiceWorker(page);

  await page.goto('/admin/students');
  await expect(alumnoEnTabla(page)).toBeVisible();
  await page.waitForFunction(() => !!localStorage.getItem('futcademic-query-cache'), null, { timeout: 15_000 });
  await caption(page, 'Ahora cortamos la red por completo…', 1800);

  // Corte real: se quitan los mocks y el contexto pasa a offline, así que ni la
  // app ni el service worker pueden llegar a ningún servidor.
  await context.setOffline(true);
  await caption(page, 'Modo avión: sin red, ni siquiera para el service worker', 2000);

  // Recarga completa: el shell tiene que salir del precache del service worker.
  await page.reload({ waitUntil: 'load' });

  await expect(page.locator('header')).toBeVisible({ timeout: 20_000 });
  await caption(page, 'La app carga igualmente: el shell viene del service worker', 2600);

  // Aviso visible de que los datos pueden no estar al día.
  await expect(page.getByText('Sin conexión')).toBeVisible({ timeout: 15_000 });

  // Y los datos siguen ahí, rehidratados desde localStorage.
  await expect(alumnoEnTabla(page)).toBeVisible({ timeout: 20_000 });
  await caption(page, 'Badge "Sin conexión" + los alumnos siguen visibles desde la caché', 3000);

  await context.setOffline(false);
  await caption(page, 'Al volver la conexión, el aviso desaparece y se refrescan los datos', 2600);
  await expect(page.getByText('Sin conexión')).toBeHidden({ timeout: 15_000 });
});

test('05 — Cerrar sesión borra la caché (aislamiento entre academias)', async ({ page }) => {
  await mockAtContextLevel(page);
  await loginAs(page, { profile: ADMIN_PROFILE, api: API });
  await waitForServiceWorker(page);

  await page.goto('/admin/students');
  await expect(alumnoEnTabla(page)).toBeVisible();
  await page.waitForFunction(() => !!localStorage.getItem('futcademic-query-cache'), null, { timeout: 15_000 });
  await caption(page, 'La caché guarda datos de la academia del usuario actual', 2200);

  await page.getByLabel('Menú de usuario').click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();

  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  await caption(page, 'Al cerrar sesión se borra: el siguiente usuario no ve datos ajenos', 2800);

  // El persister vuelve a escribir su estado (vacío) tras el clear, así que lo
  // que importa no es que la clave desaparezca sino que no quede ningún dato.
  await page.waitForTimeout(1500);
  const leftover = await page.evaluate(() => localStorage.getItem('futcademic-query-cache'));
  expect(leftover ?? '').not.toContain('Carlos López');
  if (leftover) {
    expect(JSON.parse(leftover).clientState.queries).toHaveLength(0);
  }
});

// ═══════════════════════════════════════════════════════════
// 7. COLA DE ESCRITURAS SIN CONEXIÓN
// ═══════════════════════════════════════════════════════════

test('06 — Sin conexión: el pase de lista se guarda y se envía al volver la red', async ({
  page,
  context,
}) => {
  await mockAtContextLevel(page);
  await loginAs(page, { profile: ADMIN_PROFILE, api: API });
  await waitForServiceWorker(page);

  // Cuenta los POST que llegan DE VERDAD al backend. Se registra después de
  // `loginAs` a propósito: en Playwright gana el handler más reciente, y el de
  // `mockApi` atrapa `/api/**`.
  const enviados: unknown[] = [];
  const contarPost = async (route: Route) => {
    const req = route.request();
    if (req.method() === 'POST') enviados.push(req.postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'ok' }),
    });
  };
  await context.route('http://localhost:3000/api/attendances', contarPost);
  await page.route('http://localhost:3000/api/attendances', contarPost);

  await page.goto('/attendance');
  await page.getByRole('textbox', { name: 'Categoría' }).click();
  await page.getByRole('option', { name: 'Sub-12' }).click();
  await expect(page.getByText('Carlos López')).toBeVisible();
  await caption(page, 'Pase de lista en la cancha… donde justo no hay señal', 2000);

  await context.setOffline(true);
  await expect(page.getByText('Sin conexión')).toBeVisible({ timeout: 15_000 });

  // Marca a todos los de la lista (si queda alguno sin marcar sale el diálogo
  // «sin marcar») y guarda, ya sin red.
  await page.getByRole('button', { name: 'Presente: Carlos López' }).click();
  await page.getByRole('button', { name: 'Ausente: Ana Torres' }).click();
  await page.getByRole('button', { name: 'Presente: Diego Ramírez' }).click();
  await page.getByRole('button', { name: 'Guardar pase de lista' }).click();

  await expect(page.getByText('Guardado sin conexión')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('1 por enviar')).toBeVisible({ timeout: 10_000 });
  expect(enviados, 'sin red no debe salir ninguna petición').toHaveLength(0);
  await caption(page, 'Queda guardado en el teléfono: "1 por enviar"', 2600);

  // La cola se persiste: sobrevive a cerrar la app.
  await page.waitForFunction(
    () => {
      const raw = localStorage.getItem('futcademic-query-cache');
      if (!raw) return false;
      return (JSON.parse(raw).clientState.mutations ?? []).length > 0;
    },
    null,
    { timeout: 15_000 },
  );

  // Recarga completa SIN red: el shell sale del service worker, la cola se
  // rehidrata y lo marcado sigue en pantalla.
  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('header')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('1 por enviar')).toBeVisible({ timeout: 20_000 });
  expect(enviados, 'una app abierta sin red no debe disparar la cola').toHaveLength(0);
  // La categoría viaja en la URL (?categoria=) y sobrevive a la recarga. No se
  // vuelve a elegir: en Mantine, pulsar la opción ya elegida la deselecciona.
  await expect(
    page.getByRole('button', { name: 'Presente: Carlos López' }),
  ).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  await caption(page, 'Tras recargar sin red: el cambio sigue en cola y la marca en pantalla', 3000);

  // Vuelve la conexión: la cola se envía sola.
  await context.setOffline(false);
  await expect(page.getByText('Cambios enviados')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('1 por enviar')).toBeHidden({ timeout: 20_000 });
  expect(enviados, 'al volver la red el pase de lista debe salir una sola vez').toHaveLength(1);
  await caption(page, 'Al volver la señal se envía solo, una sola vez', 3000);
});
