---
tipo: nota
area: backend
estado: verificado
actualizado: 2026-11-13
fuentes:
  - backend/api/services/images.ts
  - backend/api/controllers/upload.controller.ts
  - backend/api/routes/upload.routes.ts
  - web/src/hooks/useUpload.ts
tags:
  - backend
  - web
  - fotos
---

# Fotos e imágenes

Fotos de alumnos y usuarios, logo de la academia y escudo de las categorías.
Los documentos de inscripción **no** son esto: viven en un bucket privado, ver
[[Alumnos y acceso]].

## Buckets

| Bucket | Público | Qué guarda | Rutas dentro del bucket |
| --- | --- | --- | --- |
| `avatars` | sí | fotos de personas | `avatars/<school>/<user>-<uuid>.jpg`, `students/<school>/<student>-<uuid>.jpg` |
| `logos` | sí | marca | `logos/<school>/<school>-<uuid>.jpg`, `categories/<school>/<category>-<uuid>.jpg` |
| `enrollment-documents` | no | expediente | ver [[Alumnos y acceso]] |

Públicos a propósito: la foto se pinta en listados y avatares, y firmar una URL
por fila rompería el caché del CDN. Los dos buckets quedaron versionados en
`migrations/20261113_add_category_logo_and_image_buckets.sql`, **ya aplicada al
proyecto `vbuoiysqzyntsharrowf` el 2026-11-13**.

> [!warning] `logos` no existía
> Antes de esa migración el bucket `logos` **no estaba creado** en Supabase,
> aunque `uploadLogo` llevaba tiempo escribiendo en él: subir el logo de la
> academia fallaba siempre en producción. `avatars` sí existía, público y sin
> límite de tamaño ni de mimes; ahora ambos tienen 5 MB y jpeg/png/webp.

El nombre lleva un UUID porque antes se reescribía siempre la misma ruta y el
CDN seguía sirviendo la foto vieja. Al subir una nueva se borra la anterior
(`removePublicImage`, que ignora URLs de otros dominios).

## Endpoints

| Método | Ruta | Roles | Escribe |
| --- | --- | --- | --- |
| `POST`/`DELETE` | `/api/upload/avatar` | todos (el de otro: solo admin) | `users.avatar_url` + `profile_information.avatar_url` |
| `POST`/`DELETE` | `/api/upload/student/:id/photo` | admin, profesor con `can_manage_students` | `students.avatar_url` (+ `users` si el alumno tiene cuenta) |
| `POST` | `/api/upload/logo` | admin | `schools.logo_url` |
| `POST`/`DELETE` | `/api/upload/category/:id/logo` | admin | `categories.logo_url` |

El archivo viaja en el campo `image` de un `multipart/form-data`. Límite 5 MB
(un archivo mayor sale como 413, no como error genérico). La foto del alumno
pasa por `findStudentForTenant`, así que un id de otra academia da 404.

## Validación

`validateImageFile` (en `api/services/images.ts`) mira los **magic bytes**
reusando `detectDocumentType` de `documents.ts`: la extensión y el
`Content-Type` del navegador no son confiables. Solo JPG, PNG y WEBP; el HEIC
de iPhone se rechaza con mensaje propio porque Chrome no lo pinta.

## Lado web

> [!note] Los componentes web nuevos están en la rama `claude/photo-upload-feature-3d7cac`,
> todavía no en `main`: por eso no aparecen como fuentes de esta nota.

`PhotoUploader` (`web/src/components/common/`) es el único punto de subida:
elegir archivo → `ImageCropModal` (recorte interactivo con `react-easy-crop`,
zoom y arrastre) → canvas exporta un **JPEG de 512 px** → `useUpload`. Una foto
de celular de 5 MB se sube como ~80 KB.

Se usa en la ficha del alumno (cabecera), **el editor del alumno** (pestaña
«Datos»), la ficha del profesor, «Mi perfil», los datos de la academia y el
modal de edición de categoría (escudo). En el pase de lista la foto la pinta
`components/attendance/RollCallList.tsx`, que ya venía del rediseño móvil: no
hay nada que añadir ahí. En el editor la foto **no** pasa por
«Guardar cambios»: tiene su propio endpoint, se guarda al subirla y no ensucia
el formulario; el texto de ayuda lo dice para que no se espere a guardar. Los hooks invalidan
las queries afectadas; antes no lo hacían y el avatar del shell seguía viejo.

Cobertura: `backend/api/__tests__/upload.test.ts` (autorización, 404 cruzado,
415) y `web/e2e/fotos.spec.ts` (recorte real en el navegador).
