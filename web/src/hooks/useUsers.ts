import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useGetUsers = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
  });

export const useGetTeachers = () =>
  useQuery({
    queryKey: ['users', 'profesor'],
    queryFn: async () => (await api.get('/users?role=profesor')).data,
  });

export const useGetTeacherDetails = (teacherId?: string) =>
  useQuery({
    queryKey: ['users', 'teacher-details', teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      return (await api.get(`/users/teachers/${teacherId}`)).data;
    },
    enabled: !!teacherId,
  });

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) =>
      (await api.put(`/users/${id}`, payload)).data,
    onSuccess: (_, variables: any) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', 'teacher-details', variables.id] });
    },
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: async (newPassword: string) =>
      (await api.patch('/users/me/password', { newPassword })).data,
  });

export const useInviteParent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; fullName: string; phone?: string }) =>
      (await api.post('/auth/invite-parent', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useInviteTeacher = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      fullName: string;
      phone?: string;
      categoryIds?: string[];
      permissions?: Record<string, boolean>;
    }) => (await api.post('/auth/invite-teacher', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useInviteAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; fullName: string }) =>
      (await api.post('/auth/invite-admin', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};
