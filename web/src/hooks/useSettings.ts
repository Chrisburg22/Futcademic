import { useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useUpdateAcademy = () =>
  useMutation({
    mutationFn: async (payload: { id: string; name: string; logo_url?: string }) => {
      const { id, ...data } = payload;
      return (await api.put(`/schools/${id}`, data)).data;
    },
  });
