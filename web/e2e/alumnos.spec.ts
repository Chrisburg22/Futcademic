import { test, expect, type Page } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Sección de alumnos: listado con KPIs, filtros, orden, selección masiva,
 * edición rápida y ficha con pestañas. Todo contra el backend simulado.
 */

const CATEGORIAS = [
  { id: 'c1', name: 'Sub-12', birth_year: '2014', color: '#1971c2' },
  { id: 'c2', name: 'Sub-14', birth_year: '2012', color: '#c2255c' },
];

const alumno = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `s${n}`,
  full_name: `Zeta ${String(n).padStart(2, '0')} Pérez`,
  birth_date: n % 2 ? '2014-03-10' : '2012-07-21',
  category_id: n % 2 ? 'c1' : 'c2',
  category: n % 2 ? CATEGORIAS[0] : CATEGORIAS[1],
  parent_id: 'p1',
  parent: { id: 'p1', full_name: 'María López' },
  status: 'activo',
  uniform_delivered: true,
  expediente_status: 'completo',
  expediente_missing: [],
  created_at: `2026-01-${String((n % 28) + 1).padStart(2, '0')}T10:00:00Z`,
  ...extra,
});

const ALUMNOS = [
  alumno(1, {
    full_name: 'Ángel Ramírez',
    status: 'pendiente_pago',
    emergency_contact_name: 'Rosa Ramírez',
    emergency_contact_phone: '55 9999 8888',
  }),
  alumno(2, { full_name: 'Beatriz Soto', expediente_status: 'incompleto', expediente_missing: ['curp', 'acta_nacimiento'] }),
  alumno(3, { full_name: 'Carlos López', parent_id: null, parent: null, expediente_status: 'sin_tutor', uniform_delivered: false }),
  alumno(4, { full_name: 'Diana Cruz', status: 'becado' }),
  alumno(5, { full_name: 'Esteban Gil', status: 'inactivo' }),
  ...Array.from({ length: 25 }, (_, i) => alumno(i + 6)),
];

const DETALLE_BEATRIZ = {
  ...ALUMNOS[1],
  email: 'beatriz@alumno.futcademic.local',
  parent: { id: 'p1', full_name: 'María López', phone: '55 1234 5678' },
};

const DETALLE = {
  ...ALUMNOS[2],
  email: 'carlos@alumno.futcademic.local',
  phone: '5512345678',
  emergency_contact_name: null,
  emergency_contact_phone: null,
  medical_notes: 'Alergia a la penicilina',
};

/** Cobranza del mes: solo Ángel debe (el backend excluye a los becados). */
const COBRANZA = [
  { id: 's1', full_name: 'Ángel Ramírez', monthly_fee: 500, paid_amount: 0, pending_amount: 500 },
];

async function abrirLista(page: Page, ruta = '/admin/students') {
  await loginAs(page, {
    goto: ruta,
    api: {
      students: ALUMNOS,
      categories: CATEGORIAS,
      pendingPayments: COBRANZA,
      users: [{ id: 'p1', full_name: 'María López', role: 'padre' }],
      extra: {
        '/students/s2': DETALLE_BEATRIZ,
        '/students/s2/stats': { currentStreak: 0, maxStreak: 0, trainingsThisMonth: 0, attendedThisMonth: 0, achievementsUnlocked: 0, totalAchievements: 6 },
        '/students/s2/team': { teamName: 'Sub-14', teammates: [], teachers: [] },
        '/payments/account-statement/s2': { monthlyFee: 500, pendingAmount: 0, totalPaid: 0, totalPayments: 0, movements: [] },
        '/attendances/student/s2': [],
        '/students/s3': DETALLE,
        '/students/s3/stats': {
          currentStreak: 2, maxStreak: 5, trainingsThisMonth: 8, attendedThisMonth: 6,
          achievementsUnlocked: 1, totalAchievements: 6,
        },
        '/students/s3/team': { teamName: 'Sub-12', teammates: [], teachers: [] },
        '/payments/account-statement/s3': {
          monthlyFee: 500, pendingAmount: 500, totalPaid: 1000, totalPayments: 2,
          movements: [{ date: '2026-09-05', amount: 500, description: 'Mensualidad septiembre' }],
        },
        '/attendances/student/s3': [
          { id: 'a1', date: '2026-10-01', type: 'entrenamiento', present: true },
          { id: 'a2', date: '2026-10-03', type: 'partido', present: false },
        ],
      },
    },
  });
}

test('el listado resume la academia y filtra desde los indicadores', async ({ page }) => {
  await abrirLista(page);
  await expect(page.getByRole('heading', { name: 'Alumnos' })).toBeVisible();

  const resumen = (nombre: RegExp) => page.getByRole('button', { name: nombre });
  await expect(resumen(/^Alumnos: 30/)).toBeVisible();
  await expect(resumen(/^Pendientes de pago: 1/)).toBeVisible();
  await expect(resumen(/^Sin tutor: 1/)).toBeVisible();
  await expect(resumen(/^Expediente incompleto: 1/)).toBeVisible();

  await page.screenshot({ path: '/private/tmp/claude-501/shots/lista-desktop.png', fullPage: true });

  await resumen(/^Sin tutor/).click();
  const tabla = page.getByRole('table');
  await expect(tabla.getByRole('row')).toHaveCount(2); // encabezado + Carlos
  await expect(tabla).toContainText('Carlos López');
  await expect(page.getByText('1 de 30 alumnos')).toBeVisible();

  await page.getByRole('button', { name: /^Limpiar/ }).click();
  await expect(page.getByText('30 alumnos')).toBeVisible();
});

test('la búsqueda ignora acentos y combina con filtros', async ({ page }) => {
  await abrirLista(page);
  await page.getByLabel('Buscar').fill('angel');
  await expect(page.getByRole('table')).toContainText('Ángel Ramírez');
  await expect(page.getByText('1 de 30 alumnos')).toBeVisible();

  await page.getByLabel('Buscar').fill('zzzz');
  await expect(page.getByText('Ningún alumno coincide')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(page.getByText('30 alumnos')).toBeVisible();
});

test('pagina de 25 en 25 y ordena por columna', async ({ page }) => {
  await abrirLista(page);
  const filas = page.getByRole('table').getByRole('row');
  await expect(filas).toHaveCount(26); // encabezado + 25
  await page.getByRole('button', { name: '2', exact: true }).click();
  await expect(filas).toHaveCount(6); // encabezado + 5

  await page.getByRole('button', { name: '1', exact: true }).click();
  const encabezado = page.getByRole('columnheader', { name: /Alumno/ });
  await expect(encabezado).toHaveAttribute('aria-sort', 'ascending');
  await encabezado.getByRole('button').click();
  await expect(encabezado).toHaveAttribute('aria-sort', 'descending');
});

test('cambiar el estado desde la tabla llama al backend', async ({ page }) => {
  await abrirLista(page);
  const llamadas: { url: string; body: any }[] = [];
  await page.route('http://localhost:3000/api/students/*/status', async (route) => {
    llamadas.push({ url: route.request().url(), body: route.request().postDataJSON() });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"message":"ok"}' });
  });

  await page.getByRole('button', { name: /Estado de Ángel Ramírez/ }).click();
  await page.getByRole('menuitem', { name: 'Activo', exact: true }).click();
  await expect.poll(() => llamadas.length).toBe(1);
  expect(llamadas[0].url).toContain('/students/s1/status');
  expect(llamadas[0].body).toEqual({ status: 'activo' });
});

test('acciones masivas sobre la selección', async ({ page }) => {
  await abrirLista(page);
  const llamadas: string[] = [];
  await page.route('http://localhost:3000/api/students/*/status', async (route) => {
    llamadas.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"message":"ok"}' });
  });

  await page.getByRole('checkbox', { name: 'Seleccionar a Ángel Ramírez' }).check();
  await page.getByRole('checkbox', { name: 'Seleccionar a Beatriz Soto' }).check();
  await expect(page.getByText('2 seleccionados')).toBeVisible();
  await page.screenshot({ path: '/private/tmp/claude-501/shots/lista-seleccion.png' });

  await page.getByRole('button', { name: 'Cambiar estado' }).click();
  await page.getByRole('menuitem', { name: 'Inactivo' }).click();
  await expect.poll(() => llamadas.length).toBe(2);
  await expect(page.getByText('2 seleccionados')).toHaveCount(0);
});

test('edición rápida en panel lateral valida y avisa de cambios sin guardar', async ({ page }) => {
  await abrirLista(page);
  await page.getByRole('button', { name: 'Acciones para Carlos López' }).click();
  await page.getByRole('menuitem', { name: 'Edición rápida' }).click();

  const nombre = page.getByRole('textbox', { name: /Nombre completo/ });
  await expect(nombre).toHaveValue('Carlos López');
  await nombre.fill('Ca');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  // El error sale junto al campo y, además, resumido arriba del formulario.
  await expect(page.getByRole('alert').filter({ hasText: 'por corregir' })).toBeVisible();
  await expect(page.getByText('Escribe el nombre completo').last()).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar edición' }).click();
  await expect(page.getByText('Tienes cambios sin guardar. Si cierras, se pierden.')).toBeVisible();
  await page.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(nombre).toBeVisible();
});

test('la ficha muestra pendientes y organiza la información en pestañas', async ({ page }) => {
  await abrirLista(page);
  await page.getByRole('button', { name: 'Abrir ficha de Carlos López' }).click();
  await expect(page).toHaveURL(/\/admin\/students\/s3/);
  await expect(page.getByRole('heading', { name: 'Carlos López' })).toBeVisible();

  const pendientes = page.getByRole('alert').filter({ hasText: 'Por atender' });
  await expect(pendientes).toContainText('No tiene tutor asignado');
  await expect(pendientes).toContainText('Debe $500');
  await expect(pendientes).toContainText('Falta un contacto de emergencia');
  await expect(page.getByRole('tabpanel', { name: 'Resumen' }).getByText('Alergia a la penicilina')).toBeVisible();
  await page.screenshot({ path: '/private/tmp/claude-501/shots/ficha-resumen.png', fullPage: true });

  await page.getByRole('tab', { name: 'Pagos' }).click();
  await expect(page.getByText('Mensualidad septiembre')).toBeVisible();
  await page.getByRole('tab', { name: 'Asistencia' }).click();
  // El porcentaje también sale en la tarjeta del resumen: hay que mirar la
  // pestaña de asistencia.
  await expect(
    page.getByRole('tabpanel', { name: 'Asistencia' }).getByText('50%').first(),
  ).toBeVisible();

  await pendientes.getByRole('button', { name: 'Resolver' }).first().click();
  await expect(page.getByRole('tab', { name: 'Datos', selected: true })).toBeVisible();
  await expect(page).toHaveURL(/#datos$/);
  await page.screenshot({ path: '/private/tmp/claude-501/shots/ficha-datos.png', fullPage: true });
});

test('en móvil la tabla se convierte en tarjetas sin scroll horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await abrirLista(page);
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Abrir ficha de Beatriz Soto' })).toBeVisible();
  const desborda = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(desborda).toBe(false);
  await page.screenshot({ path: '/private/tmp/claude-501/shots/lista-movil.png' });
});

test('seleccionar todos los alumnos filtrados, no solo los de la página', async ({ page }) => {
  await abrirLista(page);
  await page.getByRole('checkbox', { name: /Seleccionar todos los alumnos de esta página/ }).check();
  await expect(page.getByText('25 seleccionados')).toBeVisible();
  await page.getByRole('button', { name: /Seleccionar los 30 alumnos/ }).click();
  await expect(page.getByText('30 seleccionados')).toBeVisible();
});

test('recordar al tutor arma el mensaje y abre WhatsApp con la lada de México', async ({ page }) => {
  await abrirLista(page);
  await page.getByRole('button', { name: 'Abrir ficha de Beatriz Soto' }).click();
  await expect(page.getByRole('heading', { name: 'Beatriz Soto' })).toBeVisible();

  await page.getByRole('button', { name: 'Recordar al tutor' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Recordar al tutor' });
  const mensaje = dialogo.getByRole('textbox', { name: /Mensaje/ });
  await expect(mensaje).toHaveValue(/Hola María, te escribimos de Academia Demo sobre Beatriz Soto/);
  await expect(mensaje).toHaveValue(/• CURP/);
  await expect(mensaje).toHaveValue(/• Acta de nacimiento/);

  const enlace = dialogo.getByRole('link', { name: 'Abrir WhatsApp' });
  await expect(enlace).toHaveAttribute('href', /^https:\/\/wa\.me\/525512345678\?text=/);

  await dialogo.getByRole('checkbox', { name: 'Documentos del expediente' }).uncheck();
  await expect(mensaje).not.toHaveValue(/CURP/);
  await page.screenshot({ path: '/private/tmp/claude-501/shots/recordatorio.png' });
});

test('los filtros viajan en la URL y los chips los quitan de uno en uno', async ({ page }) => {
  await abrirLista(page, '/admin/students?tutor=sin');

  await expect(page.getByText('1 de 30 alumnos')).toBeVisible();
  await expect(page.getByRole('table')).toContainText('Carlos López');

  await page.getByRole('button', { name: /Quitar filtro Tutor/ }).click();
  await expect(page.getByText('30 alumnos')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/students$/);
});

test('filtra por adeudo del mes y por contacto de emergencia', async ({ page }) => {
  await abrirLista(page);

  // El adeudo no viene en GET /students: se cruza con /payments/pending.
  await page.getByRole('button', { name: /^Con adeudo: 1/ }).click();
  await expect(page.getByText('1 de 30 alumnos')).toBeVisible();
  await expect(page.getByRole('table')).toContainText('$500');
  await page.getByRole('button', { name: /^Limpiar/ }).click();

  await page.getByRole('button', { name: 'Más filtros' }).click();
  await page.getByRole('textbox', { name: 'Contacto de emergencia' }).click();
  await page.getByRole('option', { name: 'Con contacto' }).click();
  await expect(page.getByText('1 de 30 alumnos')).toBeVisible();
  await expect(page.getByRole('table')).toContainText('Ángel Ramírez');
});

test('la tabla deja ocultar columnas', async ({ page }) => {
  await abrirLista(page);
  await expect(page.getByRole('columnheader', { name: /Uniforme/ })).toBeVisible();

  await page.getByRole('button', { name: 'Elegir columnas visibles' }).click();
  await page.getByRole('menuitem', { name: 'Uniforme' }).click();
  await expect(page.getByRole('columnheader', { name: /Uniforme/ })).toHaveCount(0);
});

test('la ficha pasa al alumno siguiente sin volver al listado', async ({ page }) => {
  await abrirLista(page);
  await page.getByRole('button', { name: 'Abrir ficha de Beatriz Soto' }).click();
  await expect(page.getByText('2 de 30')).toBeVisible();

  await page.getByRole('button', { name: 'Alumno siguiente' }).click();
  await expect(page.getByRole('heading', { name: 'Carlos López' })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/students\/s3/);
});
