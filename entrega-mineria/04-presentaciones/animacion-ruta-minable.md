# Animación: ruta de la vista minable

Página HTML animada (7 pasos: 4 de KDD y 3 del entrenamiento del modelo). Aquí está el contenido de cada paso.

## Paso 1 · Limpieza de datos

*Preparación KDD*

La hoja de asistencia trae fechas imposibles, alumnos repetidos y alumnos sin datos suficientes. Se excluye lo dudoso; nada se rellena ni se inventa.

**Resultado:** De 352 alumnos quedan 152 con historial utilizable.

**Código:** `mineria/vista_minable.py`

## Paso 2 · Integración de datos

*Preparación KDD*

La hoja de la academia tiene una pestaña por categoría. Las doce se unen en una sola tabla con una fila por alumno y sesión.

**Resultado:** 12 pestañas, una llave de unión y un seudónimo por alumno.

**Código:** `scripts/extract_serratos.py`

## Paso 3 · Selección de datos

*Preparación KDD*

Se eligen ocho atributos y una etiqueta, con su tipo y sus valores posibles. Al perfilar la edad aparece el único valor atípico que era un error.

**Resultado:** 8 atributos + 1 etiqueta. Los atípicos de conducta (rachas de faltas) se conservan.

**Código:** `mineria/vista_minable.py`

## Paso 4 · Transformación

*Preparación KDD*

De las marcas sueltas se calculan los atributos de cada fila, usando solo lo ocurrido antes de la sesión que se quiere predecir.

**Resultado:** Resultado: 566 filas listas para minar.

**Código:** `mineria/real/vista_minable.csv`

## Paso 5 · Partir los datos por fecha

*Entrenamiento del modelo*

Antes de entrenar se separa el pasado, con el que aprende el modelo, del futuro, con el que se le examina.

**Resultado:** 355 filas de entrenamiento y 211 de prueba.

**Código:** `mineria/entrenar_vista.py`

## Paso 6 · Entrenar el árbol de decisión

*Entrenamiento del modelo*

El árbol (CART, criterio Gini, profundidad 4, mínimo 15 filas por hoja) busca la pregunta que mejor separa a quien falta de quien asiste.

**Resultado:** Su primera pregunta: ¿venía de una falta? La racha de faltas pesa 0.65 de la importancia.

**Código:** `mineria/entrenar_vista.py`

## Paso 7 · Evaluar y comprobar

*Entrenamiento del modelo*

Se mide con datos que el modelo no vio y se repite con otra herramienta para confirmar que el resultado no depende de nuestro código.

**Resultado:** Se repite con: python3 mineria/entrenar_vista.py

**Código:** `scikit-learn 1.6.1`

## Detalles que muestra la animación

- Limpieza: 5 alumnos con edad imposible (−795, 121 o 24 años), 6 repetidos entre pestañas, 110 con una sola marca o ninguna. De 352 alumnos quedan 152.
- Integración: llave del alumno = nombre + fecha de nacimiento; los días se resuelven contra el mes del encabezado; el nombre se cambia por un seudónimo.
- Transformación: ejemplo del alumno A137; cada fila usa solo las marcas anteriores. Total 566 filas, 11 columnas, 18.6 % faltas.
- Partición por fecha (no al azar), porque un alumno aporta varias filas parecidas.
- Árbol: primera pregunta = racha de faltas; cada hoja da la probabilidad de falta.
- Evaluación: AUC 0.779 (árbol propio y scikit-learn 1.6.1), 0.730 en validación por alumno; recall 0.725, lift 2.89×. La tasa de asistencia previa sola da 0.784.
