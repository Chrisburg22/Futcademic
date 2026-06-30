# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Futcamedic — multi-tenant football academy management app. Three workspaces:
- `backend/` — Express + TypeScript API, deployed to Render.com
- `mobile/` — Expo (React Native) app with Expo Router, NativeWind (Tailwind), Supabase direct client
- `web/` — Vite + React 19 admin panel using Mantine UI, TanStack Query, Supabase + axios to backend

## Commands

### Backend
```bash
cd backend
npm run dev       # ts-node api/index.ts (local)
npm run build     # tsc → dist/
npm start         # node dist/index.js
```

### Mobile
```bash
cd mobile
npx expo start          # Metro bundler
npx expo run:ios        # iOS simulator
npx expo run:android    # Android (use IP 10.0.2.2 for emulator if localhost fails)
npx expo start --web    # Web
```

### Web (admin panel)
```bash
cd web
npm run dev      # vite dev server
npm run build    # tsc -b && vite build
npm run lint     # eslint .
```

## Architecture

### Multi-tenancy
Every DB table has `school_id`. Two backend middlewares enforce isolation:
- `requireAuth` (`api/middlewares/auth.middleware.ts`) — validates Supabase JWT, sets `req.user`
- `requireTenant` (`api/middlewares/tenant.middleware.ts`) — looks up `users` table, sets `req.tenant = { school_id, role, user_id }`
- `requireRole(...roles)` — role-based access on top of tenant

Roles: `super_admin`, `admin`, `profesor`, `padre`, `alumno`

### Backend layout
```
api/
  index.ts           # Express app entry + Vercel handler
  config/supabase.ts # supabaseAdmin (service role key)
  middlewares/       # auth + tenant
  controllers/       # auth, user, student, attendance, payment, event, category, school
  routes/index.ts    # mounts all routers under /api
src/
  app.js             # legacy JS stub (unused, ignore)
```
Backend deployed via `render.com`

### Mobile layout
```
app/              # Expo Router file-based routes
  (tabs)/         # tab navigator: home, attendance, finances, profile
  admin/          # admin screens: students, teachers, events, categories, settings/*
  login.tsx / register.tsx
src/
  contexts/AuthContext.tsx   # Supabase session + profile (with school join), useAuth()
  config/supabase.ts         # Supabase anon client
  api/axios.ts               # axios instance, auto-injects Bearer token from Supabase session
  hooks/                     # useStudents, useAttendances, usePayments, useEvents, useCategories, useUsers, useSettings
```

### Data flow
- Mobile uses **both** direct Supabase client (for auth, real-time queries via hooks) and the Express REST API via axios (for mutating operations that need tenant validation)
- `EXPO_PUBLIC_API_URL` env var controls backend base URL (defaults to `http://localhost:3000/api`)
- `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` for direct Supabase access

### Database (Supabase / PostgreSQL)
Base schema in `schema.sql`. Incremental changes live in `migrations/` (e.g. `20260511_add_financial_fields.sql`) — apply on top of base. Data extraction helper at `scripts/extract_data.py`. Key tables: `schools`, `users`, `categories`, `category_teachers`, `students`, `attendances`, `payments`, `events`. All use UUID PKs. `users.id` references `auth.users(id)`.

### Docs
`docs/` holds project documentation split into `arquitectura/`, `product/`, `scrum/`, `technical/`.

### Mobile hooks pattern
All hooks in `src/hooks/` use **TanStack Query** (`useQuery` / `useMutation`) wrapping the REST API via `src/api/axios.ts`. Mutations call `queryClient.invalidateQueries` on success. No direct Supabase queries inside hooks — Supabase is only used directly in `AuthContext` and `src/config/supabase.ts`.

### Environment variables
Backend (`backend/.env`):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — service role for admin operations
- `CORS_ORIGIN` — allowed origin (optional, defaults to `*`)

Mobile (`mobile/.env`):
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL` — backend base URL (default `http://localhost:3000/api`)

### No test suite
No automated tests exist. Validate changes by running the dev servers and testing manually.
