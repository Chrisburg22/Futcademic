-- M1 de docs/product/PLAN-INTEGRACION-MINERIA.md
--
-- Guarda lo que el modelo predijo para poder medirlo contra lo que pasó. Sin
-- esta tabla, el modelo es un acto de fe: en dos meses no habría forma de decir
-- si la banda `alto` falta más que el promedio de la academia.
--
-- El modelo NO vive aquí: vive en backend/api/services/risk/model.json,
-- versionado en git, revisable en un diff y revertible. Una tabla de pesos
-- sería un modelo que nadie puede leer.

CREATE TABLE IF NOT EXISTS public.risk_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  training_id uuid NOT NULL,
  risk numeric NOT NULL,
  band character varying NOT NULL,
  features jsonb NOT NULL,
  model_version character varying NOT NULL,
  -- Se llena cuando se pasa lista de esa sesión.
  actual_present boolean,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT risk_predictions_pkey PRIMARY KEY (id),
  CONSTRAINT risk_predictions_school_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT risk_predictions_student_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT risk_predictions_training_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id),
  CONSTRAINT risk_predictions_band_check
    CHECK (band::text = ANY (ARRAY['bajo'::character varying,
                                   'medio'::character varying,
                                   'alto'::character varying]::text[]))
);

-- Una predicción por alumno, sesión y versión del modelo: abrir dos veces la
-- lista de riesgo no debe duplicar filas, pero reentrenar sí debe poder
-- compararse con la versión anterior.
CREATE UNIQUE INDEX IF NOT EXISTS risk_predictions_uniq
  ON public.risk_predictions (student_id, training_id, model_version);

CREATE INDEX IF NOT EXISTS risk_predictions_school_created_idx
  ON public.risk_predictions (school_id, created_at DESC);
