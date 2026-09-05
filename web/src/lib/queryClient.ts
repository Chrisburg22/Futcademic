import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// La caché se persiste para que la PWA muestre datos ya vistos sin conexión.
// gcTime debe ser >= maxAge del persister o las entradas se descartan al
// rehidratar.
export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24; // 24 h
export const PERSIST_KEY = 'futcademic-query-cache';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: CACHE_MAX_AGE,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryPersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: PERSIST_KEY,
  // localStorage ronda los 5 MB: si la caché no cabe, se descarta en vez de
  // reventar con QuotaExceededError.
  throttleTime: 1000,
});

// Datos volátiles o sensibles que no queremos dejar escritos en el disco del
// navegador entre sesiones.
const NON_PERSISTED_KEYS = ['notifications', 'chat-conversations', 'chat-messages'];

export function shouldPersistQueryKey(key: readonly unknown[]): boolean {
  const root = key[0];
  return typeof root === 'string' ? !NON_PERSISTED_KEYS.includes(root) : true;
}

// Se llama al cerrar sesión: sin esto, el siguiente usuario del mismo
// navegador rehidrataría la caché del anterior (fuga entre tenants).
export function clearPersistedCache() {
  // El orden importa: al vaciar primero el cliente, cualquier escritura del
  // persister que siguiera pendiente (va con throttle) ya sale vacía.
  queryClient.clear();
  void queryPersister.removeClient();
}
