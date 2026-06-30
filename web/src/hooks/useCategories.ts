import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useGetMyCategories = (enabled = true) =>
  useQuery({
    queryKey: ['categories', 'mine'],
    queryFn: async () => (await api.get('/categories/mine')).data,
    enabled,
  });

export const useGetCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      birth_year: number | string;
      teacher_id?: string;
    }) => (await api.post('/categories', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      name: string;
      birth_year: number | string;
      teacher_id?: string | null;
    }) => (await api.patch(`/categories/${payload.id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

/** Create a category with schedule (events + trainings generated server-side). */
export const useCreateFullCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      birth_year: number;
      color?: string;
      monthly_fee?: number;
      teacher_ids?: string[];
      days?: string[];
      start_time?: string;
      venue_id?: string | null;
      recurrence_weeks?: number;
    }) => (await api.post('/categories/full', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useAssignTeacher = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { categoryId: string; teacher_id: string }) =>
      (await api.post(`/categories/${payload.categoryId}/teachers`, {
        teacher_id: payload.teacher_id,
      })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};
