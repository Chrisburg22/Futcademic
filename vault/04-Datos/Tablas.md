---
tipo: generado
generado_por: scripts/vault/vault.py
hash: ef92c50846ea
actualizado: 2026-11-20
tags:
  - datos
  - generado
---

<!-- No editar a mano: python3 scripts/vault/vault.py generar -->

# Tablas

Esquema leído de `schema.sql` más las columnas añadidas por `migrations/*.sql`.

- **28 tablas**, **315 columnas**.
- `schema.sql` es la base; las migraciones se aplican después, en orden de nombre.

> [!warning] Deriva conocida
> El backend escribe columnas que no están en `schema.sql` ni en las migraciones (`first_name`, `last_name`, …). Antes de confiar en una columna, revisa [[Deriva conocida]].

## Tablas

[[#achievements]] · [[#attendances]] · [[#categories]] · [[#category_teachers]] · [[#chat_conversations]] · [[#chat_feedback]] · [[#chat_messages]] · [[#chat_tool_calls]] · [[#consent_templates]] · [[#deleted_students]] · [[#enrollment_access_log]] · [[#enrollment_applications]] · [[#enrollment_consents]] · [[#enrollment_documents]] · [[#enrollment_invitations]] · [[#event_exceptions]] · [[#events]] · [[#notifications]] · [[#payment_students]] · [[#payments]] · [[#profile_information]] · [[#schools]] · [[#student_achievements]] · [[#students]] · [[#teacher_permissions]] · [[#trainings]] · [[#users]] · [[#venues]]

## achievements

`schema.sql` · 8 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `name` | `character varying` | NOT NULL |
| `description` | `text` | — |
| `icon` | `character varying` | — |
| `type` | `character varying` | NOT NULL, enum: racha, asistencias, goles, puntualidad, progreso |
| `threshold` | `integer` | NOT NULL |
| `created_at` | `timestamp with time zone` | default `now()` |

## attendances

`schema.sql` · 10 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `student_id` | `uuid` | FK → `students.id`, NOT NULL |
| `category_id` | `uuid` | FK → `categories.id`, NOT NULL |
| `teacher_id` | `uuid` | FK → `users.id` |
| `training_id` | `uuid` | FK → `trainings.id` |
| `date` | `date` | NOT NULL |
| `type` | `character varying` | enum: entrenamiento, partido |
| `present` | `boolean` | NOT NULL, default `false` |
| `created_at` | `timestamp with time zone` | default `now()` |

## categories

`schema.sql` · 12 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `birth_year` | `text` | NOT NULL |
| `name` | `character varying` | NOT NULL |
| `description` | `text` | — |
| `color` | `character varying` | — |
| `monthly_fee` | `numeric` | default `0` |
| `max_students` | `integer` | — |
| `status` | `character varying` | NOT NULL, default `'activa'` |
| `archived_at` | `timestamp with time zone` | — |
| `created_at` | `timestamp with time zone` | default `now()` |
| `updated_at` | `timestamp with time zone` | default `now()` |

## category_teachers

`schema.sql` · 5 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `category_id` | `uuid` | FK → `categories.id`, NOT NULL |
| `teacher_id` | `uuid` | FK → `users.id`, NOT NULL |
| `created_at` | `timestamp with time zone` | default `now()` |

## chat_conversations

`migrations/20260709_add_chat_tables.sql` · 8 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid primary key` | default `gen_random_uuid()` |
| `school_id` | `uuid` | NOT NULL |
| `user_id` | `uuid` | NOT NULL |
| `title` | `text` | — |
| `status` | `text` | NOT NULL |
| `pending_state` | `jsonb,                   -- estado del loop pausado esperando confirmación` | — |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

## chat_feedback

`migrations/20261026_chat_feedback_and_tool_calls.sql` · 11 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid primary key` | default `gen_random_uuid()` |
| `school_id` | `uuid` | NOT NULL |
| `user_id` | `uuid` | NOT NULL |
| `conversation_id` | `uuid` | NOT NULL |
| `message_id` | `uuid` | NOT NULL |
| `rating` | `text` | NOT NULL, check `rating in ('up', 'down')` |
| `reason` | `text,          -- motivo del 👎: 'datos_incorrectos', 'no_era_eso', ...` | — |
| `comment` | `text` | — |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |
| `unique` | `(message_id, user_id)` | — |

## chat_messages

`migrations/20260709_add_chat_tables.sql` · 5 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid primary key` | default `gen_random_uuid()` |
| `conversation_id` | `uuid` | NOT NULL |
| `role` | `text` | NOT NULL |
| `content` | `jsonb` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

## chat_tool_calls

`migrations/20261026_chat_feedback_and_tool_calls.sql` · 11 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid primary key` | default `gen_random_uuid()` |
| `school_id` | `uuid` | NOT NULL |
| `conversation_id` | `uuid` | NOT NULL |
| `tool_name` | `text` | NOT NULL |
| `input` | `jsonb` | NOT NULL, default `'{}'::jsonb` |
| `ok` | `boolean` | NOT NULL |
| `is_sensitive` | `boolean` | NOT NULL, default `false` |
| `confirmed` | `boolean` | — |
| `duration_ms` | `integer` | — |
| `error` | `text` | — |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

## consent_templates

`migrations/20261026_add_enrollment_expediente.sql` · 8 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid primary key` | default `gen_random_uuid()` |
| `school_id` | `uuid` | — |
| `version` | `text` | NOT NULL |
| `body_md` | `text` | NOT NULL |
| `body_hash` | `text` | — |
| `active` | `boolean` | NOT NULL, default `true` |
| `created_by` | `uuid` | — |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

## deleted_students

`schema.sql` · 9 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `original_student_id` | `uuid` | NOT NULL |
| `full_name` | `character varying` | NOT NULL |
| `birth_date` | `date` | NOT NULL |
| `category_id` | `uuid` | — |
| `parent_id` | `uuid` | — |
| `deleted_at` | `timestamp with time zone` | default `now()` |
| `deleted_by` | `uuid` | FK → `users.id` |

## enrollment_access_log

`migrations/20261026_add_enrollment_expediente.sql` · 11 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid primary key` | default `gen_random_uuid()` |
| `school_id` | `uuid` | NOT NULL |
| `invitation_id` | `uuid` | — |
| `user_id` | `uuid` | — |
| `action` | `text` | NOT NULL |
| `entity_type` | `text` | — |
| `entity_id` | `uuid` | — |
| `ip` | `inet` | — |
| `user_agent` | `text` | — |
| `metadata` | `jsonb` | — |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

## enrollment_applications

`migrations/20261026_add_enrollment_expediente.sql` · 32 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid primary key` | default `gen_random_uuid()` |
| `school_id` | `uuid` | NOT NULL |
| `invitation_id` | `uuid` | NOT NULL |
| `category_id` | `uuid` | NOT NULL |
| `original_category_id` | `uuid` | — |
| `status` | `text` | NOT NULL, default `'borrador'` |
| `check` | `(status in ('borrador', 'enviada', 'en_revision', 'aprobada', 'rechazada'))` | — |
| `student_full_name` | `text` | — |
| `student_birth_date` | `date` | — |
| `student_curp` | `text` | — |
| `student_phone` | `text` | — |
| `student_address` | `text` | — |
| `emergency_contact_name` | `text` | — |
| `emergency_contact_phone` | `text` | — |
| `medical_notes` | `text` | — |
| `guardian_full_name` | `text` | — |
| `guardian_relationship` | `text` | — |
| `guardian_email` | `text` | — |
| `guardian_phone` | `text` | — |
| `guardian_address` | `text` | — |
| `guardian_user_id` | `uuid` | — |
| `submitted_at` | `timestamptz` | — |
| `submitted_ip` | `inet` | — |
| `submitted_user_agent` | `text` | — |
| `reviewed_by` | `uuid` | — |
| `reviewed_at` | `timestamptz` | — |
| `rejection_reason` | `text` | — |
| `student_id` | `uuid` | — |
| `category_mismatch` | `boolean` | NOT NULL, default `false` |
| `reopen_count` | `integer` | NOT NULL, default `0` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

## enrollment_consents

`migrations/20261026_add_enrollment_expediente.sql` · 20 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid primary key` | default `gen_random_uuid()` |
| `school_id` | `uuid` | NOT NULL |
| `application_id` | `uuid unique` | — |
| `student_id` | `uuid` | — |
| `guardian_name` | `text` | NOT NULL |
| `guardian_relationship` | `text` | — |
| `consent_version` | `text` | NOT NULL |
| `text_hash` | `text` | NOT NULL |
| `accepted_data` | `boolean` | NOT NULL, default `false` |
| `accepted_participation` | `boolean` | NOT NULL, default `false` |
| `accepted_medical` | `boolean` | NOT NULL, default `false` |
| `accepted_image` | `boolean` | NOT NULL, default `false` |
| `accepted_at` | `timestamptz` | NOT NULL, default `now()` |
| `ip` | `inet` | — |
| `user_agent` | `text` | — |
| `pdf_path` | `text` | — |
| `captured_by` | `uuid` | — |
| `revoked_at` | `timestamptz` | — |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `or` | `(application_id is null and student_id is` | NOT NULL |

## enrollment_documents

`migrations/20261026_add_enrollment_expediente.sql` · 22 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid primary key` | default `gen_random_uuid()` |
| `school_id` | `uuid` | NOT NULL |
| `application_id` | `uuid` | — |
| `student_id` | `uuid` | — |
| `owner_type` | `text` | NOT NULL, check `owner_type in ('alumno', 'tutor')` |
| `doc_type` | `text` | NOT NULL |
| `file_path` | `text` | NOT NULL |
| `file_name` | `text` | — |
| `mime_type` | `text` | — |
| `size_bytes` | `bigint` | — |
| `file_hash` | `text` | — |
| `status` | `text` | NOT NULL, default `'pendiente'` |
| `check` | `(status in ('pendiente', 'validado', 'rechazado', 'vencido'))` | — |
| `expires_at` | `date` | — |
| `uploaded_by` | `uuid` | — |
| `uploaded_at` | `timestamptz` | NOT NULL, default `now()` |
| `verified_by` | `uuid` | — |
| `verified_at` | `timestamptz` | — |
| `rejection_reason` | `text` | — |
| `reused_from` | `uuid` | — |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `or` | `(application_id is null and student_id is` | NOT NULL |

## enrollment_invitations

`migrations/20261026_add_enrollment_expediente.sql` · 11 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid primary key` | default `gen_random_uuid()` |
| `school_id` | `uuid` | NOT NULL |
| `category_id` | `uuid` | NOT NULL |
| `token_hash` | `text` | NOT NULL |
| `created_by` | `uuid` | — |
| `expires_at` | `timestamptz` | NOT NULL |
| `used_at` | `timestamptz` | — |
| `revoked_at` | `timestamptz` | — |
| `application_id` | `uuid` | — |
| `note` | `text` | — |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

## event_exceptions

`schema.sql` · 6 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `uuid_generate_v4()` |
| `school_id` | `uuid` | FK → `schools.id` |
| `event_id` | `uuid` | FK → `events.id` |
| `date` | `date` | NOT NULL |
| `is_cancelled` | `boolean` | default `true` |
| `created_at` | `timestamp with time zone` | default `now()` |

## events

`schema.sql` · 14 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `category_id` | `uuid` | FK → `categories.id`, NOT NULL |
| `venue_id` | `uuid` | FK → `venues.id` |
| `date` | `date` | NOT NULL |
| `start_time` | `time without time zone` | — |
| `type` | `character varying` | enum: entrenamiento, partido |
| `description` | `text` | — |
| `is_completed` | `boolean` | default `false` |
| `is_recurring` | `boolean` | default `false` |
| `recurring_weeks` | `integer` | — |
| `recurring_end_date` | `date` | — |
| `recurrence_rule` | `jsonb` | — |
| `created_at` | `timestamp with time zone` | default `now()` |

## notifications

`schema.sql` · 9 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `user_id` | `uuid` | FK → `users.id`, NOT NULL |
| `title` | `character varying` | NOT NULL |
| `body` | `text` | — |
| `type` | `character varying` | NOT NULL, enum: pago_recibido, sesion_recordatorio, sesion_cancelada, bienvenida, logro_desbloqueado |
| `data` | `jsonb` | — |
| `is_read` | `boolean` | default `false` |
| `created_at` | `timestamp with time zone` | default `now()` |

## payment_students

`schema.sql` · 5 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `payment_id` | `uuid` | FK → `payments.id`, NOT NULL |
| `student_id` | `uuid` | FK → `students.id`, NOT NULL |
| `amount` | `numeric` | NOT NULL |
| `created_at` | `timestamp with time zone` | default `now()` |

## payments

`schema.sql` · 11 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `amount` | `numeric` | NOT NULL |
| `payment_date` | `date` | NOT NULL |
| `payment_type` | `character varying` | enum: mensualidad, pago_profesor |
| `student_id` | `uuid` | FK → `students.id` |
| `teacher_id` | `uuid` | FK → `users.id` |
| `description` | `text` | — |
| `payment_month` | `integer` | — |
| `payment_year` | `integer` | default `extract(year from now())` |
| `created_at` | `timestamp with time zone` | default `now()` |

## profile_information

`schema.sql` · 11 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | FK → `users.id`, NOT NULL |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `phone` | `character varying` | — |
| `address` | `text` | — |
| `birth_date` | `date` | — |
| `gender` | `character varying` | — |
| `emergency_contact_name` | `character varying` | — |
| `emergency_contact_phone` | `character varying` | — |
| `medical_notes` | `text` | — |
| `avatar_url` | `text` | — |
| `updated_at` | `timestamp with time zone` | default `now()` |

## schools

`schema.sql` · 7 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `name` | `character varying` | NOT NULL |
| `logo_url` | `text` | — |
| `razon_social` | `character varying` | — |
| `direccion` | `text` | — |
| `contacto_email` | `character varying` | — |
| `created_at` | `timestamp with time zone` | default `now()` |

## student_achievements

`schema.sql` · 4 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `student_id` | `uuid` | FK → `students.id`, NOT NULL |
| `achievement_id` | `uuid` | FK → `achievements.id`, NOT NULL |
| `unlocked_at` | `timestamp with time zone` | default `now()` |

## students

`schema.sql` · 20 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `category_id` | `uuid` | FK → `categories.id`, NOT NULL |
| `parent_id` | `uuid` | FK → `users.id` |
| `full_name` | `character varying` | NOT NULL |
| `birth_date` | `date` | NOT NULL |
| `status` | `character varying` | default `'activo'::character varying`, enum: activo, pendiente_pago, becado, inactivo |
| `uniform_delivered` | `boolean` | default `false` |
| `phone` | `character varying` | — |
| `address` | `text` | — |
| `emergency_contact_name` | `character varying` | — |
| `emergency_contact_phone` | `character varying` | — |
| `medical_notes` | `text` | — |
| `avatar_url` | `text` | — |
| `current_streak` | `integer` | default `0` |
| `max_streak` | `integer` | default `0` |
| `last_attendance_date` | `date` | — |
| `created_at` | `timestamp with time zone` | default `now()` |
| `curp` | `text` | migración `20261026_add_enrollment_expediente.sql` |
| `guardian_relationship` | `text` | migración `20261026_add_enrollment_expediente.sql` |

## teacher_permissions

`schema.sql` · 10 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `teacher_id` | `uuid` | FK → `users.id`, NOT NULL |
| `can_manage_students` | `boolean` | default `true` |
| `can_manage_events` | `boolean` | default `true` |
| `can_view_finances` | `boolean` | default `false` |
| `can_manage_payments` | `boolean` | default `false` |
| `can_take_attendance` | `boolean` | default `true` |
| `can_manage_categories` | `boolean` | default `false` |
| `created_at` | `timestamp with time zone` | default `now()` |

## trainings

`schema.sql` · 11 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id` |
| `event_id` | `uuid` | FK → `events.id` |
| `category_id` | `uuid` | FK → `categories.id` |
| `venue_id` | `uuid` | FK → `venues.id` |
| `date` | `date` | NOT NULL |
| `start_time` | `time without time zone` | — |
| `type` | `character varying` | enum: entrenamiento, partido |
| `is_completed` | `boolean` | default `false` |
| `is_cancelled` | `boolean` | default `false` |
| `created_at` | `timestamp with time zone` | default `now()` |

## users

`schema.sql` · 15 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL |
| `school_id` | `uuid` | FK → `schools.id` |
| `role` | `character varying` | enum: super_admin, admin, profesor, padre, alumno |
| `full_name` | `character varying` | NOT NULL |
| `avatar_url` | `text` | — |
| `must_change_password` | `boolean` | NOT NULL, default `false` |
| `push_token` | `text` | — |
| `phone` | `character varying` | — |
| `address` | `text` | — |
| `apodo` | `character varying` | — |
| `numero_favorito` | `integer` | — |
| `posicion` | `character varying` | — |
| `created_at` | `timestamp with time zone` | default `now()` |
| `onboarded_at` | `TIMESTAMPTZ` | migración `20260512_add_user_onboarded_at.sql` |
| `username` | `TEXT` | migración `20260512_add_username_to_users.sql` |

## venues

`schema.sql` · 9 columnas

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | NOT NULL, default `gen_random_uuid()` |
| `school_id` | `uuid` | FK → `schools.id`, NOT NULL |
| `name` | `character varying` | NOT NULL |
| `address` | `text` | — |
| `notes` | `text` | — |
| `capacity` | `integer` | — |
| `latitud` | `numeric` | — |
| `longitud` | `numeric` | — |
| `created_at` | `timestamp with time zone` | default `now()` |
