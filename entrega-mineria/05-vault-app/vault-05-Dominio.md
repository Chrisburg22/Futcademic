# Bóveda de la app Futcademic · 05-Dominio

Notas técnicas internas de la app (Obsidian). Los [[enlaces]] apuntan a otras notas de la bóveda.

---

## Nota: Flujos clave

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

---

## Nota: Glosario

# Glosario

| Término | Significado en este proyecto |
|---|---|
| **Futcademic** | Nombre del producto. El código heredado y algunos docs dicen "Futcamedic" |
| **Academia / escuela** | `schools`. Es el tenant |
| **Tenant** | Conjunto de datos de una academia, aislado por `school_id` |
| **Sede** | `venues`: lugar físico con dirección y coordenadas |
| **Categoría** | `categories`: equipo de una generación (`birth_year`, etiqueta de texto) con cuota (`monthly_fee`) |
| **Alumno** | `students`; si tiene cuenta, `students.id = users.id` y rol `alumno` |
| **Tutor / padre** | `users` con rol `padre`; se enlaza por `students.parent_id` |
| **Profesor** | `users` con rol `profesor`; se asigna a categorías por `category_teachers` |
| **Admin** | Dueño/operador de la academia; crea la cuenta en `/register` |
| **`super_admin`** | En la práctica comparte permisos con `admin` en todas las rutas; no cruza escuelas (`requireTenant` también lo acota a un `school_id`) |
| **Evento** | `events`: serie o plantilla (categoría, sede, hora, recurrencia) |
| **Sesión / entrenamiento** | `trainings`: ocurrencia concreta de un evento en una fecha |
| **Pase de lista** | Acción de marcar `present` por alumno en una sesión |
| **Asistencia** | Fila en `attendances` |
| **Racha** | `current_streak` / `max_streak`; hoy solo se leen, no se escriben en el backend |
| **Logro** | `achievements` + `student_achievements`; umbral por tipo (`racha`, `asistencias`, …) |
| **Mensualidad** | Pago `payment_type = mensualidad` asociado a un periodo (`payment_month`/`payment_year`) |
| **Beca** | `students.status = beca`; no aparece en pendientes de pago |
| **Pago grupal** | Un `payments` con `student_id = NULL` repartido en `payment_students` |
| **Estado de cuenta** | Resumen de cuota, pagado y pendiente de un alumno |
| **Onboarding** | Completar perfil tras la invitación (`users.onboarded_at`) |
| **Username interno** | `nombre.apellido###`; identifica al alumno sin email real |
| **Uniforme** | `students.uniform_delivered`, entregado o no |

## Nombres que se confunden

| Se dice | Tabla / ruta real |
|---|---|
| "clase" o "entrenamiento" | `trainings` (no `events`) |
| "escuela" | `schools` |
| "cuenta" o "usuario" | `users` (Auth vive aparte) |
| "cobro" | `payments` |
| "asistencia" | `attendances` (una marca, no la sesión) |

Ver [[Roles y permisos]] y [[Flujos clave]].

---

## Nota: Multi-tenant

# Multi-tenant

## Idea

Muchas academias comparten la misma base. Cada fila de negocio lleva `school_id` y toda consulta debe filtrar por el `school_id` del token, no por el que mande el cliente.

## De dónde sale el tenant

```text
JWT (Supabase Auth)
  → requireAuth valida y deja req.user.id
  → requireTenant busca users.id = req.user.id
  → req.tenant = { school_id, role, user_id }
```

El `school_id` **nunca** se toma del body, query o header. Si el usuario no tiene fila en `users`, `requireTenant` responde 403.

## Dónde se aplica

| Capa | Qué hace |
|---|---|
| `requireTenant` | fija el tenant en el request |
| Controladores | `.eq('school_id', school_id)` en cada consulta |
| `findStudentForTenant` | además valida que el alumno sea del usuario/rol |
| `sendPushNotification` | notifica solo a usuarios del tenant consultado |
| Tests | `tenant-isolation.test.ts`, `ownership.test.ts`, `TC-I-02` |

## Tablas sin `school_id`

`payment_students` y `student_achievements` heredan el tenant de `payments` / `students`. Al consultarlas:

- filtra por el padre (`payment_id`, `student_id`) que ya está acotado;
- no intentes `.eq('school_id', …)` en esas tablas: la columna no existe.

## Errores típicos

| Síntoma | Causa |
|---|---|
| Un usuario ve datos de otra academia | consulta sin `school_id` o `school_id` tomado del cliente |
| Un padre ve otro alumno | falta `findStudentForTenant` |
| Un profesor ve toda la escuela | falta el filtro por `category_teachers` en `GET /students` |
| 403 "Usuario no pertenece a ninguna escuela" | fila ausente en `users` o `school_id` nulo |

## RLS

`schema.sql` no incluye políticas RLS. El aislamiento verificable es el backend. Si se habilita RLS en Supabase, el backend con **service role** la salta igualmente: RLS protegería accesos directos con la `anon key`, no reemplaza los filtros del backend. Ver [[Deriva conocida]].

## Checklist

- [ ] Toda tabla de negocio filtra `school_id`.
- [ ] Todo `studentId` pasa por `findStudentForTenant`.
- [ ] El `school_id` viene de `req.tenant`, no del request.
- [ ] Un test de aislamiento cubre el endpoint nuevo.

Ver [[Roles y permisos]] y [[Middlewares y autenticacion]].

---

## Nota: Roles y permisos

# Roles y permisos

## Los cinco roles

`super_admin` · `admin` · `profesor` · `padre` · `alumno`

En las rutas, `super_admin` aparece junto a `admin`; no hay endpoint exclusivo de `super_admin` en el contrato actual.

## Matriz según la API

| Capacidad | super_admin | admin | profesor | padre | alumno |
|---|:--:|:--:|:--:|:--:|:--:|
| Dashboard propio | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ver alumnos | ✓ | ✓ | ✓ (sus categorías) | ✓ (sus hijos) | — |
| Crear / editar alumno | ✓ | ✓ | ✓ | — | — |
| Borrar alumno | ✓ | ✓ | — | — | — |
| Pase de lista | ✓ | ✓ | ✓ | — | — |
| Ver asistencias | ✓ | ✓ | ✓ | ✓ (hijos) | ✓ (propias) |
| Crear / editar evento | ✓ | ✓ | ✓ | — | — |
| Cancelar sesión | ✓ | ✓ | ✓ | — | — |
| Borrar evento | ✓ | ✓ | — | — | — |
| Ver todos los pagos / pendientes | ✓ | ✓ | — | — | — |
| Registrar pagos | ✓ | ✓ | — | — | — |
| Ver pagos propios o de hijos | ✓ | ✓ | — | ✓ | ✓ |
| Estado de cuenta | ✓ | ✓ | — | ✓ | — |
| Categorías: ver | ✓ | ✓ | ✓ | ✓ | ✓ |
| Categorías: crear / editar / asignar | ✓ | ✓ | — | — | — |
| Invitar profesor / admin | ✓ | ✓ | — | — | — |
| Invitar padre | ✓ | ✓ | ✓ | — | — |
| Ver usuarios | ✓ | ✓ | ✓ | — | — |
| Editar usuario | ✓ | ✓ | — | — | — |
| Permisos de profesor | ✓ | ✓ | lee los suyos | — | — |
| Chat IA | ✓ | ✓ | — | — | — |
| Exportar pagos / asistencias | ✓ | ✓ | — | — | — |
| Subir avatar | ✓ | ✓ | ✓ | ✓ | ✓ |
| Subir logo | ✓ | ✓ | — | — | — |
| Sedes: ver | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sedes: crear / editar / borrar | ✓ | ✓ | — | — | — |
| Inscripciones: ver solicitudes e invitaciones | ✓ | ✓ | ✓ | — | — |
| Inscripciones: invitar por link | ✓ | ✓ | ✓ | — | — |
| Inscripciones: aprobar, rechazar, reabrir o borrar invitación | ✓ | ✓ | — | — | — |
| Inscripciones: revisar documentos del expediente | ✓ | ✓ | — | — | — |
| Consentimiento: plantilla y registro del alumno | ✓ | ✓ | ✓ | — | — |
| Consentimiento: descargar el PDF del alumno | ✓ | ✓ | — | ✓ | ✓ |

Fuente: `backend/api-contract.json` (103 endpoints en 18 grupos, `requireRole`
por ruta; verificado 2026-10-27). La UI puede ser más estricta que la API; por ejemplo, `/achievements` no incluye a `profesor` aunque la API sí le permita el `check`.

## Rutas públicas por token

Cinco rutas del expediente van **sin autenticación ni tenant**: la única
credencial es el token del link de inscripción.

| Método | Ruta |
|---|---|
| `GET` | `/api/enrollment/:token` |
| `PUT` | `/api/enrollment/:token/draft` |
| `POST` | `/api/enrollment/:token/submit` |
| `POST` | `/api/enrollment/:token/documents` |
| `GET` | `/api/enrollment/:token/consent.pdf` |

Quien tenga el link entra: trátalo como una credencial, no como una URL. Las
otras tres rutas abiertas son `POST /api/auth/register`,
`POST /api/auth/resolve-student` y `GET /api/health`.

## Reglas de alcance

| Rol | Alcance |
|---|---|
| admin / super_admin | toda su escuela |
| profesor | alumnos de las categorías donde está en `category_teachers` |
| padre | alumnos con `students.parent_id = user_id` |
| alumno | su propia ficha (`students.id = user_id`) |

El alcance por fila **no** lo da `requireRole`; lo da `findStudentForTenant` o filtros explícitos en el controlador. Ver [[Middlewares y autenticacion]].

## `teacher_permissions`

Seis flags por profesor. Se editan con `PUT /api/permissions/:id` (admin) y se leen con `GET /api/permissions/mine`.

> [!warning] No son enforcement
> Ninguna ruta usa estos flags para autorizar (solo se leen para mostrarlos; verificado 2026-10-26). Son datos para la UI, no un control de acceso. Ver [[Deriva conocida]].

## `ProtectedRoute` no es seguridad

`web/src/components/layout/ProtectedRoute.tsx` solo decide qué renderizar. Cualquiera puede llamar a la API directamente con su token; la única barrera real es el backend.

## Roles y navegación

El sidebar y las páginas cambian por rol, pero el mapeo autoritativo está en [[Rutas web]] (generado desde `ProtectedRoute`).

Relacionado: [[Multi-tenant]].
