---
tipo: indice
area: web
estado: verificado
actualizado: 2026-10-26
fuentes:
  - web/app
  - web/src
  - web/src/components/providers/Providers.tsx
  - web/src/components/auth/AuthGate.tsx
  - web/next.config.ts
tags:
  - web
---

# Mapa web

## Stack

Next.js 16 (App Router) · React 19 · Mantine 7 · TanStack Query 5 · axios · Supabase JS · Tailwind (utilidades).

## Estructura

```text
web/
├── app/
│   ├── layout.tsx            único server component: metadata + Providers
│   ├── (auth)/               área pública: login, register, invite…
│   └── (app)/                área autenticada: ProtectedRoute → AuthGate → AppShell
├── src/
│   ├── screens/              implementación real de cada pantalla
│   ├── hooks/                TanStack Query + axios
│   ├── api/axios.ts          baseURL + interceptor JWT
│   ├── contexts/AuthContext  sesión, perfil, signOut
│   ├── components/           layout, auth, chat, attendance, finances, common
│   ├── lib/queryClient.ts    caché persistida y buster por build
│   └── types/index.ts        tipos del dominio
├── e2e/                      Playwright con backend mockeado
└── next.config.ts            inyecta NEXT_PUBLIC_BUILD_ID
```

## Árbol de providers

```text
app/layout.tsx (server)
└── Providers (client)
    ├── MantineProvider
    ├── Notifications + ModalsProvider
    └── PersistQueryClientProvider
        └── AuthProvider
            └── children
```

`app/(app)/layout.tsx` añade `ProtectedRoute` (sesión) → `AuthGate` (contraseña/onboarding) → `AppShell`.

## Auth y sesión

- `supabase` se crea en `src/config/supabase.ts` con `localStorage` y `autoRefreshToken`.
- `AuthContext` escucha `onAuthStateChange`, carga el perfil de `users` y el extra de `profile_information`.
- `AuthGate` fuerza:
  - `/change-password` si `must_change_password`;
  - `/onboarding` si rol `profesor|padre|alumno` y no tiene `onboarded_at`.
- `ProtectedRoute` solo decide qué mostrar; **la seguridad real está en la API**.

## Datos

- Hooks → `api` (axios) → Express. Ver [[Hooks y endpoints]].
- Excepción deliberada: auth/perfil usan Supabase directo.
- La caché se persiste en localStorage (no en SSR) y se invalida al cambiar `NEXT_PUBLIC_BUILD_ID`.
- No hay `src/pages/`: sería el Pages Router y rompería la app.

## Navegación

- `useRouter`, `useParams`, `usePathname` de `next/navigation`; `Link` de `next/link`.
- `<Redirect>` propio reemplaza a `<Navigate>` de React Router. No reintroducir `react-router-dom`.

Ver [[Convenciones web]] y [[Rutas web]].
