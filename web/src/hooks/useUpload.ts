import { useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useUploadAvatar = () =>
  useMutation({
    mutationFn: async (payload: { file: File; userId?: string }) => {
      const fd = new FormData();
      fd.append('image', payload.file);
      if (payload.userId) fd.append('userId', payload.userId);
      return (
        await api.post('/upload/avatar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data as { avatarUrl: string };
    },
  });

export const useUploadLogo = () =>
  useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      return (
        await api.post('/upload/logo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data as { logoUrl: string };
    },
  });
