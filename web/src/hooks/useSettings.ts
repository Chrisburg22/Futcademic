import { useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: async (payload: {
      id: string;
      full_name: string;
      phone: string;
      address: string;
      emergency_contact_name: string;
      emergency_contact_phone: string;
      avatar_url?: string;
    }) => {
      const { id, ...data } = payload;
      return (await api.put(`/users/${id}`, data)).data;
    },
  });

export const useUpdateAcademy = () =>
  useMutation({
    mutationFn: async (payload: { id: string; name: string; logo_url?: string }) => {
      const { id, ...data } = payload;
      return (await api.put(`/schools/${id}`, data)).data;
    },
  });
