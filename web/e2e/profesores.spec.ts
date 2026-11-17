import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Invitación a profesores.
 *
 * El flujo fallaba en silencio: la pantalla anunciaba "invitación enviada"
 * aunque el backend no hubiera mandado el correo, el listado no mostraba el
 * correo ni quién seguía sin activar la cuenta, y volver a invitar respondía
 * "ya está registrado en tu escuela".
 */

const ADMIN_PROFILE = {
  id: 'admin-1',
  email: 'director@futcademic.com',
  full_name: 'Roberto Sánchez',
  role: 'admin' as const,
  school_id: 'school-1',
  school: { name: 'Academia Futcademic', logo_url: null },
  onboarded_at: '2025-01-01',
};

const TEACHERS = [
  {
    id: 't1',
    full_name: 'Luis Hernández',
    role: 'profesor',
    email: 'luis@test.com',
    avatar_url: null,
    invitation_accepted: true,
  },
  {
    id: 't2',
    full_name: 'Ana Ruiz',
    role: 'profesor',
    email: 'ana@test.com',
    avatar_url: null,
    invitation_accepted: false,
  },
];

const LINK = 'http://localhost:5173/accept-invite?token_hash=abc123&type=invite';

test('el listado muestra el correo y quién sigue sin activar la cuenta', async ({ page }) => {
  await loginAs(page, {
    profile: ADMIN_PROFILE,
    api: { teachers: TEACHERS },
    goto: '/admin/teachers',
  });

  const activo = page.getByRole('row', { name: /Luis Hernández/ });
  await expect(activo).toContainText('luis@test.com');
  await expect(activo).toContainText('Activo');

  const pendiente = page.getByRole('row', { name: /Ana Ruiz/ });
  await expect(pendiente).toContainText('ana@test.com');
  await expect(pendiente).toContainText('Invitación pendiente');
  await expect(pendiente.getByRole('button', { name: 'Volver a invitar' })).toBeVisible();
  // A quien ya entró no se le ofrece reenviar.
  await expect(activo.getByRole('button', { name: 'Volver a invitar' })).toHaveCount(0);
});

test('si el correo no sale, la pantalla lo avisa y ofrece el enlace', async ({ page }) => {
  await loginAs(page, {
    profile: ADMIN_PROFILE,
    api: {
      teachers: TEACHERS,
      extra: {
        '/auth/invite-teacher': {
          message: 'Usuario creado como profesor.',
          userId: 't3',
          emailSent: false,
          activationLink: LINK,
        },
      },
    },
    goto: '/admin/teachers',
  });

  await page.getByRole('button', { name: 'Invitar profesor' }).click();
  const modal = page.getByRole('dialog', { name: 'Invitar profesor' });
  await modal.getByLabel('Nombre completo').fill('Carla Soto');
  await modal.getByLabel('Correo').fill('carla@test.com');
  await modal.getByRole('button', { name: 'Enviar invitación', exact: true }).click();

  await expect(page.getByText(/el correo no salió/i)).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Comparte el enlace de activación' })).toContainText(
    'token_hash=abc123',
  );
});

test('reenviar la invitación de quien no activó su cuenta', async ({ page }) => {
  await loginAs(page, {
    profile: ADMIN_PROFILE,
    api: {
      teachers: TEACHERS,
      extra: {
        '/auth/resend-invite': {
          message: 'Invitación reenviada por correo.',
          emailSent: true,
          activationLink: LINK,
          accepted: false,
        },
      },
    },
    goto: '/admin/teachers',
  });

  await page
    .getByRole('row', { name: /Ana Ruiz/ })
    .getByRole('button', { name: 'Volver a invitar' })
    .click();

  await expect(page.getByText('Invitación reenviada por correo.')).toBeVisible();
});
