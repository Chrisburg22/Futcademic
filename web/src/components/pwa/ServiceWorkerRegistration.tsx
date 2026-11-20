'use client';

import { useEffect } from 'react';

/**
 * Registra `/sw.js` y le pasa los recursos de la carga actual.
 *
 * En desarrollo hace lo contrario: desregistra cualquier service worker y borra
 * sus cachés. Un SW vivo en `next dev` sirve chunks viejos y rompe el HMR, y es
 * fácil quedarse uno instalado tras probar un build de producción en el mismo
 * localhost.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      void (async () => {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(
            names.filter((n) => n.startsWith('futcademic-')).map((n) => caches.delete(n)),
          );
        }
      })();
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        // Busca versión nueva en cada arranque; el navegador no revalida solo si
        // la pestaña lleva mucho abierta.
        void registration.update();
        if (cancelled) return;

        // Los chunks de ESTA carga se pidieron antes de que el SW controlara la
        // página, así que no pasaron por su `fetch`. Se los mandamos para que
        // la app ya funcione sin red tras la primera visita.
        const sendCurrentResources = () => {
          const target = navigator.serviceWorker.controller ?? registration.active;
          if (!target) return;
          const urls = performance
            .getEntriesByType('resource')
            .map((entry) => entry.name)
            .filter((name) => name.startsWith(window.location.origin))
            .filter((name) => !new URL(name).pathname.startsWith('/api/'));
          target.postMessage({ type: 'CACHE_URLS', urls: [...new Set(urls)] });
        };

        if (navigator.serviceWorker.controller) sendCurrentResources();
        else navigator.serviceWorker.addEventListener('controllerchange', sendCurrentResources);
      } catch (err) {
        // Sin service worker la app sigue funcionando online; no hay que
        // tumbar el render por esto.
        console.error('No se pudo registrar el service worker:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
