# Animación: ruta de la vista minable

Página HTML animada (7 pasos: 4 de KDD y 3 del entrenamiento). Datos de la base de producción al 16/11/2026.

## Paso 1 · Limpieza de datos

*Preparación KDD*

La base trae marcas de calendario, edades imposibles, alumnos sin marcas, alumnos que nunca asistieron y alumnos con una sola marca. Se excluye lo dudoso; nada se rellena ni se inventa.

**Resultado:** De 355 alumnos quedan 147 con historial utilizable.

**Código:** `mineria/vista_minable.py`

## Paso 2 · Integración de datos

*Preparación KDD*

Tres tablas de la base de producción se unen por sus llaves en una sola tabla con una fila por alumno y sesión.

**Resultado:** 3 tablas, una llave de unión y un seudónimo por alumno.

**Código:** `mineria/extraer_bd.py`

## Paso 3 · Selección de datos

*Preparación KDD*

Se eligen ocho atributos y una etiqueta, con su tipo y sus valores posibles. Al perfilar la edad aparece el único valor atípico que era un error.

**Resultado:** 8 atributos + 1 etiqueta. Los atípicos de conducta (rachas de faltas) se conservan.

**Código:** `mineria/vista_minable.py`

## Paso 4 · Transformación

*Preparación KDD*

De las marcas sueltas se calculan los atributos de cada fila, usando solo lo ocurrido antes de la sesión que se quiere predecir.

**Resultado:** Resultado: 544 filas listas para minar.

**Código:** `mineria/real/vista_minable.csv`

## Paso 5 · Partir los datos por fecha

*Entrenamiento del modelo*

Antes de entrenar se separa el pasado, con el que aprende el modelo, del futuro, con el que se le examina.

**Resultado:** 344 filas de entrenamiento y 200 de prueba.

**Código:** `mineria/entrenar_vista.py`

## Paso 6 · Entrenar el árbol de decisión

*Entrenamiento del modelo*

El árbol (CART, criterio Gini, profundidad 4, mínimo 15 filas por hoja) busca la pregunta que mejor separa a quien falta de quien asiste.

**Resultado:** Su primera pregunta: ¿venía de una falta? La racha de faltas pesa 0.55 de la importancia.

**Código:** `mineria/entrenar_vista.py`

## Paso 7 · Evaluar y comprobar

*Entrenamiento del modelo*

Se mide con datos que el modelo no vio y se repite con otra herramienta para confirmar que el resultado no depende de nuestro código.

**Resultado:** Se repite con: python3 mineria/entrenar_vista.py

**Código:** `scikit-learn 1.6.1`

## Detalles que muestra la animación

- Limpieza: de 355 alumnos en la base salen 3 con edad imposible, 147 sin ninguna marca, 23 que nunca asistieron y 35 con una sola marca; quedan 147. Marcas: 809 → 726 (31 de calendario fuera).
- Integración: attendances, students y schools unidas por student_id y school_id; una marca por alumno y día; seudónimo.
- Transformación: ejemplo del alumno A001; 544 filas, 11 columnas, 14.3 % faltas.
- Partición por fecha: 344 filas de entrenamiento y 200 de prueba (corte 13 de octubre).
- Árbol: primera pregunta racha de faltas (importancia 0.55); sin racha 3 % a 25 % de riesgo; con racha, 18.8 % los lunes y 57.7 % de martes a jueves.
- Evaluación: AUC 0.643 (árbol propio y scikit-learn), 0.620 por alumno y fecha, 0.613 solo tasa previa; recall 0.542 al 25 %, lift 2.17×.
