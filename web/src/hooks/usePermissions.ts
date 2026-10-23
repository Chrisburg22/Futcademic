import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import type { TeacherPermissions } from '../types';

/** Logged-in teacher's own permissions (for UI gating). */
export const useGetMyPermissions = (enabled = true) =>
  useQuery({
    queryKey: ['permissions', 'mine'],
    queryFn: async () => (await api.get('/permissions/mine')).data as TeacherPermissions,
    enabled,
  });

/**
 * Permisos efectivos del usuario actual, para condicionar la interfaz.
 *
 * Solo el rol `profesor` tiene matriz de permisos: para el resto de roles el
 * acceso ya está acotado por la restricción de rol de cada ruta, así que `can`
 * devuelve `true` y no se pide nada al servidor.
 *
 * `isLoading` solo es cierto mientras faltan los permisos de un profesor: quien
 * consulte esto debe esperar antes de decidir un redirect, o expulsaría al
 * profesor de una ruta a la que sí tiene acceso.
 */
export const useMyPermissionGate = () => {
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'profesor';
  const { data, isLoading } = useGetMyPermissions(isTeacher);

  const can = useCallback(
    (key: keyof TeacherPermissions) => (isTeacher ? !!data?.[key] : true),
    [isTeacher, data],
  );

  return { can, isLoading: isTeacher && isLoading };
};

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
