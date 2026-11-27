---
tipo: manual
actualizado: 2026-10-27
tags:
  - web
  - asistencia
  - dominio
---

# Módulo Asistencias

La pantalla `/attendance` y el historial de asistencia de un alumno. Se
rehízo el 27-oct: el pase de lista pasó a ser una herramienta de cancha
(sesión del día, tri-estado, filtros, tabla configurable) y el histórico pasó
a responder "quién está dejando de venir", no solo "qué pasó cada día".

## Dónde vive

| Capa | Archivo |
| --- | --- |
| Pantalla y estado (categoría, fecha, tipo, marcas) | `web/src/screens/AttendancePage.tsx` |
| Contexto de la sesión: categoría, fecha, tipo, sesión agendada | `web/src/components/attendance/AttendanceSessionBar.tsx` |
| Lista con filtros, orden, columnas y marcas | `web/src/components/attendance/RollCallList.tsx` |
| Cifras del pase y barra de guardado | `web/src/components/attendance/RollCallStatus.tsx` |
| Histórico de la categoría (por alumno y por sesión) | `web/src/components/attendance/CategoryAttendanceHistory.tsx` |
| Historial de un alumno (ficha y vista del padre) | `web/src/components/attendance/StudentAttendanceHistory.tsx` |
| Tarjeta de asistencia del resumen de la ficha | `web/src/components/attendance/StudentAttendanceCard.tsx` |
| Dominio: marcas, estadísticas, riesgo, periodos, CSV, URL | `web/src/lib/attendance.ts` |
| Hooks | `web/src/hooks/useAttendances.ts` |
| E2E | `web/e2e/asistencias.spec.ts` |

Ver [[Asistencias]] (backend), [[Hooks y endpoints]] y [[Pantallas]].

## Decisiones

- **«Sin marcar» existe en la pantalla, no en la base.** `attendances.present`
  es un booleano, así que cada alumno se marca con dos botones (presente /
  ausente) y el segundo clic quita la marca. Al guardar, si queda alguien sin
  marcar se pide confirmación diciendo que se guardará como **ausente**: antes
  el interruptor daba por ausente a todo el que nadie tocara, en silencio.
- **Los inactivos no entran al pase de lista** salvo que alguien los marque a
  mano. El backend borra y reinserta por alumno (`saveAttendances`), así que
  mandarlos sin marca los registraría como faltas.
- **La sesión del calendario se elige sola.** `GET /events/trainings?date=`
  da las sesiones del día; la elegida viaja como `training_id` y es lo que
  hace que el backend marque el entrenamiento como completado. Si no hay
  ninguna, se dice y se puede pasar lista igual (queda sin sesión ligada).
- **Lo ya guardado se precarga, pero nunca pisa lo que el profesor marcó**
  (`sucio`): mismo criterio que el formulario de la ficha. Cambiar de
  categoría, fecha o tipo con marcas sin guardar pide confirmación, y
  `beforeunload` avisa al cerrar la pestaña.
- **El historial previo va junto a la marca**: porcentaje, faltas seguidas,
  última asistencia, notas médicas y teléfono del tutor son columnas
  elegibles (`useLocalPref`, igual que en alumnos). Ordenar por "peor
  asistencia" o "sin marcar primero" es lo que hace rápido pasar lista en una
  categoría grande.
- **Riesgo de deserción**: menos de `PORCENTAJE_RIESGO` (60%) con al menos 4
  sesiones, o `FALTAS_SEGUIDAS_RIESGO` (3) faltas seguidas. Es el único
  número que el admin pide de verdad al histórico, así que aparece como filtro
  ("En riesgo"), como aviso y como columna.
- **Dos vistas del histórico**: por alumno (tabla ordenable con porcentaje,
  faltas seguidas, última asistencia y tendencia de las últimas 8 sesiones) y
  por sesión (acordeón con quién asistió y quién faltó, con atajo para abrir
  el pase de lista de ese día). Ambas exportan CSV.
- **El estado viaja en la query** (`vista`, `categoria`, `fecha`, `tipo`,
  `periodo`, `detalle`): se comparte "el histórico de la Sub-12 a 90 días" y
  el botón atrás no lo pierde. Por eso `app/(app)/attendance/page.tsx` monta
  la pantalla dentro de `<Suspense>`.
- **Cada rol ve lo suyo**: el padre elige hijo (o entra directo si solo tiene
  uno) y el alumno ve su propio historial. Antes ambos caían en el pase de
  lista, que para un alumno es un 403 (`findStudentForTenant`).
- **Referencias estables**: `data = []` en los hooks crea un array nuevo en
  cada render; con un `useEffect` que precarga marcas eso es un bucle infinito.
  Los arrays vacíos son constantes de módulo y las marcas se comparan por
  contenido (`mismasMarcas`).

## Lo que no se puede hacer sin backend

- **Justificar una falta o marcar retardo**: `attendances` solo tiene
  `present` booleano. La UI no inventa un estado que no se puede guardar.
- **Avisar al tutor desde el servidor**: el recordatorio sigue siendo abrir
  WhatsApp desde el navegador ([[Modulo Alumnos]]).
- **Rachas**: nadie escribe `current_streak` (ver [[Asistencias]]); el
  porcentaje y las faltas seguidas de esta pantalla se calculan en el cliente
  a partir de las marcas.
