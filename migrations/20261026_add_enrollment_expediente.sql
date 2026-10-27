-- Expediente de Inscripción — Fase 1
-- Fecha: 2026-10-26
--
-- Añade el modelo de expediente, la invitación remota de un solo uso y el
-- almacenamiento privado de documentos. Es aditiva: no modifica ni borra datos
-- existentes. Los alumnos actuales sin tutor quedan como `sin_tutor` en la
-- vista `student_expediente_status` sin necesidad de migrarlos a mano.
--
-- Aplicar en el SQL Editor de Supabase después de las migraciones anteriores.

-- ---------------------------------------------------------------------------
-- 1. Plantillas de consentimiento (versionadas, nunca se editan in place)
-- ---------------------------------------------------------------------------
create table if not exists public.consent_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id),
  version text not null,
  body_md text not null,
  body_hash text,
  active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- Solo puede haber una plantilla activa global y una activa por escuela.
create unique index if not exists consent_templates_global_active_idx
  on public.consent_templates (active)
  where school_id is null and active;

create unique index if not exists consent_templates_school_active_idx
  on public.consent_templates (school_id)
  where school_id is not null and active;

create index if not exists consent_templates_version_idx
  on public.consent_templates (version);

-- ---------------------------------------------------------------------------
-- 2. Invitaciones de inscripción (token opaco, un solo uso)
-- ---------------------------------------------------------------------------
create table if not exists public.enrollment_invitations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  category_id uuid not null references public.categories(id),
  token_hash text not null unique,
  created_by uuid references public.users(id),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  application_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists enrollment_invitations_school_idx
  on public.enrollment_invitations (school_id, created_at desc);

create index if not exists enrollment_invitations_category_idx
  on public.enrollment_invitations (school_id, category_id);

-- ---------------------------------------------------------------------------
-- 3. Solicitudes de inscripción
-- ---------------------------------------------------------------------------
create table if not exists public.enrollment_applications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  invitation_id uuid not null unique references public.enrollment_invitations(id),
  category_id uuid not null references public.categories(id),
  original_category_id uuid references public.categories(id),
  status text not null default 'borrador'
    check (status in ('borrador', 'enviada', 'en_revision', 'aprobada', 'rechazada')),

  student_full_name text,
  student_birth_date date,
  student_curp text,
  student_phone text,
  student_address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_notes text,

  guardian_full_name text,
  guardian_relationship text,
  guardian_email text,
  guardian_phone text,
  guardian_address text,
  guardian_user_id uuid references public.users(id),

  submitted_at timestamptz,
  submitted_ip inet,
  submitted_user_agent text,
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  student_id uuid references public.students(id),
  category_mismatch boolean not null default false,
  reopen_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enrollment_applications_school_status_idx
  on public.enrollment_applications (school_id, status, created_at desc);

create index if not exists enrollment_applications_category_idx
  on public.enrollment_applications (school_id, category_id);

create index if not exists enrollment_applications_student_idx
  on public.enrollment_applications (student_id)
  where student_id is not null;

-- ---------------------------------------------------------------------------
-- 4. Consentimientos firmados
-- ---------------------------------------------------------------------------
create table if not exists public.enrollment_consents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  application_id uuid unique references public.enrollment_applications(id),
  student_id uuid references public.students(id),
  guardian_name text not null,
  guardian_relationship text,
  consent_version text not null,
  text_hash text not null,
  accepted_data boolean not null default false,
  accepted_participation boolean not null default false,
  accepted_medical boolean not null default false,
  accepted_image boolean not null default false,
  accepted_at timestamptz not null default now(),
  ip inet,
  user_agent text,
  pdf_path text,
  captured_by uuid references public.users(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint enrollment_consents_one_owner check (
    (application_id is not null and student_id is null)
    or (application_id is null and student_id is not null)
  )
);

create index if not exists enrollment_consents_student_idx
  on public.enrollment_consents (student_id)
  where student_id is not null;

create unique index if not exists enrollment_consents_one_active_student_idx
  on public.enrollment_consents (student_id)
  where student_id is not null and revoked_at is null;

-- ---------------------------------------------------------------------------
-- 5. Documentos del expediente
-- ---------------------------------------------------------------------------
create table if not exists public.enrollment_documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  application_id uuid references public.enrollment_applications(id),
  student_id uuid references public.students(id),
  owner_type text not null check (owner_type in ('alumno', 'tutor')),
  doc_type text not null,
  file_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  file_hash text,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'validado', 'rechazado', 'vencido')),
  expires_at date,
  uploaded_by uuid references public.users(id),
  uploaded_at timestamptz not null default now(),
  verified_by uuid references public.users(id),
  verified_at timestamptz,
  rejection_reason text,
  reused_from uuid references public.enrollment_documents(id),
  created_at timestamptz not null default now(),
  constraint enrollment_documents_one_owner check (
    (application_id is not null and student_id is null)
    or (application_id is null and student_id is not null)
  )
);

create index if not exists enrollment_documents_application_idx
  on public.enrollment_documents (application_id)
  where application_id is not null;

create index if not exists enrollment_documents_student_idx
  on public.enrollment_documents (student_id)
  where student_id is not null;

create unique index if not exists enrollment_documents_app_type_unique
  on public.enrollment_documents (application_id, owner_type, doc_type)
  where application_id is not null;

create unique index if not exists enrollment_documents_student_type_unique
  on public.enrollment_documents (student_id, owner_type, doc_type)
  where student_id is not null;

-- ---------------------------------------------------------------------------
-- 6. Bitácora de accesos y acciones
-- ---------------------------------------------------------------------------
create table if not exists public.enrollment_access_log (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  invitation_id uuid references public.enrollment_invitations(id),
  user_id uuid references public.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  ip inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists enrollment_access_log_school_idx
  on public.enrollment_access_log (school_id, created_at desc);

create index if not exists enrollment_access_log_entity_idx
  on public.enrollment_access_log (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- 7. Campos nuevos en students
-- ---------------------------------------------------------------------------
alter table public.students
  add column if not exists curp text;

alter table public.students
  add column if not exists guardian_relationship text;

create index if not exists students_school_curp_idx
  on public.students (school_id, curp)
  where curp is not null;

-- ---------------------------------------------------------------------------
-- 8. Vista de estado del expediente
-- ---------------------------------------------------------------------------
-- No se guarda un estado redundante en students: se calcula desde el
-- consentimiento y los siete documentos obligatorios. Un expediente incompleto
-- NUNCA bloquea al alumno; solo bloquea el paquete de liga.
create or replace view public.student_expediente_status as
with requeridos(doc_type) as (
  values
    ('acta_nacimiento'),
    ('curp'),
    ('identificacion_tutor_frente'),
    ('identificacion_tutor_reverso'),
    ('comprobante_domicilio'),
    ('certificado_medico'),
    ('foto_alumno')
)
select
  s.id as student_id,
  s.school_id,
  case
    when s.parent_id is null then 'sin_tutor'
    when not exists (
      select 1 from public.enrollment_consents c
      where c.student_id = s.id and c.revoked_at is null
    ) then 'incompleto'
    when (
      select count(distinct d.doc_type)
      from public.enrollment_documents d
      join requeridos r on r.doc_type = d.doc_type
      where d.student_id = s.id
        and d.status in ('validado', 'pendiente')
        and (d.expires_at is null or d.expires_at >= current_date)
    ) < 7 then 'incompleto'
    when (
      select count(distinct d.doc_type)
      from public.enrollment_documents d
      join requeridos r on r.doc_type = d.doc_type
      where d.student_id = s.id
        and d.status = 'validado'
        and (d.expires_at is null or d.expires_at >= current_date)
    ) = 7 then 'completo'
    else 'en_revision'
  end as status,
  exists (
    select 1 from public.enrollment_consents c
    where c.student_id = s.id and c.revoked_at is null
  ) as has_consent,
  (
    select count(distinct d.doc_type)
    from public.enrollment_documents d
    join requeridos r on r.doc_type = d.doc_type
    where d.student_id = s.id
      and d.status in ('validado', 'pendiente')
      and (d.expires_at is null or d.expires_at >= current_date)
  )::int as present_documents,
  (
    select count(distinct d.doc_type)
    from public.enrollment_documents d
    join requeridos r on r.doc_type = d.doc_type
    where d.student_id = s.id
      and d.status = 'validado'
      and (d.expires_at is null or d.expires_at >= current_date)
  )::int as validated_documents,
  (
    select coalesce(array_agg(r.doc_type), array[]::text[])
    from requeridos r
    where not exists (
      select 1 from public.enrollment_documents d
      where d.student_id = s.id
        and d.doc_type = r.doc_type
        and d.status = 'validado'
        and (d.expires_at is null or d.expires_at >= current_date)
    )
  ) as missing_documents
from public.students s;

-- ---------------------------------------------------------------------------
-- 9. Bucket privado de documentos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'enrollment-documents',
  'enrollment-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 10. RLS: ningún cliente lee estas tablas directamente
-- ---------------------------------------------------------------------------
-- Todo el acceso pasa por /api (service role). Sin políticas a propósito, igual
-- que las tablas del chat. La página pública usa el backend, no PostgREST.
alter table if exists public.consent_templates enable row level security;
alter table if exists public.enrollment_invitations enable row level security;
alter table if exists public.enrollment_applications enable row level security;
alter table if exists public.enrollment_consents enable row level security;
alter table if exists public.enrollment_documents enable row level security;
alter table if exists public.enrollment_access_log enable row level security;

-- ---------------------------------------------------------------------------
-- 11. Plantilla global inicial
-- ---------------------------------------------------------------------------
-- Borrador operativo. La revisión legal puede sustituirlo creando una versión
-- nueva y desactivando esta; los consentimientos ya firmados guardan versión y
-- hash del texto exacto que se mostró.
insert into public.consent_templates (school_id, version, body_md, active)
select
  null,
  '2026-10-v1',
  $consent$
# Consentimiento informado para la inscripción de un menor

Yo, la persona tutora que firma al final de este documento, declaro que soy
madre, padre o tutor legal del alumno o alumna cuyos datos se capturan en este
formulario, y que tengo facultades para otorgar las autorizaciones que aquí se
describen.

## 1. Tratamiento de datos personales del menor

Autorizo a la academia a recabar, conservar y tratar los datos personales del
menor (nombre, fecha de nacimiento, CURP, domicilio, teléfono, contactos de
emergencia, información médica y documentos de identidad) con la única finalidad
de gestionar su inscripción, asistencia, seguridad y participación deportiva.

Los datos no se venderán ni se compartirán con terceros ajenos a la academia,
salvo obligación legal o requerimiento de la autoridad competente.

## 2. Participación en entrenamientos, partidos y traslados

Autorizo la participación del menor en entrenamientos, partidos, torneos y
actividades organizadas por la academia, así como en los traslados que la
academia organice para asistir a dichas actividades.

## 3. Atención médica de urgencia

Autorizo a la academia a solicitar atención médica de urgencia para el menor
cuando no sea posible localizar a la persona tutora, y a compartir con el personal
médico la información relevante del expediente.

## 4. Uso de imagen (opcional)

Autorizo el uso de fotografías y videos del menor en materiales informativos y
redes sociales de la academia. Esta autorización es opcional y puede revocarse en
cualquier momento sin afectar la inscripción ni la participación deportiva.

## 5. Conservación y derechos

La academia conservará el expediente mientras dure la relación deportiva y el
plazo legal aplicable. La persona tutora puede solicitar acceso, corrección o
eliminación de los datos del menor contactando a la academia.

## 6. Declaración

Declaro que la información y los documentos que entrego son verdaderos y que
cuento con la autoridad legal para firmar este consentimiento. Entiendo que este
registro electrónico (casillas, nombre escrito, fecha, dirección IP y dispositivo)
tiene valor de constancia y no constituye una firma electrónica certificada.
$consent$,
  true
where not exists (
  select 1 from public.consent_templates
  where school_id is null and active = true
);
