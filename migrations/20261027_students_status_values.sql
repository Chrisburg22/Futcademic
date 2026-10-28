-- MIGRACIÓN: alinear students.status con lo que escribe la aplicación
-- Fecha: 2026-10-27
--
-- `schema.sql` declaraba un CHECK con `beca` y `pendiente`, pero el backend
-- (PATCH /students/:id/status) y la web escriben `becado` y `pendiente_pago`.
-- La base de producción nunca tuvo ese CHECK (hoy solo hay `activo` e
-- `inactivo`), así que las escrituras funcionan y nada validaba el valor.
--
-- Esta migración normaliza los valores antiguos y deja un CHECK que sí
-- coincide con el código. Es idempotente.
--
-- ORDEN: aplicar DESPUÉS de desplegar el backend con el fix de
-- getPendingPayments (acepta `pendiente_pago` además de `pendiente`).

UPDATE public.students SET status = 'becado' WHERE status = 'beca';
UPDATE public.students SET status = 'pendiente_pago' WHERE status = 'pendiente';

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE public.students
  ADD CONSTRAINT students_status_check
  CHECK (status::text = ANY (ARRAY['activo', 'pendiente_pago', 'becado', 'inactivo']::text[]));
