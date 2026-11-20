---
tipo: indice
area: backend
estado: verificado
actualizado: 2026-10-27
fuentes:
  - backend/api/index.ts
  - backend/api/app.ts
  - backend/api/routes/index.ts
  - backend/package.json
tags:
  - backend
---

# Mapa backend

## Capas

```text
api/index.ts        carga dotenv (solo fuera de producción) e inicia el listen
api/app.ts          CORS, JSON 1 MB, /api/health, 404/500 JSON
api/routes/index.ts monta 18 routers bajo /api
api/routes/*.ts     declara método + path + middlewares de rol
api/controllers/*   lógica y consultas a Supabase
api/services/       acceso a alumnos, credenciales, email, chat
api/middlewares/    auth, tenant, rate limit
api/config/         supabaseAdmin, push
```

## Carpetas

| Ruta | Qué contiene |
|---|---|
| `api/routes/` | 18 routers + `index.ts`; única fuente de métodos y roles |
| `api/controllers/` | 19 controladores; un archivo por recurso |
| `api/services/` | `access.ts`, `credentials.ts`, `email.service.ts`, `chat/` |
| `api/middlewares/` | `auth`, `tenant` (`requireRole`), `rate-limit`, `permission` |
| `api/config/` | `supabase.ts` (falla al importar sin env), `push.ts` |
| `api/__tests__/` | 28 suites Jest con Supabase mockeado |
| `api/scripts/` | `dump-routes.ts` → `api-contract.json` |
| `scripts/` | evaluación del chat (`eval-chat.ts`), exportación del dataset e importadores |
| `dist/` | Build commiteado; no editar a mano |

## Convenciones

- Un controlador por recurso, exports nombrados (`getStudents`, `createStudent`, …).
- Errores JSON en español; el `catch` responde 500 genérico.
- Toda consulta de tabla con tenant filtra `.eq('school_id', …)`.
- El tenant se lee de `req.tenant!`, **nunca** del body o query del cliente.
- Los endpoints con `:studentId` pasan por `findStudentForTenant`.
- Nombres de archivo no siempre coinciden con el recurso: `/attendances` vive en `attendance.routes.ts`; `/payments` en `payment.routes.ts`.

## Pruebas

- `npm test`: 28 suites, Supabase mockeado.
- `npm run eval:chat`: 38 casos de selección de herramienta del asistente, sin tocar la base de datos.
- `contract.test.ts` compara el router real con `api-contract.json`.
- `chat-tools.test.ts` valida que las 34 tools del chat apunten a endpoints existentes y respeten roles.

## Antes de tocar

- [[Middlewares y autenticacion]] para el orden de guards.
- [[Multi-tenant]] para el aislamiento.
- [[Agregar un endpoint]] para el procedimiento completo.

Rutas exactas: [[API - rutas]].
