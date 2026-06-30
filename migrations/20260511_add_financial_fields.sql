-- MIGRACIÓN: Campos financieros para Pagos Pendientes
-- Fecha: 2026-05-11

-- 1. Añadir cuota mensual a las categorías
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC DEFAULT 0;

-- 2. Añadir año de pago a la tabla de pagos
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_year INTEGER DEFAULT extract(year from now());

-- 3. Poblar el año en registros existentes
UPDATE public.payments 
SET payment_year = extract(year from created_at) 
WHERE payment_year IS NULL;

-- 4. Comentarios de ayuda
COMMENT ON COLUMN public.categories.monthly_fee IS 'Costo mensual de la categoría para el cálculo de deudas.';
COMMENT ON COLUMN public.payments.payment_year IS 'Año al que corresponde el pago, independiente de la fecha de transacción.';
