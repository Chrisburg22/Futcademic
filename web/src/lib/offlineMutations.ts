import { onlineManager, type QueryKey } from '@tanstack/react-query';

import { api } from '../api/axios';
import { queryClient } from './queryClient';

/**
 * Cola de escrituras sin conexión.
 *
 * No hay cola propia: TanStack Query ya trae una. Con `networkMode: 'online'`
 * (el de fábrica) una mutación lanzada sin red no falla, queda **pausada**; el
 * persister la escribe en localStorage junto a la caché y `onlineManager` la
 * reanuda en cuanto vuelve la conexión.
 *
 * Lo que hace falta es esto:
 *
 *   1. Que cada mutación de la cola tenga `mutationKey` y su `mutationFn` viva
 *      en los *defaults*. Una mutación rehidratada después de recargar no
 *      conserva la función que se le pasó al hook: solo la clave. Sin estos
 *      defaults, `resumePausedMutations()` no sabría qué ejecutar.
 *   2. Que los `invalidateQueries` vayan también aquí y no en los callbacks de
 *      `mutate`, que tampoco sobreviven a una recarga.
 *
 * Este módulo se importa con efecto desde `Providers`, antes del primer render,
 * para que los defaults estén puestos cuando se rehidrate la cola.
 */

export const OFFLINE_MUTATION_KEYS = {
  saveAttendances: ['attendances', 'save'] as const,
  markTrainingComplete: ['trainings', 'complete'] as const,
  registerStudentPayment: ['payments', 'register-student'] as const,
  registerTeacherPayment: ['payments', 'register-teacher'] as const,
};

/** Claves de mutación que forman la cola (para contar lo pendiente). */
export const QUEUED_MUTATION_KEYS: QueryKey[] = Object.values(OFFLINE_MUTATION_KEYS).map(
  (key) => [...key],
);

export type SaveAttendancesPayload = {
  category_id: string;
  date: string;
  type: 'entrenamiento' | 'partido';
  records: { student_id: string; present: boolean }[];
  training_id?: string;
};

export type RegisterStudentPaymentPayload = {
  student_id: string;
  amount: number;
  payment_date: string;
  description?: string;
  payment_month?: number;
};

export type RegisterTeacherPaymentPayload = {
  teacher_id: string;
  amount: number;
  payment_date: string;
  description?: string;
};

/** Contexto del optimista del pase de lista, para poder deshacerlo. */
type AttendancesContext = { key: QueryKey; previous: unknown };

queryClient.setMutationDefaults(OFFLINE_MUTATION_KEYS.saveAttendances, {
  mutationFn: async (payload: SaveAttendancesPayload) =>
    (await api.post('/attendances', payload)).data,
  // Escribe el pase de lista en la caché antes de salir a la red: es lo que
  // hace que, al recargar sin conexión, la pantalla muestre lo que se marcó en
  // la cancha y no la lista anterior (la caché de queries se persiste).
  onMutate: async (payload: SaveAttendancesPayload): Promise<AttendancesContext> => {
    const key: QueryKey = ['attendances', payload.category_id, payload.date];
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData(key);
    queryClient.setQueryData(
      key,
      payload.records.map((record) => ({
        student_id: record.student_id,
        present: record.present,
      })),
    );
    return { key, previous };
  },
  onError: (_error, _payload, context) => {
    const ctx = context as AttendancesContext | undefined;
    if (ctx) queryClient.setQueryData(ctx.key, ctx.previous);
  },
  onSuccess: (_data, payload) => {
    const { category_id } = payload as SaveAttendancesPayload;
    void queryClient.invalidateQueries({ queryKey: ['attendances', category_id] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  },
});

queryClient.setMutationDefaults(OFFLINE_MUTATION_KEYS.markTrainingComplete, {
  mutationFn: async (trainingId: string) =>
    (await api.patch(`/attendances/trainings/${trainingId}/complete`)).data,
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['trainings'] });
  },
});

queryClient.setMutationDefaults(OFFLINE_MUTATION_KEYS.registerStudentPayment, {
  mutationFn: async (payload: RegisterStudentPaymentPayload) =>
    (await api.post('/payments/students', payload)).data,
  // Los pagos no se pintan optimistas: los totales y los adeudos los calcula el
  // backend y enseñar un cobro que todavía no salió invita a cobrar dos veces.
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['payments'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  },
});

queryClient.setMutationDefaults(OFFLINE_MUTATION_KEYS.registerTeacherPayment, {
  mutationFn: async (payload: RegisterTeacherPaymentPayload) =>
    (await api.post('/payments/teachers', payload)).data,
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['payments'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  },
});

/**
 * ¿La escritura va a quedarse en cola?
 *
 * Las pantallas lo consultan justo después de lanzar la mutación para decir la
 * verdad en el aviso: sin red no se ha guardado nada en el servidor todavía.
 * No se puede esperar la promesa de `mutateAsync` para averiguarlo, porque una
 * mutación pausada deja esa promesa pendiente hasta que vuelva la conexión.
 */
export function willQueueOffline() {
  return !onlineManager.isOnline();
}
