# Futcademic Web

Panel de administración en **Next.js 16 (App Router)** + React 19. Consume el backend Express + Supabase.

## Stack

- Next.js 16 (App Router, todo client-side: no hay SSR de datos)
- React 19 + TypeScript
- Mantine v7 (UI) + Tailwind v3 (utilitarias)
- TanStack Query v5 (con caché persistida en localStorage)
- Supabase JS v2 (sesión en el navegador)
- Axios
- Playwright (e2e con backend mockeado)

## Setup

```bash
cd web
cp .env.example .env   # rellena NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev            # http://localhost:5173
```

Backend en paralelo:

```bash
cd ../backend && npm run dev   # http://localhost:3000
```

## Scripts

- `npm run dev` — Next en modo dev, puerto 5173
- `npm run build` — build de producción (typecheck incluido)
- `npm run start` — sirve el build en 5173
- `npm run test:e2e` — Playwright con Supabase/API mockeados; arranca el dev server solo
- `npm run test:smoke` — ⚠️ golpea producción y crea academias reales (`ALLOW_PROD_SMOKE=yes`)
- `npm run e2e:video` — graba el recorrido demo

## Estructura

- `app/` — rutas del App Router. Cada `page.tsx` es un wrapper fino que monta la pantalla y aplica `ProtectedRoute` con los roles permitidos.
- `src/screens/` — implementación de las pantallas (antes `src/pages/`; no reintroduzcas `src/pages/` porque Next lo trataría como Pages Router).
- `src/components/layout/` — `AppShell`, `Sidebar`, `ProtectedRoute`.
- `src/contexts/AuthContext.tsx` — sesión Supabase + perfil con join a `schools`.
- `src/api/axios.ts` — base URL + interceptor JWT.
- `src/hooks/` — TanStack Query hooks contra la API.
- `src/lib/queryClient.ts` — caché persistida (24 h, buster por build).

## Roles

`super_admin`, `admin`, `profesor`, `padre`, `alumno` — el sidebar y los wrappers de ruta filtran por rol.

## PWA (diferida)

La migración a Next no incluye service worker ni manifest todavía: los iconos de
`public/` existen, pero nada los registra. `playwright.pwa.config.ts` y
`e2e/pwa.spec.ts` quedan como referencia para la segunda fase.

Para retomarla (Serwist u equivalente) hay que reproducir lo que hacía
`vite-plugin-pwa`: precache del build, `NetworkFirst` para GET `/api` (excluyendo
`/api/chat`, que es SSE), `CacheFirst` para Supabase Storage, y el aviso de
"nueva versión disponible" que antes vivía en `ReloadPrompt`.

Los iconos se regeneran desde `public/icon.svg`:

```bash
npx sharp-cli -i public/icon.svg -o public/pwa-512.png resize 512 512
# idem 192, apple-touch-icon 180 y favicon-32 32; maskable-512 sale de una
# variante sin borde redondeado y con el glifo al ~60% del lienzo.
```
