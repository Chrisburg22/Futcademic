# Futcamedic Web

React + TypeScript web app — paridad funcional con `mobile/`. Consume el backend Express + Supabase.

## Stack
- Vite + React 19 + TypeScript
- Mantine v7 (UI) + Tailwind v3 (utilitarias)
- React Router v6
- TanStack Query v5
- Supabase JS v2
- Axios

## Setup

```bash
cd web
cp .env.example .env   # rellena VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev            # http://localhost:5173
```

Backend debe correr en paralelo:
```bash
cd ../backend && npm run dev   # http://localhost:3000
```

## Scripts
- `npm run dev` — Vite en modo dev
- `npm run build` — typecheck + build a `dist/`
- `npm run preview` — sirve `dist/`

## Estructura
- `src/config/supabase.ts` — cliente Supabase con `localStorage`
- `src/api/axios.ts` — base URL + interceptor JWT
- `src/contexts/AuthContext.tsx` — sesión + perfil con join a `schools`
- `src/hooks/` — TanStack Query hooks (port 1:1 desde mobile)
- `src/components/layout/` — AppShell, Sidebar (role-based), ProtectedRoute
- `src/pages/` — todas las pantallas: auth, dashboard, tabs, admin, settings

## Roles soportados
`super_admin`, `admin`, `profesor`, `padre` — sidebar y rutas filtran por rol como en mobile.
