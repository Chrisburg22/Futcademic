/* eslint-disable no-restricted-globals */
/**
 * Service worker de Futcademic.
 *
 * Escrito a mano, sin Workbox ni Serwist: la app es un SPA client-side sobre el
 * App Router, así que basta con dos cachés y tres estrategias.
 *
 *   futcademic-assets  cache-first   /_next/static y archivos estáticos (llevan
 *                                    hash en el nombre: son inmutables).
 *   futcademic-docs    network-first documentos HTML y payloads RSC. La red
 *                                    manda; sin red se sirve la última copia.
 *
 * Reglas duras:
 *   - Nunca se cachea `/api/**` ni nada de otro origen (Supabase, backend de
 *     Render): los datos los guarda TanStack Query en localStorage, que sí sabe
 *     cuándo caducan y se borra al cerrar sesión.
 *   - Las claves de documento ignoran el query string, para no dejar escritos
 *     tokens de invitación o de recuperación de contraseña dentro de la caché.
 *   - Entre despliegues NO se purgan los assets viejos: el HTML cacheado apunta
 *     a chunks con hash que ya no existen en el servidor, y son lo único que
 *     mantiene viva la versión instalada mientras no haya red.
 */

const VERSION = 'v1';
const ASSET_CACHE = `futcademic-assets-${VERSION}`;
const DOC_CACHE = `futcademic-docs-${VERSION}`;
const CURRENT_CACHES = [ASSET_CACHE, DOC_CACHE];

const OFFLINE_URL = '/offline';

/** Lo mínimo para que la app arranque en una pestaña nueva sin red. */
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/',
  '/login',
  '/manifest.webmanifest',
  '/icon.svg',
  '/favicon-32.png',
  '/apple-touch-icon.png',
  '/pwa-192.png',
  '/pwa-512.png',
  '/maskable-512.png',
];

/** Máximo de assets guardados; por encima se tiran los más antiguos (FIFO). */
const ASSET_LIMIT = 400;

const ASSET_EXTENSIONS =
  /\.(?:js|mjs|css|png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2|ttf|otf|map)$/i;

// ───────────────────────────── instalación ─────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(ASSET_CACHE);
      // allSettled: que un icono falte no puede abortar la instalación entera.
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          // `cache: 'reload'` evita precachear lo que ya esté rancio en la
          // caché HTTP del navegador.
          const res = await fetch(url, { cache: 'reload' });
          if (res.ok) await cache.put(url, res);
        }),
      );
      // Activar sin esperar a que se cierren las pestañas viejas.
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith('futcademic-') && !CURRENT_CACHES.includes(n))
          .map((n) => caches.delete(n)),
      );
      // Controla la pestaña que lo registró, sin recargarla.
      await self.clients.claim();
    })(),
  );
});

// ───────────────────────────── estrategias ─────────────────────────────

/** Clave de documento sin query string (ver "reglas duras" arriba). */
function docKey(url, rsc) {
  return `${url.origin}${url.pathname}${rsc ? '?__rsc=1' : ''}`;
}

async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  await Promise.all(keys.slice(0, keys.length - limit).map((k) => cache.delete(k)));
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;

  const res = await fetch(request);
  if (res.ok) {
    await cache.put(request, res.clone());
    void trimCache(ASSET_CACHE, ASSET_LIMIT);
  }
  return res;
}

/**
 * Red primero y, si falla, la copia guardada. En navegaciones el último recurso
 * es `/offline`: siempre hay algo que pintar en vez del dinosaurio.
 */
async function networkFirst(request, key, { navigation = false } = {}) {
  const cache = await caches.open(DOC_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) await cache.put(key, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(key);
    if (hit) return hit;
    if (navigation) {
      const assets = await caches.open(ASSET_CACHE);
      const fallback = (await cache.match(OFFLINE_URL)) || (await assets.match(OFFLINE_URL));
      if (fallback) return fallback;
    }
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Supabase y el backend de Render viven en otro origen: pasan sin tocar.
  if (url.origin !== self.location.origin) return;
  // Datos del usuario: no se cachean aquí.
  if (url.pathname.startsWith('/api/')) return;

  if (url.pathname.startsWith('/_next/static/') || ASSET_EXTENSIONS.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Optimizador de imágenes de Next: misma idea, pero la URL lleva query.
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, docKey(url, false), { navigation: true }));
    return;
  }

  // Navegación client-side del App Router: mismo path, pero el cuerpo es el
  // payload RSC, así que necesita su propia clave.
  if (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) {
    event.respondWith(networkFirst(request, docKey(url, true)));
  }
});

// ───────────────────────────── mensajes ─────────────────────────────

/**
 * La página le pasa los recursos que ya había cargado antes de que el service
 * worker tomara el control (primera visita): sin esto, el primer arranque deja
 * los chunks fuera de la caché y la app no abre sin red hasta la segunda
 * visita.
 */
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'CACHE_URLS' || !Array.isArray(data.urls)) return;

  event.waitUntil(
    (async () => {
      const cache = await caches.open(ASSET_CACHE);
      await Promise.allSettled(
        data.urls
          .filter((raw) => typeof raw === 'string')
          .map(async (raw) => {
            const url = new URL(raw, self.location.origin);
            if (url.origin !== self.location.origin) return;
            if (await cache.match(url.href)) return;
            const res = await fetch(url.href);
            if (res.ok) await cache.put(url.href, res);
          }),
      );
      await trimCache(ASSET_CACHE, ASSET_LIMIT);
    })(),
  );
});
