---
tipo: nota
area: dominio
estado: verificado
actualizado: 2026-10-28
fuentes:
  - backend/api-contract.json
  - backend/api/middlewares/tenant.middleware.ts
  - backend/api/services/access.ts
  - backend/api/controllers/permission.controller.ts
tags:
  - dominio
  - seguridad
---

# Roles y permisos

## Los cinco roles

`super_admin` · `admin` · `profesor` · `padre` · `alumno`

En las rutas, `super_admin` aparece junto a `admin`; no hay endpoint exclusivo de `super_admin` en el contrato actual.

## Matriz según la API

| Capacidad | super_admin | admin | profesor | padre | alumno |
|---|:--:|:--:|:--:|:--:|:--:|
| Dashboard propio | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ver alumnos | ✓ | ✓ | ✓ (sus categorías) | ✓ (sus hijos) | — |
| Crear / editar alumno | ✓ | ✓ | ✓ | — | — |
| Borrar alumno | ✓ | ✓ | — | — | — |
| Pase de lista | ✓ | ✓ | ✓ | — | — |
| Ver asistencias | ✓ | ✓ | ✓ | ✓ (hijos) | ✓ (propias) |
| Crear / editar evento | ✓ | ✓ | ✓ | — | — |
| Cancelar sesión | ✓ | ✓ | ✓ | — | — |
| Borrar evento | ✓ | ✓ | — | — | — |
| Ver todos los pagos / pendientes | ✓ | ✓ | — | — | — |
| Registrar pagos | ✓ | ✓ | — | — | — |
| Ver pagos propios o de hijos | ✓ | ✓ | — | ✓ | ✓ |
| Estado de cuenta | ✓ | ✓ | — | ✓ | — |
| Categorías: ver | ✓ | ✓ | ✓ | ✓ | ✓ |
| Categorías: crear / editar / asignar | ✓ | ✓ | — | — | — |
| Invitar profesor / admin | ✓ | ✓ | — | — | — |
| Invitar padre | ✓ | ✓ | ✓ | — | — |
| Ver usuarios | ✓ | ✓ | ✓ | — | — |
| Editar usuario | ✓ | ✓ | — | — | — |
| Permisos de profesor | ✓ | ✓ | lee los suyos | — | — |
| Chat IA | ✓ | ✓ | — | — | — |
| Exportar pagos / asistencias | ✓ | ✓ | — | — | — |
| Subir avatar | ✓ | ✓ | ✓ | ✓ | ✓ |
| Subir logo | ✓ | ✓ | — | — | — |
| Sedes: ver | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sedes: crear / editar / borrar | ✓ | ✓ | — | — | — |
| Inscripciones: ver solicitudes e invitaciones | ✓ | ✓ | ✓ | — | — |
| Inscripciones: invitar por link | ✓ | ✓ | ✓ | — | — |
| Inscripciones: aprobar, rechazar, reabrir o borrar invitación | ✓ | ✓ | — | — | — |
| Inscripciones: revisar documentos del expediente | ✓ | ✓ | — | — | — |
| Consentimiento: plantilla y registro del alumno | ✓ | ✓ | ✓ | — | — |
| Consentimiento: descargar el PDF del alumno | ✓ | ✓ | — | ✓ | ✓ |

Fuente: `backend/api-contract.json` (103 endpoints en 18 grupos, `requireRole`
por ruta; verificado 2026-10-27). La UI puede ser más estricta que la API; por ejemplo, `/achievements` no incluye a `profesor` aunque la API sí le permita el `check`.

## Rutas públicas por token

Cinco rutas del expediente van **sin autenticación ni tenant**: la única
credencial es el token del link de inscripción.

| Método | Ruta |
|---|---|
| `GET` | `/api/enrollment/:token` |
| `PUT` | `/api/enrollment/:token/draft` |
| `POST` | `/api/enrollment/:token/submit` |
| `POST` | `/api/enrollment/:token/documents` |
| `GET` | `/api/enrollment/:token/consent.pdf` |

Quien tenga el link entra: trátalo como una credencial, no como una URL. Las
otras tres rutas abiertas son `POST /api/auth/register`,
`POST /api/auth/resolve-student` y `GET /api/health`.

## Reglas de alcance

| Rol | Alcance |
|---|---|
| admin / super_admin | toda su escuela |
| profesor | alumnos de las categorías donde está en `category_teachers` |
| padre | alumnos con `students.parent_id = user_id` |
| alumno | su propia ficha (`students.id = user_id`) |

El alcance por fila **no** lo da `requireRole`; lo da `findStudentForTenant` o filtros explícitos en el controlador. Ver [[Middlewares y autenticacion]].

## `teacher_permissions`

Seis flags por profesor. Se editan con `PUT /api/permissions/:id` (admin) y se leen con `GET /api/permissions/mine`.

> [!warning] No son enforcement
> Ninguna ruta usa estos flags para autorizar (solo se leen para mostrarlos; verificado 2026-10-26). Son datos para la UI, no un control de acceso. Ver [[Deriva conocida]].

## `ProtectedRoute` no es seguridad

`web/src/components/layout/ProtectedRoute.tsx` solo decide qué renderizar. Cualquiera puede llamar a la API directamente con su token; la única barrera real es el backend.

## Roles y navegación

El sidebar y las páginas cambian por rol, pero el mapeo autoritativo está en [[Rutas web]] (generado desde `ProtectedRoute`).

Relacionado: [[Multi-tenant]].
