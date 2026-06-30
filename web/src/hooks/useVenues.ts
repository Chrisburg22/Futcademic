import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import type { Venue } from '../types';

export const useGetVenues = () =>
  useQuery({
    queryKey: ['venues'],
    queryFn: async () => (await api.get('/venues')).data as Venue[],
  });

export type VenueDTO = Omit<Venue, 'id'>;

export const useCreateVenue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: VenueDTO) => (await api.post('/venues', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venues'] }),
  });
};

export const useUpdateVenue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<VenueDTO> & { id: string }) =>
      (await api.patch(`/venues/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venues'] }),
  });
};

export const useDeleteVenue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/venues/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venues'] }),
  });
};
