---
tipo: nota
area: proyecto
estado: verificado
actualizado: 2026-10-27
fuentes:
  - AGENTS.md
  - backend/package.json
  - web/package.json
  - landing/README.md
  - schema.sql
tags:
  - proyecto
---

# Despliegue

| Pieza | Destino | Notas |
|---|---|---|
| `web/` | Vercel | Next.js detectado automáticamente; **no hay `vercel.json`** |
| `backend/` | Render | `https://futcademic-backend.onrender.com`; arranca `node dist/index.js` |
| `landing/` | Host estático propio | Se sirve el `dist/` de Astro |
| Base de datos | Supabase | SQL aplicado a mano en el SQL Editor |

## Orden de un cambio con base de datos

1. Crear migración fechada en `migrations/` (`YYYYMMDD_descripcion.sql`), idempotente.
2. Aplicarla en Supabase **antes** de desplegar el código que depende de ella.
3. Actualizar `schema.sql` si el cambio debe existir en instalaciones nuevas.
4. `cd backend && npm run build` y commitear `dist/` con la fuente.
5. Actualizar docs EN/ES y regenerar la bóveda.

No hay runner de migraciones: se pegan en el SQL Editor, en orden de nombre. Ver [[Migraciones]].

## Backend en Render

- Build: `npm install && npm run build` (equivalente; `dist/` ya viene commiteado).
- Start: `node dist/index.js`.
- Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` y, según uso, `ANTHROPIC_API_KEY`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`, `WEB_APP_URL`, `CORS_ORIGIN`, `INTERNAL_API_URL`, `SCHOOL_TIMEZONE`, `PORT`.
- Health check: `GET /api/health` → `{ "status": "ok" }`.

## Web en Vercel

- Vercel detecta Next.js; si pide directorio del proyecto, es `web/`.
- Build: `npm run build`; output Next estándar.
- Variables: las tres `NEXT_PUBLIC_*`. `NEXT_PUBLIC_BUILD_ID` la genera el build.
- El `NEXT_PUBLIC_API_URL` debe apuntar al backend de Render con `/api`.

## Landing

- Build: `cd landing && npm run build`; publicar `dist/`.
- Variables `PUBLIC_*` en el host.
- Si `PUBLIC_APP_URL` falta, los CTA apuntan al dominio de ejemplo.

## Checklist post-deploy

- [ ] `GET /api/health` responde 200.
- [ ] Login y una lectura autenticada funcionan (JWT + tenant).
- [ ] La web apunta al backend correcto (consola sin CORS).
- [ ] Las migraciones nuevas están aplicadas.
- [ ] `npm run routes:dump` sin cambios pendientes en `api-contract.json`.

No hay CI ni hooks: este checklist es manual.
