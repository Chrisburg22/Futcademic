---
tipo: nota
area: backend
estado: verificado
actualizado: 2026-10-26
fuentes:
  - backend/api/controllers/auth.controller.ts
  - backend/api/controllers/user.controller.ts
  - backend/api/controllers/permission.controller.ts
  - backend/api/routes/auth.routes.ts
  - backend/api/routes/user.routes.ts
  - backend/api/services/credentials.ts
tags:
  - backend
  - auth
---

# Auth y usuarios

## Registro de una academia

`POST /api/auth/register` (público, 10/hora por IP)

1. Crea el usuario en Supabase Auth con `email_confirm: true`.
2. Crea la fila en `schools`.
3. Crea la fila en `users` con `role: 'admin'` y `school_id`.
4. Crea `profile_information` vacío.
5. Devuelve 201; el cliente inicia sesión y pasa por onboarding.

Si falla el alta de `schools`, borra el usuario de Auth. Si falla `profile_information`, solo lo registra en log: no tumba el registro.

## Invitaciones

| Endpoint | Rol que invita | Destino |
|---|---|---|
| `POST /api/auth/invite-admin` | `super_admin`, `admin` | otro admin |
| `POST /api/auth/invite-teacher` | `super_admin`, `admin` | profesor |
| `POST /api/auth/invite-parent` | `super_admin`, `admin`, `profesor` | padre/tutor |
| `POST /api/auth/resend-invite` | `super_admin`, `admin` | reenvía a staff que no activó (`userId` o `email`) |

Flujo (`inviteUser` en `auth.controller.ts`):

1. `supabaseAdmin.auth.admin.generateLink({ type: 'invite' })` — Supabase genera el token, **no** envía el correo.
2. Se arma el link `WEB_APP_URL/accept-invite?token_hash=...&type=invite`.
3. Se envía por SendGrid si `SENDGRID_API_KEY` existe.
4. Se inserta la fila en `users` con el rol pedido.
5. Si el email ya existe, distingue "ya está en tu escuela" de "pertenece a otra escuela".

La pantalla `accept-invite` verifica el token con `supabase.auth.verifyOtp({ token_hash, type })`. Sin SendGrid, la invitación queda creada pero el correo no sale: la respuesta trae `emailSent: false` y `activationLink` para que el admin lo comparta a mano (la web lo muestra en un modal).

Si el correo no sale, las respuestas de invitación traen `emailError` con el motivo (llave ausente, 401 llave inválida, 403 remitente rechazado); la web lo muestra junto al enlace. En producción (Render) deben existir `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` y `WEB_APP_URL` sin `/` final.

Arreglos (2026-11-17): `WEB_APP_URL` se normaliza sin `/` final (antes `//accept-invite`); si falla el insert en `users` se borra el usuario de Auth (antes quedaba huérfano y el reintento decía "ya pertenece a otra escuela"); la búsqueda de usuario existente pagina `listUsers` (antes solo 50); `teacher_permissions` es upsert. `GET /api/users` ahora devuelve `email` e `invitation_accepted` (`last_sign_in_at`), y la pantalla de profesores muestra "Invitación pendiente" con botón "Volver a invitar".

## Alta de alumno

No usa invitación: crea identidad con **contraseña temporal** y `must_change_password: true`. Ver [[Alumnos y acceso]].

## Login de alumno sin email

1. `POST /api/auth/resolve-student` recibe `username` (público, 20/10 min).
2. Devuelve el email interno `username@<school_id>.alumno.futcademic.local`.
3. El cliente entra a Supabase Auth con email + contraseña.

El username se genera como `nombre.apellido###`, único por escuela (`users_school_username_unique`).

## Endpoints de usuario

| Endpoint | Rol | Uso |
|---|---|---|
| `GET /api/users` | admin, profesor | listado; `?role=profesor` filtra |
| `GET /api/users/teachers/:id` | admin | ficha del profesor |
| `PUT /api/users/:id` | admin | editar datos del usuario |
| `PATCH /api/users/me/profile` | autenticado | perfil propio |
| `PATCH /api/users/me/password` | autenticado | cambiar contraseña |
| `PATCH /api/users/me/password-changed` | autenticado | marcar `must_change_password=false` |
| `PATCH /api/users/me/push-token` | autenticado | registrar token push |
| `POST /api/users/me/complete-onboarding` | autenticado | setear `onboarded_at` |

## Permisos de profesor

`teacher_permissions` guarda seis flags: `can_manage_students`, `can_manage_events`, `can_view_finances`, `can_manage_payments`, `can_take_attendance`, `can_manage_categories`.

| Endpoint | Rol |
|---|---|
| `GET /api/permissions/mine` | profesor |
| `GET /api/permissions/:id` | admin |
| `PUT /api/permissions/:id` | admin |

> [!warning] Los flags no se aplican en las rutas
> Las rutas solo usan `requireRole`. No hay middleware que consulte `teacher_permissions` (verificado 2026-10-26). Los flags se guardan, se editan y se muestran, pero **hoy no restringen la API**. No los presentes como control de acceso efectivo.

Ver [[Roles y permisos]] y [[Flujos clave]].
