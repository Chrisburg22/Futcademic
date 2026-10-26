-- Fase 0 del asistente IA: confianza + datos para el modelo propio.
--
-- chat_feedback    -> señal humana (👍/👎 + motivo) sobre respuestas del asistente.
-- chat_tool_calls  -> traza estructurada de cada herramienta ejecutada (entrada,
--                     resultado, latencia y si fue una acción sensible confirmada).
--
-- Ambas tablas son la materia prima para construir el set de evaluación y, más
-- adelante, el dataset de fine-tuning. Aplicar sobre schema.sql + migraciones
-- anteriores.

create table if not exists chat_feedback (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  message_id uuid not null references chat_messages(id) on delete cascade,
  rating text not null check (rating in ('up', 'down')),
  reason text,          -- motivo del 👎: 'datos_incorrectos', 'no_era_eso', ...
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un voto por mensaje y usuario: cambiar de opinión actualiza, no duplica.
  unique (message_id, user_id)
);

create index if not exists idx_chat_feedback_school
  on chat_feedback(school_id, created_at desc);

create index if not exists idx_chat_feedback_conversation
  on chat_feedback(conversation_id);

create table if not exists chat_tool_calls (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  tool_name text not null,
  input jsonb not null default '{}'::jsonb,
  ok boolean not null,
  is_sensitive boolean not null default false,
  -- null = no requería confirmación; true = aprobada; false = cancelada.
  confirmed boolean,
  duration_ms integer,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_tool_calls_school
  on chat_tool_calls(school_id, created_at desc);

create index if not exists idx_chat_tool_calls_conversation
  on chat_tool_calls(conversation_id, created_at);
