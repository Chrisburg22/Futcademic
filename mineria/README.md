# Dataset sintético Futcademic — Proyecto final de Minería de Datos

Dataset derivado del esquema y los datos reales de **Futcademic**, sistema multi-inquilino de gestión de academias de futbol (PostgreSQL / Supabase, proyecto `vbuoiysqzyntsharrowf`).

## Por qué es sintético

La base real lleva ~5.5 meses operando y acumula **28 registros de asistencia y 7 de pago**. Es insuficiente para entrenar cualquier modelo supervisado. Este generador completa la malla `asistencia = sesiones × alumnos de la categoría` usando distribuciones calibradas sobre los patrones reales observados.

**Lo que es real y no se inventa:** el esquema completo, los nombres de las 5 escuelas con actividad, sus 14 categorías, el periodo (7 may – 21 oct 2026), el tamaño de esa población (121 alumnos = 88 activos + 33 bajas), el número exacto de bajas (33), el patrón de días de entrenamiento, la distribución de edades y el rango de cuotas.

**Lo que se simula:** el detalle fila por fila de asistencia y pago.

Declararlo así en la presentación es parte del trabajo, no una debilidad: es la práctica estándar cuando se modela sobre un sistema recién lanzado.

## ⚠️ Dos academias del conjunto no existen

Para alcanzar un volumen de entrenamiento suficiente, el generador añade dos academias **inventadas**:

- **Gallos San Rafael** — 5 categorías, 60 alumnos
- **Master Fut MR Aguascalientes** — 6 categorías, 75 alumnos

No están en la base de producción y **no deben presentarse como academias reales**. Van marcadas con `origen = "simulada"` en `schools.csv`, `categories.csv`, `students.csv` y `dataset_ml.csv`; las otras cinco llevan `origen = "espejo_real"`.

Se generan igual que el resto en todo lo demás: sesiones los lunes y miércoles, asistencias con los mismos perfiles de comportamiento, y **mensualidades propias** (264 pagos por $145,725 en Aguascalientes, 231 por $107,075 en San Rafael), cobradas con la cuota de su categoría y la misma morosidad que las reales.

Reciben la misma tasa de baja observada en la base real (27.3 %), para que el desbalance de la clase objetivo no cambie al agregarlas. La columna `origen` **está excluida como predictor** en `validar_dataset.py`: si el modelo se agarrara de ella estaría aprendiendo cómo se generó el conjunto, no cómo se comporta un alumno. Su AUC individual medido fue 0.526, es decir, ruido — los dos grupos se comportan igual, que es justo lo que se buscaba.

Para trabajar solo con la parte que refleja la base real: filtrar `origen == "espejo_real"` (858 de 1,731 filas).

## Uso

```bash
python3 mineria/generar_dataset.py
```
```bash
python3 mineria/validar_dataset.py
```

Sin dependencias: solo biblioteca estándar de Python 3. Semilla fija (`20261021`), así que el dataset es reproducible byte a byte.

## Calibración contra la base real

| Parámetro | Valor real | Valor generado | Fuente real |
|---|---|---|---|
| Tasa de presencia | 82.1 % | **81.3 %** | 23 presentes de 28 `attendances` |
| Alumnos que reflejan la base | 121 | **121** | 88 `students` + 33 `deleted_students` |
| Bajas de ese grupo | 33 | **33** | `deleted_students` |
| Escuelas con actividad | 5 | **5** (+2 simuladas) | 5 de 20 `schools` (15 son de prueba) |
| Días de entrenamiento | lun 64, mié 48, mar 8, jue 8 | lun + mié fijos, jue 12 % | 129 `trainings` |
| Edad de los alumnos | 4–18, moda 12 | 4–18, moda 12 | 88 `students` |
| Mensualidades | 450 – 1500 MXN | 450 – 1500 MXN | 7 `payments` + 5 `categories` |

> La tasa de presencia real sale de solo 28 registros: su intervalo de confianza de Wilson al 95 % es **[64.5 %, 92.1 %]**. El 81.9 % generado cae en el centro de esa banda. Conviene mencionarlo en la presentación — es honestidad estadística, no un defecto.

## Archivos generados

| Archivo | Filas | Contenido |
|---|---:|---|
| `dataset/schools.csv` | 7 | Escuelas (5 espejo de la base + 2 simuladas) |
| `dataset/categories.csv` | 25 | Categorías por año de nacimiento y cuota |
| `dataset/venues.csv` | 5 | Sedes con coordenadas |
| `dataset/students.csv` | 256 | Alumnos con alta, baja, estatus y racha |
| `dataset/deleted_students.csv` | 70 | Bajas — **etiqueta objetivo** |
| `dataset/trainings.csv` | 1,436 | Sesiones (75 canceladas) |
| `dataset/attendances.csv` | 10,259 | Pase de lista: **la tabla principal** |
| `dataset/payments.csv` | 960 | Mensualidades cobradas de 1,237 esperadas (76.4 %) |
| `dataset/dataset_ml.csv` | 1,731 | **Tabla analítica lista para Weka / scikit-learn** |

Las primeras ocho replican el esquema de producción. La novena es la que se lleva al modelo.

## Diccionario de `dataset_ml.csv`

Panel alumno × fecha de corte, foto cada 10 días. Cada fila resume el comportamiento del alumno hasta esa fecha; la etiqueta mira 30 días hacia adelante.

| Columna | Tipo | Descripción |
|---|---|---|
| `student_id` | id | Agrupador — **usar como `groups` al partir, no como predictor** |
| `fecha_corte` | fecha | Fecha de la foto |
| `origen` | categórica | `espejo_real` o `simulada` — ⚠️ **no es predictor**, sirve para filtrar |
| `escuela`, `categoria`, `status` | categórica | Contexto del alumno |
| `edad` | entera | Años cumplidos |
| `uniforme_entregado` | binaria | Proxy de compromiso inicial |
| `antiguedad_dias` | entera | Días desde el alta |
| `sesiones_30d` | entera | Sesiones a las que pudo asistir en 30 días |
| `tasa_asistencia_15d / 30d / 60d` | 0–1 | Asistencia en cada ventana |
| `tendencia_asistencia` | −1 a 1 | `tasa_15d − tasa_60d`: señal de despegue |
| `dias_sin_asistir` | entera | Días desde la última asistencia |
| `racha_actual`, `racha_maxima` | entera | Lógica de rachas de la app real |
| `ratio_racha` | 0–1 | `actual / máxima`: qué tan lejos está de su mejor momento |
| `meses_vencidos` | entera | Mensualidades no pagadas al corte |
| `cumplimiento_pago` | 0–1 | Proporción de meses pagados |
| `perfil_latente` | categórica | ⚠️ **Verdad oculta del generador** |
| `deserta_30d` | **0/1** | **Variable objetivo**: causa baja en los siguientes 30 días |

### Dos advertencias que hay que respetar

**1. `perfil_latente` no es un predictor.** Es la etiqueta interna con la que el generador decidió el comportamiento de cada alumno (`comprometido`, `intermitente`, `moroso`, `en_fuga`). Usarla para predecir `deserta_30d` invalida el experimento. Sirve únicamente para **validar el clustering del objetivo O3**: si k-means redescubre esos cuatro grupos sin verlos, el clustering funciona.

**2. Partir el dataset al azar infla las métricas.** Un mismo alumno aporta hasta 10 filas correlacionadas entre sí; un split aleatorio lo pone en entrenamiento y en prueba a la vez. Hay que partir **por alumno** (`GroupKFold(groups=student_id)`) o **por tiempo**, que es lo que hace `validar_dataset.py`.

## Resultado de la validación

Árbol CART (Gini, profundidad 4), partición temporal 70/30 (entrena hasta el 24 ago, prueba después):

```
AUC entrenamiento ...... 0.878
AUC prueba ............. 0.779
Sobreajuste (dif) ...... 0.099

Umbral que marca al 15 % como "en riesgo":
  precisión .............. 0.319
  recall ................. 0.566
  F1 ..................... 0.408
  lift sobre la tasa base  3.38x
```

Con la mitad del volumen (solo las cinco academias espejo) el mismo árbol daba AUC 0.726, sobreajuste 0.165 y recall 0.455, con apenas 11 positivos en prueba. Agregar las dos academias simuladas subió los positivos de prueba a 53 y **redujo el sobreajuste a la mitad**: la variable ruido de la que se agarraba el árbol (`uniforme_entregado`) desapareció del modelo.

**Veredicto: dataset válido.** Hay señal aprendible y queda margen para que un Random Forest o un boosting mejoren la línea base — que es exactamente lo que debe hacer el proyecto.

Ranking de variables por AUC individual (las más predictivas primero):

| Variable | AUC | Lectura |
|---|---:|---|
| `tasa_asistencia_60d` | 0.205 | Más baja → más riesgo (la más fuerte) |
| `tasa_asistencia_15d` | 0.206 | Más baja → más riesgo |
| `tasa_asistencia_30d` | 0.212 | Más baja → más riesgo |
| `racha_actual` | 0.256 | Más baja → más riesgo |
| `ratio_racha` | 0.290 | Más baja → más riesgo |
| `dias_sin_asistir` | 0.708 | Más alta → más riesgo |
| `meses_vencidos` | 0.659 | Más alta → más riesgo |
| `edad` | 0.568 | Los mayores desertan más |
| `antiguedad_dias` | 0.491 | Casi nulo — ruido |
| `uniforme_entregado` | 0.504 | Nulo — ruido |

*(Un AUC por debajo de 0.5 indica relación inversa; su fuerza es `|AUC − 0.5|`.)*

### Tres hallazgos para comentar en la presentación

1. **La asistencia predice mejor que el pago.** Las tres ventanas de asistencia (fuerza ≈ 0.29) superan a `meses_vencidos` (0.659, fuerza 0.159). El alumno deja de ir antes de dejar de pagar — y eso da a la academia una ventana de aviso de semanas.
2. **Más volumen redujo el sobreajuste a la mitad**, de 0.165 a 0.099. Con 121 alumnos el árbol se agarraba de `uniforme_entregado`, que es ruido puro (AUC 0.504); con 256 esa variable desapareció del modelo. Es la demostración empírica de por qué el conjunto pequeño no alcanzaba.
3. **El desbalance sigue en 7.9 %.** Son 136 positivos de 1,731 filas, y 53 en el conjunto de prueba. Ya es suficiente para que las métricas sean estables, pero sigue justificando validación cruzada estratificada por grupos y probar SMOTE o pesos de clase.

## Mapa a los objetivos del proyecto

| Objetivo | Archivo | Técnica sugerida |
|---|---|---|
| O1 Deserción | `dataset_ml.csv` | Árbol / Random Forest, métrica = recall |
| O2 Morosidad | `payments.csv` + `dataset_ml.csv` | Regresión logística sobre `cumplimiento_pago` |
| O3 Segmentación | `dataset_ml.csv` sin la etiqueta | k-means, validar contra `perfil_latente` |
| O4 Reglas de asociación | `dataset_ml.csv` discretizado | Apriori / FP-Growth |
| O5 Series de tiempo | `attendances.csv` | Agregado por semana y por categoría |
| O6 Anomalías | `attendances.csv`, `payments.csv` | Z-score por categoría, Isolation Forest |
| O7 Benchmark | todos | Comparativo entre las 5 escuelas |

## Reproducibilidad

Semilla `20261021` en `generar_dataset.py`. Cambiarla produce un dataset distinto con las mismas propiedades estadísticas — útil para comprobar que el modelo no depende de una corrida afortunada.

## Privacidad

El dataset no contiene datos de menores reales: nombres, fechas de nacimiento y contactos son generados. Los datos reales de Futcademic (nombre completo, dirección, teléfono, notas médicas de menores de edad) **no salen de la base de producción**.

---

## Modelo REAL: ¿faltará a su siguiente sesión?

Segundo resultado, **separado del sintético y sin ningún dato simulado**. Usa solo la asistencia real de *Gallos San Rafael Serratos* (hoja de cálculo de la academia, cargada a producción el 22/10/2026).

```bash
cd mineria && python3 validar_real.py
```

| | |
|---|---|
| Filas | 570 (154 alumnos, 18 fechas, 26/mar – 22/oct 2026) |
| Etiqueta | `falta_siguiente`: el alumno faltó a esa sesión (18.4 % de las filas) |
| Atributos | solo lo ocurrido **antes** de la sesión: edad, sesiones previas, tasa previa y de las últimas 3, racha de faltas, días desde la última, mes, día de la semana |
| Partición | temporal: entrena hasta el 13/oct, prueba después (213 filas, 40 faltas) |

**Resultado** (árbol CART, profundidad 4):

```
AUC entrenamiento ...... 0.775
AUC prueba ............. 0.779
Sobreajuste ............ -0.004
Marcando al 25 % como "riesgo de falta":
  precisión 0.547 · recall 0.725 · F1 0.624 · lift 2.91x
```

**Hallazgo.** Lo más predictivo es la racha de faltas (AUC 0.722): quien faltó la última vez y falta de nuevo supera el 60 % de probabilidad de volver a faltar; quien no tiene racha ronda el 10 %. La tasa previa y la de las últimas 3 sesiones le siguen (AUC ≈ 0.28, es decir 0.72 invertido).

**Por qué este modelo y no el de deserción.** Las 33 bajas reales (`deleted_students`) pertenecen a otras academias, que casi no tienen asistencia registrada. Serratos tiene 0 bajas. No existe ningún alumno con historial de asistencia **y** baja conocida, así que la deserción no se puede entrenar con datos reales todavía. El modelo de deserción de las secciones anteriores sigue siendo sintético y está etiquetado así.

**Límites.**
- Son 154 alumnos con entre 2 y ~12 marcas cada uno; la hoja registra bloques cortos, no toda la temporada.
- Las marcas posteriores al 22/oct se excluyeron (fechas aún no ocurridas).
- El conjunto de datos publicado (`real/dataset_real.csv`) es anónimo: alumno seudonimizado, sin nombre ni fecha de nacimiento.
