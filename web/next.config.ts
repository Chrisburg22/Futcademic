import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Se inyecta en el bundle del cliente: al cambiar en cada build invalida la
  // caché persistida de TanStack Query.
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID ?? new Date().toISOString(),
  },
};

export default nextConfig;
