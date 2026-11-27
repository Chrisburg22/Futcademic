# Plan: integrar el proyecto de minería en la app

Estado: propuesta · 2026-11-24 · Alcance: `backend/` + `web/` + `mineria/`

---

## 1. Qué hay hoy, medido

Ejecutado en este worktree, no citado de memoria:

```text
VISTA: 544 filas · entrena 344 (antes de 2026-10-13) · prueba 200
AUC entrenamiento 0.735 · AUC prueba 0.643 · sobreajuste 0.091
Marcando 25 %: precision 0.260 · recall 0.542 · lift 2.17x · VP=13 FP=37 FN=11 VN=139
Referencia sin modelo (solo -tasa_previa): AUC prueba 0.613
```

| Pieza | Qué es | ¿Sirve en producción? |
|---|---|---|
| `extraer_bd.py` | lee Supabase (`schools`, `students` sin nombre, `attendances`, `deleted_students`) | sí, ya toca la base real |
| `vista_minable.py` | etapas 1-4 de KDD → `real/vista_minable.csv` (544 filas, 147 alumnos, 14.3 % faltas) | sí, es la definición de las variables |
| `entrenar_vista.py` + `validar_dataset.py` | CART propio, profundidad 4, hoja mínima 15 | sí, **para entrenar**; no para servir |
| **Modelo A** — ¿faltará a su siguiente sesión? | entrenado con asistencia **real** | **sí** |
| **Modelo B** — ¿abandonará en 30 días? | entrenado con el dataset **sintético** | **no**: no se despliega |
| `generar_dataset.py` + `dataset/` | dataset sintético, 2 academias inventadas | no: solo académico |

El árbol entrenado tiene **9 hojas** y usa **5 de las 8 variables**:
`racha_faltas`, `dias_desde_ultima`, `edad`, `n_previas`, `tasa_ultimas3`.

---

## 2. La verdad incómoda, y qué se hace con ella

El árbol da 0.643 de AUC. Una sola variable —la tasa de asistencia previa— da
0.613. **El modelo aporta tres centésimas.** Y al marcar al 25 % más riesgoso,
la precisión es 0.26: de cada cuatro alumnos señalados, uno falta de verdad.

Eso descarta dos cosas:

- **Montar un servicio de ML.** Otro deploy, otro secreto y un reentrenamiento
  programado para 0.03 de AUC es infraestructura que no se paga.
- **Vender «predicción con IA».** Con esa precisión, prometer predicción es
  prometer algo que el producto no cumple.

Y deja una que sí vale: **una lista de a quién llamar hoy**, con lift 2.17×.
El profesor no necesita una probabilidad; necesita tres nombres antes del
entrenamiento. Eso cabe en el backend sin Python.

**Decisión:** se porta el árbol a TypeScript dentro del backend. Las variables
se calculan desde `attendances` y `students.birth_date`, que ya existen. El
reentrenamiento sigue siendo manual con `entrenar_vista.py`.

---

## 3. Contrato del modelo

### 3.1 Variables, en el instante de predecir

Para un alumno y una **sesión futura** (`trainings.date`), con sus marcas de
`attendances` ordenadas por fecha (solo las anteriores a esa sesión):

| Variable | Cálculo | Fuente |
|---|---|---|
| `edad` | años cumplidos en el año en curso | `students.birth_date` |
| `n_previas` | número de marcas anteriores | `attendances` |
| `tasa_previa` | presentes / `n_previas` | `attendances.present` |
| `tasa_ultimas3` | presentes de las últimas 3 marcas / 3 | `attendances.present` |
| `racha_faltas` | faltas consecutivas desde la última marca hacia atrás | `attendances.present` |
| `dias_desde_ultima` | días entre la sesión y la última marca | `trainings.date` − `attendances.date` |
| `mes` | mes de la sesión (1-12) | `trainings.date` |
| `dia_semana` | día de la semana (0 = lunes) | `trainings.date` |

Reglas heredadas de la vista minable, que deben replicarse igual o el modelo se
aplica a datos distintos de los que vio:

1. Un alumno con **menos de 2 marcas** no se puntúa: no hay historia. Se muestra
   «sin historial», no un riesgo bajo.
2. Un alumno que **nunca ha asistido** no se puntúa: ya no está activo y su fila
   es un positivo trivial.
3. Las marcas con fecha futura, duplicadas o registradas antes de ocurrir se
   descartan (ver §6).
4. `tasa_*` miden **presencia**, no falta. Invertir el signo invierte el modelo.

### 3.2 El árbol, tal como quedó

```text
racha_faltas ≤ 0.5
├── sí → dias_desde_ultima ≤ 3.5
│   ├── sí → edad ≤ 10.5
│   │   ├── sí → edad ≤ 6.5 ?  10.7 %  :  3.2 %
│   │   └── no → edad ≤ 11.5 ?  20.0 %  : 10.0 %
│   └── no → n_previas ≤ 1.5
│       ├── sí → 25.0 %
│       └── no → tasa_ultimas3 ≤ 0.8334 ?  25.0 %  : 11.8 %
└── no → dia_semana ≤ 0.5 ?  18.8 %  : 57.7 %
```

Se escribe como una estructura de datos, no como `if` anidados a mano:
`backend/api/services/risk/model.json` con el árbol y su metadata
(`entrenado_en`, `filas`, `auc_prueba`, `corte_temporal`, `variables`). Así
reentrenar es reemplazar un archivo, y la versión del modelo queda registrada en
cada predicción.

### 3.3 Salida

```json
{
  "student_id": "…",
  "training_id": "…",
  "risk": 0.577,
  "band": "alto",
  "reasons": [
    { "key": "racha_faltas", "value": 2, "text": "lleva 2 faltas seguidas" },
    { "key": "dias_desde_ultima", "value": 11, "text": "11 días sin venir" }
  ],
  "model_version": "2026-11-16",
  "status": "ok"
}
```

`status` puede ser `ok`, `sin_historial` (menos de 2 marcas) o `inactivo`
(nunca asistió). Las bandas salen de la hoja del árbol: `bajo` < 15 %,
`medio` 15-30 %, `alto` > 30 %. **La banda se calibra una vez al año con el
informe**, no se inventa por pantalla.

---

## 4. Servicios

Archivos nuevos en el backend:

```text
backend/api/services/risk/
  features.ts    calcula las 8 variables desde attendances + students
  model.json     el árbol entrenado + metadata
  tree.ts        recorre el árbol (≈40 líneas, sin dependencias)
  reasons.ts     traduce el camino recorrido a frases en español
  index.ts       scoreStudent(), scoreCategory(), scoreSchool()
```

Endpoints (todos con `requireAuth + requireTenant`, el `school_id` del token):

| Método | Ruta | Roles | Qué devuelve |
|---|---|---|---|
| `GET` | `/api/risk/training/:trainingId` | admin, profesor | riesgo de cada alumno de la categoría de esa sesión, ordenado |
| `GET` | `/api/risk/students/:id` | admin, profesor | riesgo del alumno para su próxima sesión + sus 10 últimas marcas |
| `GET` | `/api/risk/summary` | admin | conteo por banda de la academia, para el dashboard |
| `GET` | `/api/platform/schools/:id/risk` | plataforma | agregado por academia (% en riesgo, alumnos sin historial) |
| `GET` | `/api/risk/model` | admin | metadata del modelo: fecha, filas, AUC, variables |

Notas de implementación:

- **Se calcula al vuelo.** 544 filas en toda la base: una consulta por categoría
  y el cálculo en memoria. Nada de tabla de predicciones todavía.
- `GET /api/risk/training/:trainingId` carga las marcas de los alumnos de la
  categoría en **una** consulta y calcula en memoria; no una consulta por alumno.
- El profesor solo alcanza sus categorías: el filtro de `category_teachers` que
  ya usa `GET /students` se reutiliza. Sin eso, el endpoint de riesgo sería una
  fuga de datos de toda la escuela.
- `/api/risk/model` existe para que la UI pueda decir «modelo del 16/nov,
  544 filas». Un número sin procedencia no se puede discutir.

### 4.1 Medir si acierta (esto no es opcional)

Una tabla nueva, en la misma migración:

```sql
CREATE TABLE public.risk_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  training_id uuid NOT NULL REFERENCES public.trainings(id),
  risk numeric NOT NULL,
  band varchar NOT NULL,
  features jsonb NOT NULL,
  model_version varchar NOT NULL,
  actual_present boolean,          -- se llena cuando se pasa lista
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX risk_predictions_uniq
  ON public.risk_predictions (student_id, training_id, model_version);
```

Cada vez que alguien abre la lista de riesgo de una sesión se guarda lo
predicho. Cuando `POST /api/attendances` registra esa sesión, se rellena
`actual_present`. Con eso, en dos meses se puede responder «¿sirve?» con datos
de producción en vez de con el AUC de un CSV. **Sin esta tabla, el modelo es un
acto de fe que nadie podrá auditar.**

---

## 5. Vistas

| Dónde | Qué se añade |
|---|---|
| **Pase de lista** (`/attendance`, `AttendancePage`) | antes de marcar, los alumnos en banda `alto` y `medio` suben a un bloque «Puede faltar hoy» con el motivo en texto y un botón de contacto al tutor. En la lista normal, un punto de color discreto. |
| **Ficha del alumno** (`/admin/students/[id]`) | bloque «Asistencia y riesgo»: banda actual, motivos, racha, tasa de las últimas semanas y una línea de tiempo de sus marcas. |
| **Dashboard del admin** (`AdminDashboard`) | tarjeta «En riesgo esta semana: 7 de 60», que enlaza a la lista filtrada. |
| **Consola de plataforma** (`/platform/schools/[id]`, pestaña Actividad) | % de alumnos en riesgo y % sin historial por academia. Un 60 % sin historial dice que esa academia no pasa lista, que es la señal real de abandono del producto. |

Reglas de presentación, no negociables por diseño:

1. **Nunca al padre ni al alumno.** El riesgo es una herramienta de operación.
   Decirle a un niño de 11 años que el sistema cree que va a faltar es un daño
   sin beneficio.
2. **Motivos, no probabilidad.** La UI dice «lleva 2 faltas seguidas y 11 días
   sin venir», no «57.7 % de riesgo». El número vive en la ficha y en la
   consola, no en la lista del profesor.
3. **Nunca se escribe «predicción» ni «IA».** El texto es «puede faltar hoy»,
   y junto al bloque, un enlace: «cómo se calcula» → el modelo, su fecha y su
   precisión (de cada 4 señalados, 1 falta).
4. **La edad no se muestra como motivo.** El árbol parte por `edad`, pero
   mostrársela al profesor convierte el modelo en una etiqueta sobre un niño por
   su año de nacimiento. Si al reentrenar se confirma que la edad aporta poco, se
   quita del modelo (ver §9.3).

---

## 6. El otro entregable, el que ya vale: la limpieza es una lista de bugs

La etapa 1 de KDD encontró, **en la base de producción**:

| Hallazgo | Cantidad | Qué es en el producto |
|---|---|---|
| Marcas registradas antes de la fecha de la sesión | 31 | se puede pasar lista de una sesión futura |
| Alumnos con edad fuera de rango (3-18) | 3 | `birth_date` sin validación |
| Alumnos sin ninguna marca | 147 de 352 | o se dan de alta y no se usan, o el pase de lista no se usa |
| Alumnos que nunca asistieron | 23 | bajas que nadie marcó como inactivas |
| Alumnos con 1 marca o menos | 182 | la base está casi vacía de historia |

Esto se arregla sin modelo y mejora el producto hoy:

1. `POST /api/attendances` rechaza fechas futuras (y el front deshabilita el
   botón). Elimina las 31 de raíz.
2. `birth_date` se valida en alta y edición de alumno: entre 3 y 18 años
   cumplidos, con mensaje claro.
3. La consola de plataforma usa «alumnos sin ninguna marca» como señal de
   academia que no arrancó (ya está en el plan de la consola, §5.1 de
   `PLAN-CONSOLA-PLATAFORMA.md`).
4. Un alumno sin marcas en 60 días se sugiere pasar a `inactivo` desde la ficha
   —sugerencia, no automatismo.

Y hay una consecuencia de producto más grande: **con 182 alumnos de 352 con una
marca o menos, el modelo no puede opinar sobre la mitad de la base.** La palanca
que más mueve la aguja no es el modelo: es que las academias pasen lista. Por eso
el «sin historial» se muestra como estado explícito y se mide en la consola.

---

## 7. Datos: una migración

`migrations/2026MMDD_risk_model.sql`

```sql
-- tabla de predicciones (§4.1)
CREATE TABLE public.risk_predictions (…);
-- índice que falta para calcular las variables sin escanear la tabla
CREATE INDEX IF NOT EXISTS attendances_student_date_idx
  ON public.attendances (student_id, date);
```

Nada más. El modelo vive en un `model.json` del repositorio, versionado con
git: se puede revisar en un diff, revertir y auditar. Una tabla de pesos sería
un modelo que nadie puede leer.

---

## 8. Fases

| Fase | Entrega | Hecho cuando |
|---|---|---|
| **M0 · Limpieza** (§6) | validación de fecha futura, validación de `birth_date`, índice | ya no entran datos imposibles; es independiente del modelo y se puede hacer primero |
| **M1 · Motor** | `services/risk/`, `model.json`, `GET /risk/training/:id` y `/risk/students/:id`, tests con las filas de `vista_minable.csv` | el backend da la misma puntuación que `entrenar_vista.py` para las mismas filas |
| **M2 · Pase de lista** | bloque «Puede faltar hoy» + motivos + contacto al tutor, `risk_predictions` escribiéndose | el profesor ve a quién llamar antes de la sesión |
| **M3 · Ficha y dashboard** | bloque de riesgo en la ficha, tarjeta en el dashboard, `/risk/summary`, pantalla «cómo se calcula» | el admin entiende de dónde sale el número |
| **M4 · Consola y evaluación** | agregado por academia en la consola, informe de aciertos reales desde `risk_predictions` | se puede decir si el modelo sirve con datos de producción |

M0 vale por sí sola aunque el modelo nunca se despliegue. M1 es la pieza que
cierra la paridad con el script: sin ese test, el backend y el trabajo académico
se separan en silencio.

---

## 9. Gobernanza del modelo

### 9.1 Reentrenar

```bash
python3 mineria/extraer_bd.py      # necesita SUPABASE_URL + SUPABASE_SERVICE_KEY
python3 mineria/vista_minable.py
python3 mineria/entrenar_vista.py  # imprime el árbol y las métricas
```

Un script nuevo, `mineria/exportar_modelo.py`, escribe el árbol como
`backend/api/services/risk/model.json` con su metadata. El reentrenamiento es
manual y trimestral, o cuando los datos cambien de forma: nada automático. Un
modelo que se reentrena solo contra datos tan escasos cambia de opinión por ruido.

### 9.2 Cuándo se apaga

Si el informe de `risk_predictions` muestra que la banda `alto` no falta más que
el promedio de la academia, el bloque se quita de la UI. Queda escrito aquí para
que apagarlo sea una decisión prevista y no una derrota.

### 9.3 Qué se revisa en cada reentrenamiento

- ¿`edad` sigue apareciendo en los primeros cortes? Si aporta poco, se quita por
  las razones de §5.4.
- ¿El AUC sigue por encima de la referencia de `tasa_previa`? Si no, el modelo se
  sustituye por la regla simple y se dice así.
- ¿Cuántos alumnos quedan en `sin_historial`? Es la métrica de adopción real.

---

## 10. Fuera de alcance

1. **Modelo B (abandono en 30 días).** Entrenado con datos sintéticos de dos
   academias inventadas. No se despliega ni se menciona en la app.
2. **El dataset sintético en cualquier pantalla.** `origen = "simulada"` no sale
   nunca de `mineria/`. No se usa para afirmar tracción ni clientes.
3. **Servicio Python en producción, reentrenamiento automático, MLflow y
   compañía.** Nueve hojas en un JSON.
4. **Predecir pagos o deserción económica.** Hay 7 pagos reales; no hay datos.
5. **Mostrar riesgo a padres o alumnos.**
6. **`scripts/serratos_*`.** Datos de menores de una academia real: no se
   commitean ni se cargan en la app.

---

## 11. Criterios de aceptación

1. Para las 200 filas de prueba de `vista_minable.csv`, el motor en TypeScript
   devuelve la **misma** puntuación que `entrenar_vista.py`, fila por fila. Test
   automatizado con el CSV como fixture.
2. Un alumno con menos de 2 marcas devuelve `status: "sin_historial"` y la UI no
   le pinta banda.
3. `POST /api/attendances` con una fecha futura responde 400.
4. Crear un alumno con `birth_date` que dé menos de 3 o más de 18 años responde
   400 con mensaje claro.
5. Un profesor que pide `/api/risk/training/:id` de una sesión de una categoría
   que no es suya recibe 403.
6. `/api/risk/*` de otra academia recibe 403 (test de aislamiento, al estilo de
   `tenant-isolation.test.ts`).
7. Abrir la lista de riesgo de una sesión deja una fila por alumno en
   `risk_predictions`; pasar lista de esa sesión rellena `actual_present`.
8. La pantalla «cómo se calcula» muestra la fecha del modelo, las filas con que
   se entrenó y la precisión real, tomadas de `/api/risk/model`.
9. Ninguna respuesta de rol `padre` o `alumno` incluye `risk`, `band` ni
   `features`.

---

## 12. Estado de la evidencia

| Afirmación | Fuente | Estado |
|---|---|---|
| AUC prueba 0.643, referencia 0.613, lift 2.17× | `python3 mineria/entrenar_vista.py`, ejecutado el 2026-11-24 | verificado |
| El árbol usa 5 variables y tiene 9 hojas | salida del mismo comando | verificado |
| Las 8 variables se calculan desde `attendances` + `students.birth_date` | `vista_minable.py`, `schema.sql` | verificado |
| 31 marcas registradas antes de ocurrir, 3 edades imposibles, 147 sin marcas | `mineria/real/vista_minable_informe.json` (extracción del 2026-11-17) | verificado |
| El Modelo B no es desplegable | `mineria/README.md`, `vault/07-Producto/Datos y mineria.md` | verificado |
| Avisar al tutor el mismo día reduce las faltas | — | hipótesis: es el supuesto que justifica todo el módulo y **nadie lo ha medido** |
| La banda `alto` identifica alumnos que de verdad abandonan | — | hipótesis: el modelo predice una falta, no una baja |

---

## 13. Preguntas abiertas

1. **¿Qué hace el profesor con el aviso?** Si la respuesta es «nada», el módulo
   no se construye. Lo mínimo es un botón de WhatsApp al tutor; conviene
   decidirlo antes de M2.
2. **¿Se mide si el aviso sirve?** Lo honesto sería mostrar el bloque en la
   mitad de las categorías durante un mes y comparar. Requiere decidir si
   aceptas un experimento en producción.
3. **Umbrales de banda.** 15 % y 30 % salen de las hojas del árbol. Con
   `risk_predictions` se recalibran con datos propios.
4. **¿Se quita `edad` del modelo?** Decisión para el primer reentrenamiento.
5. **¿El trabajo académico se congela?** Si `mineria/` se entrega a la
   universidad, conviene etiquetar la versión (`git tag`) para que los cambios
   que pida el producto no alteren las cifras del entregable.
