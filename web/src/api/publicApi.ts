import axios from 'axios';

/**
 * Cliente HTTP del formulario público de inscripción.
 *
 * No adjunta el JWT de Supabase a propósito: estas rutas se autorizan con el
 * token opaco de la URL. Usar `api` aquí enviaría la sesión del admin si abre
 * el link desde su propio navegador, y el formulario no debe depender de ella.
 */
export const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: { 'Cache-Control': 'no-store' },
});
