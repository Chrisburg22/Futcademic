-- M0 de docs/product/PLAN-INTEGRACION-MINERIA.md
--
-- Índice que las variables del modelo de riesgo necesitan: todas se calculan
-- recorriendo las marcas de un alumno en orden de fecha. Sirve también al
-- histórico de asistencias de la ficha, que hoy hace el mismo recorrido.
--
-- Las validaciones de fecha futura y de fecha de nacimiento viven en el backend
-- (api/services/validation.ts): dependen de la fecha de hoy y un CHECK de
-- Postgres solo admite expresiones inmutables.

CREATE INDEX IF NOT EXISTS attendances_student_date_idx
  ON public.attendances (student_id, date);
