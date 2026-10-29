import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Se inyecta en el bundle del cliente: al cambiar en cada build invalida la
  // caché persistida de TanStack Query.
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID ?? new Date().toISOString(),
  },
  async headers() {
    return [
      {
        // El service worker no puede quedarse pegado en la caché HTTP: si no se
        // revalida, un despliegue nuevo nunca llega a los navegadores que ya lo
        // tienen instalado.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          // Permite controlar todo el sitio aunque se sirva desde /sw.js.
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
