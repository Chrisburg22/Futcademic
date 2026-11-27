import axios from 'axios';
import { supabase } from '../config/supabase';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

/**
 * Academia suspendida.
 *
 * El backend responde 403 con `code: 'SCHOOL_SUSPENDED'` en **todas** las rutas
 * de academia, así que el aviso no puede vivir en cada pantalla. Se guarda aquí
 * y `SuspendedGate` lo convierte en una página de bloqueo; un toast por cada
 * consulta fallida sería una lluvia de errores sin explicación.
 */
export const SCHOOL_SUSPENDED = 'SCHOOL_SUSPENDED';

export type Suspension = { reason: string | null; message: string };

let suspension: Suspension | null = null;
const oyentes = new Set<(valor: Suspension | null) => void>();

export const leerSuspension = () => suspension;

export const escucharSuspension = (oyente: (valor: Suspension | null) => void) => {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
};

const anunciar = (valor: Suspension | null) => {
  suspension = valor;
  for (const oyente of oyentes) oyente(valor);
};

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const datos = error?.response?.data;
    if (error?.response?.status === 403 && datos?.code === SCHOOL_SUSPENDED) {
      anunciar({
        reason: datos.reason ?? null,
        message: datos.error || 'Esta academia está suspendida.',
      });
    }
    return Promise.reject(error);
  },
);
