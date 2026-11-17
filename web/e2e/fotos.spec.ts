import { test, expect, type Locator, type Page } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Subida de fotos: alumnos, profesores, perfil propio y escudo de categoría.
 * El recorte corre de verdad en el navegador (react-easy-crop + canvas); lo
 * único simulado es la respuesta del backend.
 */

const FOTO = 'e2e/fixtures/foto.png';

const CATEGORIAS = [{ id: 'c1', name: 'Sub-12', birth_year: '2014', color: '#1971c2' }];

const ALUMNO = {
  id: 's1',
  full_name: 'Carlos López',
  birth_date: '2014-03-10',
  category_id: 'c1',
  category: CATEGORIAS[0],
  status: 'activo',
  avatar_url: null,
  uniform_delivered: false,
  expediente_status: 'completo',
  expediente_missing: [],
  created_at: '2026-01-10T10:00:00Z',
};

const EXTRA_ALUMNO = {
  '/students/s1': ALUMNO,
  '/students/s1/stats': {
    currentStreak: 0,
    maxStreak: 0,
    trainingsThisMonth: 0,
    attendedThisMonth: 0,
    achievementsUnlocked: 0,
    totalAchievements: 6,
  },
  '/students/s1/team': { teamName: 'Sub-12', teammates: [], teachers: [] },
  '/students/s1/expediente': { status: 'completo', documents: [], missing: [] },
  '/upload/student/s1/photo': { avatarUrl: 'https://cdn.test/fotos/s1-nueva.jpg' },
};

/**
 * Elige el archivo y confirma el recorte. `ambito` acota dónde está el
 * uploader: la ficha tiene dos (la cabecera y el del editor, en «Datos»).
 */
async function subirFoto(page: Page, ambito?: Locator) {
  const raiz = ambito ?? page;
  await raiz.getByRole('button', { name: 'Subir foto' }).first().click();
  await raiz.locator('input[type="file"]').first().setInputFiles(FOTO);
  await expect(page.getByRole('dialog')).toBeVisible();
  const guardar = page.getByRole('button', { name: 'Guardar foto' });
  await expect(guardar).toBeEnabled();
  await guardar.click();
}

test('un admin sube la foto de un alumno desde su ficha', async ({ page }) => {
  await loginAs(page, {
    goto: '/admin/students/s1',
    api: { students: [ALUMNO], categories: CATEGORIAS, extra: EXTRA_ALUMNO },
  });

  const peticion = page.waitForRequest(
    (req) => req.method() === 'POST' && req.url().includes('/upload/student/s1/photo'),
  );

  await subirFoto(page);

  // El recorte se sube como JPEG, no como el PNG original.
  const req = await peticion;
  expect(req.postData()).toContain('image/jpeg');
  await expect(page.getByText('Foto actualizada')).toBeVisible();
});

test('un profesor sin permiso de alumnos no ve el botón de foto', async ({ page }) => {
  await loginAs(page, {
    profile: {
      id: 't1',
      email: 'profe@test.com',
      full_name: 'Ana Profe',
      role: 'profesor',
      onboarded_at: '2025-01-01',
    },
    goto: '/admin/students/s1',
    api: {
      students: [ALUMNO],
      categories: CATEGORIAS,
      permissions: {
        can_take_attendance: true,
        can_manage_events: false,
        can_view_finances: false,
        can_manage_students: false,
        can_manage_payments: false,
        can_manage_categories: false,
      },
      extra: EXTRA_ALUMNO,
    },
  });

  await expect(page.getByText('Carlos López').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Subir foto' })).toHaveCount(0);
});

test('cancelar el recorte no sube nada', async ({ page }) => {
  await loginAs(page, {
    goto: '/admin/students/s1',
    api: { students: [ALUMNO], categories: CATEGORIAS, extra: EXTRA_ALUMNO },
  });

  let subidas = 0;
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().includes('/upload/')) subidas += 1;
  });

  await page.getByRole('button', { name: 'Subir foto' }).first().click();
  await page.locator('input[type="file"]').first().setInputFiles(FOTO);
  await page.getByRole('button', { name: 'Cancelar' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(subidas).toBe(0);
});

test('el usuario sube su propia foto de perfil', async ({ page }) => {
  await loginAs(page, {
    goto: '/settings/edit-profile',
    api: { extra: { '/upload/avatar': { avatarUrl: 'https://cdn.test/fotos/yo.jpg' } } },
  });

  const peticion = page.waitForRequest(
    (req) => req.method() === 'POST' && req.url().includes('/upload/avatar'),
  );

  await subirFoto(page);

  await peticion;
  await expect(page.getByText('Foto actualizada')).toBeVisible();
});

test('la foto también se sube desde el editor del alumno', async ({ page }) => {
  await loginAs(page, {
    goto: '/admin/students/s1',
    api: { students: [ALUMNO], categories: CATEGORIAS, extra: EXTRA_ALUMNO },
  });

  await page.getByRole('tab', { name: 'Datos' }).click();
  const editor = page.getByRole('tabpanel', { name: 'Datos' });
  await expect(editor.getByLabel('Nombre completo')).toBeVisible();

  const peticion = page.waitForRequest(
    (req) => req.method() === 'POST' && req.url().includes('/upload/student/s1/photo'),
  );

  await subirFoto(page, editor);

  await peticion;
  await expect(page.getByText('Foto actualizada')).toBeVisible();
  // La foto no pasa por «Guardar cambios»: el formulario sigue sin tocar.
  await expect(editor.getByText('La foto se guarda al subirla', { exact: false })).toBeVisible();
});
