---
tipo: generado
generado_por: scripts/vault/vault.py
hash: 5e862a82dfa0
actualizado: 2026-11-20
tags:
  - backend
  - generado
---

<!-- No editar a mano: python3 scripts/vault/vault.py generar -->

# API - rutas

Contrato real del backend, leído de `backend/api-contract.json`.

- **113 endpoints** en **19 grupos**.
- **8 públicos** (sin token); el resto exige `Authorization: Bearer`.
- La columna **Acceso** sale de `requireRole(...)`; `autenticado` significa que la ruta no declara roles.

> [!info] Cómo regenerar
> `cd backend && npm run routes:dump` y después `python3 scripts/vault/vault.py generar`.

## Grupos

- [[#auth]] (6)
- [[#users]] (8)
- [[#students]] (20)
- [[#attendances]] (4)
- [[#categories]] (9)
- [[#payments]] (7)
- [[#events]] (8)
- [[#schools]] (1)
- [[#venues]] (4)
- [[#permissions]] (3)
- [[#dashboard]] (4)
- [[#export]] (2)
- [[#notifications]] (3)
- [[#achievements]] (2)
- [[#upload]] (7)
- [[#parents]] (3)
- [[#chat]] (6)
- [[#health]] (1)
- [[#enrollment]] (15)

## auth

6 endpoints · `backend/api/routes/auth.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/api/auth/invite-admin` | super_admin, admin |
| `POST` | `/api/auth/invite-parent` | super_admin, admin, profesor |
| `POST` | `/api/auth/invite-teacher` | super_admin, admin |
| `POST` | `/api/auth/register` | público |
| `POST` | `/api/auth/resend-invite` | super_admin, admin |
| `POST` | `/api/auth/resolve-student` | público |

## users

8 endpoints · `backend/api/routes/user.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/users` | super_admin, admin, profesor |
| `PUT` | `/api/users/:id` | super_admin, admin |
| `POST` | `/api/users/me/complete-onboarding` | autenticado |
| `PATCH` | `/api/users/me/password` | autenticado |
| `PATCH` | `/api/users/me/password-changed` | autenticado |
| `PATCH` | `/api/users/me/profile` | autenticado |
| `PATCH` | `/api/users/me/push-token` | autenticado |
| `GET` | `/api/users/teachers/:id` | super_admin, admin |

## students

20 endpoints · `backend/api/routes/student.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/students` | super_admin, admin, profesor, padre |
| `POST` | `/api/students` | super_admin, admin, profesor |
| `DELETE` | `/api/students/:id` | super_admin, admin |
| `GET` | `/api/students/:id` | super_admin, admin, profesor, padre |
| `PUT` | `/api/students/:id` | super_admin, admin, profesor |
| `POST` | `/api/students/:id/consent` | super_admin, admin, profesor |
| `GET` | `/api/students/:id/consent.pdf` | super_admin, admin, padre, alumno |
| `POST` | `/api/students/:id/documents` | super_admin, admin, profesor |
| `DELETE` | `/api/students/:id/documents/:docId` | super_admin, admin, profesor |
| `PATCH` | `/api/students/:id/documents/:docId` | super_admin, admin, profesor |
| `GET` | `/api/students/:id/documents/:docId/url` | super_admin, admin, padre, alumno |
| `POST` | `/api/students/:id/documents/reuse-tutor` | super_admin, admin, profesor |
| `GET` | `/api/students/:id/expediente` | super_admin, admin, profesor, padre, alumno |
| `GET` | `/api/students/:id/expediente/package` | super_admin, admin |
| `GET` | `/api/students/:id/stats` | super_admin, admin, profesor, padre, alumno |
| `PATCH` | `/api/students/:id/status` | super_admin, admin |
| `GET` | `/api/students/:id/team` | super_admin, admin, profesor, padre, alumno |
| `GET` | `/api/students/:id/tutor-documents/availability` | super_admin, admin, profesor |
| `PATCH` | `/api/students/:id/uniform` | super_admin, admin, profesor |
| `GET` | `/api/students/deleted` | super_admin, admin |

## attendances

4 endpoints · `backend/api/routes/attendance.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/api/attendances` | super_admin, admin, profesor |
| `GET` | `/api/attendances/category/:id` | super_admin, admin, profesor |
| `GET` | `/api/attendances/student/:id` | super_admin, admin, profesor, padre, alumno |
| `PATCH` | `/api/attendances/trainings/:id/complete` | super_admin, admin, profesor |

## categories

9 endpoints · `backend/api/routes/category.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/categories` | autenticado |
| `POST` | `/api/categories` | super_admin, admin, profesor |
| `GET` | `/api/categories/:id` | autenticado |
| `PATCH` | `/api/categories/:id` | super_admin, admin, profesor |
| `PATCH` | `/api/categories/:id/status` | super_admin, admin |
| `POST` | `/api/categories/:id/teachers` | super_admin, admin, profesor |
| `DELETE` | `/api/categories/:id/teachers/:teacherId` | super_admin, admin, profesor |
| `POST` | `/api/categories/full` | super_admin, admin, profesor |
| `GET` | `/api/categories/mine` | profesor |

## payments

7 endpoints · `backend/api/routes/payment.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/payments` | super_admin, admin |
| `GET` | `/api/payments/account-statement/:studentId` | super_admin, admin, padre |
| `GET` | `/api/payments/pending` | super_admin, admin |
| `GET` | `/api/payments/student/:id` | super_admin, admin, padre, alumno |
| `POST` | `/api/payments/students` | super_admin, admin |
| `GET` | `/api/payments/summary` | super_admin, admin |
| `POST` | `/api/payments/teachers` | super_admin, admin |

## events

8 endpoints · `backend/api/routes/event.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/events` | autenticado |
| `POST` | `/api/events` | super_admin, admin, profesor |
| `DELETE` | `/api/events/:id` | super_admin, admin |
| `GET` | `/api/events/:id` | autenticado |
| `PUT` | `/api/events/:id` | super_admin, admin, profesor |
| `GET` | `/api/events/:id/trainings` | autenticado |
| `POST` | `/api/events/cancel` | super_admin, admin, profesor |
| `GET` | `/api/events/trainings` | autenticado |

## schools

1 endpoints · `backend/api/routes/school.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `PUT` | `/api/schools/:id` | super_admin, admin |

## venues

4 endpoints · `backend/api/routes/venue.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/venues` | autenticado |
| `POST` | `/api/venues` | super_admin, admin |
| `DELETE` | `/api/venues/:id` | super_admin, admin |
| `PATCH` | `/api/venues/:id` | super_admin, admin |

## permissions

3 endpoints · `backend/api/routes/permission.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/permissions/:id` | super_admin, admin |
| `PUT` | `/api/permissions/:id` | super_admin, admin |
| `GET` | `/api/permissions/mine` | profesor |

## dashboard

4 endpoints · `backend/api/routes/dashboard.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/dashboard/admin` | super_admin, admin |
| `GET` | `/api/dashboard/alumno` | super_admin, admin, alumno |
| `GET` | `/api/dashboard/padre` | super_admin, admin, padre |
| `GET` | `/api/dashboard/profesor` | super_admin, admin, profesor |

## export

2 endpoints · `backend/api/routes/export.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/export/attendance` | super_admin, admin |
| `GET` | `/api/export/payments` | super_admin, admin |

## notifications

3 endpoints · `backend/api/routes/notification.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/notifications` | autenticado |
| `PATCH` | `/api/notifications/:id/read` | autenticado |
| `PATCH` | `/api/notifications/read-all` | autenticado |

## achievements

2 endpoints · `backend/api/routes/achievement.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/achievements` | super_admin, admin, alumno, padre |
| `POST` | `/api/achievements/check` | super_admin, admin, profesor |

## upload

7 endpoints · `backend/api/routes/upload.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `DELETE` | `/api/upload/avatar` | super_admin, admin, profesor, padre, alumno |
| `POST` | `/api/upload/avatar` | super_admin, admin, profesor, padre, alumno |
| `DELETE` | `/api/upload/category/:id/logo` | super_admin, admin |
| `POST` | `/api/upload/category/:id/logo` | super_admin, admin |
| `POST` | `/api/upload/logo` | super_admin, admin |
| `DELETE` | `/api/upload/student/:id/photo` | super_admin, admin, profesor |
| `POST` | `/api/upload/student/:id/photo` | super_admin, admin, profesor |

## parents

3 endpoints · `backend/api/routes/parent.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `DELETE` | `/api/parents/children/:id` | padre |
| `POST` | `/api/parents/link-child` | padre |
| `GET` | `/api/parents/me/children` | padre |

## chat

6 endpoints · `backend/api/routes/chat.routes.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/chat/conversations` | super_admin, admin |
| `DELETE` | `/api/chat/conversations/:id` | super_admin, admin |
| `POST` | `/api/chat/conversations/:id/confirm` | super_admin, admin |
| `GET` | `/api/chat/conversations/:id/messages` | super_admin, admin |
| `POST` | `/api/chat/conversations/:id/messages` | super_admin, admin |
| `POST` | `/api/chat/messages/:id/feedback` | super_admin, admin |

## health

1 endpoints · `backend/api/app.ts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/health` | público |

## enrollment

15 endpoints · —

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/enrollment/:token` | público |
| `GET` | `/api/enrollment/:token/consent.pdf` | público |
| `POST` | `/api/enrollment/:token/documents` | público |
| `PUT` | `/api/enrollment/:token/draft` | público |
| `POST` | `/api/enrollment/:token/submit` | público |
| `GET` | `/api/enrollment/applications` | super_admin, admin, profesor |
| `GET` | `/api/enrollment/applications/:id` | super_admin, admin, profesor |
| `POST` | `/api/enrollment/applications/:id/approve` | super_admin, admin |
| `PATCH` | `/api/enrollment/applications/:id/documents/:docId` | super_admin, admin |
| `POST` | `/api/enrollment/applications/:id/reject` | super_admin, admin |
| `POST` | `/api/enrollment/applications/:id/reopen` | super_admin, admin |
| `GET` | `/api/enrollment/consent-template` | super_admin, admin, profesor |
| `GET` | `/api/enrollment/invitations` | super_admin, admin, profesor |
| `POST` | `/api/enrollment/invitations` | super_admin, admin, profesor |
| `DELETE` | `/api/enrollment/invitations/:id` | super_admin, admin |
