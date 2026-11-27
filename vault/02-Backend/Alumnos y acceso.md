---
tipo: nota
area: backend
estado: verificado
actualizado: 2026-10-26
fuentes:
  - backend/api/controllers/student.controller.ts
  - backend/api/routes/student.routes.ts
  - backend/api/services/access.ts
  - backend/api/services/credentials.ts
tags:
  - backend
  - alumnos
---

# Alumnos y acceso

## Invariantes

1. **`students.id` = `users.id`** para un alumno: se crean juntos en Auth y en `users`.
2. **`students.parent_id`** apunta a `users.id` del padre/tutor.
3. `students.school_id` siempre sale de `req.tenant.school_id`.
4. El alumno no tiene email real: usa `username@<school_id>.alumno.futcademic.local`.
5. `status`: `activo`, `beca`, `pendiente`, `inactivo`.

## Alta

`POST /api/students` (`super_admin`, `admin`, `profesor`)

1. Genera username `nombre.apellido###` único por escuela.
2. Crea usuario en Auth con contraseña temporal y `email_confirm: true`.
3. Inserta `users` con `role: 'alumno'`, `username`, `must_change_password: true`.
4. Inserta `profile_information` vacío.
5. Inserta `students` con el mismo `id` y `status: 'activo'`.
6. Devuelve el alumno + `username` + `temp_password` para que el admin los entregue.

## Listado

`GET /api/students`

| Filtro | Efecto |
|---|---|
| `?category_id=` | filtra por categoría |
| `?parent_id=me` | resuelve al `user_id` del token |
| rol `padre` | fuerza `parent_id = user_id` |
| rol `profesor` | limita a alumnos de sus categorías (`category_teachers`) |

Un profesor sin categorías recibe `[]`, no un error.

## Detalle y edición

| Endpoint | Rol | Nota |
|---|---|---|
| `GET /students/:id` | admin, profesor, padre | pasa por `findStudentForTenant`; añade email de Auth |
| `PUT /students/:id` | admin, profesor | filtra `school_id`; actualiza `students`, `users` y `profile_information` |
| `PATCH /students/:id/uniform` | admin, profesor | `uniform_delivered` |
| `PATCH /students/:id/status` | admin | cambia `status` |
| `DELETE /students/:id` | admin | archiva y **borra permanente** |

## Eliminación

`DELETE /students/:id` no es soft delete:

1. Copia el alumno a `deleted_students` (con `deleted_by`).
2. Borra la fila de `students`.
3. Asume cascada en asistencias/logros y `student_id = NULL` en pagos; el SQL versionado no declara `ON DELETE` (ver [[Deriva conocida]]).

No hay endpoint de restauración. El histórico está en `GET /api/students/deleted` (admin).

## Stats y equipo

| Endpoint | Rol | Contenido |
|---|---|---|
| `GET /students/:id/stats` | admin, profesor, padre, alumno | asistencias, rachas, pagos, logros |
| `GET /students/:id/team` | admin, alumno | compañeros de categoría |

Ambos llaman a `findStudentForTenant` cuando aplica.

## Regla al agregar endpoints

Si la ruta recibe un `studentId`, **usa `findStudentForTenant`**. `requireRole` por sí solo deja que un padre cambie el id de la URL. Ver [[Middlewares y autenticacion]].

Tablas: [[Tablas#students]], [[Tablas#deleted_students]], [[Tablas#users]].
