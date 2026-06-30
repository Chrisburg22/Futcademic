import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import type { TeacherPermissions } from '../types';

/** Logged-in teacher's own permissions (for UI gating). */
export const useGetMyPermissions = (enabled = true) =>
  useQuery({
    queryKey: ['permissions', 'mine'],
    queryFn: async () => (await api.get('/permissions/mine')).data as TeacherPermissions,
    enabled,
  });

/** A specific teacher's permissions (admin view). */
export const useGetTeacherPermissions = (teacherId?: string) =>
  useQuery({
    queryKey: ['permissions', teacherId],
    queryFn: async () => (await api.get(`/permissions/${teacherId}`)).data as TeacherPermissions,
    enabled: !!teacherId,
  });

export const useUpdateTeacherPermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<TeacherPermissions> & { id: string }) =>
      (await api.put(`/permissions/${id}`, payload)).data,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['permissions', variables.id] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
