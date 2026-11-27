---
tipo: nota
area: dominio
estado: verificado
actualizado: 2026-10-28
fuentes:
  - backend/api/controllers/auth.controller.ts
  - backend/api/controllers/student.controller.ts
  - backend/api/controllers/attendance.controller.ts
  - backend/api/controllers/payment.controller.ts
  - backend/api/controllers/event.controller.ts
  - web/src/screens/AttendancePage.tsx
  - web/src/screens/OnboardingPage.tsx
tags:
  - dominio
---

# Flujos clave

## 1. Crear una academia

1. `POST /api/auth/register` con email, contraseña, nombre y nombre de la academia.
2. Se crea el usuario de Auth (email confirmado), la `school`, la fila `users` con rol `admin` y `profile_information`.
3. Login en `/login`.
4. El admin crea categoría y sede, invita profesores y da de alta alumnos.

**Endpoints:** `POST /auth/register`.
**Tablas:** `schools`, `users`, `profile_information`.

## 2. Invitar a un profesor o padre

1. Admin (o profesor, para padres) llama a `POST /auth/invite-teacher|invite-parent|invite-admin`.
2. Se genera un link de activación de Supabase y se envía por SendGrid.
3. La persona abre `/accept-invite?token_hash=…&type=invite`.
4. `verifyOtp` crea la sesión; se completa el perfil en `/onboarding`.
5. `POST /users/me/complete-onboarding` marca `onboarded_at`.

**Tablas:** `users`, `teacher_permissions` (si es profesor), `category_teachers` (asignación).
**Ojo:** sin `SENDGRID_API_KEY` no sale correo, aunque la invitación exista.

## 3. Alta de alumno y primer login

1. `POST /api/students` con nombre, fecha de nacimiento, categoría y tutor.
2. El backend genera `username`, crea Auth con contraseña temporal y `must_change_password`.
3. El admin entrega `username` + `temp_password`.
4. El alumno entra a `/student-login`.
5. `POST /auth/resolve-student` traduce username → email interno.
6. Supabase Auth inicia sesión; `AuthGate` obliga a `/change-password` y luego `/onboarding`.

**Tablas:** `students`, `users`, `profile_information`.

## 4. Pase de lista

1. Profesor elige categoría y fecha en `/attendance`.
2. Se cargan alumnos y la sesión (`GET /events/trainings?date=`).
3. Marca presentes/ausentes y guarda: `POST /api/attendances`.
4. El backend reemplaza las marcas de ese día y tipo.
5. El frontend dispara `POST /api/achievements/check` por alumno.

**Tablas:** `attendances`, `trainings`.
**Ojo:** el backend no actualiza rachas; ver [[Asistencias]].

## 5. Cobrar una mensualidad

1. Admin abre `/finances` (pestaña **Cobranza**) y consulta pendientes del mes: `GET /payments/pending?month=&year=`.
2. Registra pago individual (`student_id`) o grupal (`student_ids`): `POST /payments/students`.
3. Si es grupal, se crea un `payments` padre y se reparte en `payment_students`.
4. Se notifica por push al padre.
5. El padre consulta `GET /payments/account-statement/:studentId` desde su vista de `/finances`.
6. La salud del mes (cobrado, nómina y margen) sale de `GET /payments/summary?year=`.

**Tablas:** `payments`, `payment_students`, `categories.monthly_fee`.
**Ojo:** el periodo vive en la URL (`/finances?mes=&anio=&tab=`), así que un enlace puede abrir directo la cobranza de un mes.

## 6. Programar un evento recurrente

1. `POST /api/events` con categoría, sede, fecha, hora y `recurrenceRule` (o `recurringWeeks`).
2. Se crea el `events` y una fila por ocurrencia en `trainings`.
3. El pase de lista usa esos `trainings`.
4. `POST /events/cancel` con `training_id` o `event_id + date` marca `is_cancelled` y notifica a los padres.

**Tablas:** `events`, `trainings`, `event_exceptions`, `venues`.

## 7. Usar el chat IA

1. Admin entra a `/admin/chat`.
2. Envía un mensaje: `POST /chat/conversations/:id/messages` (SSE).
3. El agente consulta o propone tools.
4. Si la tool es sensible, se pausa y pide confirmación.
5. `POST /chat/conversations/:id/confirm` ejecuta o descarta.

**Tablas:** `chat_conversations`, `chat_messages`.
Ver [[Chat IA]].

## Dónde mirar cada paso

| Flujo | Controlador |
|---|---|
| Registro e invitaciones | `auth.controller.ts` |
| Alumnos | `student.controller.ts` |
| Asistencias | `attendance.controller.ts` |
| Pagos | `payment.controller.ts` |
| Eventos | `event.controller.ts` |
