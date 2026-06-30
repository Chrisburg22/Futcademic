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
