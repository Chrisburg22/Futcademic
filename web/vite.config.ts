import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Los iconos de public/ se regeneran desde public/icon.svg con:
//   npx sharp-cli -i public/icon.svg -o public/pwa-512.png resize 512 512
// (idem 192, apple-touch-icon 180 y favicon-32 32; maskable-512 sale de una
// variante sin borde redondeado y con el glifo al ~60% del lienzo).

export default defineConfig(({ mode }) => ({
  define: {
    // Cambia en cada build de producción para invalidar la caché persistida.
    __APP_VERSION__: JSON.stringify(
      mode === 'production' ? new Date().toISOString() : 'dev',
    ),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Futcademic',
        short_name: 'Futcademic',
        description: 'Gestión de academias de fútbol',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'es',
        theme_color: '#006d35',
        background_color: '#ffffff',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        // El SW toma el control en la primera visita: la app queda utilizable
        // sin conexión sin necesidad de recargar. No implica skipWaiting: las
        // versiones nuevas siguen esperando a que el usuario acepte.
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Imágenes de Supabase Storage (logos de academias, avatares).
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // GET a la API del backend (otro origen). El chat IA usa POST +
            // SSE, así que nunca entra aquí: solo interceptamos GET.
            urlPattern: ({ url, request, sameOrigin }) =>
              request.method === 'GET' &&
              !sameOrigin &&
              url.pathname.startsWith('/api') &&
              !url.pathname.startsWith('/api/chat'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173 },
}));
