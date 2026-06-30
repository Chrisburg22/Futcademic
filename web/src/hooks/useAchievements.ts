import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import type { AchievementsResponse } from '../types';

export const useGetAchievements = (enabled = true) =>
  useQuery({
    queryKey: ['achievements'],
    queryFn: async () => (await api.get('/achievements')).data as AchievementsResponse,
    enabled,
  });

/** Re-evaluate and unlock achievements for a student (after attendance, etc.). */
export const useCheckAchievements = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) =>
      (await api.post('/achievements/check', { studentId })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  });
};
