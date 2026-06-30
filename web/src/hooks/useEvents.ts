import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useGetEvents = (filters?: { category_id?: string }) =>
  useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      let url = '/events?';
      if (filters?.category_id) url += `category_id=${filters.category_id}&`;
      return (await api.get(url)).data;
    },
  });

export const useGetTrainings = (filters?: { category_id?: string; date?: string }) =>
  useQuery({
    queryKey: ['trainings', filters],
    queryFn: async () => {
      if (!filters?.date) return [];
      let url = `/events/trainings?date=${filters.date}&`;
      if (filters?.category_id) url += `category_id=${filters.category_id}&`;
      return (await api.get(url)).data;
    },
  });

export const useGetEvent = (eventId?: string) =>
  useQuery({
    queryKey: ['events', 'details', eventId],
    queryFn: async () => (await api.get(`/events/${eventId}`)).data,
    enabled: !!eventId,
  });

export const useGetTrainingsByEvent = (eventId?: string) =>
  useQuery({
    queryKey: ['trainings', 'event', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      return (await api.get(`/events/${eventId}/trainings`)).data;
    },
    enabled: !!eventId,
  });

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name?: string;
      category_id: string;
      date: string;
      start_time?: string;
      type: 'entrenamiento' | 'partido';
      description?: string;
      venue_id?: string | null;
      recurringWeeks?: number;
    }) => (await api.post('/events', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      category_id?: string;
      description?: string;
      venue_id?: string | null;
      start_time?: string;
      end_time?: string;
    }) => (await api.put(`/events/${id}`, payload)).data,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['events', 'details', variables.id] });
    },
  });
};

export const useCancelInstance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      training_id?: string;
      event_id?: string;
      date?: string;
    }) => (await api.post('/events/cancel', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['trainings'] });
    },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
};
