import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
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

export interface StudentAttendanceSummary {
  /** Sesiones del mes en curso con registro para este alumno. */
  total: number;
  present: number;
  /** Porcentaje del mes, o null si el mes aún no tiene sesiones registradas. */
  rate: number | null;
  /** Última fecha en la que asistió (YYYY-MM-DD), de todo su historial. */
  lastPresent: string | null;
  /** Días completos desde esa fecha. null si nunca ha asistido. */
  daysSince: number | null;
}

/**
 * Resumen de asistencia por alumno para un puñado de categorías.
 *
 * El backend no expone un agregado, así que se calcula en el cliente sobre
 * `/attendances/category/:id` — la misma clave de caché que usa el histórico,
 * para no pedir dos veces lo mismo. Por eso conviene pasarle solo las
 * categorías de la página que se está viendo y no las de toda la academia.
 */
export const useAttendanceSummaries = (categoryIds: string[]) =>
  useQueries({
    queries: categoryIds.map((id) => ({
      queryKey: ['attendances', id, undefined],
      queryFn: async () => (await api.get(`/attendances/category/${id}`)).data,
    })),
    combine: (results) => {
      const byStudent = new Map<string, StudentAttendanceSummary>();
      const now = dayjs();

      for (const result of results) {
        for (const a of (result.data ?? []) as any[]) {
          if (!a?.student_id) continue;
          const entry =
            byStudent.get(a.student_id) ??
            { total: 0, present: 0, rate: null, lastPresent: null, daysSince: null };

          if (dayjs(a.date).isSame(now, 'month')) {
            entry.total += 1;
            if (a.present) entry.present += 1;
          }
          if (a.present && (!entry.lastPresent || a.date > entry.lastPresent)) {
            entry.lastPresent = a.date;
          }
          byStudent.set(a.student_id, entry);
        }
      }

      const today = now.startOf('day');
      for (const entry of byStudent.values()) {
        entry.rate = entry.total ? Math.round((entry.present / entry.total) * 100) : null;
        entry.daysSince = entry.lastPresent
          ? today.diff(dayjs(entry.lastPresent).startOf('day'), 'day')
          : null;
      }

      return {
        byStudent,
        isLoading: results.some((r) => r.isPending),
      };
    },
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
