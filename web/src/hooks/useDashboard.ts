import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import type { Role } from '../types';

export const useGetAdminDashboard = (enabled = true) =>
  useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => (await api.get('/dashboard/admin')).data,
    enabled,
  });

export const useGetProfesorDashboard = (enabled = true) =>
  useQuery({
    queryKey: ['dashboard', 'profesor'],
    queryFn: async () => (await api.get('/dashboard/profesor')).data,
    enabled,
  });

export const useGetPadreDashboard = (enabled = true) =>
  useQuery({
    queryKey: ['dashboard', 'padre'],
    queryFn: async () => (await api.get('/dashboard/padre')).data,
    enabled,
  });

export const useGetAlumnoDashboard = (enabled = true) =>
  useQuery({
    queryKey: ['dashboard', 'alumno'],
    queryFn: async () => (await api.get('/dashboard/alumno')).data,
    enabled,
  });

/** Convenience: fetch the dashboard matching the current role. */
export const useGetDashboard = (role?: Role) => {
  const map: Record<string, string> = {
    super_admin: '/dashboard/admin',
    admin: '/dashboard/admin',
    profesor: '/dashboard/profesor',
    padre: '/dashboard/padre',
    alumno: '/dashboard/alumno',
  };
  const url = role ? map[role] : undefined;
  return useQuery({
    queryKey: ['dashboard', role],
    queryFn: async () => (await api.get(url!)).data,
    enabled: !!url,
  });
};
