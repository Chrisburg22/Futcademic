---
tipo: nota
area: datos
estado: verificado
actualizado: 2026-10-27
fuentes:
  - schema.sql
  - migrations
  - docs/technical/ESQUEMA-BASE-DATOS.md
tags:
  - datos
---

# Base de datos

Postgres en Supabase. El backend accede con la **service key**; el navegador nunca consulta tablas de negocio directamente.

## Tamaño real

- **28 tablas**: 18 en `schema.sql` y 10 creadas por migraciones.
- Las 10 de migraciones son 4 de chat (`chat_conversations`, `chat_messages`,
  `chat_feedback`, `chat_tool_calls`) y 6 de inscripciones
  (`consent_templates`, `enrollment_invitations`, `enrollment_applications`,
  `enrollment_consents`, `enrollment_documents`, `enrollment_access_log`).
- **8 migraciones** en total. Ver [[Migraciones]].
- Listado completo y columnas: [[Tablas]] (generado).

## Convenciones

| Convención | Detalle |
|---|---|
| PK | `uuid` con `gen_random_uuid()` |
| Tenant | `school_id` en todas las tablas de negocio |
| Timestamps | `created_at timestamptz default now()` |
| Enums | `CHECK (col = ANY (ARRAY[...]))`, no tipos enum |
| Dinero | `numeric`; cuota en `categories.monthly_fee` |
| Fechas | `date` para días; `timestamptz` para auditoría |

Las tablas puente `payment_students` y `student_achievements` **no tienen `school_id`**: heredan el tenant de su padre. No filtres por `school_id` ahí.

## Invariantes

1. `users.id` = `auth.users.id`.
2. `students.id` = `users.id` para alumnos.
3. `profile_information.id` = `users.id`.
4. `students.parent_id` → `users.id` del padre.
5. `students.category_id` → `categories.id`.
6. `payments.student_id` puede ser `NULL` en pagos grupales.
7. Borrar un alumno asume cascada en asistencias/logros y pagos con `student_id = NULL`; el SQL versionado no declara `ON DELETE` (ver [[Deriva conocida]]).

## Aislamiento

`schema.sql` **no declara políticas RLS** para las 18 tablas base. Las 10 tablas
creadas por migraciones sí traen `enable row level security`
(`20261026_chat_rls.sql` y `20261026_add_enrollment_expediente.sql`), pero
**sin políticas**: con RLS activo y cero políticas nadie entra por la API de
Supabase, y el backend sigue pasando con la service key, que la ignora. Es
cierre de la puerta directa, no aislamiento por fila.

El aislamiento verificable está en el backend: `requireTenant` fija `school_id`
y cada consulta filtra por él. Ver [[Deriva conocida]] y [[Multi-tenant]].

## Grupos de tablas

| Grupo | Tablas |
|---|---|
| Academia | `schools`, `venues`, `categories`, `category_teachers` |
| Personas | `users`, `profile_information`, `students`, `deleted_students` |
| Operación | `events`, `trainings`, `event_exceptions`, `attendances` |
| Dinero | `payments`, `payment_students` |
| Gamificación | `achievements`, `student_achievements` |
| Avisos y chat | `notifications`, `chat_conversations`, `chat_messages`, `chat_feedback`, `chat_tool_calls` |
| Inscripciones | `enrollment_invitations`, `enrollment_applications`, `enrollment_consents`, `enrollment_documents`, `enrollment_access_log`, `consent_templates` |
| Permisos | `teacher_permissions` |

## Antes de tocar

- Cambios: [[Cambiar la base de datos]].
- Relaciones: [[Relaciones]].
- Deriva: [[Deriva conocida]].
