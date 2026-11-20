import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';
import {
  OFFLINE_MUTATION_KEYS,
  type RegisterStudentPaymentPayload,
  type RegisterTeacherPaymentPayload,
} from '../lib/offlineMutations';

export const useGetPayments = (filters?: {
  type?: 'mensualidad' | 'pago_profesor';
  student_id?: string;
  teacher_id?: string;
  month?: number;
  year?: number;
}) =>
  useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.set('type', filters.type);
      if (filters?.student_id) params.set('student_id', filters.student_id);
      if (filters?.teacher_id) params.set('teacher_id', filters.teacher_id);
      if (filters?.month) params.set('month', String(filters.month));
      if (filters?.year) params.set('year', String(filters.year));
      return (await api.get(`/payments?${params.toString()}`)).data;
    },
  });

/**
 * Cobrado (mensualidades) y nómina del año, mes a mes.
 * Una consulta agregada alimenta las tarjetas y la gráfica del panel.
 */
export const useGetPaymentsSummary = (year: number) =>
  useQuery({
    queryKey: ['payments', 'summary', year],
    queryFn: async () => (await api.get(`/payments/summary?year=${year}`)).data,
  });

/**
 * Alumnos que deben la mensualidad del mes.
 * `GET /payments/pending` es solo de admin: `enabled` evita el 403.
 */
export const useGetPendingPayments = (
  params: { month?: number; year?: number; enabled?: boolean } = {},
) => {
  const month = params.month ?? new Date().getMonth() + 1;
  const year = params.year ?? new Date().getFullYear();
  return useQuery({
    queryKey: ['payments', 'pending', month, year],
    queryFn: async () => (await api.get(`/payments/pending?month=${month}&year=${year}`)).data,
    enabled: params.enabled ?? true,
  });
};

export const useGetPaymentsByStudent = (studentId?: string) =>
  useQuery({
    queryKey: ['payments', 'student', studentId],
    queryFn: async () => (await api.get(`/payments/student/${studentId}`)).data,
    enabled: !!studentId,
  });

export const useGetAccountStatement = (studentId?: string) =>
  useQuery({
    queryKey: ['payments', 'account-statement', studentId],
    queryFn: async () =>
      (await api.get(`/payments/account-statement/${studentId}`)).data,
    enabled: !!studentId,
  });

// Igual que en asistencias: la función y los invalidate están en los defaults
// de `src/lib/offlineMutations.ts` para que la cola sobreviva a una recarga.
export const useRegisterStudentPayment = () =>
  useMutation<unknown, Error, RegisterStudentPaymentPayload>({
    mutationKey: OFFLINE_MUTATION_KEYS.registerStudentPayment,
  });

export const useRegisterTeacherPayment = () =>
  useMutation<unknown, Error, RegisterTeacherPaymentPayload>({
    mutationKey: OFFLINE_MUTATION_KEYS.registerTeacherPayment,
  });
