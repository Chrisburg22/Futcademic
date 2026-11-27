---
tipo: nota
area: backend
estado: verificado
actualizado: 2026-10-27
fuentes:
  - backend/api/controllers/category.controller.ts
  - backend/api/routes/category.routes.ts
  - backend/api/controllers/permission.controller.ts
tags:
  - backend
  - categorias
---

# Categorias y equipo

## Categoría

`categories` agrupa alumnos por año de nacimiento:

| Campo | Uso |
|---|---|
| `name` | Ej. `Sub-10` |
| `birth_year` | Etiqueta de la generación (`text`): un año, un rango o un grupo. Ver [[Modulo Categorias]] |
| `monthly_fee` | Cuota base para calcular pendientes |
| `color` | Color en la UI |

## Endpoints

| Endpoint | Rol | Nota |
|---|---|---|
| `GET /categories` | autenticado | todas las de la escuela |
| `GET /categories/mine` | profesor | solo las asignadas |
| `POST /categories` | admin | crear |
| `PATCH /categories/:id` | admin | editar |
| `POST /categories/:id/teachers` | admin | asignar profesor (`teacher_id`) |
| `POST /categories/full` | admin | categoría + profesores + evento recurrente |

`POST /categories/full` es el alta guiada: crea la categoría, inserta filas en `category_teachers` y, si recibe `days`, `start_time`, `venue_id`, `duration_minutes` y `recurrence_weeks`, crea el evento y sus sesiones. Devuelve advertencias si alguna parte opcional falla sin tumbar la categoría.

## Muchos profesores por categoría

`category_teachers` es la tabla puente (`school_id`, `category_id`, `teacher_id`). Un profesor puede tener varias categorías y una categoría varios profesores.

- `GET /students` limita al profesor a los alumnos de sus categorías.
- `GET /categories/mine` alimenta el selector del pase de lista.
- Asignar dos veces al mismo profesor falla con 400 ("¿Ya está asignado?").

## Permisos del profesor

`teacher_permissions` (1:1 con profesor) guarda:

`can_manage_students` · `can_manage_events` · `can_view_finances` · `can_manage_payments` · `can_take_attendance` · `can_manage_categories`

Se editan en `PUT /api/permissions/:id` (admin) y se leen en `GET /api/permissions/mine`.

> [!warning] No son control de acceso efectivo
> Las rutas usan `requireRole`, no estos flags. Un profesor con todos los flags en `false` sigue pudiendo llamar a los endpoints de su rol. Ver [[Roles y permisos]].

## Tablas

[[Tablas#categories]] · [[Tablas#category_teachers]] · [[Tablas#teacher_permissions]]

Pantallas: [[Pantallas]] (`/admin/categories`, `/admin/categories/[id]`, `/admin/teachers`).
