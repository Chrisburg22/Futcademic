import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import dayjs from 'dayjs';
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
    onSuccess: () => {
      // El pase de lista cambia el histórico de la categoría, el del día y el
      // de cada alumno: la clave entera es lo único que los cubre a todos.
      qc.invalidateQueries({ queryKey: ['attendances'] });
      qc.invalidateQueries({ queryKey: ['trainings'] });
    },
  });
};

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
