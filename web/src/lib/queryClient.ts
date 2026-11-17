import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// `onlineManager` arranca en `true` y solo cambia con los eventos `online` /
// `offline` del navegador. Si la app se abre cuando YA no hay red, esos eventos
// nunca llegan: TanStack cree que hay conexión, lanza las consultas (fallan) y,
// peor, ejecuta las escrituras que estaban en cola en vez de dejarlas pausadas,
// así que se pierden. Se sincroniza una vez al cargar; a partir de ahí los
// eventos del navegador mantienen el valor al día.
// Solo se hace caso del `false`: `navigator.onLine` da `true` con un wifi sin
// salida a internet, y de eso ya se encarga el fallo de la petición.
if (typeof window !== 'undefined' && navigator.onLine === false) {
  onlineManager.setOnline(false);
}

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
    mutations: {
      // `networkMode: 'online'` (el de fábrica, explícito aquí porque de él
      // depende la cola sin conexión): una escritura lanzada sin red no falla,
      // queda pausada, se persiste y se reanuda al volver la conexión. Ver
      // `src/lib/offlineMutations.ts`.
      networkMode: 'online',
      // Un corte a mitad del envío tampoco debe perder el dato: tras los
      // reintentos la mutación queda pausada, no fallida.
      retry: 2,
    },
  },
});

// En el servidor no hay localStorage. El persister se crea igualmente con un
// almacenamiento no-op para que el árbol de providers sea idéntico en SSR y en
// el cliente (evita errores de hidratación).
const serverStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

export const queryPersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : serverStorage,
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
