/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

// Inyectado por `define` en vite.config.ts. Sirve de `buster` de la caché
// persistida de TanStack Query.
declare const __APP_VERSION__: string;
