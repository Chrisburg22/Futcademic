import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { categoryKeys } from './useCategories';

/** El backend lee siempre el archivo del campo `image`. */
function cuerpoImagen(file: File, extra: Record<string, string> = {}) {
  const fd = new FormData();
  fd.append('image', file);
  Object.entries(extra).forEach(([clave, valor]) => fd.append(clave, valor));
  return fd;
}

const CABECERAS = { headers: { 'Content-Type': 'multipart/form-data' } };

export const useUploadAvatar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { file: File; userId?: string }) => {
      const extra: Record<string, string> = payload.userId
        ? { userId: payload.userId }
        : {};
      return (
        await api.post('/upload/avatar', cuerpoImagen(payload.file, extra), CABECERAS)
      ).data as { avatarUrl: string };
    },
    // Sin esto el avatar seguía saliendo viejo en el shell y en los listados.
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      if (variables.userId) {
        qc.invalidateQueries({ queryKey: ['users', 'teacher-details', variables.userId] });
      }
    },
  });
};

export const useRemoveAvatar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { userId?: string } = {}) =>
      (await api.delete('/upload/avatar', { data: payload })).data as { avatarUrl: null },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      if (variables?.userId) {
        qc.invalidateQueries({ queryKey: ['users', 'teacher-details', variables.userId] });
      }
    },
  });
};

export const useUploadStudentPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { studentId: string; file: File }) =>
      (
        await api.post(
          `/upload/student/${payload.studentId}/photo`,
          cuerpoImagen(payload.file),
          CABECERAS,
        )
      ).data as { avatarUrl: string },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['students', 'details', variables.studentId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useRemoveStudentPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) =>
      (await api.delete(`/upload/student/${studentId}/photo`)).data as { avatarUrl: null },
    onSuccess: (_data, studentId) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['students', 'details', studentId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUploadLogo = () =>
  useMutation({
    mutationFn: async (file: File) =>
      (await api.post('/upload/logo', cuerpoImagen(file), CABECERAS)).data as {
        logoUrl: string;
      },
  });

export const useUploadCategoryLogo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { categoryId: string; file: File }) =>
      (
        await api.post(
          `/upload/category/${payload.categoryId}/logo`,
          cuerpoImagen(payload.file),
          CABECERAS,
        )
      ).data as { logoUrl: string },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      qc.invalidateQueries({ queryKey: categoryKeys.detail(variables.categoryId) });
    },
  });
};

export const useRemoveCategoryLogo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string) =>
      (await api.delete(`/upload/category/${categoryId}/logo`)).data as { logoUrl: null },
    onSuccess: (_data, categoryId) => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      qc.invalidateQueries({ queryKey: categoryKeys.detail(categoryId) });
    },
  });
};
