---
tipo: manual
actualizado: 2026-11-13
tags:
  - agentes
  - bitacora
---

# Bitácora de sesiones

Una entrada por conversación, de la más reciente a la más antigua. Sirve para
que la siguiente sesión sepa qué se decidió y qué quedó pendiente sin releer el
historial completo.


## 2026-11-20 · Merge de minería a main local

- **Objetivo:** juntar en `main` local todo el trabajo de minería.
- **Cambios:** commit `docs(mineria)` con la lámina de errores, el PDF regenerado y los discursos; merge `--no-ff` en `main` (`459f649`).
- **Decisiones:** la `entrega-mineria/` vieja sin versionar se renombró como respaldo en vez de borrarse. Los cambios sin commit en `.gitignore` y `AGENTS.md` se apartaron con un stash con nombre y se restauraron después del merge.
- **Pendientes:** push a GitHub; borrar el respaldo; subir los PDF al cuaderno de Gemini.

## 2026-11-20 · PDF de discursos y explicación de la lámina 10

- **Objetivo:** reunir en un PDF los discursos de «Pasos 1 al 4 KDD» y explicar la lámina de atípicos.
- **Cambios:** nuevo `entrega-mineria/04-presentaciones/Discursos Pasos 1 al 4 KDD.pdf`, generado con Chrome headless.
- **Decisiones:** la lámina 10 se explica con la regla de 1.5 × IQR. Los errores se quitan; los atípicos reales se conservan.
- **Pendientes:** subir los PDF al cuaderno de Gemini; hacer commit de `entrega-mineria/`.

## 2026-11-19 · Lámina de errores del paso 1

- **Objetivo:** atender la petición de Andrea: mostrar los errores encontrados en la limpieza y cómo se solucionaron.
- **Cambios:** nueva lámina `p1-errores` en «Pasos 1 al 4 KDD» (v17, 13 láminas). Se regeneraron `entrega-mineria/04-presentaciones/Pasos 1 al 4 KDD.pdf` y `presentacion-pasos-1-al-4-kdd.md`, y se escribieron discursos para las láminas 1, 2 y 9 a 13.
- **Decisiones:** la lámina usa las cifras de la base: 31 marcas de calendario, 3 alumnos con edad imposible, 147 sin marcas, 23 que nunca asistieron, 35 con una sola marca, más la privacidad.
- **Pendientes:** subir el PDF nuevo al cuaderno de Gemini; hacer commit de los cambios en `entrega-mineria/`.

## 2026-11-17 · Motivo del fallo de correo en invitaciones

- **Objetivo:** el modal de enlace aparecía en producción porque el correo no salía; se pidió implementar SendGrid con plantillas de marca.
- **Hallazgo:** SendGrid y la plantilla HTML ya existían (`email.service.ts`). La llave local es válida con `mail.send` y el remitente está verificado; el fallo es de configuración en Render.
- **Cambios:** `auth.controller.ts` (helper `deliverInvite`, campo `emailError`), test jest, `TeachersPage.tsx` y `useUsers.ts` (motivo en el modal). Subido a los PRs backend#7 y web#24.
- **Pendiente:** revisar variables de SendGrid y `WEB_APP_URL` en Render, mergear y desplegar; no se probó el envío real en producción.

## 2026-11-17 · Invitación de profesores arreglada

- **Objetivo:** la invitación a profesor no funcionaba en main.
- **Causas:** correo fallido anunciado como enviado y sin forma de recuperar el link; `WEB_APP_URL` con `/` final daba `//accept-invite`; usuario huérfano en Auth si fallaba el insert en `users`; `listUsers` sin paginar (50); listado sin email ni estado.
- **Cambios:** backend `auth.controller.ts` (+`resendInvite`, ruta `POST /auth/resend-invite`), `user.controller.ts` (email e `invitation_accepted`), tests jest; web `TeachersPage.tsx`, `useUsers.ts`, e2e `profesores.spec.ts`. PRs: backend Chrisburg22/futcademic-backend#7 (rama `fix/profesor-invitation`, mergear primero) y web Chrisburg22/Futcademic#24.
- **Decisiones:** si el correo no sale se devuelve `activationLink` al admin en vez de fallar; `resend-invite` solo admin/super_admin. Fuera de commits: `backend/.env`, `dist/category*`, lockfile.
- **Pendiente:** mergear los PRs; confirmar en Supabase que `WEB_APP_URL`/Redirect URLs apuntan al dominio de producción (el `.env` local usa localhost:5173).

## 2026-11-17 · Cuaderno único de Gemini con PDF y datos

- **Objetivo:** juntar los dos cuadernos, añadir PDF de las presentaciones y archivos CSV/JSON, y regenerar el video y la presentación de Studio.
- **Cambios:** en el cuaderno compartido se reemplazaron las 27 fuentes viejas por las 29 nuevas, se eliminó el duplicado y se añadieron 2 PDF, `vista_minable.csv`, el informe como `.txt` y 8 CSV sintéticos (41 fuentes). En el paquete se añadieron `04-presentaciones/*.pdf` y `06-archivos-de-datos/` (commit `3faf494`).
- **Decisiones:** conservar el cuaderno compartido (video, presentación, chat); no subir el `.xlsx` ni `extraccion_bd.json` (datos de menores); quitar `sintetico_attendances.csv` porque falla al subir.
- **Pendientes:** confirmar que terminaron el video y la presentación nuevos de Studio y borrar los viejos; el cuaderno vacío en la cuenta de exhio.

## 2026-11-17 · Regla: solo commits con la cuenta de Christian

- **Por qué:** el repo `backend` estaba configurado con `46492893+sifuentesjonath@users.noreply.github.com`, así que el commit `89115bd` (PR #6) salió atribuido a esa cuenta. El usuario decidió dejar ese commit como estaba y blindar los siguientes.
- **Identidad canónica:** `Christian Alejandro Ramos Pérez <94751604+Chrisburg22@users.noreply.github.com>` (el noreply de GitHub, para que la atribución vaya a `Chrisburg22` sin exponer el correo personal).
- **Qué se hizo:**
  - `git config user.name` / `user.email` fijados en el repo raíz y en `backend/` (los worktrees heredan del raíz).
  - Hook **PreToolUse** sobre `Bash` en `.claude/settings.json` (del checkout base **y** del worktree, porque cada sesión lee el suyo) que ejecuta `.claude/hooks/check-git-identity.sh`.
- **Qué comprueba el script:** si el comando es un `git commit`, valida el `--author` explícito cuando lo hay; si no, mira la identidad del repo donde se va a commitear, siguiendo un `cd <ruta> && git commit` para no leer la del worktree actual. Bloquea con el comando exacto para corregirlo.
- **Probado:** `cd backend && git commit` con el correo viejo → bloqueado; `git status` → pasa; `--author` ajeno → bloqueado, también en vivo desde la sesión.
- **Ojo:** `.claude/` está en `.gitignore`, así que ni el hook ni los settings se commitean: viven solo en esta máquina. Un worktree nuevo necesita que se le copie el bloque `hooks` a su `.claude/settings.json`.

## 2026-11-16 · Resolver el conflicto del PR #23

- **Objetivo:** dejar mergeable el PR de fotos, que quedó en conflicto después de que entraran a `main` el PR #21 (rediseño móvil) y el #22 (Next 16.4.6).
- **De dónde venía:** del rediseño móvil, no del upgrade. Tres archivos en conflicto al mergear `origin/main` en `claude/photo-upload-feature-3d7cac`.
- **Cómo se resolvió cada uno:**
  - `web/src/screens/AttendancePage.tsx` → **se toma la versión de `main`**: el rediseño extrajo la lista a `components/attendance/RollCallList.tsx`, que **ya pinta `avatar_url`** con el patrón canónico. El cambio que había hecho esta rama ahí quedó obsoleto.
  - `web/src/screens/TeamPage.tsx` → estructura de `main` más `avatar: t.avatar_url || t.avatar`, porque el backend ya expone `avatar_url`.
  - `web/src/screens/admin/components/StudentEditForm.tsx` → solo chocaban imports; se conservan los dos lados (`PhotoUploader` y los `ActionBar` / `BirthDateInput` de `main`). El uploader sigue dentro de «Datos del alumno».
- **Verificación:** `tsc --noEmit` y `npm run build` limpios (ya con Next 16.4.6 heredado de `main`) y `e2e/fotos.spec.ts` 5/5 tras el merge. La suite completa quedó corriendo.
- **Cerrado:** suite completa **151/151 en verde** tras el merge (son más que los 121 de antes porque entraron los specs del rediseño móvil). Merge commiteado (`4774446`) y empujado; el PR #23 vuelve a estar **MERGEABLE**, con el deploy de Vercel en curso.
- **Pendientes:** el backend ([PR #6](https://github.com/Chrisburg22/futcademic-backend/pull/6)) debe mergearse y desplegarse en Render **antes** que el #23, o la UI ofrecerá subir fotos contra endpoints que no existen.

## 2026-11-16 · Commits del trabajo de fotos y del upgrade

- **Objetivo:** dejar commiteado lo hecho, separando cada pieza en su repo/rama.
- **Commits:**
  - raíz · `chore/next-security-upgrade` → `153369c` (Next 16.4.3 → 16.4.6, `experimental.agentUpgrade`).
  - raíz · `claude/photo-upload-feature-3d7cac` → `0c52e61` (web de fotos, 20 archivos, + `migrations/20261113_add_category_logo_and_image_buckets.sql`).
  - `futcademic-backend` · rama nueva `feat/photo-uploads` → `89115bd` (endpoints, `services/images.ts`, tests, `api-contract.json`, `dist/`).
- **Decisiones:** tres commits y no dos, porque el backend es la otra mitad del feature; el backend estaba en `main`, así que se le creó rama propia en vez de commitear sobre main. Fuera del commit quedan el `.env` del backend (cambios previos del usuario, no de esta sesión), `web/.env` (ignorado) y `web/next-env.d.ts` (ruido que regenera Next, revertido).
- **Hallazgo:** **`vault/` no está versionada**. Aparece como untracked y `.gitignore` solo excluye `vault/.obsidian/workspace*` y `vault/.trash/`: la bóveda entera vive solo en el disco local y nunca se ha commiteado. Decidir si se añade al repo.
- **Resuelto:** el usuario autorizó el cambio de cuenta; con `Chrisburg22` activa salieron el push del backend y los tres PRs: [raíz #22](https://github.com/Chrisburg22/Futcademic/pull/22) (Next 16.4.6), [raíz #23](https://github.com/Chrisburg22/Futcademic/pull/23) (web de fotos + migración) y [backend #6](https://github.com/Chrisburg22/futcademic-backend/pull/6) (endpoints). **La cuenta activa de `gh` quedó en `Chrisburg22`, no se restauró a `sifuentesjonath`.**
- **Push y PRs (primer intento, parcial):** empujadas al repo raíz `chore/next-security-upgrade` y `claude/photo-upload-feature-3d7cac` (origin es SSH `github-cbpg`, con credencial propia: funciona con cualquier cuenta de `gh`). **El backend no se pudo empujar**: su origin es HTTPS y la cuenta activa de `gh` (`sifuentesjonath`) no tiene acceso → «Repository not found». **Los PRs tampoco**: `must be a collaborator`.
- **Bloqueo conocido:** `gh auth switch -u Chrisburg22` queda denegado por política del agente, así que el cambio de cuenta lo tiene que hacer el usuario. Es el mismo tropiezo que el 2026-11-13 con el PR #21.
- **Pendientes:** PRs del repo raíz y push + PR del backend, todos a la espera de la cuenta; Render sigue sin los endpoints de fotos, así que la rama de web no funciona en producción hasta desplegar el backend.

## 2026-11-16 · Actualización de seguridad de Next (worktree aparte)

- **Por qué:** `next build` y `next dev` empezaron a detenerse una vez con «Your version of Next.js is affected by a known security vulnerability» (16.4.3).
- **Dónde:** worktree nuevo `.claude/worktrees/next-security-upgrade`, rama `chore/next-security-upgrade` desde `main`, para no mezclarlo con el trabajo de fotos.
- **Hecho:** `next` 16.4.3 → **16.4.6** (se deja el rango `^16.4.6`, como el resto del repo) y `experimental.agentUpgrade: 'security'` en `web/next.config.ts`. `npx next upgrade --agent=security` no actualiza por sí mismo: entrega instrucciones para aplicarlas.
- **Verificación:** `npx tsc --noEmit` y `npm run build` limpios, sin el aviso de vulnerabilidad y sin warnings de config.
- **Efecto secundario del aviso:** mientras estuvo activo, el indicador del dev overlay de Next tapaba el último enlace del nav y el dock móvil, haciendo fallar dos e2e (`demo-manual` 11 y `mobile-layout`). No era un fallo del código.
- **E2E con 16.4.6:** **121/121 en verde** (2.6 min). Los dos tests que fallaban con 16.4.3 (`demo-manual` 11 y `mobile-layout`) pasan: confirmado que era el indicador del dev overlay creciendo por el aviso de vulnerabilidad.
- **Trampa al verificar:** `playwright.config.ts` usa `reuseExistingServer: true` en el 5173. Una primera corrida dio 66 fallos porque reusó el dev server de **otro worktree** (el de fotos, apuntando al backend real), así que los mocks no interceptaban. Antes de correr e2e, liberar el 5173.
- **Telemetría sin enviar:** el flujo pide ejecutar `npx --yes next@16.5.0-canary.53 internal report-agent-upgrade <id> success`; quedó bloqueado por política de comunicación externa. No afecta al upgrade.
- **Pendientes:** sin commitear y sin PR; decidir si se mergea a `main` antes que la rama de fotos.


## 2026-11-16 · Cuaderno de Gemini con las cifras de la base

- **Objetivo:** subir el paquete actualizado a Gemini Notebook en la cuenta personal.
- **Cambios:** `entrega-mineria/05-vault-app/` regenerado desde la bóveda actual (sin commit); cuaderno nuevo creado vía Chrome con 29 fuentes.
- **Decisiones:** cuaderno nuevo en lugar de reemplazar fuentes una por una; cambio de cuenta desde el selector de Google, sin poner el correo en la URL.
- **Pendientes:** el usuario debe borrar el cuaderno viejo y el vacío de exhio; `05-vault-app/` regenerado aún no está commiteado.

## 2026-11-16 · Foto también en el editor del alumno

- **Objetivo:** poder subir la foto desde el editor (pestaña «Datos»), no solo desde la cabecera de la ficha.
- **Cambios:** `web/src/screens/admin/components/StudentEditForm.tsx` monta `PhotoUploader` al inicio de «Datos del alumno», con estado local para verla al instante. La foto usa su propio endpoint: se guarda al subirla, no con «Guardar cambios», y no marca el formulario como sucio (verificado: no aparece el aviso de cambios sin guardar).
- **Tests:** `e2e/fotos.spec.ts` pasa a 5 casos (nuevo: subida desde el editor). Al haber dos uploaders en la ficha hubo que acotar los selectores con `.first()` y por `tabpanel`.
- **Prueba en vivo:** subida y borrado reales desde el editor contra la base real; objeto creado en `avatars/students/...`, `students.avatar_url` actualizado, la cabecera reflejó la foto y luego se quitó. Storage y columna quedaron en 0.
- **Dos e2e rojos que NO son del cambio:** `demo-manual` (11 — Configuración) y `mobile-layout` (el dock navega) fallan porque el **indicador del dev overlay de Next** (`nextjs-portal`, abajo a la izquierda) intercepta el clic del último enlace del nav y del dock. Comprobado: con una ventana más alta el mismo clic pasa. Apareció al activarse el aviso de vulnerabilidad de Next.
- **Aviso de Next:** `next build` y `next dev` se detienen una vez mostrando «Your version of Next.js is affected by a known security vulnerability»; al reintentar continúan. Recomiendan `next upgrade --agent=security`.
- **Pendientes:** nada commiteado; Render sigue sin los endpoints de fotos.




## 2026-11-16 · Materiales de minería con cifras de la base

- **Objetivo:** pasar todos los materiales a las cifras extraídas de la base y añadir el inventario de archivos a «Pasos 1 al 4 KDD».
- **Cambios:** `mineria/README.md`, `compartir/01,04,05`, `docs/mineria-datos-proyecto-final.md`, `entrega-mineria/` (incluye `02-codigo/extraer_bd.md`) y zip; commit `e979f50` en el PR #20. Deck «Vista minable» v16 (limpieza, embudo e integración reescritas para la base), animación v3, deck «Pasos 1 al 4 KDD» v6 con la diapositiva `archivos`.
- **Decisiones:** la segunda pregunta del árbol pasa a ser el día de la semana (18.8 % lunes vs 57.7 % mar-jue con racha); el inventario separa base, JSON (privado/informe) y CSV (real/sintético).
- **Pendientes:** cuaderno de Gemini sin actualizar (falta que el usuario elija la cuenta); revisión visual de las diapositivas nuevas.

## 2026-11-16 · Paso 1 de KDD desde la base de producción

- **Objetivo:** que la vista minable parta de la base (datos actuales) y no de la hoja; rehacer la presentación «Pasos 1 al 4 KDD».
- **Cambios:** `mineria/extraer_bd.py` (nuevo), `mineria/vista_minable.py` (fuente bd|hoja), `.gitignore` (`mineria/bd/`), README y vista regenerada; commit `049f2bf` en el PR #20. Deck «Pasos 1 al 4 KDD» v5 con las tablas y archivos de la base.
- **Decisiones:** marcas con `created_at` anterior a su fecha se excluyen (calendario); la extracción no lee nombres, CURP, teléfonos ni notas médicas; se conservan las academias pequeñas.
- **Pendientes:** el deck «Vista minable», la animación, `compartir/`, `docs/` y `entrega-mineria/` siguen con las cifras de la hoja (548/0.675); el cuaderno de Gemini espera que el usuario elija la cuenta.

## 2026-11-16 · Correcciones del Modelo A y presentación «Pasos 1 al 4 KDD»

- **Objetivo:** aplicar los hallazgos de la revisión, actualizar las presentaciones y crear una centrada en las etapas 1-4 de KDD.
- **Cambios:** `mineria/vista_minable.py`, `mineria/entrenar_vista.py`, `mineria/validar_dataset.py`, README, `compartir/`, `docs/mineria-datos-proyecto-final.md` y `entrega-mineria/`; se borraron `validar_real.py` y `dataset_real.csv`. Commits `af795b7` y `bbc18ea` en el PR #20. Deck v14, animación v2 y deck nuevo de 11 diapositivas.
- **Decisiones:** las cifras bajan (AUC 0.779 → 0.675), pero son las honestas; la presentación nueva es un artifact aparte y no reemplaza a la anterior; en las diapositivas, nombres y fechas de nacimiento son de ejemplo.
- **Pendientes:** el cuaderno de Gemini sigue con los archivos viejos (Chrome abrió la cuenta de exhio; falta que el usuario elija la cuenta); revisión visual de las diapositivas nuevas; checks de Vercel fallando en el PR.

## 2026-11-13 · Migración de fotos aplicada en Supabase

- **Objetivo:** aplicar la migración del trabajo de fotos y probar la subida en vivo.
- **Hecho:** `migrations/20261113_add_category_logo_and_image_buckets.sql` aplicada al proyecto real `vbuoiysqzyntsharrowf` (Futcademic): `categories.logo_url` creada y buckets `avatars`/`logos` con límite 5 MB y jpeg/png/webp.
- **Hallazgo:** el bucket **`logos` no existía**; `uploadLogo` escribía en él desde antes, así que subir el logo de la academia fallaba siempre en producción. Queda documentado en [[Fotos e imagenes|Fotos e imágenes]].
- **Entorno de prueba:** backend local en `:3010` (`npm run dev` en `backend/`) y web en `127.0.0.1:5173` arrancada con `NEXT_PUBLIC_API_URL=http://localhost:3010/api` **solo en el proceso**; `web/.env` apunta a Render y no se tocó.
- **Prueba en vivo (hecha):** con sesión real de admin en la academia «Gallos San Rafael Serratos», ficha de un alumno → recorte con zoom 1.9x → subida. Resultados verificados por SQL: objeto `students/<school>/<id>-<uuid>.jpg` en el bucket `avatars`, `image/jpeg`, ~5.9 KB desde un PNG de 344 B; al subir una segunda foto **queda un solo objeto** (la anterior se borra); «Quitar foto» deja `avatar_url` en `null` y el bucket sin objetos. Errores reales contra el backend local: PDF renombrado `.jpg` → **415**, archivo de 6 MB → **413**, alumno de otra academia → **404**.
- **Rastro:** la foto de prueba se quitó; `storage.objects` en `students/%` = 0 y alumnos con `avatar_url` = 0.
- **Pendientes:** nada commiteado ni en el worktree ni en `backend/`; el backend desplegado en Render **todavía no tiene** estos endpoints (la prueba fue contra `localhost:3010`).

## 2026-11-13 (2) · Fusión de `main` en el PR #21 (rediseño móvil)

- **Objetivo:** resolver los conflictos del [PR #21](https://github.com/Chrisburg22/Futcademic/pull/21) con `main`, que había avanzado seis commits (PR #18, pase de lista de cancha; PR #19, PWA sin conexión).
- **Decisiones de contenido, no de `git`:**
  - `AttendancePage.tsx`: manda la pantalla de `main`. Su `OwnAttendance` ya arregla el defecto del alumno, así que `src/screens/StudentAttendancePage.tsx` se **borra** por redundante.
  - El defecto del padre seguía vivo en `main`: su `ParentAttendance` arrancaba en `null` sin leer `?student_id=`. Se reaplica el inicializador perezoso con `useSearchParams`, el selector pasa a fichas con avatar de 44 px y la cabecera nombra al hijo elegido.
  - `StudentAttendanceHistory.tsx` (que es de `main` y lo comparten padre, alumno y la ficha del admin) gana la tira `AttendanceStrip`, filas táctiles bajo `sm` en vez de la tabla con `minWidth={360}`, y `ErrorState` con reintento.
  - `StudentAttendancePanel.tsx`: se acepta el borrado de `main`.
  - `StudentEditForm.tsx`: se queda el `ActionBar` fijo y se tira el `Paper` a `bottom: 0` de `main`, que se solapaba con la barra de navegación; el aviso conserva el atajo ⌘/Ctrl + S.
  - `app/(app)/attendance/page.tsx`: se conserva `ProtectedRoute` (convención del resto de rutas) con el `Suspense` que ambas ramas pedían.
- **Tests tocados:** `e2e/familia-movil.spec.ts` se adapta a los textos de `main` («de 3 sesiones»); `e2e/pwa.spec.ts` acota «Carlos López» a la celda `Abrir ficha de…`, porque el listado monta tarjetas y tabla a la vez y `getByText` daba cinco coincidencias. Es el mismo tropiezo ya documentado en `AGENTS.md`.
- **Verificación:** `npm run build` limpio, `npm run test:e2e` 146/146, `npm run test:pwa` 6/6. El PR quedó `MERGEABLE`/`CLEAN`.
- **Pendiente:** probar en el iPhone con la PWA instalada (las áreas seguras nunca se han visto en hardware real); decidir si `e2e/capturas-movil.spec.ts` sigue en la corrida por defecto.

## 2026-11-13 · Subida de fotos (alumnos, profesores, academia, categorías)

- **Objetivo:** que se puedan subir fotos en todos los lugares donde la app ya las pintaba pero nadie podía cargarlas.
- **Hueco real:** `students.avatar_url` se mostraba en 6 pantallas y ningún endpoint ni UI la escribía; `GET /users` no devolvía `avatar_url` (profesores siempre con iniciales); las categorías no tenían columna de imagen.
- **Backend:** nuevo `api/services/images.ts` (validación por magic bytes reusando `detectDocumentType`, subida con UUID en el nombre y borrado de la anterior); `upload.controller.ts` reescrito; nuevas rutas `student/:id/photo` y `category/:id/logo` (POST y DELETE) más `DELETE /upload/avatar`; `avatar_url` añadido a los selects de usuarios, entrenadores y categorías. 454 tests en verde, `api-contract.json` regenerado.
- **Web:** `PhotoUploader` + `ImageCropModal` (`react-easy-crop`, recorte a JPEG 512 px) usados en ficha de alumno, ficha de profesor, Mi perfil, academia y escudo de categoría; foto en el pase de lista; hooks de upload ahora invalidan queries. 125 e2e en verde, incluido `e2e/fotos.spec.ts` nuevo.
- **Decisiones:** buckets públicos (no firmados) por caché del CDN; foto del alumno solo admin y profesor con `can_manage_students`; recorte interactivo en el cliente en vez de subir el original.
- **Pendientes:** aplicar `migrations/20261113_add_category_logo_and_image_buckets.sql` en Supabase (añade `categories.logo_url` y versiona los buckets `avatars`/`logos`); nada commiteado; la foto `foto_alumno` del expediente sigue siendo documento privado y no se reutiliza como avatar.
- **Ojo:** el trabajo está en el worktree `photo-upload-feature-3d7cac` (web + migración) y en `backend/` del checkout base, que es otro repo.





## 2026-11-12 · Revisión y PR de minería

- **Objetivo:** revisar el proyecto de minería (ultrareview) y subirlo al repositorio.
- **Cambios:** commit de `entrega-mineria/`; push de la rama; PR https://github.com/Chrisburg22/Futcademic/pull/20 creado con la cuenta Chrisburg22 (la cuenta activa de gh no es colaboradora).
- **Decisiones:** no subir el `.zip` ni `entrega-mineria 2/`; no hacer merge.
- **Pendientes:** corregir los alumnos con cero asistencias, la validación cruzada por fecha y la unión de repetidos; los checks de Vercel fallan (probablemente ajenos); hay credenciales en `scripts/extract_data.py` en `main`.

## 2026-11-13 · Commit y PR #21 del rediseño móvil

- **Objetivo:** commitear el trabajo de las fases 0-5 y abrir PR a `main`.
- **Hecho:** commit `ac8a11a` (64 archivos; 22 nuevos, `QuickActionsDock` eliminado), rama empujada y [PR #21](https://github.com/Chrisburg22/Futcademic/pull/21) abierto. Los 3 checks en verde.
- **`gh` con dos cuentas:** la activa era `sifuentesjonath`, que no es colaboradora, y el `pr create` falló con «must be a collaborator». Se cambió a `Chrisburg22`, se creó el PR y **se dejó la cuenta activa como estaba**. El `push` sí funcionó porque va por SSH con otra credencial.
- **Se revirtió `web/next-env.d.ts`:** lo reescribe `next dev` al arrancar para los tests y el propio archivo dice que no se edita.
- **El PR está en conflicto con `main`**, que avanzó 6 commits desde la base de la rama (`0a6460b`): entraron el PR #18 (pase de lista de cancha e histórico de deserción) y el #19 (PWA offline). Conflicto en `AttendancePage.tsx`, `app/(app)/attendance/page.tsx`, `StudentEditForm.tsx` y `StudentAttendancePanel.tsx` (este último **borrado** en `main`).
- **Hallazgo clave:** `main` **ya arregla el defecto del alumno** con `OwnAttendance`, así que `StudentAttendancePage.tsx` sobra; pero **no** arregla el del padre (`ParentAttendance` sigue sin leer `?student_id=`). Al resolver: quedarse con `OwnAttendance`, conservar la corrección del padre, descartar los cambios al panel borrado.
- **De paso se explica** la contradicción detectada ayer: el `AGENTS.md` de este worktree dice que la PWA está diferida porque la rama es anterior al merge del #19.
- **Pendientes:** resolver el conflicto (son decisiones de contenido, no de git) y volver a pasar build y suite.

## 2026-11-12 (5) · Cierre de la Fase 4 y Fase 5 (limpieza)

- **Objetivo:** terminar lo que faltaba del módulo del admin y dejar las reglas escritas.
- **Cambios:** `web/src/screens/admin/components/StudentWizard.tsx` e `InviteStudentModal.tsx` pasan a `BottomSheet` (el alta usa `BirthDateInput`); sección «Mobile UI rules» nueva en el **`AGENTS.md` raíz**; aserciones acotadas en `web/e2e/demo-manual.spec.ts` y `web/e2e/fase1.spec.ts`.
- **Decisiones:** las reglas van al `AGENTS.md` raíz y **no** a `web/AGENTS.md`, que lo regenera `next dev`. Los 23 `size="compact-*"` se conservan: el suelo CSS los sube a 44 px en teléfono y el spec de toque lo demuestra sin excepciones; barrerlos cambiaría la densidad de escritorio sin ganar nada.
- **Comprobaciones:** `grep useMediaQuery` devuelve solo `src/hooks/useEsMovil.ts`; `e2e/touch-targets.spec.ts` sin excepciones; `demo-manual` y `fase1` 33/33.
- **Hallazgo sin tocar:** el `AGENTS.md` del worktree dice que la PWA está diferida y que no hay service worker, mientras la bóveda documenta `public/sw.js` y soporte offline. Una de las dos está desactualizada.
- **Pasada final:** build en verde y **139 pruebas e2e pasadas, 0 fallos**. Con esto quedan terminadas las fases 0 a 5 del rediseño móvil.
- **Pendientes:** nada commiteado.

## 2026-11-12 (4) · Fase 4: módulo de alumnos del admin en teléfono

- **Objetivo:** rediseñar para móvil el listado y la ficha de alumnos del admin y el profesor.
- **Cambios:** `web/src/screens/admin/StudentsPage.tsx`, `components/StudentsToolbar.tsx`, `components/StudentsTable.tsx`, `components/StudentsSummary.tsx`, `components/StudentEditForm.tsx`, `components/StudentPaymentsPanel.tsx`, `components/StudentAttendancePanel.tsx`, `components/TutorReminderModal.tsx`, `StudentDetailPage.tsx`; `components/common/ActionBar.*` (prop `mobileOnly`), `BottomSheet.tsx` (`closeLabel`), `InfoPopover.tsx`, `BirthDateInput.tsx`; `components/chat/ChatWidget.tsx`.
- **Resultado:** el primer alumno pasó de ~550 px de cromo a ~270 px. `e2e/touch-targets.spec.ts` quedó **sin excepciones**.
- **Decisiones:** en móvil no se ofrecen columnas ni densidad (son conceptos de la tabla); para ver más alumnos están «Anteriores/Siguientes». El buscador se unificó en una sola instancia. Los filtros secundarios solo se montan en escritorio: en teléfono viven en la hoja, y tenerlos en los dos sitios duplicaría cada etiqueta.
- **Defectos de capas corregidos:** el botón flotante del chat (z-index 300) se montaba sobre la barra «Nuevo alumno» y sobre la hoja de filtros; bajó a 190 y ahora descuenta `--action-bar-height`. La paginación de escritorio se movió a la izquierda porque el mismo botón interceptaba sus clics.
- **Coste asumido:** tabla y tarjetas conviven en el DOM, así que varios textos aparecen dos veces y algunas aserciones hubo que acotarlas (`getByRole('cell', …)`, la región de la barra masiva). A cambio desaparece el parpadeo y el desbordamiento horizontal.
- **Pendientes:** `StudentWizard` e `InviteStudentModal` siguen como `Modal`; falta la Fase 5 (limpieza y reglas en `web/AGENTS.md`). Nada commiteado. Build y suite completa quedaron corriendo al cerrar.

## 2026-11-12 (3) · Suite completa tras la Fase 3: 4 fallos corregidos

- **Objetivo:** dejar en verde build y suite completa después del rediseño móvil y de las correcciones que destaparon las capturas.
- **Resultado de la primera pasada:** build en verde; e2e 135 pasados / 4 fallos.
- **Cambios:** `web/src/screens/DashboardPage.tsx` (descripción del alumno a «Lo que viene y cómo vas»); aserciones en `web/e2e/fase4.spec.ts`, `web/e2e/fase5.spec.ts` y `web/e2e/demo-manual.spec.ts`.
- **Causas de los fallos:** dos eran el renombre de la etiqueta del KPI («Racha» → «Sesiones seguidas») sin propagar a `fase4`/`fase5`; los otros dos, colisiones de `getByText` por subcadena: la descripción del inicio repetía literalmente la etiqueta de la tarjeta (se arregló la **redacción**, no el test) y el encabezado «Compañeros» choca con el badge «3 compañeros» de `CategorySummary` (ahí sí `{ exact: true }`).
- **Tropiezo:** el reemplazo de `exact: true` alcanzó también al test 04 de `demo-manual` (ficha del admin), que estaba pasando; revertido. `demo-manual` quedó 22/22.
- **Pasada final:** build en verde y **139 pruebas e2e pasadas, 0 fallos**.
- **Pendientes:** fases 4 (módulo de alumnos del admin; `StudentsFilterSheet.tsx` escrito pero sin cablear) y 5 (limpieza y `web/AGENTS.md`); nada commiteado.

## 2026-11-12 (2) · Capturas móviles y cuatro defectos que destaparon

- **Objetivo:** ver cómo quedaron las vistas de la Fase 3 en teléfono, con Playwright y backend simulado.
- **Cambios:** nuevo `web/e2e/capturas-movil.spec.ts` (390×844, 15 PNG por rol en el directorio temporal, no en el repo). Correcciones en `web/src/components/layout/MobileNav.tsx`, `web/src/components/common/ActionBar.module.css`, `web/src/components/common/BottomSheet.tsx`, `web/src/components/attendance/AttendanceStrip.tsx`, `web/src/screens/dashboard/ParentDashboard.tsx`, `web/src/screens/ChildrenPage.tsx`, `web/src/screens/StudentAttendancePage.tsx` y `web/src/screens/FinancesPage.tsx`.
- **Defectos encontrados mirando las capturas, no por los tests:**
  1. La barra inferior iba en `z-index: 250` y los overlays de Mantine en 200, así que **tapaba el botón principal de las hojas inferiores**. Barra a 150, `ActionBar` a 160. El test pasaba porque el botón existía y Playwright lo daba por visible.
  2. `tt="capitalize"` sobre el valor crudo pintaba «Pendiente_pago»; ahora se usa `ESTADOS_ALUMNO`/`normalizarEstado`.
  3. `AttendanceStrip` arrancaba por la sesión más vieja y las recientes quedaban fuera de pantalla; ahora el scroll empieza al final.
  4. El título del padre decía «Finanzas» mientras la navegación decía «Pagos»; unificado en «Pagos» (`demo-manual` y `fase3` actualizados).
- **Decisiones:** se quitó el asa de `BottomSheet` (el `Drawer` pinta la cabecera primero, así que quedaba bajo el título y se leía como separador). El profesor conserva «Asistencias» en la barra: esa pantalla es pase de lista **e** histórico.
- **Pendientes:** sin cambios respecto a la entrada anterior — fases 4 y 5, y nada commiteado. El resultado del build y la suite completa tras estas correcciones quedó corriendo al cerrar.

## 2026-11-12 · UX/UI móvil de la sección de alumnos (fases 0-3)

- **Objetivo:** rediseñar para teléfono la sección de alumnos —módulo de gestión del admin y vistas del rol alumno/padre—, con prioridad en gente que no usa aplicaciones. Plan de 6 fases aprobado; ejecutadas 0 a 3 en el worktree `estudiantes-mobile-ux-ui-d7e888`.
- **Fase 0, suelo táctil:** `web/src/lib/theme.ts` y `web/src/styles/globals.css`. El mínimo de 44 px lo pone CSS (`touch-target`/`touch-row` vía `classNames`), no `defaultProps`, que no gana contra un `size="compact-sm"` explícito. Se sobrescriben `--mantine-font-size-{xs,sm,md}` bajo 48em.
- **Fase 1, navegación:** nuevos `web/src/components/layout/navItems.ts` (fuente única) y `MobileNav.tsx`; eliminado `QuickActionsDock.tsx`; `Sidebar.tsx`, `AppShell.tsx` y `AdminDashboard.tsx` adelgazados. Cuatro destinos por rol + «Más», montada una vez en `AppShell`.
- **Fase 2, primitivas:** 11 componentes nuevos en `web/src/components/common/` (`ActionBar`, `BottomSheet`, `TouchRow`, `KpiCarousel`, `FilterChip`, `FilterSheet`, `InfoPopover`, `ErrorState`, `SkeletonPage`, `SearchInput`, `BirthDateInput`), más `hooks/useEsMovil.ts`, `components/attendance/AttendanceStrip.tsx` y `PageHeader` ampliado.
- **Fase 3, alumno y padre:** reescritas `StudentDashboard`, `ParentDashboard`, `StatsPage`, `TeamPage`, `AchievementsPage`, `ChildrenPage`, `DashboardPage`, `OnboardingPage`, `ProfilePage` y el bloque `ParentFinances` de `FinancesPage.tsx`; nueva `StudentAttendancePage.tsx`; `CategorySummary` pone el horario antes que los entrenadores; `AuthLayout.module.css` respeta áreas seguras.
- **Dos defectos reales corregidos:** el alumno que entraba a `/attendance` veía el pase de lista del profesor (`AttendancePage` no desviaba su rol), y el padre que llegaba con `?student_id=` caía en un selector vacío (`ParentAttendance` nunca leía la query, al contrario que `ParentFinances`).
- **Decisiones:** no se añade `vaul` (~12-15 kB más Radix, segundo gestor de foco junto al `ModalsProvider` ya montado); `BottomSheet` va sobre el `Drawer` de Mantine. Para el padre `/finances` se llama «Pagos»; el profesor conserva «Asistencias» porque esa pantalla tiene pase de lista **y** histórico. Las etiquetas de KPI del alumno dejan de abreviar («Tu mejor racha» en vez de «Racha máx»).
- **Pruebas:** nuevos `web/e2e/touch-targets.spec.ts` (lista de excepciones que se vacía por fases) y `web/e2e/familia-movil.spec.ts`; reescrito `mobile-layout.spec.ts`. Verde: build, `mobile-layout` (13), `touch-targets` (2), `familia-movil` (6) y los 14 specs que la Fase 1 rompió (`chat-widget`, `fase2`, `fase3`, `demo-manual`).
- **Hallazgo de entorno:** el worktree no tiene `web/.env` (gitignorado), así que `npm run build` necesita `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY`/`NEXT_PUBLIC_API_URL` inline. Ojo con `npm run build | tail`: el código de salida es el del `tail`, no el del build.
- **Pendientes:** re-ejecutar la suite completa tras la Fase 3 (`demo-manual`, `fase1/3/4` tocan pantallas de familia); fases 4 (módulo del admin; `StudentsFilterSheet.tsx` ya escrito pero sin cablear) y 5 (limpieza y `web/AGENTS.md`). «Avisar que ya pagué» por WhatsApp **no se puede hacer**: `schools` solo tiene `contacto_email`, no teléfono. Nada commiteado.

## 2026-11-11 · Cuaderno en Gemini Notebook

- **Objetivo:** pasar el proyecto de minería y la bóveda a Gemini Notebook para generar material de estudio.
- **Cambios:** bóveda consolidada en `entrega-mineria/05-vault-app/` (9 `.md`, sin frontmatter); cuaderno creado desde Chrome con 27 fuentes.
- **Decisiones:** el conector `notebooklm-mcp-server` falló al autenticar; se subió vía Chrome. Bóveda revisada sin secretos antes de subir.
- **Pendientes:** el `.zip` no incluye `05-vault-app/`; nada commiteado.

## 2026-11-11 · Paquete de minería solo en Markdown (para Gemini)

- **Objetivo:** dejar `entrega-mineria/` lista para una IA, solo con archivos `.md`; además, merge local de la rama a `main` (`4336f11`).
- **Cambios:** 18 `.md` (índice, 7 docs, 6 scripts en bloques de código, tabla real completa, muestra sintética, 14 diapositivas con notas, 7 pasos de la animación); se quitaron `.py/.csv/.json/.html`; zip regenerado.
- **Decisiones:** corregir 570→566 filas en las copias; sin nombres reales ni credenciales.
- **Pendientes:** los originales en `compartir/` y `docs/` siguen con 570; nada commiteado ni subido.

## 2026-11-11 · Paquete compartible de minería

- **Objetivo:** juntar todo el proyecto de minería en una carpeta para comprimir y compartir; además se explicó arquitectura y código.
- **Cambios:** nueva `entrega-mineria/` (41 archivos, README) y `entrega-mineria.zip` (212 KB) en el worktree; rutas de las copias ajustadas, probadas (AUC 0.779).
- **Decisiones:** excluir datos con nombres de menores y credenciales; omitir `validar_real.py`/`dataset_real.csv` (570 filas, obsoleto).
- **Pendientes:** docs 01-07 aún citan 570 filas (vigente 566); nada commiteado ni subido a GitHub.

## 2026-11-10 (2) — Entrenamiento del modelo A sobre la vista minable

- **Objetivo**: entrenar el árbol de decisión sobre la vista y comprobarlo con otra herramienta; añadirlo al deck.
- **Cambios**: nuevo `mineria/entrenar_vista.py` (CART propio + contraste scikit-learn 1.6.1 en un venv fuera del repo), commit en el worktree, sin push. Deck: +3 diapositivas (proyecto, entrenamiento, comprobación), 14 en total.
- **Resultado**: AUC prueba 0.779, recall al 25 % 0.725, lift 2.89×, idéntico en ambas implementaciones; validación cruzada por alumno AUC 0.730.
- **Decisión**: reportar que la tasa de asistencia previa sola da AUC 0.784 (el árbol no la supera).
- **Pendientes**: comparar con regresión logística y bosque aleatorio; actualizar `compartir/` y `docs/` (siguen citando 570 filas).

## 2026-11-10 — Vista minable (KDD 1-4) y deck de avance

- **Objetivo**: preparar la entrega de avance de la vista minable (limpieza, integración, selección, transformación) con los tres integrantes.
- **Cambios**: nuevo `mineria/vista_minable.py` (genera `mineria/real/vista_minable.csv`, 566 filas, 152 alumnos, y un informe JSON) en el worktree `futcademic-university-project-e6e6ec`, commit `6c2291f` (sin push). Deck nuevo de 11 diapositivas en Artifacts (https://claude.ai/artifact/JbxNpM83NGFYdJo619P8KC).
- **Decisiones**: edades fuera de 3–18 años se excluyen; los atípicos de conducta (racha, tasas) se conservan.
- **Hallazgo**: `dataset_real.csv` traía 4 filas con edad −795 y 24; la vista nueva las corrige.
- **Pendientes**: `compartir/` y `docs/` aún citan 570 filas; reentrenar el modelo A sobre la vista nueva.

## 2026-10-28 — Merge de main en el PR de PWA offline

- **Objetivo**: resolver los conflictos del PR
  [#19](https://github.com/Chrisburg22/Futcademic/pull/19) con `main`, que
  había cambiado mientras tanto la pantalla de pase de lista, los fixtures
  de alumnos/finanzas y `dayjs`.
- **Cambios**: merge con `origin/main` en el worktree de la rama (commit
  `c385675`, subido). El host no podía sincronizar porque el remoto es SSH.
  El PR pasa de CONFLICTING a MERGEABLE.
- **Archivos en conflicto**: `web/src/screens/AttendancePage.tsx` (se toma
  la versión de main y se reaplica la parte offline),
  `web/src/hooks/useAttendances.ts` (cola + `useEstadisticaAsistencia`),
  `web/src/lib/dates.ts` (main), `web/e2e/demo-manual.spec.ts` y
  `web/e2e/fase4.spec.ts` (main). Además se ajustan
  `web/src/lib/offlineMutations.ts`, `web/e2e/pwa.spec.ts` y
  `web/e2e/asistencias.spec.ts`.
- **Decisiones**:
  - La caché optimista del pase de lista usa la forma de `Attendance`
    (`type`, `date`, `training_id`). Sin eso `marcasDeRegistros` descarta las
    filas y las marcas no volvían tras recargar sin red.
  - Los defaults de la cola invalidan `['attendances']` completa y
    `['trainings']`, como hacía main.
  - Dos expectativas obsoletas en `demo-manual`: «Años de nacimiento» →
    «Años» (main la renombró) y las pestañas de Finanzas → Cobranza / Pagos
    del mes / Nómina (de `0a6460b`).
  - En Mantine `Select`, volver a elegir la opción ya seleccionada la
    deselecciona: el test de recarga no debe repetir el clic.
- **Verificación**: `tsc` y `build` limpios; `test:pwa` 6/6; `test:e2e`
  127/127 en la última suite completa, y `asistencias.spec.ts` corregido
  después (7/7).
- **Mezclado**: PR #19 mezclado a `main` con merge commit `3d68fcf` (el
  29-10-2026 UTC).
- **Pendientes**:
  - El PR arrastró `0a6460b` (finanzas), que no estaba en main. Quedó
    mezclado con el resto; revisarlo aparte si hace falta.
  - Sin CI en el repo: la verificación fue solo local.

## 2026-10-28 — La PWA abre sin internet

- **Objetivo**: que la web se pueda usar sin conexión. El intento anterior
  fallaba con "no carga la página". Rama
  `claude/pwa-offline-functionality-b9f43f` (solo `web/`), commit `80d0d4a`,
  PR [#19](https://github.com/Chrisburg22/Futcademic/pull/19).
- **Archivos nuevos**: `web/app/manifest.ts`, `web/app/offline/page.tsx`,
  `web/public/sw.js`, `web/src/lib/offlineAuth.ts`,
  `web/src/lib/offlineMutations.ts`,
  `web/src/components/pwa/ServiceWorkerRegistration.tsx`,
  `web/src/components/pwa/OfflineQueueBadge.tsx`.
- **Archivos tocados**: `web/app/layout.tsx`, `web/next.config.ts` (cabeceras de
  `/sw.js`), `web/src/contexts/AuthContext.tsx`, `web/src/lib/queryClient.ts`,
  `web/src/components/providers/Providers.tsx`,
  `web/src/components/layout/AppShell.tsx`, `web/src/hooks/useAttendances.ts`,
  `web/src/hooks/usePayments.ts`, `web/src/screens/AttendancePage.tsx`,
  `web/src/screens/FinancesPage.tsx`, `web/e2e/pwa.spec.ts`,
  `web/playwright.pwa.config.ts`, `web/playwright.config.ts`,
  `web/package.json` (script `test:pwa`), `web/README.md`, `AGENTS.md`.
- **Causa real del fallo**: no era solo que faltara el service worker. Con el
  shell servido desde caché, `supabase.auth.getSession()` devuelve `null`
  cuando el refresh del token no tiene red, así que `ProtectedRoute` rebotaba
  a `/login`; y la consulta del perfil a `users` también fallaba, dejando el
  `AppShell` sin rol ni menú.
- **Service worker a mano** (`web/public/sw.js`), sin Workbox ni Serwist:
  `futcademic-assets` cache-first para `/_next/static` y estáticos (hash =
  inmutables, no se purgan entre despliegues porque son lo único que mantiene
  viva la versión instalada) y `futcademic-docs` network-first para HTML y
  payloads RSC, con clave sin query string para no guardar tokens de
  invitación. `/api/**` y los otros orígenes nunca se cachean: de los datos se
  encarga la caché persistida de TanStack Query.
- **Registro solo en producción** (`ServiceWorkerRegistration`): en desarrollo
  desinstala el que hubiera, porque un SW sirviendo chunks viejos rompe el HMR.
  Tras registrarse le pasa por `postMessage` los recursos de la carga actual,
  que no pasaron por su `fetch`; sin eso la app no abre sin red hasta la
  segunda visita.
- **Arranque sin conexión** (`web/src/lib/offlineAuth.ts`): sesión leída de
  localStorage como respaldo de `getSession()`, último perfil descargado en
  `futcademic-profile`, `onAuthStateChange` ignora una sesión nula salvo en
  `SIGNED_OUT` y `signOut` limpia aunque el POST de logout falle.
- **Manifest** en `app/manifest.ts` (3 iconos, uno maskable) y pantalla
  `/offline` como fallback de navegación.
- **Verificación**: `npm run build` + `npx tsc --noEmit` limpios,
  `npm run test:pwa` 5/5 (la suite dormida de la fase 2, reactivada: corta la
  red de verdad con `context.setOffline`) y `npm run test:e2e` 121/121.
- **Cola de escrituras** (misma sesión, después): el pase de lista, completar
  entrenamiento y los dos registros de pago ya se pueden guardar sin red. No se
  escribió cola propia: con `networkMode: 'online'` TanStack Query pausa la
  mutación, el persister la guarda y `onlineManager` la reanuda. La `mutationFn`,
  el optimista del pase de lista y los `invalidateQueries` viven en
  `setMutationDefaults` (`web/src/lib/offlineMutations.ts`) porque al rehidratar
  solo sobrevive la `mutationKey`.
- **Trampa encontrada**: `onlineManager` arranca en `true` y solo cambia con los
  eventos `online`/`offline`. Una app abierta **ya sin red** se creía conectada y
  ejecutaba la cola contra el vacío, perdiéndola. `queryClient.ts` ahora lo
  sincroniza con `navigator.onLine` al cargar. El test 06 de `pwa.spec.ts` lo
  cubre: recarga sin red y comprueba que no sale ninguna petición.
- **Otra trampa**: las pantallas no pueden `await mutateAsync`; la promesa de una
  mutación pausada no resuelve hasta que vuelva la red (el botón se quedaba
  girando). Ahora usan `mutate` con callbacks y `willQueueOffline()` para el
  aviso, y los `loading` descuentan `isPaused`.
- **Pendiente**: el login sin conexión no es posible (lo valida Supabase) y
  cualquier escritura que no esté en `offlineMutations.ts` sigue necesitando red.
  Cerrar sesión con cola pendiente la borra: por eso ahora pide confirmación.

## 2026-10-27 — Asistencias como herramienta de cancha

- **Objetivo**: que `/attendance` sirva para pasar lista en la cancha en menos
  de un minuto y para detectar deserción, y que la ficha del alumno diga
  cuánto asiste. Rama `claude/attendance-section-ux-improvements-c96c11`
  (solo `web/`; el backend vive en otro repo y no se tocó).
- **Pase de lista**: sesión agendada del día elegida sola (`GET
  /events/trainings`, viaja como `training_id`), marcas de tres estados
  (presente / ausente / sin marcar), búsqueda, filtros por marca y por riesgo,
  cuatro órdenes, acciones masivas sobre *lo filtrado*, columnas elegibles
  (asistencia histórica, faltas seguidas, última asistencia, notas médicas,
  contacto) y barra de guardado pegada al pie.
- **Decisión clave**: «sin marcar» no existe en la base (`present` es
  booleano), así que al guardar se avisa de cuántos se guardarán como
  ausentes. Antes el interruptor daba por ausente a todo el que nadie tocara.
  Los alumnos inactivos quedan fuera del pase salvo marca explícita.
- **Histórico**: dos vistas, por alumno (porcentaje, faltas seguidas, última
  asistencia, tendencia, ordenable) y por sesión (quién asistió y quién
  faltó, con atajo al pase de lista de ese día), con periodo, tipo, búsqueda,
  aviso de alumnos en riesgo (<60% o 3 faltas seguidas) y exportación CSV. El
  estado vive en la query.
- **Ficha del alumno**: pestaña de asistencia reconstruida (KPIs, meses,
  sesiones, CSV) y compartida con la vista del padre; tarjeta de asistencia en
  el resumen y badge naranja en la pestaña cuando está en riesgo. La edición
  mide lo que falta por llenar, copia los datos del tutor al contacto de
  emergencia y guarda con ⌘/Ctrl + S.
- **Roles**: el padre entra directo al historial de su hijo y el alumno al
  suyo; antes ambos caían en el pase de lista, que para un alumno es un 403.
- **Fechas en español**: `lib/dates.ts` fija el locale de dayjs y `Providers`
  monta un `DatesProvider` con `locale: 'es'` (Mantine no lee el locale
  global). Antes `format('ddd DD MMM')` salía en inglés en pagos y agenda.
- **Trampa encontrada**: `data = []` en los hooks de TanStack crea un array
  nuevo por render; con el efecto que precarga las marcas eso era un bucle de
  `setState`. Arreglado con constantes de módulo y comparación por contenido
  (`mismasMarcas`).
- **Verificación**: `npm run build` y `npx playwright test` (128 pruebas, con
  `e2e/asistencias.spec.ts` nuevo: 7 casos). Siguen fallando de antes, sin
  relación con este cambio: `fase4 › alumno: página de equipo` y
  `demo-manual › 21 — Alumno: Mi equipo` (la pantalla lee `full_name` donde el
  backend manda `name`) y `demo-manual › 06 — Admin: Categorías` (busca "Años
  de nacimiento", texto que el módulo ya no usa).
- **PR**: [#18](https://github.com/Chrisburg22/Futcademic/pull/18) a `main`.
- **Mi equipo** (mismo PR, commit aparte): los dos fallos de e2e no eran de la
  pantalla sino de las fixtures. `GET /students/:id/team` manda los
  entrenadores como `{id, name, avatar, phone}` y los horarios como
  `{id, name, time, venue}`; `fase4.spec.ts` y `demo-manual.spec.ts` seguían
  con `full_name` y `day`/`start_time` (`fase1.spec.ts` ya estaba bien).
- **Pendiente**: justificar faltas y marcar retardos necesita una columna
  nueva en `attendances`; avisar al tutor por falta necesita endpoint. Sigue
  rojo `demo-manual › 06 — Admin: Categorías`, que busca "Años de nacimiento",
  texto que el módulo ya no usa.

## 2026-10-27 — Inicio como tablero y más filtros en alumnos

- **Objetivo**: que Inicio responda "qué hay que hacer hoy" y que el listado de
  alumnos filtre y se lea como una herramienta de trabajo; de paso, mejorar la
  ficha y la edición. Rama `claude/ui-ux-home-students-improvement-9eea66`
  (solo `web/`; el backend no se tocó).
- **Inicio** (`screens/dashboard/AdminDashboard` + `dashboard/components/`):
  indicadores con contexto y enlace (activos / asistencia de hoy / por cobrar /
  ingreso), bandeja "Por atender" que enlaza al listado ya filtrado, agenda de
  los próximos 7 días y altas recientes. `upcomingEvents` y la cobranza ya
  existían en el backend y la pantalla anterior no los usaba.
- **Listado**: once filtros (nuevos: pago del mes, contacto de emergencia,
  notas médicas, fecha de alta y el atajo "Por atender"), etiquetas para quitar
  cada filtro, tarjeta "Con adeudo", orden por adeudo, y tabla con columnas
  elegibles, densidad y filas por página guardadas en `localStorage`. El estado
  del listado (filtros, orden, página) vive en la query: se comparte, se vuelve
  atrás y es como Inicio enlaza a cada aviso.
- **Adeudo**: `GET /students` no lo trae; se cruza con `GET /payments/pending`
  (`ContextoAlumnos` en `lib/students.ts`). `useGetPendingPayments` acepta
  `enabled` porque la ruta es solo de admin.
- **Ficha**: anterior/siguiente con la posición, avisos en las pestañas
  (documentos que faltan, deuda), badge de expediente y botones para llamar o
  escribir al tutor por WhatsApp, más una tarjeta de mensualidad en Resumen.
- **Edición**: resumen de errores con enlace al campo, foco en el primero y
  barra de guardado pegada al pie. **Bug encontrado**: `PUT /students/:id` lee
  `fullName`, así que renombrar a un alumno devolvía 200 sin guardar nada; el
  panel manda ahora los dos nombres. Ver [[Deriva conocida]]. Queda pendiente
  aceptar `full_name` en el backend.
- **Verificación**: `npm run build` (con env stub) y los 121 e2e; fallan solo
  06 (Categorías), 21 (Mi equipo) y `fase4` "página de equipo", que ya venían
  rotos de la reescritura de categorías. Pruebas nuevas: `web/e2e/inicio.spec.ts`
  y cuatro casos en `alumnos.spec.ts` (URL, adeudo, columnas, siguiente alumno).
- **Entrega**: commit `31d15d6` en `claude/ui-ux-home-students-improvement-9eea66`,
  empujado a `origin`, y PR Chrisburg22/Futcademic#17. `gh pr create` falla con
  `must be a collaborator` mientras la cuenta activa sea `sifuentesjonath`:
  hay que pasar a la del dueño con
  `gh auth switch -h github.com -u Chrisburg22` (quedó activa esa).
  `web/next-env.d.ts` se deja fuera del commit: `next dev` lo reescribe a
  rutas `.next/dev` y `next build` lo devuelve.
- **Pendiente**: fusionar la rama y volver a correr
  `vault.py generar` desde el checkout base (los archivos nuevos todavía no
  existen ahí); en el backend, aceptar `full_name` en `updateStudent`.

## 2026-10-27 — Rediseño de la sección de alumnos

- **Objetivo**: pantalla de alumnos profesional: más filtros, mejor tabla y
  ficha/edición más útil (con enfoque de producto: "a quién falta atender").
- **Cambios** (rama `claude/students-section-ux-improvement-587196`): listado con indicadores clicables, búsqueda sin acentos, filtros
  (categoría, estado, expediente, uniforme, año, tutor), orden, paginación,
  selección con acciones masivas (estado, categoría, uniforme), exportación CSV,
  tarjetas en móvil y edición rápida en panel lateral. Ficha con pestañas
  (Resumen, Datos, Expediente, Pagos, Asistencia), panel "Por atender" y
  formulario con validación y aviso de cambios sin guardar. Nota
  [[Modulo Alumnos]].
- **Decisión**: filtrar y paginar en el cliente (producción ~350 alumnos); no se
  tocó el backend.
- **Segunda tanda** (mismo día): fix de `getPendingPayments` en el backend
  (rama `fix/pending-payments-pendiente-pago`, 433 tests), migración y
  `schema.sql` para los estados, botón "Recordar al tutor" por WhatsApp,
  selección de todos los alumnos filtrados (cambio de temporada) y estado de
  expediente `en_revision`. Las claves de documento reales son siete
  (`identificacion_tutor_frente`/`_reverso`, `foto_alumno`…).
- **Verificación**: `tsc`, `npm run build` y e2e de alumnos/inscripción/chat
  pasan. En `demo-manual.spec.ts` fallan 06 (Categorías) y 21 (Mi equipo) por
  la reescritura de categorías ya fusionada, no por este cambio.
- **PRs**: web Chrisburg22/Futcademic#16 y backend
  Chrisburg22/futcademic-backend#5 (sin CI). Archivos clave: `web/src/lib/students.ts`,
  `web/src/screens/admin/StudentsPage.tsx`, `StudentDetailPage.tsx`,
  `components/Students*.tsx`, `StudentEditForm.tsx`, `TutorReminderModal.tsx`,
  `migrations/20261027_students_status_values.sql`, `schema.sql`.
- **Pendiente**: desplegar el backend, aplicar la migración a producción a mano, fusionar las dos ramas (web y backend), aplicar la migración
  a producción y correr `vault.py generar`/`verificar` (los archivos nuevos aún
  no existen en el checkout base). `gh` está con la cuenta `sifuentesjonath`
  (solo lectura en `Chrisburg22/*`); el push va por el alias SSH
  `github-cbpg`.

## 2026-10-27 — Hooks de la bóveda y fusión de las dos copias

- **Objetivo**: que cada conversación de Claude Code lea la bóveda al iniciar y
  la actualice al terminar.
- **Cambios**: tres hooks en `~/.claude/settings.json`, con scripts en
  `~/.claude/hooks/`, filtrados por `cwd` que contenga `Futcademic` (valen
  también desde worktrees): `futcademic-vault-context.sh` (SessionStart, inyecta
  `vault.py brief`), `futcademic-vault-end.sh` (SessionEnd, corre `generar` y
  `verificar` y registra en `~/.claude/futcademic-vault-end.log`) y
  `futcademic-vault-stop.sh` (Stop, bloquea el cierre si hay código más nuevo
  que esta bitácora).
- **Decisión**: había dos bóvedas. `vault/` (11 notas, 27-oct) era una
  reescritura parcial; `Futcademic/` (43 notas, 26-oct) tenía 35 notas que
  `vault/` no tenía. Se fusionaron en `vault/`: se copiaron esas 35, se
  conservaron las 8 comunes de `vault/` por ser más nuevas, el `.obsidian` pasó
  a `vault/` y la copia vieja se movió a la Papelera
  (`~/.Trash/Futcademic-boveda-2026-10-26`). `02-Backend/Chat IA.md` se renombró
  a `Chat IA - backend.md` para quitar el nombre duplicado; `[[Chat IA]]` apunta
  a la nota de `03-Web`. El mapa de la portada volvió a cubrir las 46 notas.
- **Revisión de los 12 avisos** (mismo día): las 10 notas del 26-oct se
  contrastaron contra el código y quedaron al día; `verificar` da 0 errores y
  0 avisos. Lo que estaba mal: la bóveda decía 18 tablas + 2 de chat y 4
  migraciones, y son **28 tablas y 8 migraciones**; faltaban los grupos de
  inscripciones, `teacher_permissions` y las dos tablas nuevas de chat; faltaba
  que las 10 tablas de migraciones traen `enable row level security` **sin
  políticas** (cierra la puerta directa, no aísla por fila); la matriz de roles
  no tenía inscripciones ni consentimiento, ni las **5 rutas públicas por token**
  del expediente (`/api/enrollment/:token…`, sin auth ni tenant: el link es la
  credencial); el contrato tiene 103 endpoints, no 77; los tests son 26 suites,
  no 20; y faltaba el comando `brief` y los hooks.
- **Decisión**: `Bitacora de sesiones` es la bitácora viva (una entrada por
  conversación); `Bitacora` queda como histórico de cambios de la bóveda. El
  frontmatter admite los dos esquemas (`tipo: manual` del 27-oct y
  `tipo/area/estado/fuentes` del 26-oct); al tocar una nota se conserva el suyo.
- **`Pantallas` al día** (mismo día): se añadieron `/admin/enrollments`,
  `/admin/enrollments/[id]`, la sección de inscripción pública
  (`/inscripcion/[token]`, fuera del shell, `noindex` y `no-referrer`), los dos
  cambios en `/admin/students*` (invitación por link y expediente en la ficha),
  los cinco componentes nuevos y `/forgot-password` y `/reset-password`, que
  tampoco estaban. Se agregó `web/src/components/layout/Sidebar.tsx` a sus
  `fuentes` para que `verificar` la vigile.
- **Pendiente**: las versiones del 26-oct de la portada, `Deriva conocida` y
  `Protocolo de busqueda` (más largas que las que quedaron) están solo en la
  Papelera, en `~/.Trash/Futcademic-boveda-2026-10-26`.

## 2026-10-27 — Dictado local en el asistente

- **Objetivo**: que el micrófono funcione en Brave, donde la Web Speech API
  devuelve `network` aunque haya internet.
- **Cambios**: Whisper Base q8 en un Web Worker (`web/src/lib/localSpeech.ts`,
  `web/src/workers/dictation.worker.ts`), captura y resample a 16 kHz en
  `web/src/lib/speech.ts`, estados y progreso en `ChatInput.tsx`. PR #14
  fusionado en `main` y desplegado.
- **Decisión**: dictado local; la primera vez descarga ~100 MB (modelo +
  runtime WASM) y queda en la caché del navegador. El audio nunca sale del
  dispositivo.
- **Pendiente**: pasada manual en Brave sobre producción para confirmar
  permiso, descarga inicial y transcripción.

## 2026-10-27 — Bóveda: lectura al inicio y actualización al cerrar

- **Objetivo**: que cada conversación nueva (OpenCode o Claude Code) lea el
  mapa de la bóveda en vez de explorar el repo, y que la bóveda se regenere al
  terminar.
- **Cambios**: nota de inicio y protocolo de búsqueda; comando `brief` en
  `scripts/vault/vault.py`; hooks `SessionStart`/`SessionEnd` en
  `.claude/settings.json`; `instructions` y plugin `session.idle` en OpenCode.
- **Decisión**: las notas generadas se actualizan solas; las decisiones y
  pendientes se escriben a mano en esta bitácora.
