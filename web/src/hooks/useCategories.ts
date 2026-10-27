import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/axios';
import type {
  Category,
  CategoryDetail,
  CategoryFilters,
  CategoryStatus,
} from '../types';

export const categoryKeys = {
  all: ['categories'] as const,
  mine: ['categories', 'mine'] as const,
  list: (filters: CategoryFilters = {}) => ['categories', 'list', filters] as const,
  detail: (id?: string) => ['categories', 'detail', id] as const,
};

export interface CategoryPayload {
  name: string;
  status?: CategoryStatus;
  /** Etiqueta de la generación: un año, un rango o un grupo. */
  birth_year: string;
  description?: string | null;
  color?: string | null;
  monthly_fee?: number | null;
  max_students?: number | null;
  /** El backend espera la lista; un `teacher_id` suelto se descarta. */
  teacher_ids?: string[];
}

export const useGetMyCategories = (enabled = true) =>
  useQuery({
    queryKey: categoryKeys.mine,
    queryFn: async () => (await api.get('/categories/mine')).data as Category[],
    enabled,
  });

/**
 * Lista sin paginar. La usan los selectores de otras pantallas (alumnos,
 * agenda, asistencias), así que sigue devolviendo el array tal cual.
 */
export const useGetCategories = (enabled = true) =>
  useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => (await api.get('/categories')).data as Category[],
    enabled,
  });

/** Lista del módulo: filtros, orden y paginación. El total viaja en la cabecera. */
export const useGetCategoriesPaged = (filters: CategoryFilters = {}, enabled = true) =>
  useQuery({
    queryKey: categoryKeys.list(filters),
    enabled,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.birth_year) params.set('birth_year', String(filters.birth_year));
      if (filters.teacher_id) params.set('teacher_id', filters.teacher_id);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.order) params.set('order', filters.order);
      params.set('page', String(filters.page || 1));
      params.set('per_page', String(filters.per_page || 25));

      const res = await api.get(`/categories?${params.toString()}`);
      const items = (res.data || []) as Category[];
      // Si CORS no expone X-Total-Count, al menos no dejamos la tabla en blanco.
      const total = Number(res.headers?.['x-total-count']);
      return { items, total: Number.isFinite(total) ? total : items.length };
    },
    placeholderData: keepPreviousData,
  });

export const useGetCategory = (id?: string) =>
  useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: async () => (await api.get(`/categories/${id}`)).data as CategoryDetail,
    enabled: !!id,
  });

const invalidarCategorias = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: categoryKeys.all });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoryPayload) =>
      (await api.post('/categories', payload)).data,
    onSuccess: () => invalidarCategorias(qc),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CategoryPayload> & { id: string }) =>
      (await api.patch(`/categories/${id}`, payload)).data,
    onSuccess: (_, variables) => {
      invalidarCategorias(qc);
      qc.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
    },
  });
};

/** Crea la categoría y, si se le pasa horario, genera los entrenamientos. */
export const useCreateFullCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: CategoryPayload & {
        /** Números 0-6, con 0 = domingo. */
        days?: number[];
        start_time?: string;
        venue_id?: string | null;
        duration_minutes?: number;
        recurrence_weeks?: number;
      },
    ) => (await api.post('/categories/full', payload)).data,
    onSuccess: () => {
      invalidarCategorias(qc);
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateCategoryStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; status: CategoryStatus }) =>
      (await api.patch(`/categories/${payload.id}/status`, { status: payload.status })).data,
    onSuccess: (_, variables) => {
      invalidarCategorias(qc);
      qc.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useAssignTeacher = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { categoryId: string; teacher_id: string }) =>
      (
        await api.post(`/categories/${payload.categoryId}/teachers`, {
          teacher_id: payload.teacher_id,
        })
      ).data,
    onSuccess: (_, variables) => {
      invalidarCategorias(qc);
      qc.invalidateQueries({ queryKey: categoryKeys.detail(variables.categoryId) });
    },
  });
};

export const useUnassignTeacher = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { categoryId: string; teacherId: string }) =>
      (await api.delete(`/categories/${payload.categoryId}/teachers/${payload.teacherId}`)).data,
    onSuccess: (_, variables) => {
      invalidarCategorias(qc);
      qc.invalidateQueries({ queryKey: categoryKeys.detail(variables.categoryId) });
    },
  });
};
