import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useGetMyChildrenFull = () =>
  useQuery({
    queryKey: ['parents', 'children'],
    queryFn: async () => (await api.get('/parents/me/children')).data,
  });

export const useLinkChild = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      student_id?: string;
      student_code?: string;
      full_name?: string;
    }) => (await api.post('/parents/link-child', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parents', 'children'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useUnlinkChild = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/parents/children/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parents', 'children'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};
