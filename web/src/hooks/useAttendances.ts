import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { api } from '../api/axios';
import {
  OFFLINE_MUTATION_KEYS,
  type SaveAttendancesPayload,
} from '../lib/offlineMutations';
import {
  enPeriodo,
  estadisticaDeRegistros,
  type Periodo,
  type RegistroAlumno,
} from '../lib/attendance';
import type { Attendance } from '../types';

export const useGetAttendancesByCategory = (
  categoryId: string,
  date?: string,
  enabled = true,
) =>
  useQuery({
    queryKey: ['attendances', categoryId, date],
    queryFn: async () => {
      const url = date
        ? `/attendances/category/${categoryId}?date=${date}`
        : `/attendances/category/${categoryId}`;
      return (await api.get(url)).data as Attendance[];
    },
    enabled: enabled && !!categoryId,
  });

export const useGetAttendancesByStudent = (studentId?: string) =>
  useQuery({
    queryKey: ['attendances', 'student', studentId],
    queryFn: async () =>
      (await api.get(`/attendances/student/${studentId}`)).data as Attendance[],
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

/**
 * Resumen de asistencia de un alumno, ya filtrado por periodo. Reutiliza la
 * misma consulta que el historial, así que no cuesta una petición extra.
 */
export const useEstadisticaAsistencia = (studentId?: string, periodo: Periodo = '90') => {
  const { data, isLoading } = useGetAttendancesByStudent(studentId);
  const registros: RegistroAlumno[] = ((data || []) as Attendance[])
    .map((r) => ({
      id: r.id,
      date: dayjs(r.date).format('YYYY-MM-DD'),
      type: r.type,
      present: !!r.present,
    }))
    .filter((r) => enPeriodo(r.date, periodo));
  return {
    isLoading,
    total: ((data || []) as Attendance[]).length,
    estadistica: estadisticaDeRegistros(registros, {
      studentId: studentId || '',
      nombre: 'Alumno',
    }),
  };
};
