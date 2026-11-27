# Plan: Consola de plataforma (dueño de Futcademic)

Estado: propuesta · 2026-11-24 · Alcance: `backend/` + `web/` + `migrations/`

---

## 1. Definición del producto

### Una frase

Una consola separada donde el dueño de Futcademic ve todas las academias
registradas, detecta las que se están muriendo y resuelve los problemas de
soporte sin pedirle contraseñas a nadie.

### Tipo de producto

**Herramienta** (Tool) interna. No se vende, no tiene comprador: el usuario es el
operador del negocio. Eso cambia el criterio de éxito: no se mide por retención
sino por **cuántas preguntas del dueño contesta sin abrir Supabase**.

### El usuario

- **Quién:** el dueño de la aplicación (una persona, hoy tú). Opera soporte,
  comercial y producto a la vez.
- **Antes:** entra al editor SQL de Supabase, corre consultas a mano para saber
  cuántas academias hay, y para dar soporte pide capturas por WhatsApp o
  credenciales prestadas.
- **Después (día 30):** abre `/platform`, ve en una pantalla cuántas academias
  están activas, cuáles no han pasado lista en dos semanas y cuáles acaban de
  registrarse; entra a la ficha de una academia para resolver un ticket y deja
  rastro de lo que tocó.

### Día 1

1. Entra a `/login` con su cuenta de rol `plataforma`.
2. `AuthGate` lo manda a `/platform`, no al panel de academia.
3. Ve el resumen: academias activas, alumnos totales, altas de los últimos 30
   días, academias sin actividad.
4. Abre `/platform/schools`, ordena por última actividad y encuentra las tres
   academias que se registraron y nunca crearon un alumno.
5. Abre la ficha de una, ve que sí tiene categorías pero cero alumnos, y le
   manda un aviso.
6. Suspende una academia de prueba que ya no se usa.

### Lo que el dueño deja de hacer

- Escribir SQL para contar academias, alumnos o usuarios.
- Pedir credenciales o capturas para reproducir un problema.
- Adivinar si una academia abandonó la app.

### Lo que sigue haciendo

- Cobrar (no hay facturación en la app: fuera de alcance, ver §8).
- Contestar los tickets; la consola da contexto, no responde correos.
- Las correcciones de datos finos de un alumno se siguen haciendo dentro de la
  academia (impersonando o pidiéndole al admin).

---

## 2. El problema real: hoy no existe un rol de plataforma

Verificado en código:

| Hecho | Dónde |
|---|---|
| Los cinco roles son `super_admin`, `admin`, `profesor`, `padre`, `alumno` | `schema.sql`, CHECK de `users.role` |
| `requireTenant` lee `users.school_id` y lo fija en `req.tenant`; si no hay fila, 403 | `backend/api/middlewares/tenant.middleware.ts` |
| `super_admin` aparece siempre junto a `admin` y **queda acotado a un `school_id`** | 103 endpoints del contrato; ninguno exclusivo de `super_admin` |
| `schools` no tiene estado: solo `id`, `name`, `logo_url`, `razon_social`, `direccion`, `contacto_email`, `created_at` | `schema.sql` |
| Cualquiera puede crear una academia desde `/register` sin revisión | `POST /api/auth/register` |
| No existe bitácora de acciones administrativas | no hay tabla de auditoría en `schema.sql` ni en `migrations/` |

Conclusión: `super_admin` **no** es el dueño de la plataforma; es un `admin` con
otro nombre. Convertirlo en cross-tenant obligaría a revisar las ~60 rutas que
lo aceptan y a resolver el `school_id` de otra manera en cada una: riesgo directo
de fuga entre academias, que es justo lo que `tenant-isolation.test.ts` protege.

**Decisión:** se agrega un sexto rol, `plataforma`, con `school_id` nulo, un
middleware propio y un espacio de rutas propio. `super_admin` se queda como está.

---

## 3. Modelo de seguridad

```text
JWT (Supabase Auth)
  → requireAuth              valida y deja req.user.id
  → requirePlatform          busca users.id, exige role = 'plataforma'
                             → req.platform = { user_id }
                             → NUNCA fija school_id
```

Reglas duras:

1. **Dos puertas distintas.** `requirePlatform` y `requireTenant` nunca se
   combinan. Un usuario `plataforma` no pasa `requireTenant` (no tiene
   `school_id`) y por lo tanto no puede entrar por accidente a una ruta de
   academia.
2. **Ningún controlador se reutiliza.** `/api/platform/*` tiene sus propios
   controladores y un `platform.service.ts`. El `school_id` llega como parámetro
   explícito de ruta, nunca inferido. Reutilizar los controladores de academia
   obligaría a inyectar un tenant falso, que es la forma más fácil de romper el
   aislamiento.
3. **Toda escritura deja rastro.** Cada mutación de `/api/platform/*` escribe en
   `platform_audit_log` dentro de la misma operación. Si la auditoría falla, la
   operación falla.
4. **Suspensión en el middleware.** `requireTenant` pasa a verificar
   `schools.status = 'activa'`; si no, responde 403 con un código propio
   (`SCHOOL_SUSPENDED`). Así la suspensión aplica a los 103 endpoints de golpe,
   sin tocar controladores.
5. **El primer usuario `plataforma` no se crea por HTTP.** Se siembra con un
   script de `backend/api/scripts/` usando la service role. No hay endpoint para
   promover a `plataforma`; el CHECK de rol se cambia en migración, pero la
   asignación es manual y deliberada.

---

## 4. Cambios de datos

Una migración nueva: `migrations/2026MMDD_platform_console.sql`.

### 4.1 Rol

```sql
ALTER TABLE public.users DROP CONSTRAINT users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('plataforma','super_admin','admin','profesor','padre','alumno'));
```

`users.school_id` ya es nullable: no hace falta tocarlo. Se añade un CHECK de
coherencia: `role = 'plataforma'` ⟺ `school_id IS NULL`.

### 4.2 Estado de la academia

```sql
ALTER TABLE public.schools
  ADD COLUMN status varchar NOT NULL DEFAULT 'activa'
    CHECK (status IN ('activa','suspendida','archivada')),
  ADD COLUMN suspended_at timestamptz,
  ADD COLUMN suspended_reason text,
  ADD COLUMN internal_notes text;
CREATE INDEX schools_status_idx ON public.schools (status);
```

`internal_notes` es del dueño de la plataforma, no de la academia: ningún
endpoint de academia lo devuelve.

### 4.3 Bitácora

```sql
CREATE TABLE public.platform_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES public.users(id),
  action varchar NOT NULL,              -- school.suspend, school.update, impersonate.start…
  target_type varchar NOT NULL,         -- school | user | announcement
  target_id uuid,
  school_id uuid REFERENCES public.schools(id),
  payload jsonb,                        -- antes/después, razón
  ip varchar,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX platform_audit_created_idx ON public.platform_audit_log (created_at DESC);
CREATE INDEX platform_audit_school_idx ON public.platform_audit_log (school_id, created_at DESC);
```

### 4.4 Avisos

```sql
CREATE TABLE public.platform_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar NOT NULL,
  body text NOT NULL,
  audience varchar NOT NULL CHECK (audience IN ('todas','escuela')),
  school_id uuid REFERENCES public.schools(id),   -- obligatorio si audience = 'escuela'
  target_roles text[] NOT NULL DEFAULT '{admin}',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);
```

El aviso **no** se multiplica en `notifications` al crearse: esa tabla exige
`school_id` y `user_id` y su CHECK de `type` no incluye avisos de plataforma. El
aviso se lee como banner desde la app de academia (`GET /api/users/me/announcements`,
una ruta de tenant que filtra por audiencia y vigencia). Si más adelante se
quiere push, se amplía el CHECK de `notifications.type` con `aviso_plataforma`.

### 4.5 Impersonación

```sql
CREATE TABLE public.platform_impersonations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES public.users(id),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  reason text NOT NULL,
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### 4.6 Métricas (fase 4)

`school_daily_metrics (school_id, date, students, active_users, attendances, payments_amount)`:
una fila por academia y día, escrita por un job nocturno. Sirve para tendencias
sin escanear `attendances` completa en cada carga del resumen.

---

## 5. Servicios y endpoints

Todos bajo `/api/platform`, todos con `requireAuth + requirePlatform`.
Archivos nuevos: `backend/api/routes/platform.routes.ts`,
`backend/api/controllers/platform.controller.ts`,
`backend/api/services/platform.ts`,
`backend/api/services/audit.ts`,
`backend/api/middlewares/platform.middleware.ts`.

### 5.1 Resumen

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/platform/overview` | KPIs y listas de atención |

```json
{
  "schools": { "total": 14, "activas": 12, "suspendidas": 2, "nuevas_30d": 3 },
  "usage": { "alumnos": 842, "usuarios": 1130, "por_rol": { "admin": 14, "profesor": 61, "padre": 790, "alumno": 265 } },
  "activity": { "asistencias_7d": 1204, "pagos_registrados_mes": 318, "monto_registrado_mes": 412000 },
  "atencion": {
    "sin_actividad_14d": [{ "school_id": "…", "name": "…", "last_activity_at": "…" }],
    "sin_alumnos": [],
    "registradas_sin_usar_7d": []
  }
}
```

«Actividad» de una academia = máximo entre la última `attendances.created_at`,
el último `payments.created_at` y el último `students.created_at`. Queda
documentado en el contrato porque es el número con el que se juzga a un cliente.

### 5.2 Academias

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/platform/schools` | listado paginado; filtros `status`, `q`, orden por `last_activity_at`, `students`, `created_at` |
| `GET` | `/platform/schools/:id` | ficha completa: identidad, uso, personas, actividad 90d, pagos del mes, últimas 20 líneas de auditoría |
| `PATCH` | `/platform/schools/:id` | edita `name`, `razon_social`, `direccion`, `contacto_email`, `internal_notes` → auditoría con antes/después |
| `POST` | `/platform/schools/:id/suspend` | body `{ reason }` → `status = 'suspendida'` |
| `POST` | `/platform/schools/:id/reactivate` | → `status = 'activa'`, limpia `suspended_*` |
| `GET` | `/platform/schools/:id/activity` | serie diaria (asistencias, pagos, altas) para la gráfica |
| `GET` | `/platform/schools.csv` | export del listado |

### 5.3 Personas (soporte)

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/platform/users?q=&role=&school_id=` | buscador global por nombre, email o username; devuelve academia y rol |
| `GET` | `/platform/users/:id` | ficha mínima: rol, academia, `onboarded_at`, `must_change_password`, último acceso |
| `POST` | `/platform/users/:id/password-reset` | genera link de recuperación de Supabase y lo envía por SendGrid; **nunca** devuelve la contraseña |

Contesta el ticket más común («no puedo entrar») sin tocar la base.

### 5.4 Entrar como academia (solo lectura)

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/platform/schools/:id/impersonate` | body `{ reason }`; crea fila en `platform_impersonations`, caduca a los 15 min, devuelve un token de app propio |
| `POST` | `/platform/impersonations/:id/end` | cierra la sesión |

Implementación: el token es propio del backend (JWT firmado con un secreto del
servidor, **no** una sesión de Supabase), con claims
`{ actor_user_id, school_id, role: 'admin', readonly: true }`. `requireTenant`
lo acepta y marca `req.tenant.impersonated = true`; un guard global rechaza
cualquier método distinto de `GET` mientras esa marca esté puesta. Así el dueño
ve exactamente lo que ve el admin y no puede alterar datos por error. La web
pinta una banda roja fija con la academia, el motivo y el tiempo restante.

### 5.5 Avisos

| Método | Ruta |
|---|---|
| `GET` / `POST` | `/platform/announcements` |
| `PATCH` / `DELETE` | `/platform/announcements/:id` |
| `GET` | `/users/me/announcements` *(ruta de tenant, la consume la app de academia)* |

### 5.6 Bitácora y salud

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/platform/audit?action=&school_id=&from=&to=` | bitácora paginada |
| `GET` | `/platform/health` | estado de dependencias: Supabase, SendGrid (`SENDGRID_API_KEY` presente y último envío), storage de imágenes, push |

---

## 6. Vistas web

Namespace `/platform/*` en `web/app/(platform)/`, con **shell propio**
(`PlatformShell`), no el `AppShell` de academia: el menú, los colores y el
lenguaje son distintos y mezclarlos invita a confundir «mi academia» con «todas
las academias».

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/platform` | `PlatformOverviewPage` | KPIs, gráfica de crecimiento, tarjetas de «necesita atención» |
| `/platform/schools` | `PlatformSchoolsPage` | tabla: academia, estado, alumnos, usuarios, última actividad, creada |
| `/platform/schools/[id]` | `PlatformSchoolDetailPage` | pestañas **Resumen · Personas · Actividad · Datos · Bitácora**; acciones suspender / reactivar / entrar como |
| `/platform/users` | `PlatformUsersPage` | buscador global de personas + enviar recuperación |
| `/platform/announcements` | `PlatformAnnouncementsPage` | crear, programar y retirar avisos |
| `/platform/audit` | `PlatformAuditPage` | bitácora filtrable |
| `/platform/health` | `PlatformHealthPage` | semáforo de integraciones |

Cambios en lo existente:

- `web/src/types/index.ts`: `Role` suma `'plataforma'`.
- `AuthContext` y `AuthGate`: el rol `plataforma` se redirige a `/platform` y
  **no** puede entrar a `(app)`; los roles de academia no pueden entrar a
  `(platform)`.
- `navItems.ts`: ni un destino nuevo. El rol `plataforma` no aparece en
  `BARRA_POR_ROL` ni en `visibleFor`; su navegación vive en `PlatformShell`.
- Banda de impersonación: componente global en el layout de `(app)`, visible
  solo cuando la sesión activa es de impersonación.
- Pantalla de academia suspendida: cuando la API responde `SCHOOL_SUSPENDED`,
  la app de academia muestra una página de bloqueo con el contacto, no un toast
  de error.
- Hooks nuevos en `web/src/hooks/usePlatform.ts` (TanStack Query, misma
  convención que `useDashboard`).

---

## 7. Fases

| Fase | Entrega | Hecho cuando |
|---|---|---|
| **F1 · Cimientos** | rol `plataforma`, migración (rol + `schools.status` + auditoría), `requirePlatform`, `/platform/overview`, `/platform/schools`, ficha en lectura, `PlatformShell`, redirecciones | el dueño entra y ve todas las academias sin abrir Supabase |
| **F2 · Operación** | suspender / reactivar con enforcement en `requireTenant`, `PATCH` de datos, buscador de personas, recuperación de contraseña, bitácora en UI, export CSV | puede cerrar una academia y resolver un «no puedo entrar» sin SQL |
| **F3 · Soporte** | impersonación de solo lectura + banda + auditoría, avisos globales + banner en la app, `/platform/health` | puede reproducir un problema y avisar a todos |
| **F4 · Observabilidad** | `school_daily_metrics` + job nocturno, tendencias y comparativas, alerta de academias inactivas | ve si una academia se está apagando antes de que se vaya |

F1 y F2 son el producto mínimo útil. F3 es el que más riesgo de seguridad
introduce y por eso va después de que la auditoría ya esté funcionando.

---

## 8. Fuera de alcance

1. **Planes, suscripciones, MRR, churn, Stripe.** No hay tablas de facturación y
   el PRD ya deja los pagos en línea fuera. Entra cuando exista cobro real.
2. **RLS.** El backend usa service role y la saltaría igual; el aislamiento
   verificable sigue siendo el backend (ver `vault/04-Datos/Deriva conocida.md`).
3. **Borrar academias.** Solo `archivada`. El borrado en cascada de un tenant es
   un proyecto propio.
4. **Escribir datos de negocio de una academia** (alumnos, pagos, asistencias)
   desde la consola. La impersonación es de lectura.
5. **`mobile/`.** La consola es web.
6. **Multi-usuario de plataforma** (equipo de soporte con permisos finos). El rol
   es uno y la bitácora ya guarda el actor, así que crecer es posible, pero no
   se diseña ahora.

---

## 9. Criterios de aceptación

Funcionales:

1. Un usuario con rol `plataforma` entra a `/platform` y ve el total de
   academias, alumnos y usuarios, que coincide con un `count` directo en la base.
2. El listado de academias ordena por última actividad y marca las que llevan
   más de 14 días sin ninguna.
3. Suspender una academia deja a sus `admin`, `profesor`, `padre` y `alumno`
   fuera de los 103 endpoints con `SCHOOL_SUSPENDED`, y reactivarla los devuelve.
4. Cada suspensión, reactivación, edición e impersonación aparece en
   `/platform/audit` con actor, motivo y marca de tiempo.
5. Una sesión de impersonación caduca a los 15 minutos y rechaza cualquier
   `POST`, `PUT`, `PATCH` o `DELETE`.
6. Un aviso con audiencia `todas` aparece como banner para los `admin` de todas
   las academias activas dentro de su vigencia.

De seguridad (tests, al estilo de `tenant-isolation.test.ts`):

7. Un `admin` o `super_admin` que llama a cualquier `/api/platform/*` recibe 403.
8. Un usuario `plataforma` que llama a cualquier ruta de academia recibe 403 por
   `requireTenant` (no tiene `school_id`).
9. Ninguna ruta de `/api/platform/*` toma un `school_id` del body, query o
   header: siempre del parámetro de ruta.
10. Si la escritura en `platform_audit_log` falla, la mutación se revierte.
11. `internal_notes` no aparece en ninguna respuesta de ruta de academia.

---

## 10. Dependencias

- Migración aplicada en Supabase antes de desplegar el backend (el CHECK de rol
  es bloqueante).
- Un secreto nuevo en el backend para firmar el token de impersonación
  (`PLATFORM_IMPERSONATION_SECRET`), documentado en
  `vault/01-Proyecto/Entornos y variables.md`.
- `SENDGRID_API_KEY` para la recuperación de contraseña desde la consola: sin
  ella el botón no sirve (mismo hoyo conocido de las invitaciones).
- El script de siembra del primer usuario `plataforma`.
- Regenerar `backend/api-contract.json` con `dump-routes.ts` al cerrar F1.

---

## 11. Estado de la evidencia

| Afirmación | Fuente | Estado |
|---|---|---|
| `super_admin` está acotado a un `school_id` | `tenant.middleware.ts`, `api-contract.json` | verificado |
| `schools` no tiene estado ni notas internas | `schema.sql` | verificado |
| No existe bitácora de acciones administrativas | `schema.sql`, `migrations/` | verificado |
| `notifications.type` no admite avisos de plataforma | `schema.sql` | verificado |
| No hay tablas de planes ni suscripciones | `schema.sql`, `migrations/` | verificado |
| «Sin actividad en 14 días» predice abandono | — | hipótesis: es el umbral propuesto, no medido |
| Las academias registradas sin uso son el problema principal del dueño | — | hipótesis: no hay datos de uso real todavía |

---

## 12. Preguntas abiertas

1. **Umbral de inactividad.** 14 días es una propuesta. Al tener diez academias
   reales habrá que recalibrarlo.
2. **Retención de la bitácora.** ¿Se guarda para siempre o se purga a los 12
   meses?
3. **Impersonación con escritura.** Queda de solo lectura en F3. Si el soporte
   real exige corregir datos, se abre como cambio aparte con confirmación
   explícita y auditoría por operación.
4. **Aviso por push.** Los avisos arrancan como banner. Mandarlos por push pide
   ampliar el CHECK de `notifications.type`.
5. **Registro abierto.** Hoy cualquiera crea una academia desde `/register`. Con
   la consola, ¿se deja así y se suspende lo que sobra, o se pasa a aprobación?
