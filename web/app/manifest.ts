import type { MetadataRoute } from 'next';

/**
 * Manifest de la PWA. Next lo sirve en `/manifest.webmanifest` e inyecta el
 * `<link rel="manifest">` en el head de todas las páginas.
 *
 * `start_url: '/'` entra por el layout autenticado: si no hay sesión,
 * `ProtectedRoute` redirige a `/login` sin pedir red.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Futcademic',
    short_name: 'Futcademic',
    description: 'Gestión de academias de fútbol',
    lang: 'es',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#006d35',
    icons: [
      { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
