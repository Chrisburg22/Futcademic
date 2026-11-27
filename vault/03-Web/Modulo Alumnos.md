---
tipo: manual
actualizado: 2026-11-12
tags:
  - web
  - alumnos
  - dominio
---

# Módulo Alumnos

El listado y la ficha de alumnos del admin y del profesor. Se rediseñaron el
27-oct para que el listado responda "a quién falta atender" y la ficha reúna
todo lo de un alumno en pestañas; ese mismo día se ampliaron los filtros, la
tabla pasó a ser configurable y el estado del listado se movió a la URL.

## Dónde vive

| Capa | Archivo |
| --- | --- |
| Listado: KPIs, filtros, orden, paginación, acciones masivas | `web/src/screens/admin/StudentsPage.tsx` |
| Indicadores clicables | `web/src/screens/admin/components/StudentsSummary.tsx` |
| Búsqueda y filtros | `web/src/screens/admin/components/StudentsToolbar.tsx` |
| Tabla (escritorio) y tarjetas (móvil) | `web/src/screens/admin/components/StudentsTable.tsx` |
| Formulario de edición compartido | `web/src/screens/admin/components/StudentEditForm.tsx` |
| Ficha con pestañas | `web/src/screens/admin/StudentDetailPage.tsx` |
| Pestaña Pagos | `StudentPaymentsPanel.tsx` (misma carpeta `components/`) |
| Pestaña Asistencia y tarjeta del resumen | `components/attendance/StudentAttendanceHistory.tsx` · `StudentAttendanceCard.tsx` (ver [[Modulo Asistencias\|Módulo Asistencias]]) |
| Filtros, orden, estado en la URL, pendientes, CSV | `web/src/lib/students.ts` |
| Preferencias de tabla (columnas, densidad, por página) | `web/src/hooks/useLocalPref.ts` |
| Recordatorio al tutor | `web/src/screens/admin/components/TutorReminderModal.tsx` |
| Acción masiva | `useBulkUpdateStudents` en `web/src/hooks/useStudents.ts` |
| E2E | `web/e2e/alumnos.spec.ts` |
| E2E de Inicio | `web/e2e/inicio.spec.ts` |

Ver [[Alumnos y acceso]], [[Hooks y endpoints]] y [[Pantallas]].

## Decisiones

- **Filtrado, orden y paginación en el cliente.** `GET /students` solo filtra por
  categoría y no pagina. Producción tiene ~350 alumnos, así que se trae la
  lista una vez y se trabaja en memoria (25 por página). Si pasa de unos miles,
  habrá que mover búsqueda y paginación al backend.
- **Indicadores = filtros.** Cada tarjeta (activos, pendientes de pago, con
  adeudo, expediente incompleto, sin tutor, inactivos) aplica el filtro que
  cuenta.
- **Once filtros, en dos niveles.** A la vista: búsqueda, categoría, estado y
  expediente. Detrás de «Más filtros»: pago del mes, uniforme, tutor, contacto
  de emergencia, notas médicas, año de nacimiento y fecha de alta. Encima de la
  tabla, el atajo «Por atender» deja solo a quien tiene algo urgente
  (`requiereAtencion`). Cada filtro activo se pinta como etiqueta que se quita
  por separado (`chipsDeFiltros`).
- **El adeudo no viene en `GET /students`.** Se cruza con `GET /payments/pending`
  (solo admin, por eso `useGetPendingPayments` acepta `enabled`) y se pasa a
  `filtrarAlumnos` / `ordenarAlumnos` / `resumirAlumnos` como `ContextoAlumnos`.
  Un enlace directo a `?adeudo=con` muestra el esqueleto hasta que llega la
  cobranza, en vez de «ningún alumno coincide».
- **Filtros, orden y página viven en la query** (`leerEstadoDeUrl` /
  `escribirEstadoEnUrl`): se comparte una vista, el botón atrás no la pierde e
  Inicio enlaza a «los 4 sin tutor» con `enlaceAlListado`. Se lee con
  `useSearchParams` —en una navegación suave `window.location.search` todavía
  no está puesto al primer render—, de ahí el `<Suspense>` en
  `app/(app)/admin/students/page.tsx`. Se escribe con `history.replaceState`
  para no llenar el historial.
- **La tabla la configura quien la usa**: columnas visibles, densidad y filas
  por página se guardan en `localStorage` (`useLocalPref`). Por omisión se
  muestran las columnas que caben sin scroll horizontal; edad, contacto,
  alta y «por atender» se encienden a mano.
- **Un solo formulario de edición** (`StudentEditForm`): en el panel lateral
  del listado y en la pestaña Datos de la ficha. Avisa de cambios sin guardar,
  resume los errores arriba con enlace al campo y deja la barra de guardado
  pegada al pie (apartada del dock móvil y del botón del chat). Desde el
  27-oct también mide la ficha ("completa al 57%") con enlace a cada dato que
  falta, copia nombre y teléfono del tutor al contacto de emergencia y guarda
  con ⌘/Ctrl + S.
- **El nombre se manda dos veces.** `PUT /students/:id` lee `fullName`; mandar
  solo `full_name` devolvía 200 sin guardar nada. Ver [[Deriva conocida]].
- **De una ficha a la siguiente.** La ficha trae «anterior / siguiente» sobre
  la lista ordenada por nombre, con la posición («3 de 30»), porque revisar
  expedientes o cobros se hace de uno en uno. Las pestañas avisan de lo que
  falta (documentos pendientes, deuda) y la cabecera lleva a llamar o escribir
  por WhatsApp al tutor.
- **Acciones masivas sin endpoint masivo**: una petición por alumno con
  `Promise.allSettled`; si alguna falla, quedan seleccionados solo los fallidos.
- **El profesor** no ve estado, baja, pagos ni equipo (el backend los limita a
  admin): la UI los oculta en vez de dejar que den 403.
- **Cambio de temporada**: se filtra por categoría, se seleccionan *todos los
  filtrados* (no solo los de la página) y se usa "Mover de categoría".
- **Recordar al tutor**: desde "Por atender" en la ficha, arma un mensaje con los
  documentos que faltan (`student_expediente_status.missing_documents`) y/o la
  deuda, y abre `wa.me` con la lada 52 si el teléfono tiene 10 dígitos. No envía
  nada desde el servidor.
- El expediente tiene cuatro estados: `completo`, `en_revision`, `incompleto`
  y `sin_tutor`. "Expediente incompleto" cuenta solo `incompleto` con tutor.
- La pestaña de la ficha vive en el hash (`#datos`, `#pagos`…).
- **Asistencia en la ficha**: el resumen trae una tarjeta con el porcentaje de
  los últimos 90 días, la última asistencia y las faltas seguidas, y la
  pestaña avisa con un badge naranja cuando el alumno está en riesgo. El
  historial completo (periodo, tipo, meses, sesiones y CSV) es el mismo
  componente que usa el padre en `/attendance`.

## Estados del alumno

La UI y el controlador usan `activo`, `pendiente_pago`, `becado`, `inactivo`.
`schema.sql` declaraba un CHECK con `beca` y `pendiente`; la base de producción
nunca lo tuvo (el 27-oct solo había `activo` e `inactivo`). Se alineó
`schema.sql` y se añadió `migrations/20261027_students_status_values.sql`, que
normaliza los valores antiguos y crea el CHECK nuevo; **hay que aplicarla a
producción a mano**, después de desplegar el backend. `normalizarEstado` acepta
ambos juegos mientras tanto.

`getPendingPayments` ignoraba `pendiente_pago` (un alumno marcado así
desaparecía de pendientes de pago). Corregido en el repo del backend, rama
`fix/pending-payments-pendiente-pago`.

## Otros hallazgos

- `GET /students/:id/team` y `GET /payments/account-statement/:id` son solo
  admin (y alumno / padre): la ficha del profesor no los pide.
- `PUT /students/:id` y `PATCH /students/:id/uniform` no pasan por
  `requireTeacherPermission('can_manage_students')`, a diferencia del resto de
  rutas de expediente.
- El estado de cuenta calcula el mes en curso con la fecha de vencimiento
  `2026-MM-10` escrita a mano.

## Móvil (12-nov)

El módulo se rediseñó para teléfono. Lo que cambió respecto a lo descrito
arriba:

- **Tarjetas y tabla conviven en el DOM** y elige el CSS
  (`hiddenFrom`/`visibleFrom`). Antes lo decidía `useMediaQuery`, que en el
  primer render devuelve `undefined`: se pintaba la tabla —hasta 1392 px de
  ancho mínimo— y luego saltaba a tarjetas. El coste es marcado duplicado; a
  cambio desaparece el parpadeo y el desbordamiento horizontal.
- La tarjeta es `TouchRow`: **toda** la superficie abre la ficha. El menú «…»
  recupera lo que la tabla tenía en columnas y en teléfono se perdía: llamar,
  WhatsApp, uniforme y cambiar estado.
- **Filtros en hoja inferior** (`StudentsFilterSheet`), agrupados por pregunta
  —¿Quién? ¿Qué le falta? ¿Debe? ¿Desde cuándo?— con borrador y botón
  «Ver N alumnos». A la vista quedan solo el buscador, «Filtros» y tres atajos:
  «Por atender», «Debe» y «Expediente incompleto». El orden vive dentro de la
  hoja.
- **Una sola instancia del buscador** (`SearchInput`): dos campos con la
  etiqueta «Buscar» rompían `getByLabel` y dejaban dos controles con el mismo
  nombre en el documento.
- Los KPI son `KpiCarousel` con anclaje y puntos, al 46 % de ancho.
- La acción principal vive en `ActionBar` al pie: «Nuevo alumno», o «Acciones»
  con alumnos seleccionados (la barra masiva pegada arriba se queda para
  escritorio). La paginación numérica se sustituye por «Anteriores /
  Siguientes», y en escritorio pasó a la izquierda porque el botón flotante del
  chat se comía sus clics.
- El cajón de edición rápida y el modal de mover categoría son `BottomSheet`
  (lateral y centrado desde `sm`); `TutorReminderModal` también.
- Ficha: sin `keepMounted`, cabecera con solo llamar y WhatsApp más un menú
  «Más», «Resolver» como botón, etiquetas de indicador en `sm` sin mayúsculas y
  los dos paneles con scroll lateral (pagos y asistencia) con filas táctiles en
  teléfono; el de asistencia estrena la tira de sesiones.
- `StudentWizard` e `InviteStudentModal` también son `BottomSheet`, y el alta usa
  la rueda de fecha nativa del teléfono (`BirthDateInput`).
