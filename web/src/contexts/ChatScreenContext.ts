'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import type { ChatScreenContext } from '../lib/chatScreen';

/**
 * Registro del contexto de pantalla activo.
 *
 * Va en un store de módulo, no en un provider, por dos razones:
 *  - el chat vive en AppShell y las pantallas son sus hijas; un provider
 *    obligaría a envolver todo el árbol para transmitir un dato efímero;
 *  - el contexto se ata a la ruta, así que una pantalla que se desmonta no
 *    puede dejar su contexto pegado a la siguiente (se compara la ruta).
 */

interface Entry {
  path: string;
  value: ChatScreenContext;
}

let entry: Entry | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Entry | null {
  return entry;
}

// En el servidor no hay ruta ni pantalla montada.
function getServerSnapshot(): Entry | null {
  return null;
}

/**
 * Declara el contexto de la pantalla actual. Se llama desde la pantalla que
 * conoce el registro abierto (ficha de alumno, de profesor…). Al desmontarse
 * se retira, salvo que ya haya otro contexto de la misma ruta.
 */
export function useRegisterChatScreen(value: ChatScreenContext | null): void {
  const pathname = usePathname();
  const valueRef = useRef(value);
  valueRef.current = value;
  const key = value ? JSON.stringify(value) : '';

  useEffect(() => {
    const current = valueRef.current;
    if (!current) return;

    entry = { path: pathname, value: current };
    emit();

    return () => {
      if (entry?.path === pathname) {
        entry = null;
        emit();
      }
    };
  }, [pathname, key]);
}

/** Contexto registrado, solo si corresponde a la ruta visible. */
export function useRegisteredChatScreen(pathname: string): ChatScreenContext | null {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return snapshot && snapshot.path === pathname ? snapshot.value : null;
}
