import { test, expect, Page, Browser } from '@playwright/test';

/**
 * Smoke test de producción — https://futcademic.vercel.app
 * Cubre: registro, login, todos los módulos admin.
 *
 * Estrategia: beforeAll registra la academia y guarda la sesión.
 * Los tests de módulos reusan esa sesión para no re-loguear cada vez.
 */

const BASE = 'https://futcademic.vercel.app';
const TS = Date.now();
const ADMIN_EMAIL = `test.admin.${TS}@mailinator.com`;
const ADMIN_PASS = 'TestProd2024!';
const SCHOOL_NAME = `Academia Smoke ${TS}`;
const ADMIN_NAME = 'Admin Smoke Test';

// Sesión compartida para tests que requieren auth
let sessionState: string | undefined;

// ── helpers ──────────────────────────────────────────────────────────────────
async function goto(page: Page, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
}

async function loadSession(page: Page) {
  if (sessionState) {
    await page.context().addInitScript(state => {
      // inyectar localStorage de sesión
      const s = JSON.parse(state);
      for (const [k, v] of Object.entries(s)) {
        localStorage.setItem(k, v as string);
      }
    }, sessionState);
  }
}

// ── Setup global: registrar academia + login una sola vez ─────────────────────
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();

  // 1. Registrar
  await page.goto(`${BASE}/register`, { waitUntil: 'load' });
  await page.getByLabel('Nombre de la academia').fill(SCHOOL_NAME);
  await page.getByLabel('Tu nombre completo').fill(ADMIN_NAME);
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /crear academia/i }).click();

  // Esperar éxito (hasta 60s para el cold start de Render)
  await expect(
    page.getByText(/academia creada|redirigiendo/i)
  ).toBeVisible({ timeout: 60_000 });

  // 2. Login para obtener sesión
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 30_000 });

  // Guardar localStorage para compartir sesión
  const ls = await page.evaluate(() => {
    const out: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      out[k] = localStorage.getItem(k)!;
    }
    return out;
  });
  sessionState = JSON.stringify(ls);
  await page.close();
});

// ── Tests de páginas públicas (sin auth) ─────────────────────────────────────
test('1. Login page carga', async ({ page }) => {
  await goto(page, '/login');
  await expect(page.getByText('Futcademic')).toBeVisible();
  await expect(page.getByLabel('Correo')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /registra tu academia/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /acceso alumno/i })).toBeVisible();
});

test('2. Register page carga', async ({ page }) => {
  await goto(page, '/register');
  await expect(page.getByRole('heading', { name: /registrar academia/i })).toBeVisible();
  await expect(page.getByLabel('Nombre de la academia')).toBeVisible();
  await expect(page.getByLabel('Tu nombre completo')).toBeVisible();
});

test('3. Student-login page carga', async ({ page }) => {
  await goto(page, '/student-login');
  await expect(page.getByText(/acceso alumno/i)).toBeVisible();
  await expect(page.getByLabel(/usuario/i)).toBeVisible();
});

test('4. Página de términos carga', async ({ page }) => {
  await goto(page, '/settings/terms');
  await expect(page.getByText(/Futcademic/)).toBeVisible();
});

// ── Tests autenticados ────────────────────────────────────────────────────────
test('5. Login funciona', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await expect(page.url()).toContain(BASE);
});

test('6. Dashboard admin carga', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await expect(page.getByText('Alumnos activos').first()).toBeVisible({ timeout: 10_000 });
});

test('7. Sidebar muestra módulos admin', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });

  const nav = page.getByRole('navigation');
  for (const label of ['Alumnos', 'Profesores', 'Categorías', 'Agenda', 'Canchas', 'Finanzas', 'Asistencias']) {
    await expect(nav.getByText(label, { exact: true })).toBeVisible();
  }
});

test('8. Módulo Alumnos', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await goto(page, '/admin/students');
  await expect(page.getByRole('heading', { name: /alumnos/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /agregar|nuevo|añadir/i })).toBeVisible();
});

test('9. Módulo Profesores', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await goto(page, '/admin/teachers');
  await expect(page.getByRole('heading', { name: /profesores/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Invitar profesor' })).toBeVisible();
});

test('10. Módulo Categorías', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await goto(page, '/admin/categories');
  await expect(page.getByRole('heading', { name: /categorías/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /nueva|crear/i })).toBeVisible();
});

test('11. Módulo Canchas — lista y crear', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await goto(page, '/admin/venues');
  await expect(page.getByRole('heading', { name: /canchas/i })).toBeVisible();
  // Crear cancha
  await page.getByRole('button', { name: /nueva|agregar/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await page.getByRole('textbox', { name: /nombre/i }).fill('Cancha Smoke Test');
  await page.getByRole('button', { name: /guardar|crear/i }).click();
  await expect(page.getByText('Cancha Smoke Test')).toBeVisible({ timeout: 15_000 });
});

test('12. Módulo Eventos', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await goto(page, '/admin/events');
  await expect(page.getByRole('heading', { name: /agenda/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nuevo evento' })).toBeVisible();
});

test('13. Módulo Finanzas — tabs', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await goto(page, '/finances');
  await expect(page.getByRole('heading', { name: /finanzas/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /alumnos/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /profesores/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /pendientes/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /registrar pago/i })).toBeVisible();
});

test('14. Módulo Asistencias', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await goto(page, '/attendance');
  await expect(page.getByRole('heading', { name: /asistencias/i })).toBeVisible();
  await expect(page.getByText(/selecciona una categoría/i)).toBeVisible();
});

test('15. Configuración — Perfil', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await goto(page, '/settings/edit-profile');
  await expect(page.getByRole('heading', { name: /perfil/i })).toBeVisible();
});

test('16. Configuración — Academia', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await goto(page, '/settings/edit-academy');
  await expect(page.getByRole('heading', { name: /academia/i })).toBeVisible();
  await expect(page.locator(`input[value="${SCHOOL_NAME}"]`)).toBeVisible({ timeout: 10_000 });
});

test('17. Export — botones CSV', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await goto(page, '/settings/export');
  await expect(page.getByRole('heading', { name: /exportar/i })).toBeVisible();
  await expect(page.getByText(/pagos \(csv/i)).toBeVisible();
  await expect(page.getByText(/asistencia \(csv/i)).toBeVisible();
});

test('18. Ruta desconocida redirige al inicio', async ({ page }) => {
  await goto(page, '/login');
  await page.getByLabel('Correo').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 20_000 });
  await goto(page, '/ruta-inexistente-xyz');
  await page.waitForURL(/futcademic\.vercel\.app\/$/, { timeout: 10_000 });
  await expect(page.url()).toMatch(/futcademic\.vercel\.app\/$/);
});
