-- MIGRACIÓN: Módulo Categorías (ciclo de vida, rango de años, aforo)
-- Fecha: 2026-10-26

-- 1. Columnas nuevas
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS birth_year_end integer,
  ADD COLUMN IF NOT EXISTS status character varying NOT NULL DEFAULT 'activa',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS max_students integer,
  ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. Backfill de categorías anteriores a la migración
UPDATE public.categories SET status = 'activa' WHERE status IS NULL;
UPDATE public.categories SET updated_at = created_at WHERE updated_at IS NULL;

-- 3. Restricciones (idempotentes: ALTER TABLE ... ADD CONSTRAINT no admite IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_status_check'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_status_check
      CHECK (status IN ('activa', 'inactiva', 'archivada'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_birth_year_range_check'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_birth_year_range_check
      CHECK (birth_year_end IS NULL OR birth_year_end >= birth_year);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_max_students_check'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_max_students_check
      CHECK (max_students IS NULL OR max_students > 0);
  END IF;
END $$;

-- 4. Índices de listado y unicidad de nombre por escuela
CREATE INDEX IF NOT EXISTS categories_school_status_idx
  ON public.categories (school_id, status);

CREATE INDEX IF NOT EXISTS categories_school_birth_year_idx
  ON public.categories (school_id, birth_year DESC);

-- Dos categorías vivas no pueden compartir nombre dentro de la misma escuela.
-- Las archivadas quedan fuera para poder reutilizar el nombre en una temporada nueva.
--
-- Si la base ya tiene nombres duplicados el índice no se puede crear; en ese
-- caso la migración avisa y sigue, y la unicidad queda cubierta por la
-- validación del controlador (409). Para ver los duplicados antes de migrar:
--   SELECT school_id, lower(name), count(*) FROM public.categories
--   WHERE status <> 'archivada' GROUP BY 1, 2 HAVING count(*) > 1;
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS categories_school_name_uniq
    ON public.categories (school_id, lower(name))
    WHERE status <> 'archivada';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'categories_school_name_uniq omitido: hay nombres duplicados por escuela.';
END $$;

-- 6. Asignación profesor-categoría idempotente
-- Quita pares repetidos (se queda el más antiguo) y evita que vuelvan a entrar,
-- para que `assignTeacher` pueda hacer upsert en lugar de fallar con un error
-- genérico cuando el profesor ya estaba asignado.
DELETE FROM public.category_teachers ct
USING public.category_teachers mas_antiguo
WHERE ct.category_id = mas_antiguo.category_id
  AND ct.teacher_id = mas_antiguo.teacher_id
  AND ct.created_at > mas_antiguo.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS category_teachers_pair_uniq
  ON public.category_teachers (category_id, teacher_id);

CREATE INDEX IF NOT EXISTS category_teachers_category_idx
  ON public.category_teachers (category_id);

-- 7. Comentarios de ayuda
COMMENT ON COLUMN public.categories.birth_year IS 'Año de nacimiento ancla de la categoría; se usa para ordenar el listado.';
COMMENT ON COLUMN public.categories.birth_year_end IS 'Año final cuando la categoría agrupa varias generaciones (2015-2016). NULL si es un solo año.';
COMMENT ON COLUMN public.categories.status IS 'Ciclo de vida: activa | inactiva | archivada. No se borran categorías con historial, se archivan.';
COMMENT ON COLUMN public.categories.description IS 'Nota breve visible en el listado y el detalle.';
COMMENT ON COLUMN public.categories.max_students IS 'Aforo máximo de alumnos; NULL = sin límite.';
COMMENT ON COLUMN public.categories.archived_at IS 'Momento en que se archivó; se limpia al restaurar.';
