import { expect, test } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Expediente de inscripción: link público de un solo uso + bandeja del admin.
 *
 * El link solo conoce academia y categoría; el backend es quien resuelve el
 * resto. Estas pruebas fijan ese contrato de cara al usuario y cubren los
 * estados terminales (enviada, expirada, inválida) que nunca deben mostrar el
 * formulario otra vez.
 */

const TOKEN = 'tok_publico_de_prueba';

const CONSENT_TEMPLATE = {
  version: '2026-10-v1',
  body_md: '## Consentimiento\n\nAutorizo la participación del menor.',
  body_hash: 'hash-demo',
};

const CHECKLIST = [
  { type: 'identificacion_tutor_frente', label: 'Identificación del tutor (frente)', owner_type: 'tutor', required: true },
  { type: 'identificacion_tutor_reverso', label: 'Identificación del tutor (reverso)', owner_type: 'tutor', required: true },
  { type: 'acta_nacimiento', label: 'Acta de nacimiento', owner_type: 'alumno', required: true },
  { type: 'curp', label: 'CURP', owner_type: 'alumno', required: true },
  { type: 'foto_alumno', label: 'Foto del alumno', owner_type: 'alumno', required: true },
];

function publicPayload(overrides: Record<string, any> = {}) {
  return {
    academy: { name: 'Academia Halcones', logo_url: null },
    category: { name: 'Sub-12', color: '#1c7ed6', birth_years: ['2014-2015'] },
    invitation: {
      status: 'activa',
      expires_at: '2026-11-02T18:00:00.000Z',
      used_at: null,
      editable: true,
      can_download_consent: false,
      rejection_reason: null,
    },
    application: null,
    terminal: false,
    form: {
      fields: {
        student_full_name: '',
        student_birth_date: '',
        student_curp: '',
        guardian_full_name: '',
        guardian_email: '',
        guardian_phone: '',
      },
      category_mismatch: false,
      updated_at: null,
      rejection_reason: null,
    },
    documents: [],
    consent_template: CONSENT_TEMPLATE,
    checklist: CHECKLIST,
    ...overrides,
  };
}

test('el link público muestra solo academia, categoría y formulario', async ({ page }) => {
  await page.route('**/api/enrollment/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === `/api/enrollment/${TOKEN}`) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(publicPayload()),
      });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"no"}' });
  });

  await page.goto(`/inscripcion/${TOKEN}`);

  await expect(page.getByText('Academia Halcones')).toBeVisible();
  await expect(page.getByText('Sub-12')).toBeVisible();
  await expect(page.getByText('Datos del alumno')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();

  // El link es de un solo uso: no debe indexarse ni filtrar el token como
  // referrer hacia terceros.
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toContain('noindex');
  const referrer = await page.locator('meta[name="referrer"]').getAttribute('content');
  expect(referrer).toBe('no-referrer');
});

test('un link ya enviado muestra el estado final, no el formulario', async ({ page }) => {
  await page.route('**/api/enrollment/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        publicPayload({
          invitation: {
            status: 'enviada',
            expires_at: '2026-11-02T18:00:00.000Z',
            used_at: '2026-10-26T14:00:00.000Z',
            editable: false,
            can_download_consent: true,
            rejection_reason: null,
          },
          application: { status: 'enviada', submitted_at: '2026-10-26T14:00:00.000Z', rejection_reason: null },
          terminal: true,
          form: null,
        }),
      ),
    }),
  );

  await page.goto(`/inscripcion/${TOKEN}`);

  await expect(page.getByText('Solicitud recibida')).toBeVisible();
  await expect(page.getByText('Datos del alumno')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Enviar solicitud' })).toHaveCount(0);
});

test('un link expirado explica que hay que pedir uno nuevo', async ({ page }) => {
  await page.route('**/api/enrollment/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        publicPayload({
          invitation: {
            status: 'expirada',
            expires_at: '2026-10-01T18:00:00.000Z',
            used_at: null,
            editable: false,
            can_download_consent: false,
            rejection_reason: null,
          },
          terminal: true,
          form: null,
        }),
      ),
    }),
  );

  await page.goto(`/inscripcion/${TOKEN}`);

  await expect(page.getByText('Este link expiró')).toBeVisible();
  await expect(page.getByText(/genere un link nuevo/i)).toBeVisible();
});

test('un token inexistente no revela si la academia existe', async ({ page }) => {
  await page.route('**/api/enrollment/**', (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Link no válido.' }),
    }),
  );

  await page.goto(`/inscripcion/${TOKEN}`);

  await expect(page.getByText('Link no válido')).toBeVisible();
  await expect(page.getByText('Link no válido.')).toBeVisible();
});

test('el admin ve solicitudes y links generados en Inscripciones', async ({ page }) => {
  await loginAs(page, {
    goto: '/admin/enrollments',
    api: {
      categories: [{ id: 'cat-1', name: 'Sub-12' }],
      extra: {
        '/enrollment/applications': [
          {
            id: 'app-1',
            student_full_name: 'Diego Ramos',
            student_birth_date: '2015-03-04',
            guardian_full_name: 'Ana Ramos',
            guardian_phone: '5551234567',
            guardian_email: 'ana@example.com',
            category: { name: 'Sub-12' },
            status: 'enviada',
            submitted_at: '2026-10-26T14:00:00.000Z',
            category_mismatch: false,
          },
        ],
        '/enrollment/invitations': [
          {
            id: 'inv-1',
            category: { name: 'Sub-12' },
            status: 'activa',
            created_at: '2026-10-26T13:00:00.000Z',
            expires_at: '2026-11-02T13:00:00.000Z',
            note: 'Papá de Diego',
          },
        ],
      },
    },
  });

  await expect(page.getByRole('heading', { name: 'Inscripciones' })).toBeVisible();
  await expect(page.getByText('Diego Ramos')).toBeVisible();
  await expect(page.locator('tbody').getByText('Enviada', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: /Links generados/ }).click();
  await expect(page.getByText('Papá de Diego')).toBeVisible();
  await expect(page.getByText(/no se puede recuperar después/i)).toBeVisible();
});

test('generar un link muestra la URL una sola vez', async ({ page }) => {
  await loginAs(page, {
    goto: '/admin/enrollments',
    api: {
      categories: [{ id: 'cat-1', name: 'Sub-12' }],
      extra: {
        '/enrollment/applications': [],
      },
    },
  });

  // El POST se responde igual que el resto (mock genérico), así que se
  // intercepta aparte para devolver la URL firmada una única vez.
  await page.route('http://localhost:3000/api/enrollment/invitations', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'inv-2',
        url: 'https://app.futcademic.test/inscripcion/tok_nuevo',
        expires_at: '2026-11-02T18:00:00.000Z',
        category: { name: 'Sub-12' },
      }),
    });
  });

  await page.getByRole('button', { name: 'Invitar alumno' }).click();
  await expect(page.getByText(/llenará los datos del alumno/i)).toBeVisible();

  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Categoría').click();
  await page.getByRole('option', { name: 'Sub-12' }).click();
  await dialog.getByRole('button', { name: 'Generar link' }).click();

  await expect(page.getByText('https://app.futcademic.test/inscripcion/tok_nuevo')).toBeVisible();
  await expect(page.getByText(/no guardamos el link en claro/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copiar link' })).toBeVisible();
});

test('aprobar una solicitud crea el alumno y muestra credenciales', async ({ page }) => {
  await loginAs(page, {
    goto: '/admin/enrollments/app-1',
    api: {
      categories: [{ id: 'cat-1', name: 'Sub-12' }],
      extra: {
        '/enrollment/applications/app-1': {
          id: 'app-1',
          status: 'enviada',
          student_full_name: 'Diego Ramos',
          student_birth_date: '2015-03-04',
          category_id: 'cat-1',
          category: { name: 'Sub-12' },
          guardian_full_name: 'Ana Ramos',
          guardian_email: 'ana@example.com',
          guardian_phone: '5551234567',
          guardian_relationship: 'madre',
          invitation: { note: 'Desde el celular' },
          category_mismatch: false,
          submitted_at: '2026-10-26T14:00:00.000Z',
          created_at: '2026-10-26T13:00:00.000Z',
          consent: {
            guardian_name: 'Ana Ramos',
            accepted_at: '2026-10-26T13:50:00.000Z',
            consent_version: '2026-10-v1',
            ip: '189.1.1.1',
            user_agent: 'iPhone',
            accepted_data: true,
            accepted_participation: true,
            accepted_medical: true,
            accepted_image: false,
          },
          documents: [
            {
              id: 'doc-1',
              doc_type: 'identificacion_tutor_frente',
              owner_type: 'tutor',
              label: 'Identificación del tutor (frente)',
              status: 'validado',
              uploaded_at: '2026-10-26T13:40:00.000Z',
              signed_url: 'https://example.test/frente.jpg',
            },
            {
              id: 'doc-2',
              doc_type: 'identificacion_tutor_reverso',
              owner_type: 'tutor',
              label: 'Identificación del tutor (reverso)',
              status: 'validado',
              uploaded_at: '2026-10-26T13:41:00.000Z',
              signed_url: 'https://example.test/reverso.jpg',
            },
          ],
          checklist: CHECKLIST,
        },
        '/enrollment/applications/app-1/approve': {
          student_id: 'stu-1',
          guardian_reused: false,
          guardian_email_sent: false,
          credentials: { username: 'diego.ramos', temp_password: 'Tmp-123456' },
        },
      },
    },
  });

  await expect(page.getByText('Diego Ramos').first()).toBeVisible();
  await expect(page.getByText('Ana Ramos').first()).toBeVisible();

  await page.getByRole('button', { name: 'Aprobar', exact: true }).click();
  await expect(page.getByRole('dialog').getByText(/pueden quedar pendientes/i)).toBeVisible();
  await page.getByRole('button', { name: 'Aprobar y crear alumno' }).click();

  await expect(page.getByText('Alumno dado de alta correctamente.')).toBeVisible();
  await expect(page.getByText('diego.ramos')).toBeVisible();
  await expect(page.getByText('Tmp-123456')).toBeVisible();
});

test('alumnos: columna Expediente y acceso a Invitar alumno', async ({ page }) => {
  await loginAs(page, {
    goto: '/admin/students',
    api: {
      categories: [{ id: 'cat-1', name: 'Sub-12' }],
      students: [
        {
          id: 'stu-1',
          full_name: 'Diego Ramos',
          status: 'activo',
          category: { name: 'Sub-12' },
          expediente_status: 'incompleto',
          uniform_delivered: false,
        },
        {
          id: 'stu-2',
          full_name: 'Luis Histórico',
          status: 'activo',
          category: { name: 'Sub-12' },
          expediente_status: 'sin_tutor',
          uniform_delivered: true,
        },
      ],
      extra: {
        '/parents': [],
        '/users?role=padre': [],
      },
    },
  });

  await expect(page.getByRole('columnheader', { name: 'Expediente' })).toBeVisible();
  await expect(page.getByText('Incompleto')).toBeVisible();
  await expect(page.getByText('Sin tutor')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Invitar alumno' })).toBeVisible();
});
