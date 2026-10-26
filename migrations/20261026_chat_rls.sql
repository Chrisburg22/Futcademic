-- Cierra la exposición pública de las tablas del chat.
--
-- PostgREST expone el schema `public` con la clave anon, que viaja en el
-- cliente web. Sin RLS, cualquiera con esa clave podía leer conversaciones,
-- mensajes, feedback y trazas de herramientas. El backend usa la service role
-- key, que ignora RLS, así que activarlo no cambia el comportamiento de la API.
--
-- No se añaden políticas a propósito: ningún cliente debe leer estas tablas
-- directamente; todo el acceso pasa por /api/chat (requireAuth + requireTenant
-- + requireRole).

alter table if exists chat_conversations enable row level security;
alter table if exists chat_messages enable row level security;
alter table if exists chat_feedback enable row level security;
alter table if exists chat_tool_calls enable row level security;
