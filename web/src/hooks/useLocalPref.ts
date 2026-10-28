'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Preferencia de interfaz que sobrevive al refresco (densidad de una tabla,
 * columnas visibles, cuántas filas por página).
 *
 * No es estado de negocio: si `localStorage` no está disponible (ventana
 * privada, PWA sin permisos) se usa el valor por omisión y no pasa nada.
 */
export function useLocalPref<T>(clave: string, inicial: T) {
  const [valor, setValor] = useState<T>(inicial);

  // Se lee después del primer render para que el HTML del servidor y el del
  // cliente coincidan.
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(`futcademic:${clave}`);
      if (guardado != null) setValor(JSON.parse(guardado) as T);
    } catch {
      /* sin preferencia guardada */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const guardar = useCallback(
    (siguiente: T) => {
      setValor(siguiente);
      try {
        window.localStorage.setItem(`futcademic:${clave}`, JSON.stringify(siguiente));
      } catch {
        /* no se puede guardar; la sesión sigue funcionando */
      }
    },
    [clave],
  );

  return [valor, guardar] as const;
}
