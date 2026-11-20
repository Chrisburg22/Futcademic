---
tipo: nota
area: proyecto
estado: verificado
actualizado: 2026-10-26
fuentes:
  - AGENTS.md
  - backend/api/config/supabase.ts
  - backend/api/services/email.service.ts
  - web/next.config.ts
  - landing/src/consts.ts
tags:
  - proyecto
---

# Entornos y variables

## API (`backend/`)

| Variable | Uso | Obligatoria |
|---|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase | sí |
| `SUPABASE_SERVICE_KEY` | Service role. **No** se llama `SUPABASE_SERVICE_ROLE_KEY` | sí |
| `PORT` | Puerto de Express (default 3000) | no |
| `CORS_ORIGIN` | Origen permitido (default `*`) | no |
| `ANTHROPIC_API_KEY` | Chat IA | para el chat |
| `SENDGRID_API_KEY` | Envío de invitaciones | para email |
| `SENDGRID_FROM_EMAIL` | Remitente (default `no-reply@futcademic.com`) | no |
| `SENDGRID_FROM_NAME` | Nombre del remitente (default `Futcademic`) | no |
| `WEB_APP_URL` | Base de los links de activación (default `http://localhost:5173`) | no |
| `INTERNAL_API_URL` | Base para las tools del chat | no |

- `api/config/supabase.ts` **lanza al importar** si falta `SUPABASE_URL` o `SUPABASE_SERVICE_KEY`. Tests y scripts deben definir ambas.
- `api/index.ts` carga `dotenv` solo si `NODE_ENV !== 'production'`; en Render las variables se inyectan.
- Sin `SENDGRID_API_KEY`, `isEmailConfigured()` es `false` y **la invitación no se envía** (se registra un aviso, no falla).

## Panel (`web/`)

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base de la API. Fallback: `http://localhost:3000/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública) |
| `NEXT_PUBLIC_BUILD_ID` | Inyectada por `next.config.ts` en cada build; invalida la caché persistida |

## Landing (`landing/`)

| Variable | Uso | Default |
|---|---|---|
| `PUBLIC_APP_URL` | Base de los CTA a `/register` | `https://app.futcademic.com` |
| `PUBLIC_SITE_URL` | URL canónica (OG, sitemap) | `https://futcademic.com` |
| `PUBLIC_PRIVACY_URL` | Aviso de privacidad; vacío ⇒ no se enlaza | vacío |

## Reglas de secretos

- `backend/.env` está **commiteado** en su repo por legado. No agregar secretos nuevos en texto plano.
- El `.gitignore` raíz bloquea `**/.env`, `.env.local`, `.env.production`, `.env.test` y variantes.
- La `service key` solo vive en el backend. El navegador usa la `anon key`.
- Nunca poner secretos en `NEXT_PUBLIC_*`: se bundlean al cliente.

Ver [[Despliegue]] para dónde va cada variable.
