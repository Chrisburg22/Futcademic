# Bóveda de la app Futcademic · 08-Agentes

Notas técnicas internas de la app (Obsidian). Los [[enlaces]] apuntan a otras notas de la bóveda.

---

## Nota: Bitacora de sesiones

# Bitácora de sesiones

Una entrada por conversación, de la más reciente a la más antigua. Sirve para
que la siguiente sesión sepa qué se decidió y qué quedó pendiente sin releer el
historial completo.



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

---

## Nota: Bitacora

# Bitacora

Registro append-only de cambios **de la bóveda**. La entrada más reciente
arriba. Lo que se decidió en cada conversación va en
[[Bitacora de sesiones]], que es la que revisa el hook `Stop`.

| Fecha | Cambio | Archivos |
|---|---|---|
| 2026-10-27 | `Pantallas` completada: inscripciones, expediente, inscripción pública por token, recuperación de contraseña y componentes nuevos; `Sidebar.tsx` añadido a sus fuentes | `vault/03-Web/Pantallas.md` |
| 2026-10-27 | Notas del 26-oct revisadas contra el código: 28 tablas y 8 migraciones, RLS de las tablas nuevas, inscripciones y rutas públicas por token, 26 suites, comando `brief` y los hooks | `vault/04-Datos/Base de datos.md`, `vault/05-Dominio/Roles y permisos.md`, `vault/01-Proyecto/`, `vault/06-Recetas/`, `vault/00-Inicio/Convenciones de la boveda.md` |
| 2026-10-27 | Fusión de las dos bóvedas en `vault/` (46 notas), `.obsidian` movido, `Chat IA` del backend renombrada y mapa de la portada ampliado | `vault/**` |
| 2026-10-26 | Revisión final: 34 tools del chat, borrado de evento para admin, cascadas no versionadas y búsquedas portables sin `rg` | `vault/02-Backend/`, `vault/04-Datos/Deriva conocida.md`, `vault/05-Dominio/`, `vault/08-Agentes/` |
| 2026-10-26 | Creación de la bóveda: portada, 5 notas generadas, arquitectura, backend, web, datos, dominio, recetas, producto y agentes | `vault/**`, `scripts/vault/vault.py` |
| 2026-10-26 | Generador y verificador: rutas de API, tablas + migraciones, rutas web, hooks, índice, enlaces y fuentes | `scripts/vault/vault.py` |
| 2026-10-26 | Deriva documentada: columnas fantasma, RLS no versionado, rachas, permisos de profesor y fechas fijas | `vault/04-Datos/Deriva conocida.md` |

## Cómo agregar una entrada

```markdown
| 2026-11-02 | Descripción corta | `ruta/afectada` |
```

- Una fila por cambio relevante, no por archivo tocado.
- Si se corrige una deriva, se anota aquí y se borra la fila de [[Deriva conocida]].
- No borrar filas antiguas.

---

## Nota: Protocolo de busqueda

# Protocolo de búsqueda

Reglas para que un agente trabaje con la bóveda sin leer de más y sin dejarla
desactualizada. Aplica a OpenCode y a Claude Code.

## Al iniciar

1. Lee [[Boveda Futcademic|la nota de inicio]].
2. Identifica el área y lee **solo** esa nota.
3. Abre los archivos que la nota nombra. Si no alcanza, busca con `rg` acotado
   a la carpeta del área, no a todo el repo.

El hook de OpenCode inyecta la nota de inicio en cada sesión. En Claude Code,
el hook `SessionStart` imprime el mismo mapa. Si el hook no está activo, lee
`vault/00-Inicio/Boveda Futcademic.md` a mano.

## Al buscar

- **Rutas y pantallas**: [[Rutas web]] antes de mirar `web/app/`.
- **Llamadas a la API**: [[Hooks y endpoints]] antes de abrir los hooks.
- **Backend**: [[API - rutas]] y el controlador que nombre la tabla.
- **Base de datos**: [[Tablas]] y, si una columna no aparece, [[Deriva conocida]].
- **Chat**: [[Chat IA]], que separa web, backend y persistencia.
- **Categorías**: [[Modulo Categorias|Módulo Categorías]].

No leas notas generadas completas si solo necesitas una sección: usa sus
encabezados (`[[Tabla#students]]`, `[[API - rutas#payments]]`).

## Al cambiar código

- Si cambias rutas, esquema, pantallas o hooks, actualiza la nota manual del
  área en el mismo cambio.
- No edites notas con `tipo: generado`: se reconstruyen con
  `python3 scripts/vault/vault.py generar`.
- Si cambias rutas del backend, primero `cd backend && npm run routes:dump`;
  después regenera la bóveda.
- Añade `fuentes:` al frontmatter de una nota manual cuando dependa de archivos
  concretos; así `verificar` avisa si envejeció.
- Si una nota contradice al código, corrige la nota; no dejes la discrepancia.

## Al cerrar la conversación

1. `python3 scripts/vault/vault.py generar`
2. `python3 scripts/vault/vault.py verificar` (0 errores; revisa los avisos)
3. Añade una entrada al principio de [[Bitacora de sesiones]] con:
   - fecha y objetivo;
   - cambios y archivos principales;
   - decisiones que la siguiente sesión necesita conocer;
   - pendientes o riesgos.

El hook de cierre regenera las notas automáticamente, pero **la entrada de la
bitácora y las notas manuales son responsabilidad del agente**: el generador no
puede deducir decisiones.

## Qué no hacer

- No leer toda la bóveda ni todo el repo "por si acaso".
- No duplicar en una nota manual lo que ya genera `vault.py`.
- No editar `Indice completo.md` ni las demás notas generadas.
