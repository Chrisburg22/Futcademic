---
tipo: manual
actualizado: 2026-10-27
tags:
  - datos
  - deuda-tecnica
---

# Deriva conocida

Diferencias entre lo que el código escribe y lo que declaran `schema.sql` y
`migrations/*.sql`. **Antes de confiar en una columna, revisa la base real.**

## `students` y `users`: `first_name` / `last_name`

`schema.sql` solo declara `full_name` en `students` y `users`, pero el backend
escribe y lee `first_name` y `last_name`:

- `backend/api/controllers/auth.controller.ts` (registro e invitaciones)
- `backend/api/controllers/student.controller.ts` (altas y ediciones)

Las columnas existen en la base de producción (añadidas a mano), pero no hay
migración que las cree. Consecuencias:

- Un entorno nuevo creado solo con `schema.sql` + migraciones rompe el alta de
  alumnos y usuarios.
- `full_name` sigue siendo el nombre canónico para mostrar; `first_name` /
  `last_name` son un desglose que puede quedar vacío.

**Arreglo pendiente:** migración que añada las columnas y rellene el desglose a
partir de `full_name`.

## `PUT /students/:id` espera `fullName`, no `full_name`

`createStudent` lee `full_name` del body, pero `updateStudent` desestructura
`fullName` (`backend/api/controllers/student.controller.ts`). El panel mandaba
solo `full_name`, así que **renombrar a un alumno desde la ficha no guardaba
nada y la respuesta era 200**: `full_name: undefined` desaparece al serializar
el update de Supabase, de modo que ni fallaba ni escribía.

El panel manda los dos nombres desde el 27-oct
(`aPayloadAlumno` en `web/src/screens/admin/components/StudentEditForm.tsx`).

**Arreglo pendiente en el backend:** aceptar `full_name` en `updateStudent`
como hace `createStudent`, y entonces quitar el campo duplicado del panel.

## `categories.birth_year` es `text`, no `integer`

`schema.sql` lo declaraba como `integer NOT NULL`. En la base real es `text`, y
16 de las 27 categorías guardan algo que no es un año suelto: `2010-2011`,
`2012-2013-2014`, `2014-2015 Femenil`, `Porteros`, `4`.

`schema.sql` ya está corregido y el código trata la columna como la etiqueta de
la generación que es. Ver [[Modulo Categorias]]. Lo que queda abierto:

- `categories_school_id_birth_year_key`, el UNIQUE sobre `(school_id,
  birth_year)`, no estaba documentado en ningún sitio y es el que dispara el
  23505 que probaba `modular.test.ts`.
- `Alcones Rayados` tiene `Sub14` (2012) y `SUB14` (2014). Probablemente la
  primera debería llamarse `Sub12`; mientras tanto el índice único de nombre no
  se puede crear.

## `categories.horario`: columna muerta

La base tiene `categories.horario text`, que no está en `schema.sql` ni en
ninguna migración, y está vacía en las 27 filas. Ningún controlador la lee ni
la escribe. El horario real vive en `events` + `trainings`.

**Arreglo pendiente:** borrarla, o documentarla si alguien la quería para algo.

## Resuelto: `categories` (2026-10-26)

El módulo de categorías arrastraba tres desajustes que ya no existen, anotados
aquí por si aparecen en una base sin la migración `20261026_categories_module.sql`:

- El panel mandaba `teacher_id` (string) y el controlador leía `teacher_ids`
  (array): la asignación de profesores se descartaba en silencio.
- Se creyó que el formulario rompía al mandar `"2015-2016"` a `birth_year`.
  En realidad la columna es `text` y eso era lo normal; ver la sección de
  arriba.
- `teacher_permissions.can_manage_categories` se guardaba y se editaba sin que
  ninguna ruta lo consultara. Ver [[Modulo Categorias]].

Las columnas `status`, `archived_at`, `description`, `max_students` y
`updated_at` **necesitan esa migración aplicada** en el SQL
editor de Supabase antes de desplegar el backend; sin ella el listado falla con
columna inexistente.

## `students.status`: `pendiente`/`beca` vs `pendiente_pago`/`becado`

`schema.sql` declara un CHECK con `activo, beca, pendiente, inactivo`; el
controlador y la UI escriben `pendiente_pago` y `becado`. La base de producción
no tiene el CHECK, así que las escrituras funcionan, pero
`getPendingPayments` filtra por `['activo', 'pendiente']` y por eso no lista a
los alumnos en `pendiente_pago`. Resuelto el 27-oct: `schema.sql` alineado, migración `20261027_students_status_values.sql` (aplicar a mano) y fix del backend en la rama `fix/pending-payments-pendiente-pago`. Detalle en [[Modulo Alumnos]].

## Cómo evitar más deriva

1. Si tocas una tabla, añade la columna a `schema.sql` o a una migración fechada
   (`YYYYMMDD_descripcion.sql`), nunca solo al código.
2. Las migraciones se aplican a mano en el SQL editor de Supabase, en orden de
   nombre; no hay runner que detecte una migración olvidada.
3. Si una nota contradice al código, gana el código: corrige la nota en el
   mismo cambio. Ver [[Tablas]].
