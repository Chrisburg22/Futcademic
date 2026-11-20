---
tipo: nota
area: backend
estado: verificado
actualizado: 2026-10-26
fuentes:
  - backend/api/middlewares/auth.middleware.ts
  - backend/api/middlewares/tenant.middleware.ts
  - backend/api/middlewares/rate-limit.middleware.ts
  - backend/api/services/access.ts
  - backend/api/routes/auth.routes.ts
tags:
  - backend
  - seguridad
---

# Middlewares y autenticacion

## Cadena típica

```text
requireAuth → requireTenant → requireRole(...) → controller
```

| Middleware | Qué hace | Falla con |
|---|---|---|
| `requireAuth` | Lee `Authorization: Bearer`, valida el JWT con `supabaseAdmin.auth.getUser` y deja `req.user` | 401 |
| `requireTenant` | Busca la fila en `users` y fija `req.tenant = { school_id, role, user_id }` | 401 si no hay auth; 403 si no tiene escuela |
| `requireRole(...roles)` | Compara `req.tenant.role` contra la lista | 403 |
| `rateLimit({max, windowMs})` | Ventana en memoria por IP; `Retry-After` en 429 | 429 |
| `findStudentForTenant` | Autorización por fila para endpoints con alumno | 404/403/500 |

## Orden real

1. `app.ts` aplica CORS y `express.json({ limit: '1mb' })`.
2. Cada router decide: algunos hacen `router.use(requireAuth, requireTenant)` y luego `requireRole` por ruta.
3. `requireRole` **solo mira el rol**. No valida pertenencia de filas.
4. Por eso todo `studentId` debe pasar por `findStudentForTenant`.

## `findStudentForTenant`

`backend/api/services/access.ts`

| Rol | Puede ver |
|---|---|
| `super_admin`, `admin`, `profesor` | cualquier alumno de su escuela |
| `padre` | alumnos con `students.parent_id === user_id` |
| `alumno` | su propia ficha (`students.id === user_id`) |

Siempre filtra `id` **y** `school_id`. Devuelve `{ student }` o `{ denied: { status, error } }`.

> [!warning] Regla de seguridad
> `requireRole` no impide que un padre cambie el id de la URL y lea otra familia. Si el endpoint recibe un alumno y no llama a `findStudentForTenant`, es un hueco de autorización.

## Rate limit

| Ruta | Límite |
|---|---|
| `POST /api/auth/register` | 10 por hora por IP |
| `POST /api/auth/resolve-student` | 20 cada 10 minutos por IP |

Es por proceso: no es cuota estricta con varias instancias, pero corta el escaneo automatizado. `resolve-student` traduce un username al email interno del alumno; sin límite permitiría enumerar el padrón.

## `requireRole` y el contrato

`requireRole` adjunta la lista de roles a la función guard (`(guard as any).roles = roles`). `dump-routes.ts` lee esa propiedad para generar `api-contract.json`. Si se declara el rol de otra forma, el contrato sale sin roles.

## Checklist al crear una ruta

- [ ] `requireAuth` + `requireTenant` (o `router.use`).
- [ ] `requireRole(...)` con los roles mínimos.
- [ ] Si recibe alumno: `findStudentForTenant`.
- [ ] Si es pública: `rateLimit`.
- [ ] `npm run routes:dump`.
- [ ] Test de RBAC/ownership si aplica.

Ver [[Roles y permisos]] y [[Agregar un endpoint]].
