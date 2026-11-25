import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';

/**
 * Riesgo de falta a la siguiente sesión (Modelo A).
 *
 * Nunca se consulta para padre ni alumno: la API responde 403 y la UI no lo
 * ofrece. Ver docs/product/PLAN-INTEGRACION-MINERIA.md, §5.
 */
export type BandaRiesgo = 'bajo' | 'medio' | 'alto';
export type EstadoRiesgo = 'ok' | 'sin_historial' | 'inactivo';

export type MotivoRiesgo = { key: string; value: number; text: string };

export type RiesgoAlumno = {
  student_id: string;
  full_name?: string | null;
  status: EstadoRiesgo;
  risk: number | null;
  band: BandaRiesgo | null;
  reasons: MotivoRiesgo[];
  marcas: number;
  model_version: string;
};

export type RiesgoCategoria = {
  category_id: string;
  date: string;
  model_version: string;
  students: RiesgoAlumno[];
};

export type ResumenRiesgo = {
  fecha: string;
  total: number;
  por_banda: Record<BandaRiesgo, number>;
  sin_historial: number;
  inactivos: number;
  model_version: string;
};

export type ModeloRiesgo = {
  nombre: string;
  version: string;
  entrenado_con: {
    fuente?: string;
    filas?: number;
    alumnos?: number;
    corte_temporal?: string;
    tasa_falta?: number;
  };
  metricas: {
    auc_prueba: number;
    referencia_tasa_previa: number;
    precision_top25: number;
    recall_top25: number;
    lift_top25: number;
  };
  variables: string[];
  bandas: { medio: number; alto: number };
};

export const COLOR_BANDA: Record<BandaRiesgo, string> = {
  alto: 'red',
  medio: 'orange',
  bajo: 'gray',
};

export const useRiesgoCategoria = (
  categoryId: string | null,
  fecha: string,
  habilitado = true,
) =>
  useQuery({
    queryKey: ['risk', 'category', categoryId, fecha],
    queryFn: async () =>
      (await api.get(`/risk/category/${categoryId}`, { params: { date: fecha } }))
        .data as RiesgoCategoria,
    enabled: Boolean(categoryId) && habilitado,
  });

export const useRiesgoAlumno = (studentId: string | null, habilitado = true) =>
  useQuery({
    queryKey: ['risk', 'student', studentId],
    queryFn: async () =>
      (await api.get(`/risk/students/${studentId}`)).data as RiesgoAlumno & {
        historial: { date: string; present: boolean }[];
        date: string;
      },
    enabled: Boolean(studentId) && habilitado,
  });

export const useResumenRiesgo = (habilitado = true) =>
  useQuery({
    queryKey: ['risk', 'summary'],
    queryFn: async () => (await api.get('/risk/summary')).data as ResumenRiesgo,
    enabled: habilitado,
  });

export const useModeloRiesgo = (habilitado = true) =>
  useQuery({
    queryKey: ['risk', 'model'],
    queryFn: async () => (await api.get('/risk/model')).data as ModeloRiesgo,
    enabled: habilitado,
    staleTime: 60 * 60 * 1000,
  });
