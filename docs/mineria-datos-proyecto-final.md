# Proyecto final de Minería de Datos — Conjunto de datos: Futcademic

**Fuente de datos:** base de datos operativa de Futcademic (PostgreSQL / Supabase, proyecto `vbuoiysqzyntsharrowf`, región us-east-1).
**Dominio:** gestión multi-inquilino (multi-tenant) de academias de futbol infantil y juvenil.
**Fecha del corte:** 22 de octubre de 2026.

---

## 1. Proceso en el que se utilizan los datos

Los datos provienen del proceso operativo diario de una academia de futbol. No son un dataset descargado: son los registros que genera el propio negocio al operar. El flujo completo es:

**a) Alta y registro (proceso de inscripción)**
El administrador de la escuela da de alta al alumno con nombre, fecha de nacimiento, categoría (definida por año de nacimiento), tutor responsable, contacto de emergencia y notas médicas. El sistema asigna la categoría y el estatus (`activo`, `beca`, `pendiente`, `inactivo`).

**b) Programación de sesiones (proceso de planeación deportiva)**
Se crean eventos (`events`) de tipo *entrenamiento* o *partido*, con fecha, hora, sede (`venues`, con latitud/longitud) y reglas de recurrencia semanal. Cada ocurrencia de un evento recurrente se materializa como una sesión concreta (`trainings`).

**c) Toma de asistencia (proceso de control operativo)**
El profesor pasa lista desde la app móvil en cada sesión. Cada marca genera un renglón en `attendances` con alumno, categoría, profesor, sesión, fecha, tipo y presente (sí/no). El sistema actualiza en cada marca la racha actual (`current_streak`), la racha máxima (`max_streak`) y la última fecha de asistencia del alumno, y desbloquea logros (`achievements` / `student_achievements`) por umbrales de racha, asistencia, goles, puntualidad o progreso.

**d) Cobranza (proceso financiero)**
Se registran pagos de mensualidad por alumno (`payments` con mes y año de aplicación, importe y descripción) y pagos a profesores. Cada categoría tiene su cuota mensual (`categories.monthly_fee`), lo que permite calcular el adeudo esperado contra lo cobrado.

**e) Comunicación (proceso de retención)**
El sistema emite notificaciones a padres y alumnos: pago recibido, recordatorio de sesión, sesión cancelada, bienvenida y logro desbloqueado (`notifications`).

**f) Baja (proceso de deserción)**
Cuando un alumno se da de baja, el registro se conserva en `deleted_students` con fecha y usuario que ejecutó la baja. **Esta tabla es la etiqueta natural del problema de predicción de deserción.**

> En resumen: los datos se usan para operar la academia (control de asistencia, cobranza y comunicación). La minería de datos se aplicaría *sobre* ese registro operativo para convertirlo en decisiones de retención y finanzas.

---

## 2. Cómo se obtienen los datos

La captura es **primaria y transaccional**, por tres vías:

| Vía | Qué captura | Quién lo genera |
|---|---|---|
| App móvil (Expo / React Native) | Asistencia en cancha, perfil del alumno, consulta de pagos | Profesor, padre, alumno |
| Panel administrativo web (React + Vite + Mantine) | Alumnos, categorías, eventos, sedes, pagos, configuración | Administrador de la escuela |
| API REST (Express + TypeScript en Render.com) | Validación de todas las operaciones de escritura | Sistema |

**Arquitectura de captura:** cliente → API Express → Supabase (PostgreSQL). Dos middlewares garantizan el aislamiento por escuela: `requireAuth` valida el JWT de Supabase y `requireTenant` resuelve el `school_id` del usuario. **Toda tabla lleva `school_id`**, así que los datos están segmentados por academia desde el origen.

**Carga histórica inicial (migración):** el histórico anterior al sistema vivía en hojas de cálculo de WPS Office/Excel que la academia llevaba a mano (listas por categoría con pagos mensuales de enero a mayo y pagos de torneo). Ese archivo se migró con el script `scripts/extract_data.py`, que parsea el Excel y genera el JSON de carga. Esto explica por qué una parte del histórico financiero tiene granularidad mensual y no diaria.

**Extracción para minería:** consultas SQL directas al Postgres de Supabase (vía MCP, `psql` o el SQL Editor), exportando a CSV para procesar en Python (pandas / scikit-learn) o Weka.

**Aspectos éticos y de privacidad:** la base contiene datos de menores de edad (nombre completo, fecha de nacimiento, dirección, teléfono, notas médicas, contacto de emergencia). Para el proyecto académico se **anonimiza**: se sustituyen nombres por IDs, se reemplaza la fecha de nacimiento por la edad en años, se eliminan dirección, teléfono y notas médicas, y se agregan los datos por categoría. Solo se conservan los atributos con valor predictivo.

---

## 3. Histórico de datos

**Periodo de recolección.** Asistencia: del **19 de marzo al 22 de octubre de 2026 (≈ 7 meses)**. El sistema entró en operación el 7 de mayo de 2026; los pagos van del 10 de mayo al 1 de octubre. El histórico financiero migrado desde Excel cubre además enero–mayo de 2026 con granularidad mensual.

**Cómo cambió la base esta semana.** Al corte del 21 de octubre había solo 28 registros de asistencia y 7 de pago. El 22 de octubre se cargó a producción la hoja de asistencia real de la academia *Gallos San Rafael Serratos* (265 alumnos, 751 pases de lista y 613 pagos válidos). Eso cambió la naturaleza del conjunto: pasó de ser demasiado pequeño para modelar a tener volumen real suficiente para un primer modelo.

Volumetría real al 22 de octubre de 2026:

| Tabla | Registros | Rango de fechas |
|---|---:|---|
| `users` (admins, profesores, padres, alumnos) | 175 | 07/05/2026 – 21/10/2026 |
| `trainings` (sesiones materializadas) | 192 | 19/03/2026 – 29/10/2026 |
| `students` | 353 (349 activos, 4 inactivos) | 09/05/2026 – 22/10/2026 |
| `deleted_students` (bajas) | 33 | 13/05/2026 – 21/10/2026 |
| `attendances` | **779** (802 en la base, menos 23 con fecha futura) | 19/03/2026 – 22/10/2026 |
| `categories` | 27 | 09/05/2026 – 22/10/2026 |
| `schools` (inquilinos) | 20 | 07/05/2026 – 30/06/2026 |
| `events` | 11 | 11/05/2026 – 17/05/2026 |
| `venues` | 10 | — |
| `payments` | **620** | 10/05/2026 – 01/10/2026 |
| `notifications` | 3 | 10/05/2026 – 11/05/2026 |

Distribución por escuela (las 6 con actividad real):

| Escuela | Alumnos | Categorías | Asistencias | Sesiones | Pagos | Usuarios |
|---|---:|---:|---:|---:|---:|---:|
| Gallos San Rafael Serratos | 265 | 8 | 751 | 95 | 613 | 2 |
| Master Fut MR | 78 | 6 | 17 | 0 | 3 | 114 |
| Alcones Rayados | 4 | 6 | 2 | 71 | 0 | 13 |
| Gallos Verdes FC | 3 | 1 | 1 | 1 | 0 | 14 |
| Demo Test Academy 2 | 2 | 2 | 5 | 21 | 0 | 7 |
| Academia Demo 2 | 1 | 2 | 3 | 4 | 4 | 8 |

El resto de las 20 escuelas son entornos de prueba (`Academia Smoke …`, `Test School`) sin datos; se **excluyen del análisis**.

### Calidad de los datos de Serratos (declararla en la presentación)

- **79 alumnos no se cargaron** por no traer fecha de nacimiento legible (solo el año, solo el nombre o la celda vacía); la lista está en `scripts/serratos_excluidos.txt`. La tabla `students` exige `birth_date`.
- **5 alumnos más se descartaron** por fechas imposibles (`2821`, `1905`, `2002` en una categoría de 12–13 años) y **18 pagos** por repetir mes dentro de un alumno (`scripts/serratos_descartes_calidad.txt`).
- **23 pases de lista tienen fecha futura** (27 y 29 de octubre): están en la base pero se excluyen de toda la minería, porque nadie pasa lista de un día que aún no ocurrió.
- **Los pagos no traían fecha**; se registró el día 1 del mes pagado y se marcó como «fecha estimada» en la descripción.
- **Los 265 alumnos se cargaron sin tutor** (`parent_id` vacío): la hoja no trae ese dato.
- Solo `A` (asistió) y `F` (faltó) se cargan como asistencia. Las marcas `L` (lesión o enfermedad), `C`, `LG` (liga), `PP` (partido de preparación) y colores sin código conocido no son ni presencia ni falta y se omitieron.

### Limitación crítica: hay asistencia real, pero no bajas con historial

La asistencia real es abundante (Serratos aporta 751 de los 779 pases válidos), pero **las 33 bajas pertenecen a otras academias que casi no registran asistencia, y Serratos no registra ninguna**. No existe un solo alumno con historial de asistencia **y** baja conocida. Por eso la deserción —el objetivo principal— **no se puede entrenar todavía con datos reales**, y el proyecto presenta **dos modelos separados**:

**Modelo A · datos reales · ¿faltará a su siguiente sesión?** Entrenado solo con asistencia real de Serratos, sin ningún dato simulado ([`mineria/validar_real.py`](../mineria/validar_real.py)).

| | |
|---|---|
| Filas | 570 (154 alumnos, 18 fechas) |
| Etiqueta | el alumno faltó a esa sesión (18.4 % de las filas) |
| Partición | temporal: entrena hasta el 13/oct, prueba después (213 filas, 40 faltas) |
| **AUC en prueba** | **0.779** (entrenamiento 0.775; sobreajuste −0.004) |
| Marcando al 25 % de sesiones | recall 0.725 (detecta 7 de cada 10 faltas), precisión 0.547, lift 2.91x |

Hallazgo: **una falta llama a otra.** La racha de faltas es el mejor predictor (AUC 0.722): sin racha la probabilidad de faltar ronda el 12 %, tras una falta sube a cerca del 54 %. Límite: son 154 alumnos con entre 2 y 12 marcas cada uno, porque la hoja registra bloques cortos y no la temporada completa.

**Modelo B · datos simulados · ¿abandonará en 30 días?** Como no hay bajas con historial real, la deserción se modela sobre un conjunto sintético derivado del esquema real ([`mineria/generar_dataset.py`](../mineria/generar_dataset.py), validado con [`mineria/validar_dataset.py`](../mineria/validar_dataset.py)). Se compone de dos grupos, distinguibles por la columna `origen`:

- **121 alumnos con 33 bajas** que reproducen exactamente las cinco academias reales originales (`espejo_real`).
- **135 alumnos con 37 bajas** repartidos en dos academias **simuladas**, *Gallos San Rafael* y *Master Fut MR Aguascalientes*, añadidas solo para alcanzar volumen de entrenamiento (`simulada`). **No existen en la base y no deben presentarse como reales.**

Produce 10,259 registros de asistencia, 960 pagos y una tabla analítica de 1,731 filas. La calibración reproduce la tasa de presencia real con una desviación de 0.8 puntos (81.3 % generado contra 82.1 % observado; con la asistencia real ya cargada la tasa medida es 82.2 %, es decir, la calibración era correcta). Un árbol CART alcanza **AUC 0.779**, lift 3.38x y recall 0.566.

**Coincidencia que conviene aclarar:** ambos modelos dieron AUC 0.779. Son modelos distintos, con etiquetas distintas y datos distintos.

Detalle completo, diccionario de datos y advertencias metodológicas en [`mineria/README.md`](../mineria/README.md). El conjunto publicado del modelo real (`mineria/real/dataset_real.csv`) es anónimo: alumno seudonimizado, sin nombre ni fecha de nacimiento.

---

## 4. Objetivos de aplicar Minería de Datos

### Objetivo general
Transformar el registro operativo de Futcademic en modelos que permitan a la academia anticipar la deserción de alumnos y la morosidad, y optimizar la operación de sus categorías y sedes.

### Objetivos específicos

**O1 — Predicción de deserción (clasificación).**
*Problema:* 33 bajas registradas contra 349 alumnos activos. Cada baja es ingreso mensual perdido.
*Técnica:* árbol de decisión (C4.5 / CART), Random Forest y regresión logística como línea base.
*Variable objetivo:* alumno presente en `deleted_students` (sí/no) en los siguientes 30 días.
*Atributos:* tasa de asistencia a 30/60 días, tendencia de asistencia (pendiente), días desde la última asistencia, racha actual vs. racha máxima, meses con pago atrasado, edad, categoría, antigüedad, estatus, logros desbloqueados, uniforme entregado.
*Métricas:* recall sobre la clase "deserta" (es más caro no detectar una baja que dar una falsa alarma), F1 y AUC-ROC.
*Valor:* lista semanal de alumnos en riesgo para que el administrador llame al tutor antes de que se vaya.

**O2 — Predicción de morosidad (clasificación / regresión).**
Predecir qué alumnos no pagarán la mensualidad del mes siguiente, cruzando `payments` contra `categories.monthly_fee` y el historial de pago. Permite priorizar la cobranza y proyectar el flujo de efectivo.

**O3 — Segmentación de alumnos (clustering, no supervisado).**
k-means / DBSCAN sobre comportamiento de asistencia, puntualidad de pago, antigüedad y edad, para descubrir perfiles (ej. *comprometido*, *intermitente*, *en fuga*, *moroso crónico*). Cada segmento recibe una estrategia de retención distinta. Validación con coeficiente de silueta y método del codo.

**O4 — Reglas de asociación (Apriori / FP-Growth).**
Buscar patrones del tipo *"asistencia < 50% en el último mes + mensualidad vencida + categoría de mayores de 15 años → baja en 30 días"* o *"sesiones en sede X los sábados por la mañana → mayor ausentismo"*. Son reglas legibles por el dueño de la academia, no una caja negra.

**O5 — Análisis de series de tiempo y estacionalidad.**
Detectar el patrón semanal y mensual de la asistencia (vacaciones, torneos, clima) para planear carga de profesores y uso de sedes.

**O6 — Detección de anomalías.**
Identificar alumnos, categorías o sedes con comportamiento atípico (caída abrupta de asistencia en una categoría completa → posible problema con el profesor; pago fuera del rango de la cuota → error de captura).

**O7 — Análisis comparativo entre academias (benchmark multi-tenant).**
Como el esquema es multi-inquilino, se pueden comparar indicadores entre las 20 escuelas (tasa de retención, asistencia media, cumplimiento de cobranza) y dar a cada una su posición relativa como producto de valor.

### Beneficio esperado para el negocio
Si la academia retiene 10 de cada 33 alumnos que hoy se dan de baja, y la cuota promedio por categoría es de ~$500 MXN mensuales, son ~$60,000 MXN anuales recuperados por escuela — con una intervención tan barata como una llamada telefónica disparada por el modelo.

---

## Anexo — Esquema de la base de datos

16 tablas, todas con llave primaria UUID y columna `school_id` para el aislamiento multi-inquilino:

`schools`, `users`, `profile_information`, `students`, `deleted_students`, `categories`, `category_teachers`, `teacher_permissions`, `events`, `event_exceptions`, `trainings`, `attendances`, `payments`, `payment_students`, `venues`, `notifications`, `achievements`, `student_achievements`.

Tablas núcleo para la minería: **`students`** (perfil), **`attendances`** (comportamiento), **`payments`** (financiero), **`deleted_students`** (etiqueta objetivo), **`trainings`** (contexto temporal), **`categories`** (segmento y cuota).

Roles del sistema: `super_admin`, `admin`, `profesor`, `padre`, `alumno`.
