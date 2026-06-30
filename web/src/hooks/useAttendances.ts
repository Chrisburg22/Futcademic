import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useGetAttendancesByCategory = (categoryId: string, date?: string) =>
  useQuery({
    queryKey: ['attendances', categoryId, date],
    queryFn: async () => {
      const url = date
        ? `/attendances/category/${categoryId}?date=${date}`
        : `/attendances/category/${categoryId}`;
      return (await api.get(url)).data;
    },
    enabled: !!categoryId,
  });

export const useGetAttendancesByStudent = (studentId?: string) =>
  useQuery({
    queryKey: ['attendances', 'student', studentId],
    queryFn: async () => (await api.get(`/attendances/student/${studentId}`)).data,
    enabled: !!studentId,
  });

export const useMarkTrainingComplete = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (trainingId: string) =>
      (await api.patch(`/attendances/trainings/${trainingId}/complete`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trainings'] }),
  });
};

export const useSaveAttendances = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      category_id: string;
      date: string;
      type: 'entrenamiento' | 'partido';
      records: { student_id: string; present: boolean }[];
      training_id?: string;
    }) => (await api.post('/attendances', payload)).data,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['attendances', variables.category_id] });
    },
  });
};
