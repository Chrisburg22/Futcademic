import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useGetMyChildren = () =>
  useQuery({
    queryKey: ['students', 'my-children'],
    queryFn: async () => (await api.get('/students?parent_id=me')).data,
  });

export const useGetStudents = (categoryId?: string) =>
  useQuery({
    queryKey: ['students', categoryId],
    queryFn: async () => {
      const url = categoryId ? `/students?category_id=${categoryId}` : '/students';
      return (await api.get(url)).data;
    },
  });

export const useCreateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      category_id: string;
      full_name: string;
      birth_date: string;
      email: string;
      parent_id?: string | null;
      curp?: string | null;
      guardian_relationship?: string | null;
      phone?: string | null;
      address?: string | null;
      emergency_contact_name?: string | null;
      emergency_contact_phone?: string | null;
      medical_notes?: string | null;
    }) => (await api.post('/students', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
};

export const useGetStudentDetails = (studentId?: string) =>
  useQuery({
    queryKey: ['students', 'details', studentId],
    queryFn: async () => (await api.get(`/students/${studentId}`)).data,
    enabled: !!studentId,
  });

export interface UpdateStudentDTO {
  id: string;
  /** El controlador lee `fullName`; se manda junto con `full_name`. */
  fullName?: string;
  full_name?: string;
  birth_date?: string;
  category_id?: string | null;
  parent_id?: string | null;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  avatar_url?: string;
}

export const useUpdateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateStudentDTO) =>
      (await api.put(`/students/${id}`, payload)).data,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['students', 'details', variables.id] });
    },
  });
};

export const useUpdateUniform = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; uniform_delivered: boolean }) =>
      (
        await api.patch(`/students/${payload.id}/uniform`, {
          uniform_delivered: payload.uniform_delivered,
        })
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
};

export const useUpdateStudentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      status: 'activo' | 'pendiente_pago' | 'inactivo' | 'becado';
    }) => (await api.patch(`/students/${payload.id}/status`, { status: payload.status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
};

export type AccionMasiva =
  | { tipo: 'status'; status: 'activo' | 'pendiente_pago' | 'inactivo' | 'becado' }
  | { tipo: 'uniform'; entregado: boolean }
  | { tipo: 'category'; category_id: string };

/**
 * No hay endpoint masivo: se lanza una petición por alumno y se informa de
 * cuántas funcionaron, para que un fallo aislado no deje todo a medias sin
 * avisar.
 */
export const useBulkUpdateStudents = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, accion }: { ids: string[]; accion: AccionMasiva }) => {
      const ejecutar = (id: string) => {
        if (accion.tipo === 'status') return api.patch(`/students/${id}/status`, { status: accion.status });
        if (accion.tipo === 'uniform') {
          return api.patch(`/students/${id}/uniform`, { uniform_delivered: accion.entregado });
        }
        return api.put(`/students/${id}`, { category_id: accion.category_id });
      };
      const resultados = await Promise.allSettled(ids.map(ejecutar));
      const fallidos = ids.filter((_, i) => resultados[i].status === 'rejected');
      return { total: ids.length, correctos: ids.length - fallidos.length, fallidos };
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
};

export const useDeleteStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/students/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
};

export const useGetStudentStats = (studentId?: string) =>
  useQuery({
    queryKey: ['students', 'stats', studentId],
    queryFn: async () => (await api.get(`/students/${studentId}/stats`)).data,
    enabled: !!studentId,
  });

export const useGetStudentTeam = (studentId?: string) =>
  useQuery({
    queryKey: ['students', 'team', studentId],
    queryFn: async () => (await api.get(`/students/${studentId}/team`)).data,
    enabled: !!studentId,
  });

export const useGetDeletedStudents = () =>
  useQuery({
    queryKey: ['students', 'deleted'],
    queryFn: async () => (await api.get('/students/deleted')).data,
  });
