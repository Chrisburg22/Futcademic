-- MIGRACIÓN: quitar categories.birth_year_end
-- Fecha: 2026-10-27
--
-- `birth_year_end` se creó pensando que `birth_year` era un entero y que un
-- rango necesitaba dos columnas. En la base real `birth_year` es `text` y ya
-- guarda la etiqueta completa ("2014-2015", "2012-2013-2014", "Porteros"), así
-- que la columna sobra: nunca llegó a tener datos.
--
-- APLICAR SOLO DESPUÉS de desplegar el backend que deja de pedirla en el
-- SELECT de categorías; si se adelanta, el listado falla con columna
-- inexistente.

ALTER TABLE public.categories DROP COLUMN IF EXISTS birth_year_end;
