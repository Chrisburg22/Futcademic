---
tipo: generado
generado_por: scripts/vault/vault.py
hash: 601e485c07af
actualizado: 2026-11-20
tags:
  - web
  - generado
---

<!-- No editar a mano: python3 scripts/vault/vault.py generar -->

# Hooks y endpoints

Qué hook de TanStack Query llama a qué endpoint. Se lee de `web/src/hooks/*.ts`.

- **17 de 19 hooks** con llamadas literales, **90 llamadas**.
- Los hooks con URL construida en una variable aparecen abajo.
- No incluye `web/src/contexts/`: el chat (SSE) vive en `ChatContext.tsx`; ver [[Chat IA]].

## useAchievements.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/achievements` | useAchievements.ts:8 |
| `POST` | `/achievements/check` | useAchievements.ts:17 |

## useAttendances.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/attendances/student/${studentId}` | useAttendances.ts:19 |
| `PATCH` | `/attendances/trainings/${trainingId}/complete` | useAttendances.ts:27 |
| `POST` | `/attendances` | useAttendances.ts:41 |

## useCategories.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/categories/mine` | useCategories.ts:33 |
| `GET` | `/categories` | useCategories.ts:44 |
| `GET` | `/categories?${params.toString()}` | useCategories.ts:64 |
| `GET` | `/categories/${id}` | useCategories.ts:76 |
| `POST` | `/categories` | useCategories.ts:87 |
| `PATCH` | `/categories/${id}` | useCategories.ts:96 |
| `POST` | `/categories/full` | useCategories.ts:117 |
| `PATCH` | `/categories/${payload.id}/status` | useCategories.ts:130 |
| `POST` | `/categories/${payload.categoryId}/teachers` | useCategories.ts:144 |
| `DELETE` | `/categories/${payload.categoryId}/teachers/${payload.teacherId}` | useCategories.ts:159 |

## useDashboard.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/dashboard/admin` | useDashboard.ts:8 |
| `GET` | `/dashboard/profesor` | useDashboard.ts:15 |
| `GET` | `/dashboard/padre` | useDashboard.ts:22 |
| `GET` | `/dashboard/alumno` | useDashboard.ts:29 |

## useEnrollment.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `POST` | `/enrollment/invitations` | useEnrollment.ts:85 |
| `GET` | `/enrollment/invitations` | useEnrollment.ts:93 |
| `DELETE` | `/enrollment/invitations/${id}` | useEnrollment.ts:99 |
| `GET` | `/enrollment/applications${qs ? ` | useEnrollment.ts:116 |
| `GET` | `/enrollment/applications/${id}` | useEnrollment.ts:123 |
| `POST` | `/enrollment/applications/${payload.id}/approve` | useEnrollment.ts:136 |
| `POST` | `/enrollment/applications/${payload.id}/reject` | useEnrollment.ts:152 |
| `POST` | `/enrollment/applications/${id}/reopen` | useEnrollment.ts:161 |
| `PATCH` | `/enrollment/applications/${payload.application_id}/documents/${payload.document_id}` | useEnrollment.ts:176 |
| `GET` | `/enrollment/consent-template` | useEnrollment.ts:191 |

## useEvents.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/events/${eventId}` | useEvents.ts:28 |
| `GET` | `/events/${eventId}/trainings` | useEvents.ts:37 |
| `POST` | `/events` | useEvents.ts:54 |
| `PUT` | `/events/${id}` | useEvents.ts:73 |
| `POST` | `/events/cancel` | useEvents.ts:88 |
| `DELETE` | `/events/${id}` | useEvents.ts:100 |

## useExpediente.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/students/${studentId}/expediente` | useExpediente.ts:8 |
| `POST` | `/students/${studentId}/consent` | useExpediente.ts:27 |
| `POST` | `/students/${payload.studentId}/documents` | useExpediente.ts:52 |
| `PATCH` | `/students/${studentId}/documents/${documentId}` | useExpediente.ts:75 |
| `DELETE` | `/students/${payload.studentId}/documents/${payload.documentId}` | useExpediente.ts:88 |
| `POST` | `/students/${studentId}/documents/reuse-tutor` | useExpediente.ts:100 |
| `GET` | `/students/${studentId}/tutor-documents/availability` | useExpediente.ts:111 |
| `GET` | `/students/${studentId}/consent.pdf` | useExpediente.ts:122 |
| `GET` | `/students/${studentId}/expediente/package` | useExpediente.ts:129 |

## useMe.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `PATCH` | `/users/me/profile` | useMe.ts:16 |
| `POST` | `/users/me/complete-onboarding` | useMe.ts:21 |

## useNotifications.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/notifications` | useNotifications.ts:8 |
| `PATCH` | `/notifications/${id}/read` | useNotifications.ts:16 |
| `PATCH` | `/notifications/read-all` | useNotifications.ts:24 |

## useParents.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/parents/me/children` | useParents.ts:7 |
| `POST` | `/parents/link-child` | useParents.ts:17 |
| `DELETE` | `/parents/children/${id}` | useParents.ts:29 |

## usePayments.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/payments?${params.toString()}` | usePayments.ts:20 |
| `GET` | `/payments/summary?year=${year}` | usePayments.ts:31 |
| `GET` | `/payments/pending?month=${month}&year=${year}` | usePayments.ts:45 |
| `GET` | `/payments/student/${studentId}` | usePayments.ts:53 |
| `GET` | `/payments/account-statement/${studentId}` | usePayments.ts:61 |
| `POST` | `/payments/students` | usePayments.ts:74 |
| `POST` | `/payments/teachers` | usePayments.ts:87 |

## usePermissions.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/permissions/mine` | usePermissions.ts:9 |
| `GET` | `/permissions/${teacherId}` | usePermissions.ts:17 |
| `PUT` | `/permissions/${id}` | usePermissions.ts:28 |

## useSettings.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `PUT` | `/schools/${id}` | useSettings.ts:8 |

## useStudents.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/students?parent_id=me` | useStudents.ts:7 |
| `POST` | `/students` | useStudents.ts:35 |
| `GET` | `/students/${studentId}` | useStudents.ts:43 |
| `PUT` | `/students/${id}` | useStudents.ts:67 |
| `PATCH` | `/students/${payload.id}/uniform` | useStudents.ts:80 |
| `PATCH` | `/students/${payload.id}/status` | useStudents.ts:94 |
| `PATCH` | `/students/${id}/status` | useStudents.ts:114 |
| `PATCH` | `/students/${id}/uniform` | useStudents.ts:116 |
| `PUT` | `/students/${id}` | useStudents.ts:118 |
| `DELETE` | `/students/${id}` | useStudents.ts:132 |
| `GET` | `/students/${studentId}/stats` | useStudents.ts:141 |
| `GET` | `/students/${studentId}/team` | useStudents.ts:148 |
| `GET` | `/students/deleted` | useStudents.ts:155 |

## useUpload.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `POST` | `/upload/avatar` | useUpload.ts:11 |
| `POST` | `/upload/logo` | useUpload.ts:24 |

## useUsers.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/users` | useUsers.ts:8 |
| `GET` | `/users?role=profesor` | useUsers.ts:14 |
| `GET` | `/users/teachers/${teacherId}` | useUsers.ts:22 |
| `PUT` | `/users/${id}` | useUsers.ts:31 |
| `PATCH` | `/users/me/password-changed` | useUsers.ts:47 |
| `POST` | `/auth/invite-parent` | useUsers.ts:55 |
| `POST` | `/auth/invite-teacher` | useUsers.ts:69 |
| `POST` | `/auth/invite-admin` | useUsers.ts:78 |

## useVenues.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/venues` | useVenues.ts:8 |
| `POST` | `/venues` | useVenues.ts:16 |
| `PATCH` | `/venues/${id}` | useVenues.ts:25 |
| `DELETE` | `/venues/${id}` | useVenues.ts:34 |

## Llamadas con URL dinámica

El generador no puede resolver estas URLs; se mantienen a mano.

| Hook | Endpoints |
| --- | --- |
| `useEvents.ts` | `GET /events`, `GET /events/trainings` |
| `useAttendances.ts` | `GET /attendances/category/:id` |
| `usePayments.ts` | `GET /payments` |
| `useDashboard.ts` | `GET /dashboard/admin\|profesor\|padre\|alumno` |
| `useStudents.ts` | `GET /students` |
