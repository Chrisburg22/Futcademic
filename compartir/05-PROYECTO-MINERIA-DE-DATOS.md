# Proyecto de Minería de Datos

Documento completo del proyecto final. Cada sección responde un punto de la actividad; al final están los resultados, las limitaciones y cómo reproducir todo.

---

## 1. Proceso en el que se utilizan los datos

Los datos no se recolectan para analizarlos: **se generan al operar una academia de futbol**. Cada acción deja un registro.

| Paso | Qué ocurre | Qué dato queda |
|---|---|---|
| Inscripción | El administrador da de alta al alumno | `students`: categoría, tutor, edad, estatus |
| Planeación | Se programan entrenamientos y partidos | `events` y `trainings`: fecha, hora, sede |
| **Pase de lista** | El profesor marca quién asistió | **`attendances`: presente o falta, por sesión** |
| Cobranza | Se registra la mensualidad | `payments`: monto, mes, año |
| Comunicación | El sistema avisa a los padres | `notifications` |
| **Baja** | El alumno deja la academia | **`deleted_students`: con fecha** |

Dos de esos pasos sostienen la minería: el **pase de lista** da el comportamiento y la **baja** da la respuesta de la deserción.

## 2. Cómo se obtienen los datos

**Captura primaria y transaccional**, desde tres vías:

| Vía | Qué captura | Quién la usa |
|---|---|---|
| App móvil | Asistencia en la cancha, perfil | Profesor, padre, alumno |
| Panel web | Alumnos, pagos, eventos, ajustes | Administrador |
| API REST | Valida cada escritura y le pega el sello de la academia | El sistema |

Los datos quedan en PostgreSQL (Supabase), separados por academia. Para el análisis se extrae con consultas SQL a CSV.

**Una academia, desde una hoja de cálculo.** *Gallos San Rafael Serratos* llevaba su asistencia y sus pagos en una hoja de 14 pestañas (una por categoría), con una letra `A` o `F` por día o, en algunas pestañas, **solo el color de la celda**. Se leyó con un script (letras y colores), se limpió y se cargó a producción el 22 de octubre de 2026.

Leyenda de la hoja: `A` asistencia · `F` falta · `L` lesión o enfermedad · `C` Córdica · `LG` Liga Gallos · `PP` partido de preparación. **Solo `A` y `F` se cargaron como asistencia**; el resto no es presencia ni falta y se omitió.

## 3. Histórico de datos

**Asistencia del 19 de marzo al 22 de octubre de 2026 (≈ 7 meses).** El sistema está en uso desde el 7 de mayo; los pagos van del 10 de mayo al 1 de octubre.

| | Antes de la carga (21/oct) | Después (22/oct) |
|---|---:|---:|
| Alumnos | 88 | **353** |
| Asistencias | 28 | **779** |
| Pagos | 7 | **620** |
| Sesiones | 129 | **192** |
| Bajas | 33 | 33 |

Casi toda la asistencia viene de una academia (751 de 779 pases). Las 33 bajas pertenecen a otras academias que casi no pasan lista en la app.

### Calidad de los datos cargados

- **79 alumnos no se cargaron** por no traer fecha de nacimiento legible (solo el año, solo el nombre o la celda vacía). La base exige `birth_date`.
- **5 alumnos más se descartaron** por fechas imposibles (años 2821, 1905, 2002 en una categoría de 12 a 13 años).
- **18 pagos se descartaron** por repetir mes dentro de un mismo alumno.
- **23 pases de lista tienen fecha futura** (27 y 29 de octubre). Siguen en la base pero **se excluyen de toda la minería**.
- Los pagos no traían fecha: se registró el **día 1 del mes pagado**, marcado como «fecha estimada».
- Los alumnos se cargaron **sin tutor**: la hoja no trae ese dato.
- Las hojas A y B de un mismo año **comparten categoría**, porque la base solo admite una categoría por año de nacimiento en cada academia.

## 4. Objetivos de aplicar minería de datos

| # | Objetivo | Técnica | Estado |
|---|---|---|---|
| **A** | ¿Quién va a **faltar** a su siguiente sesión? | Árbol de decisión | **Hecho, con datos reales** |
| **B** | ¿Quién va a **abandonar** en 30 días? | Árbol de decisión | Hecho, **con datos simulados** |
| O2 | ¿Quién **no va a pagar**? | Regresión logística | Pendiente |
| O3 | ¿Qué **tipos de alumno** hay? | Agrupamiento (k-means) | Pendiente |
| O4 | Reglas del tipo «falta mucho y debe dos meses → se va» | Apriori | Pendiente |
| O5–O7 | Estacionalidad, anomalías y comparación entre academias | Series de tiempo y análisis comparativo | Pendiente |

**Valor esperado.** Si una academia retiene 10 de cada 33 alumnos que hoy se dan de baja, con una cuota promedio estimada de $500 MXN mensuales, recupera cerca de **$60,000 MXN al año**. Es una **estimación**, no una medición.

---

## Resultados

### Modelo A · datos reales · ¿faltará a su siguiente sesión?

Entrenado solo con la asistencia real de una academia. **Sin ningún dato simulado.**

| | |
|---|---|
| Filas | 570 (154 alumnos, 18 fechas, 26/mar – 22/oct) |
| Etiqueta | Faltó a esa sesión (18.4 % de las filas) |
| Atributos | Solo lo ocurrido **antes** de la sesión: edad, sesiones previas, tasa de asistencia previa y de las últimas 3, racha de faltas, días desde la última, mes, día de la semana |
| Partición | **Temporal**: entrena hasta el 13/oct, prueba después (213 filas, 40 faltas) |
| **AUC en prueba** | **0.779** (entrenamiento 0.775) |
| **Sobreajuste** | **−0.004** |
| Marcando al 25 % de las sesiones | Recall **0.725** · precisión 0.547 · lift **2.91×** |

**Hallazgo: una falta llama a otra.** La racha de faltas es el mejor predictor (AUC 0.722). Sin racha, la probabilidad de faltar ronda el **12 %**; después de una falta sube a cerca del **54 %**.

### Modelo B · datos simulados · ¿abandonará en 30 días?

La deserción no tiene historial real, así que se modela con un conjunto sintético derivado del esquema real. Son **256 alumnos** de siete academias, de los cuales **dos academias, *Gallos San Rafael* y *Master Fut MR Aguascalientes*, no existen**: se añadieron solo para dar volumen y se marcan con `origen = simulada` en todos los archivos.

| | |
|---|---|
| Filas | 1,731 (230 alumnos), 136 casos de baja (7.9 %) |
| **AUC en prueba** | **0.779** (entrenamiento 0.878) |
| Sobreajuste | 0.099 |
| Marcando al 15 % de los alumnos | Recall 0.566 · lift 3.38× |

El generador se **calibró** contra la base real: tasa de asistencia simulada 81.3 % frente a 82.2 % medida con los 768 pases reales (menos de un punto de diferencia).

> **Coincidencia que conviene aclarar:** ambos modelos dieron AUC 0.779. Son modelos distintos, con etiquetas distintas y datos distintos.

**Una prueba de que el volumen importa.** Con la mitad de los datos simulados el árbol daba AUC 0.726 y sobreajuste 0.165, y se apoyaba en una variable de ruido (el uniforme entregado). Al duplicar el conjunto esa variable desapareció sola y el sobreajuste bajó a la mitad.

---

## Decisiones metodológicas

- **Partición temporal, no aleatoria.** Un alumno aporta varias filas parecidas entre sí; repartirlas al azar metería al mismo alumno en entrenamiento y en prueba e inflaría el resultado. Se entrena con los cortes viejos y se prueba con los recientes.
- **Sin mirar el futuro.** Cada fila usa solo lo ocurrido antes de la sesión que se predice.
- **Criterio de validez fijado antes de correr.** Un AUC bajo 0.65 habría indicado ruido y uno sobre 0.97, una fuga de información.
- **La métrica clave es el recall.** Una falsa alarma cuesta una llamada; una baja o una falta no detectadas cuestan más.
- **Variables excluidas del modelo:** el identificador del alumno, el origen (real o simulado) y el perfil oculto del generador. Usarlas invalidaría el experimento.

## Limitaciones

- **No hay modelo real de deserción.** Ningún alumno tiene historial de asistencia y baja conocida a la vez.
- **El Modelo A usa 154 alumnos** con entre 2 y 12 marcas cada uno: la hoja registra bloques cortos, no la temporada completa.
- **Los pagos de la academia cargada llevan fecha estimada** y no se usaron como atributo del modelo.
- **Árbol de decisión de profundidad 4**, escrito sin librerías externas. Hay margen para mejorarlo con bosques aleatorios y validación cruzada por alumno.

## Privacidad

Los datos son de **menores de edad**. Lo que se comparte no incluye nombres, fechas de nacimiento, teléfonos, direcciones ni notas médicas. El conjunto del Modelo A usa identificadores seudonimizados y solo la edad en años. La base de producción no sale de Supabase.

## Cómo reproducirlo

Todo está en Python 3 estándar, sin dependencias externas (solo la lectura del Excel usa `openpyxl`).

```bash
# Modelo A: datos reales
python3 mineria/validar_real.py

# Modelo B: generar el conjunto simulado y validarlo
python3 mineria/generar_dataset.py
python3 mineria/validar_dataset.py
```

| Ruta | Contenido |
|---|---|
| `mineria/real/dataset_real.csv` | Conjunto del Modelo A, anónimo |
| `mineria/dataset/*.csv` | Conjunto simulado del Modelo B (con columna `origen`) |
| `mineria/README.md` | Diccionario de datos y detalle de cada modelo |
| `scripts/extract_serratos.py` | Extractor de la hoja de cálculo |
| `scripts/generar_carga_serratos.py` | Genera el SQL de carga a producción (el SQL y la hoja original **no se publican**: contienen nombres de menores) |
| `docs/mineria-datos-proyecto-final.md` | Documento académico con los cuatro puntos |

El generador usa una semilla fija: el conjunto simulado se regenera idéntico en cada corrida.
