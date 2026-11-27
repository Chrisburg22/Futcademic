-- Consola de plataforma (docs/product/PLAN-CONSOLA-PLATAFORMA.md), fases 1 y 2.
--
-- Rol nuevo `plataforma` en vez de volver `super_admin` cross-tenant: así
-- ninguna de las rutas que hoy aceptan `super_admin` cambia de alcance y el
-- aislamiento por `school_id` sigue intacto.

-- 1. Rol ------------------------------------------------------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role::text = ANY (ARRAY[
    'plataforma'::character varying,
    'super_admin'::character varying,
    'admin'::character varying,
    'profesor'::character varying,
    'padre'::character varying,
    'alumno'::character varying
  ]::text[]));

-- `users.school_id` ya es nullable. Esto impide los dos estados incoherentes:
-- un usuario de plataforma amarrado a una escuela, o un rol de academia sin
-- escuela (que es el 403 de `requireTenant` esperando a ocurrir).
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_platform_sin_escuela;
ALTER TABLE public.users ADD CONSTRAINT users_platform_sin_escuela
  CHECK ((role = 'plataforma' AND school_id IS NULL)
      OR (role <> 'plataforma' AND school_id IS NOT NULL));

-- 2. Estado de la academia ------------------------------------------------
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS status character varying NOT NULL DEFAULT 'activa',
  ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS suspended_reason text,
  -- Notas del dueño de la plataforma: ninguna ruta de academia las devuelve.
  ADD COLUMN IF NOT EXISTS internal_notes text;

ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_status_check;
ALTER TABLE public.schools ADD CONSTRAINT schools_status_check
  CHECK (status::text = ANY (ARRAY['activa'::character varying,
                                   'suspendida'::character varying,
                                   'archivada'::character varying]::text[]));

CREATE INDEX IF NOT EXISTS schools_status_idx ON public.schools (status);

-- 3. Bitácora -------------------------------------------------------------
-- Toda escritura de /api/platform/* deja fila aquí dentro de la misma
-- operación: si la bitácora falla, la operación falla.
CREATE TABLE IF NOT EXISTS public.platform_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  action character varying NOT NULL,
  target_type character varying NOT NULL,
  target_id uuid,
  school_id uuid,
  payload jsonb,
  ip character varying,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT platform_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT platform_audit_log_actor_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id),
  CONSTRAINT platform_audit_log_school_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);

CREATE INDEX IF NOT EXISTS platform_audit_created_idx
  ON public.platform_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_school_idx
  ON public.platform_audit_log (school_id, created_at DESC);

-- 4. Índices que la consola necesita para no escanear tablas completas ----
CREATE INDEX IF NOT EXISTS students_school_created_idx
  ON public.students (school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS attendances_school_created_idx
  ON public.attendances (school_id, created_at DESC);
