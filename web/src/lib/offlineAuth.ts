import type { Session } from '@supabase/supabase-js';

/**
 * Sesión y perfil para arrancar sin red.
 *
 * Sin esto la PWA no abre sin conexión aunque el shell venga del service
 * worker: `supabase.auth.getSession()` intenta refrescar el token y, si el
 * refresh falla por falta de red, devuelve `null`, así que `ProtectedRoute`
 * manda a `/login`; y la consulta del perfil a `users` también falla, dejando
 * el `AppShell` sin nombre, sin rol y sin menú.
 *
 * Lo que se guarda aquí son datos que el navegador ya tenía (la sesión la
 * escribe supabase-js, el perfil es del propio usuario) y se borra al cerrar
 * sesión. No concede acceso a nada: cualquier lectura real sigue necesitando un
 * token válido contra Supabase o el backend.
 */

export const PROFILE_KEY = 'futcademic-profile';

function hasWindow() {
  return typeof window !== 'undefined';
}

export function saveCachedProfile(profile: unknown) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Cuota llena o modo privado: seguir sin caché es mejor que reventar.
  }
}

export function readCachedProfile<T>(): T | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearCachedProfile() {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* no-op */
  }
}

/** supabase-js guarda la sesión bajo `sb-<ref>-auth-token`. */
function findAuthTokenRaw(): string | null {
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && /^sb-.*-auth-token$/.test(key)) {
      return window.localStorage.getItem(key);
    }
  }
  return null;
}

/**
 * Lee la sesión tal cual está escrita en localStorage, sin pasar por la red.
 * Puede devolver un token caducado: es deliberado, sirve para pintar la app con
 * los datos ya descargados mientras no haya conexión.
 */
export function readPersistedSession(): Session | null {
  if (!hasWindow()) return null;
  try {
    let raw = findAuthTokenRaw();
    if (!raw) return null;

    // Versiones recientes de supabase-js prefijan el valor serializado. `atob`
    // devuelve bytes, no texto: sin TextDecoder los nombres con acentos salen
    // corrompidos (el perfil se pinta con "Ramírez" roto).
    if (raw.startsWith('base64-')) {
      const bytes = Uint8Array.from(atob(raw.slice('base64-'.length)), (c) => c.charCodeAt(0));
      raw = new TextDecoder().decode(bytes);
    }

    const parsed = JSON.parse(raw);
    // Según la versión, el objeto es la sesión o viene envuelto en `currentSession`.
    const session = (parsed?.currentSession ?? parsed) as Session | null;
    if (!session?.access_token || !session?.user) return null;
    return session;
  } catch {
    return null;
  }
}
