-- Contexto de pantalla por mensaje.
--
-- Cuando el admin escribe desde la ficha de un alumno o desde finanzas con
-- filtros, ese contexto viaja con el mensaje y hace que "este alumno" o "este
-- mes" se resuelvan sin repetir lo que ya está en pantalla.
--
-- Se guarda junto al mensaje para que el exportador del dataset pueda entrenar
-- y evaluar con el mismo contexto que vio el modelo. Es opcional: los mensajes
-- antiguos y los turnos sin contexto quedan en NULL.

alter table if exists chat_messages add column if not exists context jsonb;

comment on column chat_messages.context is
  'Contexto de pantalla saneado que acompañó al mensaje del usuario (pantalla, registro en foco y filtros).';
