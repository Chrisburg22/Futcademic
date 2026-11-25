import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';

/**
 * Consola de plataforma. Namespace de caché propio (`['platform', …]`) para que
 * nada de aquí se mezcle con las consultas de una academia.
 */
export type EstadoEscuela = 'activa' | 'suspendida' | 'archivada';

export type EscuelaFila = {
  id: string;
  name: string;
  status: EstadoEscuela;
  created_at: string | null;
  logo_url: string | null;
  contacto_email: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  students: number;
  students_activos: number;
  users: number;
  categories: number;
  last_activity_at: string | null;
  dias_sin_actividad: number | null;
};

export type ResumenPlataforma = {
  schools: { total: number; activas: number; suspendidas: number; archivadas: number; nuevas_30d: number };
  usage: {
    alumnos: number;
    alumnos_activos: number;
    usuarios: number;
    por_rol: Record<string, number>;
    categorias: number;
  };
  activity: { asistencias_7d: number; pagos_registrados_mes: number; monto_registrado_mes: number };
  atencion: {
    sin_actividad_14d: EscuelaFila[];
    sin_alumnos: EscuelaFila[];
    suspendidas: EscuelaFila[];
  };
  generado_en: string;
};

export type FichaEscuela = EscuelaFila & {
  razon_social: string | null;
  direccion: string | null;
  internal_notes: string | null;
  venues: number;
  por_rol: Record<string, number>;
  marcas_total: number;
  pagos_total: number;
  monto_total: number;
  actividad: { fecha: string; marcas: number; altas: number }[];
  bitacora: LineaBitacora[];
};

export type LineaBitacora = {
  id: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  school_id?: string | null;
  payload: Record<string, any> | null;
  ip?: string | null;
  created_at: string;
  actor?: { full_name: string | null } | null;
  school?: { name: string | null } | null;
};

export type UsuarioPlataforma = {
  id: string;
  full_name: string | null;
  role: string;
  school_id: string | null;
  created_at: string | null;
  onboarded_at: string | null;
  must_change_password: boolean | null;
  school?: { name: string | null; status: string | null } | null;
};

export const useOverview = () =>
  useQuery({
    queryKey: ['platform', 'overview'],
    queryFn: async () => (await api.get('/platform/overview')).data as ResumenPlataforma,
  });

export const useEscuelas = (filtros: { q?: string; status?: string; orden?: string } = {}) =>
  useQuery({
    queryKey: ['platform', 'schools', filtros],
    queryFn: async () =>
      (await api.get('/platform/schools', { params: filtros })).data as EscuelaFila[],
  });

export const useEscuela = (id: string) =>
  useQuery({
    queryKey: ['platform', 'school', id],
    queryFn: async () => (await api.get(`/platform/schools/${id}`)).data as FichaEscuela,
    enabled: Boolean(id),
  });

export const useUsuariosPlataforma = (filtros: { q?: string; role?: string } = {}) =>
  useQuery({
    queryKey: ['platform', 'users', filtros],
    queryFn: async () =>
      (await api.get('/platform/users', { params: filtros })).data as UsuarioPlataforma[],
    // Sin texto el listado son los últimos 50 usuarios, que también sirve.
    staleTime: 30_000,
  });

export const useBitacora = (filtros: { action?: string; school_id?: string } = {}) =>
  useQuery({
    queryKey: ['platform', 'audit', filtros],
    queryFn: async () => (await api.get('/platform/audit', { params: filtros })).data as LineaBitacora[],
  });

/** Invalida todo lo de plataforma: los conteos del resumen cambian con cada acción. */
const invalidarTodo = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ['platform'] });

export const useEditarEscuela = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...parche }: { id: string } & Partial<Record<string, string | null>>) =>
      (await api.patch(`/platform/schools/${id}`, parche)).data,
    onSuccess: () => invalidarTodo(qc),
  });
};

export const useSuspenderEscuela = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      (await api.post(`/platform/schools/${id}/suspend`, { reason })).data,
    onSuccess: () => invalidarTodo(qc),
  });
};

export const useReactivarEscuela = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) =>
      (await api.post(`/platform/schools/${id}/reactivate`)).data,
    onSuccess: () => invalidarTodo(qc),
  });
};

/** Etiquetas de la bitácora: el `action` crudo no se muestra al usuario. */
export const ETIQUETA_ACCION: Record<string, string> = {
  'school.update': 'Editó la academia',
  'school.suspend': 'Suspendió la academia',
  'school.reactivate': 'Reactivó la academia',
  'user.password_reset': 'Envió recuperación de contraseña',
};
