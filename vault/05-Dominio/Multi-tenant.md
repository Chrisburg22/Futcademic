---
tipo: nota
area: dominio
estado: verificado
actualizado: 2026-10-26
fuentes:
  - backend/api/middlewares/tenant.middleware.ts
  - backend/api/services/access.ts
  - backend/api/controllers/student.controller.ts
  - backend/api/__tests__/tenant-isolation.test.ts
  - backend/api/__tests__/ownership.test.ts
tags:
  - dominio
  - seguridad
---

# Multi-tenant

## Idea

Muchas academias comparten la misma base. Cada fila de negocio lleva `school_id` y toda consulta debe filtrar por el `school_id` del token, no por el que mande el cliente.

## De dónde sale el tenant

```text
JWT (Supabase Auth)
  → requireAuth valida y deja req.user.id
  → requireTenant busca users.id = req.user.id
  → req.tenant = { school_id, role, user_id }
```

El `school_id` **nunca** se toma del body, query o header. Si el usuario no tiene fila en `users`, `requireTenant` responde 403.

## Dónde se aplica

| Capa | Qué hace |
|---|---|
| `requireTenant` | fija el tenant en el request |
| Controladores | `.eq('school_id', school_id)` en cada consulta |
| `findStudentForTenant` | además valida que el alumno sea del usuario/rol |
| `sendPushNotification` | notifica solo a usuarios del tenant consultado |
| Tests | `tenant-isolation.test.ts`, `ownership.test.ts`, `TC-I-02` |

## Tablas sin `school_id`

`payment_students` y `student_achievements` heredan el tenant de `payments` / `students`. Al consultarlas:

- filtra por el padre (`payment_id`, `student_id`) que ya está acotado;
- no intentes `.eq('school_id', …)` en esas tablas: la columna no existe.

## Errores típicos

| Síntoma | Causa |
|---|---|
| Un usuario ve datos de otra academia | consulta sin `school_id` o `school_id` tomado del cliente |
| Un padre ve otro alumno | falta `findStudentForTenant` |
| Un profesor ve toda la escuela | falta el filtro por `category_teachers` en `GET /students` |
| 403 "Usuario no pertenece a ninguna escuela" | fila ausente en `users` o `school_id` nulo |

## RLS

`schema.sql` no incluye políticas RLS. El aislamiento verificable es el backend. Si se habilita RLS en Supabase, el backend con **service role** la salta igualmente: RLS protegería accesos directos con la `anon key`, no reemplaza los filtros del backend. Ver [[Deriva conocida]].

## Checklist

- [ ] Toda tabla de negocio filtra `school_id`.
- [ ] Todo `studentId` pasa por `findStudentForTenant`.
- [ ] El `school_id` viene de `req.tenant`, no del request.
- [ ] Un test de aislamiento cubre el endpoint nuevo.

Ver [[Roles y permisos]] y [[Middlewares y autenticacion]].
