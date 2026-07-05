import { useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';

/** Update the logged-in user's own profile (no admin role needed). */
export const useUpdateOwnProfile = () =>
  useMutation({
    mutationFn: async (payload: {
      fullName?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      address?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      avatar_url?: string;
    }) => (await api.patch('/users/me/profile', payload)).data,
  });

export const useCompleteOnboarding = () =>
  useMutation({
    mutationFn: async () => (await api.post('/users/me/complete-onboarding')).data,
  });
