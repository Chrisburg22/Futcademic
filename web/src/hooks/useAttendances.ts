import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';
import {
  OFFLINE_MUTATION_KEYS,
  type SaveAttendancesPayload,
} from '../lib/offlineMutations';

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

// `mutationFn`, el optimista y los invalidate viven en los defaults de
// `src/lib/offlineMutations.ts`: así una escritura que se quedó en cola sin
// conexión se puede reanudar después de recargar, cuando ya no existe el
// componente que la lanzó.
export const useMarkTrainingComplete = () =>
  useMutation<unknown, Error, string>({
    mutationKey: OFFLINE_MUTATION_KEYS.markTrainingComplete,
  });

export const useSaveAttendances = () =>
  useMutation<unknown, Error, SaveAttendancesPayload>({
    mutationKey: OFFLINE_MUTATION_KEYS.saveAttendances,
  });
