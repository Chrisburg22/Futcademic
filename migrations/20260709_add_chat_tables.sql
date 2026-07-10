-- Chat IA para admins: conversaciones y mensajes
-- Aplicar sobre el schema base (schema.sql + migraciones previas)

create table if not exists chat_conversations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  title text,
  status text not null default 'active', -- 'active' | 'awaiting_confirmation'
  pending_state jsonb,                   -- estado del loop pausado esperando confirmación
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  role text not null,    -- 'user' | 'assistant'
  content jsonb not null, -- content blocks exactos de Anthropic (text, tool_use, tool_result, thinking)
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_conversations_school
  on chat_conversations(school_id, user_id, updated_at desc);

create index if not exists idx_chat_messages_conversation
  on chat_messages(conversation_id, created_at);
