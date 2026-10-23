---
title: "Futcademic — Evaluación del núcleo"
subtitle: "Categorías, Alumnos y Asistencias: ¿son viables como producto?"
date: "23 de octubre de 2026"
author:
  - name: "Product Owner"
---

# Evaluación del núcleo: Categorías, Alumnos, Asistencias

Estos tres módulos no son tres funciones sueltas: son **el bucle central del
producto**. Categorías define la estructura, Alumnos la población, Asistencias
el hecho que se repite cinco veces por semana. Finanzas, Logros, Equipo y el
Asistente IA se alimentan de lo que estos tres produzcan. Si el bucle no cierra,
no hay producto — hay una base de datos con formularios encima.

Estado del código al 23 de octubre de 2026, incluyendo las conexiones hechas
hoy (`/categories/full`, permisos de profesor, `training_id` + cierre de sesión).

---

## 1. Veredicto

| Módulo | ¿Viable? | Por qué |
|---|---|---|
| **Categorías** | **Sí, con reservas** | El alta ya deja lista la temporada completa en un paso. Falla en mantenimiento: lo que creas no se puede cambiar. |
| **Alumnos** | **No al ICP declarado** | Sin buscador, sin paginación y sin importación, una academia de 300 alumnos no puede operar esta pantalla. El ICP del landing es 50-500. |
| **Asistencias** | **Viable para registrar, no para decidir** | La captura funciona y ya cierra la sesión. La ergonomía de cancha falla y lo que devuelve no responde ninguna pregunta de negocio. |

### El diagnóstico de fondo

**Los tres módulos son un sistema de captura, no un sistema de información.**

Casi todo el diseño está puesto en meter datos; casi nada en devolverlos
convertidos en una decisión. El dueño de la academia no paga por guardar
asistencias: paga por enterarse a tiempo de que un alumno lleva tres semanas sin
venir. Hoy el producto guarda ese dato perfectamente y **no lo dice en ninguna
pantalla de lista**.

Prueba concreta: la tabla `students` almacena `current_streak`, `max_streak` y
`last_attendance_date`. Una búsqueda en todo `web/src` da **cero resultados**
para los tres campos. El producto calcula el riesgo de fuga y lo deja escrito en
la base sin mostrarlo nunca.

---

## 2. El bucle, visto como producto

### Qué hace un cliente que paga, en sus primeros 30 días, con estos tres módulos

| Momento | Lo que hace hoy | Fricción |
|---|---|---|
| Día 1 | Crea 4-8 categorías con cuota, horario y profesor | **Resuelto.** Un paso por categoría. |
| Día 1-5 | Captura 50-300 alumnos, uno por uno, en un asistente de 3 pasos | **~2 min por alumno.** Con 300 alumnos son ~10 horas de captura manual. Es el muro de entrada. |
| Día 2 en adelante | Cada profesor pasa lista: elige categoría, fecha y tipo, y acciona un interruptor por alumno | **~20 toques por sesión**, sin conexión no funciona. |
| Día 30 | Entra a ver cómo va | **Aquí se rompe.** No hay pantalla que responda "quién está faltando", "quién está en riesgo" ni "cómo va cada grupo". |

El bucle captura bien y **no devuelve nada en el día 30**. Eso es exactamente el
momento en que el cliente decide si esto valía la pena.

### Las tres señales que el bucle ya podría producir y no produce

Con los datos que ya están guardados, sin tocar el backend:

1. **Porcentaje de asistencia por alumno**, visible en la lista de alumnos.
2. **Alumno en riesgo**: días desde `last_attendance_date`, con un umbral.
3. **Salud por categoría**: alumnos, % de asistencia del grupo y cuántos deben,
   cruzando `monthly_fee` con los pagos del mes.

Ninguna de las tres existe. Las tres son columnas y badges, no proyectos.

---

## 3. Categorías

### Qué hace hoy

- Alta en un paso con nombre, año de nacimiento, mensualidad, color, varios
  profesores, días de entrenamiento, hora, cancha y número de semanas a generar.
  El servidor crea los eventos y las sesiones de la temporada.
- Tabla con nombre, año, mensualidad y profesor.
- Detalle con tres pestañas: alumnos, agenda y asistencias del grupo.

### Veredicto: **viable, con reservas**

El alta dejó de ser un formulario de dos campos y pasó a ser la configuración
real de un grupo. Eso convierte a Categorías en el primer paso del Día 1 y lo
hace defendible.

La reserva es seria: **lo que creas no se puede mantener.**

### Funciones que faltan

| Falta | Por qué importa |
|---|---|
| **Editar la mensualidad** | La cuota sube cada temporada. Hoy se fija al crear y no hay forma de cambiarla. Es la cifra que gobierna todo el cálculo de adeudos. |
| **Editar el horario** | Un cambio de día u hora a mitad de temporada obliga a borrar el evento y recrearlo. |
| **Cupo máximo y lista de espera** | Es la herramienta con la que una academia decide abrir un grupo nuevo. Hoy no hay forma de saber si Sub-12 está lleno. |
| **Archivar al terminar la temporada** | En enero cada academia tendrá que convivir con los grupos del año pasado. |
| **Promover de categoría al cambiar el año** | Los alumnos cambian de grupo por edad una vez al año. Hoy es un cambio manual alumno por alumno. |
| **Edición alineada con el alta** | El modal de edición sigue enviando `birth_year` como cadena (`"2014-2015"`) contra una columna `INTEGER`, y no toca cuota, horario ni profesores múltiples. |

### Visibilidad que falta

La lista de categorías debería ser el panel de control de la academia y hoy es
un catálogo. Para un dueño con ocho grupos, las columnas útiles son:

| Columna | Hoy | Debería |
|---|---|---|
| Alumnos | no está | número, con aviso si supera el cupo |
| Asistencia del grupo | no está | % del mes, con semáforo |
| Cobranza del grupo | no está | cuántos deben de cuántos |
| Próxima sesión | no está | día y hora |
| Mensualidad | sí | sí |

En el detalle falta lo mismo en grande: el grupo tiene tres pestañas de datos y
ninguna cifra que resuma su estado. Un dueño abre Sub-12 y no puede responder
"¿cómo va este grupo?" sin leer tres tablas.

---

## 4. Alumnos

### Qué hace hoy

- Tabla filtrable por categoría, con avatar, nombre, correo, categoría, estatus
  editable en línea, conmutador de uniforme y acciones de ver, editar y eliminar.
- Alta con asistente de 3 pasos, incluyendo invitación del tutor por correo.
- Ficha con métricas de racha, asistencia del mes, logros, equipo e historial.

### Veredicto: **no viable al cliente que el producto dice servir**

El landing declara academias de **50 a 500 alumnos**. Esta pantalla:

- renderiza **todos** los alumnos sin paginación ni virtualización;
- **no tiene buscador por nombre** — solo filtro por categoría;
- no tiene ordenamiento, ni filtro por estatus, ni selección múltiple;
- no tiene importación masiva.

Con 300 alumnos, encontrar a uno exige recordar su categoría y desplazarse por
la tabla en un teléfono. No es una molestia de diseño: es la diferencia entre
servir o no servir al cliente objetivo. **Este es el módulo que decide si el
producto escala más allá de la academia de 40 alumnos.**

### Funciones que faltan

| Falta | Por qué importa |
|---|---|
| **Buscador por nombre** | Es la acción más frecuente sobre esta tabla. Una tarde. |
| **Paginación u orden** | Sin esto la tabla se vuelve inusable antes de los 200 alumnos. |
| **Importación CSV** | Mientras no exista, cada cliente nuevo es captura manual tuya o suya. Es el techo de crecimiento del negocio, no una comodidad. |
| **Acciones en bloque** | Cambiar de categoría a 20 alumnos al empezar temporada, uno por uno, son 20 modales. |
| **Papelera visible** | `GET /students/deleted` existe y ninguna vista lo muestra. Una baja por error hoy no se recupera desde la interfaz. |
| **Deshacer el cambio de estatus** | El `Select` en línea guarda al primer toque, sin confirmación. Un roce en móvil desactiva a un alumno. |
| **Correo opcional en el alta** | Es obligatorio para niños de 8 años: el dueño va a inventar direcciones. Debería generar el `username` de acceso en su lugar. |
| **Código de vinculación visible** | `/children` pide "código del alumno" y ninguna pantalla lo genera ni lo muestra. El circuito con los padres está roto de punta a punta. |
| **Dos tutores** | `parent_id` es una sola llave foránea. En familias separadas es lo normal. |
| **Vocabulario de estatus alineado** | La UI ofrece `becado` y `pendiente_pago`; el `CHECK` de la tabla acepta `beca` y `pendiente`. |

### Visibilidad que falta

Las columnas actuales —Alumno, Categoría, Status, Uniforme— describen al alumno
en reposo. Ninguna dice si el alumno **está yendo** o **está pagando**, que son
las dos únicas preguntas que el dueño se hace sobre su padrón.

| Columna propuesta | De dónde sale | Coste |
|---|---|---|
| Asistencia del mes | ya calculada en `/students/:id/stats` | agregar al listado |
| Días sin venir | `students.last_attendance_date`, **ya guardado** | columna |
| Racha | `students.current_streak`, **ya guardado** | columna |
| Adeudo | cruce de `monthly_fee` con pagos del mes | ya existe en `/payments/pending` |
| Teléfono del tutor | ya en el modelo | columna o acción rápida |

Y en la ficha del alumno faltan justo los datos que se necesitan en la cancha:
**teléfono, dirección, contacto de emergencia y notas médicas existen en el
modelo y la ficha no los muestra.** Tampoco muestra el estado de cuenta, de modo
que la pregunta real —"este que no paga, ¿al menos viene?"— exige abrir dos
módulos.

---

## 5. Asistencias

### Qué hace hoy

- Selección de categoría, fecha y tipo; carga de alumnos; precarga de lo ya
  guardado; un interruptor por alumno; guardado en lote.
- Ata el registro a la sesión programada (`training_id`), la marca como
  completada y avisa si la sesión está cancelada.
- Dispara la revisión de logros de los alumnos presentes.
- Histórico por categoría agrupado por sesión, con porcentaje y semáforo.
- Vista aparte para el padre: historial del hijo en tarjetas.

### Veredicto: **viable para registrar, no viable para decidir**

Dos cosas distintas que conviene no mezclar:

**La captura funciona.** Con el cierre de sesión conectado, el dato que entra ya
está bien atado al calendario y es auditable. Eso estaba roto esta mañana.

**La ergonomía de cancha no funciona.** El usuario real es un profesor de pie,
con sol, con el teléfono en una mano y 18 niños enfrente. Para él:

| Problema | Consecuencia |
|---|---|
| **No hay "marcar todos presentes"** | Con asistencia típica del 85 %, son 20 toques en vez de 3. Es la decisión entre usar la app o el cuaderno. |
| **No funciona sin conexión** | El service worker cachea solo lecturas. En una cancha sin señal el guardado falla y se pierde el trabajo. Una PWA que se vende para la cancha necesita cola de escritura, no es un extra. |
| **Un refetch borra las marcas no guardadas** | Pérdida silenciosa de trabajo a mitad del pase de lista. |
| **No hay contador en vivo** | No se puede cuadrar "14 de 18" contra lo que se ve en el campo. |
| **No hay justificación de ausencia** | Presente/ausente binario le quita credibilidad al reporte frente al padre. |
| **No se ven las notas médicas** | El único momento en que esa información importa es justo este. |

### Visibilidad que falta — el hueco más caro del producto

El histórico está agrupado **por sesión**: responde "¿cómo asistió el grupo el
martes?". La pregunta del negocio es la contraria: **"¿qué alumno está
faltando?"**, y no hay ninguna pantalla que la responda.

Lo que falta, en orden de valor:

1. **Matriz alumno × sesión** con el porcentaje por alumno, ordenable por el
   peor. Es la vista que convierte el registro en gestión.
2. **Alerta de riesgo de baja**: "3 faltas seguidas", "por debajo del 50 %". El
   propio landing define este dolor con estas palabras: *"nadie puede decirte qué
   alumno lleva tres semanas sin venir, y para cuando te enteras, ya se fue"*.
   El producto tiene el dato y no lo dice.
3. **Resumen del mes por categoría** en la cabecera del histórico.
4. **Porcentaje y racha en la vista del padre.** Hoy recibe cuarenta tarjetas y
   ningún número; es la prueba de valor que justifica la mensualidad.
5. **Quién pasó lista y a qué hora.** `attendances.teacher_id` existe en el
   esquema y la vista no lo envía. Sin eso no hay supervisión del profesor.
6. **Exportación del histórico** con rango de fechas.

---

## 6. Lo que ya está guardado y no se muestra

Resumen de la deuda de visibilidad. Nada de esto requiere backend nuevo:

| Dato | Dónde vive | Dónde debería verse |
|---|---|---|
| `students.last_attendance_date` | tabla `students` | columna "días sin venir" en Alumnos |
| `students.current_streak` / `max_streak` | tabla `students` | columna en Alumnos, cabecera en la ficha |
| `categories.monthly_fee` | tabla `categories` | ya en la lista; falta poder editarla |
| `attendances.teacher_id` | tabla `attendances` | quién registró cada sesión |
| Teléfono, dirección, emergencia, notas médicas | `students` | ficha del alumno y pase de lista |
| `/students/:id/stats` | endpoint existente | hoy solo en la ficha, uno por uno |
| `/students/deleted` | endpoint existente | papelera inexistente |

---

## 7. Qué hacer, en orden

### Bloque 1 — Desbloquear el ICP (sin esto el producto no escala)

1. Buscador por nombre y paginación en Alumnos.
2. Importación CSV de alumnos con vista previa.
3. Columnas de asistencia y días sin venir en la lista de alumnos.

### Bloque 2 — Que el profesor no vuelva al cuaderno

4. "Marcar todos presentes" + contador en vivo.
5. Cola de escritura sin conexión para el pase de lista.
6. Proteger las marcas no guardadas frente al refetch.
7. Notas médicas visibles en el pase de lista.

### Bloque 3 — Convertir registro en información

8. Matriz alumno × sesión con porcentaje por alumno.
9. Alerta de alumnos en riesgo, en el inicio del admin y en el detalle de la
   categoría.
10. Resumen por categoría: alumnos, asistencia y cobranza, en la lista y en el
    detalle.
11. Porcentaje y racha en la vista del padre.

### Bloque 4 — Mantenimiento de lo que se crea

12. Editar mensualidad y horario de una categoría.
13. Papelera de alumnos y deshacer en el cambio de estatus.
14. Alinear el vocabulario de estatus con el `CHECK` de la base.
15. Cupo, archivado de temporada y promoción de categoría.

---

## 8. Cómo sabremos que el núcleo es viable

Criterios medibles, no impresiones:

| Módulo | Criterio |
|---|---|
| Categorías | Un dueño configura 6 categorías con cuota y horario en menos de 15 minutos, y puede cambiar una cuota sin ayuda. |
| Alumnos | Una academia de 300 alumnos carga su padrón en menos de 1 hora y encuentra a cualquier alumno en menos de 10 segundos. |
| Asistencias | Un profesor registra una sesión de 18 alumnos en menos de 30 segundos, sin conexión, y el registro sobrevive. |
| Los tres juntos | En la primera pantalla tras entrar, el dueño ve cuántos alumnos están en riesgo de baja este mes. |

El último criterio es el que importa. Los otros tres son el camino para llegar a
él: mientras el producto no conteste esa pregunta sola, sigue siendo un cuaderno
digital y compite contra un cuaderno gratis.

---

## 9. Preguntas abiertas

1. ¿Cuántos alumnos tiene la academia más grande que lo usa hoy? De eso depende
   si el Bloque 1 es urgente o es teoría.
2. ¿Qué define "en riesgo" para un dueño de academia: tres faltas seguidas, dos
   semanas, o por debajo de un porcentaje? Hay que preguntárselo a uno antes de
   construir la alerta.
3. ¿Los profesores están pasando lista en la app o siguen con el cuaderno? Es el
   indicador de salud del producto y hoy no está instrumentado.
4. ¿La cuota es por categoría, o hay becas y descuentos por hermano que el
   modelo actual no admite?
