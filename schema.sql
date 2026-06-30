-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  icon character varying,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['racha'::character varying, 'asistencias'::character varying, 'goles'::character varying, 'puntualidad'::character varying, 'progreso'::character varying]::text[])),
  threshold integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id),
  CONSTRAINT achievements_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.attendances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  category_id uuid NOT NULL,
  teacher_id uuid,
  training_id uuid,
  date date NOT NULL,
  type character varying CHECK (type::text = ANY (ARRAY['entrenamiento'::character varying, 'partido'::character varying]::text[])),
  present boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendances_pkey PRIMARY KEY (id),
  CONSTRAINT attendances_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT attendances_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT attendances_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT attendances_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id),
  CONSTRAINT attendances_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  birth_year integer NOT NULL,
  name character varying NOT NULL,
  color character varying,
  monthly_fee numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.category_teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  category_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT category_teachers_pkey PRIMARY KEY (id),
  CONSTRAINT category_teachers_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT category_teachers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT category_teachers_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id)
);
CREATE TABLE public.deleted_students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  original_student_id uuid NOT NULL,
  full_name character varying NOT NULL,
  birth_date date NOT NULL,
  category_id uuid,
  parent_id uuid,
  deleted_at timestamp with time zone DEFAULT now(),
  deleted_by uuid,
  CONSTRAINT deleted_students_pkey PRIMARY KEY (id),
  CONSTRAINT deleted_students_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT deleted_students_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id)
);
CREATE TABLE public.event_exceptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  school_id uuid,
  event_id uuid,
  date date NOT NULL,
  is_cancelled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_exceptions_pkey PRIMARY KEY (id),
  CONSTRAINT event_exceptions_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT event_exceptions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  category_id uuid NOT NULL,
  venue_id uuid,
  date date NOT NULL,
  start_time time without time zone,
  type character varying CHECK (type::text = ANY (ARRAY['entrenamiento'::character varying, 'partido'::character varying]::text[])),
  description text,
  is_completed boolean DEFAULT false,
  is_recurring boolean DEFAULT false,
  recurring_weeks integer,
  recurring_end_date date,
  recurrence_rule jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT events_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title character varying NOT NULL,
  body text,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['pago_recibido'::character varying, 'sesion_recordatorio'::character varying, 'sesion_cancelada'::character varying, 'bienvenida'::character varying, 'logro_desbloqueado'::character varying]::text[])),
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.payment_students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_students_pkey PRIMARY KEY (id),
  CONSTRAINT payment_students_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id),
  CONSTRAINT payment_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_type character varying CHECK (payment_type::text = ANY (ARRAY['mensualidad'::character varying, 'pago_profesor'::character varying]::text[])),
  student_id uuid,
  teacher_id uuid,
  description text,
  payment_month integer,
  payment_year integer DEFAULT extract(year from now()),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT payments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id)
);
CREATE TABLE public.profile_information (
  id uuid NOT NULL,
  school_id uuid NOT NULL,
  phone character varying,
  address text,
  birth_date date,
  gender character varying,
  emergency_contact_name character varying,
  emergency_contact_phone character varying,
  medical_notes text,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_information_pkey PRIMARY KEY (id),
  CONSTRAINT profile_information_id_fkey FOREIGN KEY (id) REFERENCES public.users(id),
  CONSTRAINT profile_information_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  logo_url text,
  razon_social character varying,
  direccion text,
  contacto_email character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schools_pkey PRIMARY KEY (id)
);
CREATE TABLE public.student_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT student_achievements_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT student_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  category_id uuid NOT NULL,
  parent_id uuid,
  full_name character varying NOT NULL,
  birth_date date NOT NULL,
  status character varying DEFAULT 'activo'::character varying CHECK (status::text = ANY (ARRAY['activo'::character varying, 'beca'::character varying, 'pendiente'::character varying, 'inactivo'::character varying]::text[])),
  uniform_delivered boolean DEFAULT false,
  phone character varying,
  address text,
  emergency_contact_name character varying,
  emergency_contact_phone character varying,
  medical_notes text,
  avatar_url text,
  current_streak integer DEFAULT 0,
  max_streak integer DEFAULT 0,
  last_attendance_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT students_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT students_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id)
);
CREATE TABLE public.teacher_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  teacher_id uuid NOT NULL UNIQUE,
  can_manage_students boolean DEFAULT true,
  can_manage_events boolean DEFAULT true,
  can_view_finances boolean DEFAULT false,
  can_manage_payments boolean DEFAULT false,
  can_take_attendance boolean DEFAULT true,
  can_manage_categories boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teacher_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_permissions_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT teacher_permissions_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id)
);
CREATE TABLE public.trainings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid,
  event_id uuid,
  category_id uuid,
  venue_id uuid,
  date date NOT NULL,
  start_time time without time zone,
  type character varying CHECK (type::text = ANY (ARRAY['entrenamiento'::character varying, 'partido'::character varying]::text[])),
  is_completed boolean DEFAULT false,
  is_cancelled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT trainings_pkey PRIMARY KEY (id),
  CONSTRAINT trainings_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id),
  CONSTRAINT trainings_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT trainings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT trainings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  school_id uuid,
  role character varying CHECK (role::text = ANY (ARRAY['super_admin'::character varying, 'admin'::character varying, 'profesor'::character varying, 'padre'::character varying, 'alumno'::character varying]::text[])),
  full_name character varying NOT NULL,
  avatar_url text,
  must_change_password boolean NOT NULL DEFAULT false,
  push_token text,
  phone character varying,
  address text,
  apodo character varying,
  numero_favorito integer,
  posicion character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.venues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name character varying NOT NULL,
  address text,
  notes text,
  capacity integer,
  latitud numeric,
  longitud numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT venues_pkey PRIMARY KEY (id),
  CONSTRAINT venues_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);