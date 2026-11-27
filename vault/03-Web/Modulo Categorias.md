---
tipo: manual
actualizado: 2026-10-27
tags:
  - web
  - categorias
  - dominio
---

# Módulo Categorías

Una categoría es el **equipo por generación**: agrupa jugadores de uno o dos
años de nacimiento, tiene entrenadores, horario, mensualidad y aforo. Es el eje
del modelo: `students`, `events`, `trainings` y `attendances` cuelgan de ella,
y la deuda de cada alumno se calcula con su `monthly_fee`.

## Dónde vive

| Capa | Archivo |
| --- | --- |
| Lista, filtros y edición | `web/src/screens/admin/CategoriesPage.tsx` |
| Detalle con métricas y pestañas | `web/src/screens/admin/CategoryDetailPage.tsx` |
| Campos y validación compartidos | `web/src/screens/admin/components/CategoryFormFields.tsx` |
| Asistente de creación (3 pasos) | `web/src/screens/admin/components/CategoryWizard.tsx` |
| Plantel y cuerpo técnico | `web/src/screens/admin/components/CategoryMembersPanel.tsx` |
| Ficha de solo lectura | `web/src/components/categories/CategorySummary.tsx` |
| Formato y estados | `web/src/lib/categories.ts` |
| Hooks | `web/src/hooks/useCategories.ts` |
| Histórico de asistencias | `web/src/components/attendance/CategoryAttendanceHistory.tsx` |
| Controlador | `backend/api/controllers/category.controller.ts` |
| Rutas | `backend/api/routes/category.routes.ts` |
| Permiso de profesor | `backend/api/middlewares/permission.middleware.ts` |
| Recorte por rol | `backend/api/services/access.ts` |
| E2E | `web/e2e/categorias.spec.ts` · fixtures en `web/e2e/helpers.ts` |
| Tests de API | `backend/api/__tests__/category.test.ts` |

Ver [[API - rutas]], [[Hooks y endpoints]], [[Rutas web]] y [[Tablas]].

## La generación (`birth_year`)

`categories.birth_year` es **`text`, no un entero**, y guarda la etiqueta de la
generación tal como la escribe la academia:

- un año suelto: `2015`
- un rango: `2014-2015`, `2012-2013-2014`
- un grupo sin año: `Porteros`, `2014-2015 Femenil`

En la base de producción, 16 de 27 categorías usan algo que no es un año
suelto, así que el `MultiSelect` del panel antiguo no era un bug: era la forma
en que se agrupan generaciones. El campo del formulario es un `Autocomplete`
que sugiere años pero acepta cualquier texto, y `formatearGeneracion` muestra
la etiqueta sin tocarla.

El backend la valida como texto de 1 a 40 caracteres y la recorta; el filtro
compara como texto, porque con `Number()` no encontraría `2014-2015`.

**No hay columna de año final.** `birth_year_end` llegó a existir un día,
pensada para un `birth_year` entero, y se quita en
`migrations/20261027_categories_drop_birth_year_end.sql`.

`categories_school_id_birth_year_key` es un UNIQUE sobre `(school_id,
birth_year)` que ya venía de antes: repetir una generación en la misma escuela
da 23505, que el controlador traduce a 409. Ver [[Deriva conocida]].

## Ciclo de vida

| Estado | Qué significa |
| --- | --- |
| `activa` | Aparece en el listado y en los selectores de alumnos, agenda y asistencias. |
| `inactiva` | Pausada: se conserva todo, pero deja de ofrecerse como opción nueva. |
| `archivada` | Fuera del listado por defecto. Sella `archived_at`; restaurar lo limpia. |

**No hay borrado duro.** `students`, `events`, `trainings` y `attendances`
apuntan a la categoría sin `ON DELETE`, así que borrarla rompería el historial.
`PATCH /api/categories/:id/status` es el único camino, y el diálogo de archivar
avisa de los jugadores que seguirán generando mensualidad.

El índice único `categories_school_name_uniq` impide dos categorías vivas con
el mismo nombre en una escuela, y deja libre el nombre en cuanto se archiva
(para reusarlo en una temporada nueva). **En producción no llegó a crearse**:
`Alcones Rayados` tiene `Sub14` y `SUB14`, que solo se diferencian en las
mayúsculas. Mientras sigan ahí, esa unicidad la cubre solo el controlador.

## Permisos por rol

| Rol | Qué puede hacer |
| --- | --- |
| `super_admin`, `admin` | Todo: crear, editar, archivar, restaurar, asignar plantel y cuerpo técnico. |
| `profesor` con `can_manage_categories` | Crear, y editar o asignar **solo en sus propias categorías** (`category_teachers`). |
| `profesor` sin el permiso | Solo lectura de sus categorías (`GET /categories/mine`). Sin botón de crear ni de editar. |
| `padre` | Lectura de las categorías de sus hijos, desde "Mis hijos". |
| `alumno` | Lectura de la suya, desde "Mi equipo". |

`teacher_permissions.can_manage_categories` existía en la base y en los toggles
de `TeacherDetailPage` sin que ninguna ruta lo consultara: ahora lo aplica
`requireTeacherPermission('can_manage_categories')`, que **no expone `.roles`**
a propósito, porque `api/scripts/dump-routes.ts` toma el primer handler con
`roles` para el contrato y ese debe seguir siendo el `requireRole` de la ruta.

`GET /api/categories` y `GET /api/categories/:id` se quedan sin `requireRole`
porque sirven a los cinco roles; el recorte lo hace `categoryIdsForTenant` /
`findCategoryForTenant` por dato, y están declaradas en el
`SIN_ROLES_JUSTIFICADO` de `rbac.test.ts`.

## Vista de las familias

Padre y alumno **no entran al módulo de gestión**. Los dos ven la misma ficha,
`CategorySummary` (color, años, compañeros, entrenadores y horario), alimentada
por `GET /api/students/:id/team`:

- alumno → "Mi equipo" (`web/src/screens/TeamPage.tsx`)
- padre → "Mis hijos", desplegable por hijo (`web/src/screens/ChildrenPage.tsx`)

Ese endpoint devuelve los entrenadores como `{ id, name, avatar, phone }` y los
horarios como `{ name, time, venue }`. No son `full_name`, `day` ni
`start_time`: leerlos con esos nombres deja la pantalla vacía. El 27-oct se
corrigieron las fixtures de `e2e/fase4.spec.ts` y `e2e/demo-manual.spec.ts`,
que seguían con la forma vieja y hacían fallar "Mi equipo" aunque la pantalla
estaba bien.

## Lista y paginación

`GET /api/categories` sigue devolviendo un **array plano** (lo consumen los
selectores de alumnos, agenda, asistencias y export) y publica el total en la
cabecera `X-Total-Count`, expuesta en el CORS de `api/app.ts`. Acepta `search`,
`status`, `birth_year`, `teacher_id`, `sort` (lista blanca), `order`, `page` y
`per_page`.

- `useGetCategories()` → array, para los selectores.
- `useGetCategoriesPaged(filtros)` → `{ items, total }`, solo para el módulo.
- `useGetCategory(id)` → detalle con métricas; antes el detalle pedía **todas**
  las categorías y filtraba en cliente.

## Horario

`POST /api/categories/full` crea la categoría y genera los entrenamientos.
`days` acepta **números 0-6** (0 = domingo) o nombres en inglés
(`monday`…`sunday`), que es lo que mandan las tools del chat; antes los nombres
producían `NaN` y fechas inválidas. Sin `days` no se genera nada y la categoría
se crea igual. Ver [[Chat IA]].
