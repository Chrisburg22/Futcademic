import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useGetPayments = (filters?: {
  type?: 'mensualidad' | 'pago_profesor';
  student_id?: string;
  teacher_id?: string;
  month?: number;
}) =>
  useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      let url = '/payments?';
      if (filters?.type) url += `type=${filters.type}&`;
      if (filters?.student_id) url += `student_id=${filters.student_id}&`;
      if (filters?.teacher_id) url += `teacher_id=${filters.teacher_id}&`;
      if (filters?.month) url += `month=${filters.month}&`;
      return (await api.get(url)).data;
    },
  });

export const useGetPendingPayments = (month?: number) => {
  const currentMonth = month ?? new Date().getMonth() + 1;
  return useQuery({
    queryKey: ['payments', 'pending', currentMonth],
    queryFn: async () => (await api.get(`/payments/pending?month=${currentMonth}`)).data,
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

export const useRegisterStudentPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      student_id: string;
      amount: number;
      payment_date: string;
      description?: string;
      payment_month?: number;
    }) => (await api.post('/payments/students', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};

export const useRegisterTeacherPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      teacher_id: string;
      amount: number;
      payment_date: string;
      description?: string;
    }) => (await api.post('/payments/teachers', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};
