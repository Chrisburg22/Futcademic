# Presentación: Vista minable — Futcademic

14 diapositivas. Texto de cada una y notas de quien presenta.

---

## Diapositiva 1 · `cover`

Avance · Vista minable 

### De la hoja de asistencia a una tabla lista para minar 
Limpieza, integración, selección y transformación de los datos de Futcademic: las primeras cuatro etapas de KDD. 
Equipo 
Andrea Lizbeth Torres Arana 
Sergio Samhir Peña Galván 
Christian Alejandro Ramos Pérez 
Minería de Datos · D02 2026 B 
Futcademic 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Abre presentando a los tres integrantes y anuncia el reparto: Christian presenta el proyecto, la vista minable y cierra con lo que falta; Andrea cuenta la limpieza y la integración (etapas 1 y 2) y la comprobación del modelo con otra herramienta; Sergio cuenta la selección de atributos, los valores atípicos, la transformación (etapas 3 y 4) y cómo se entrena el modelo. Idea de apertura: la primera entrega mostró de dónde salen los datos; esta muestra en qué se convirtieron después de pasar por las cuatro primeras etapas de KDD.

---

## Diapositiva 2 · `proyecto`

El proyecto 

### Futcademic: una academia en el teléfono 

**Qué es **
Aplicación web y móvil para academias de futbol infantil: inscribe alumnos, programa entrenamientos, pasa lista y cobra mensualidades. 

**De dónde salen los datos **
Cada pase de lista deja un registro en la base de producción. Gallos San Rafael Serratos aportó su hoja de asistencia y se cargó a la base. 

**Qué se busca **
Anticipar quién va a faltar a su siguiente sesión, para que el entrenador avise a tiempo. 
App móvil · Expo 
Panel web · React 
API · Express 
Base · Supabase 
Cada academia solo ve sus propios datos: toda tabla lleva el identificador de la academia 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Presenta el proyecto en un minuto, para que se entienda de dónde sale la tabla. Futcademic es una aplicación que el equipo construyó y que una academia usa todos los días: el entrenador pasa lista desde el teléfono, el administrador cobra y programa desde el panel web, y todo pasa por una API hacia una base en Supabase. Cada pase de lista deja un registro, y de ahí sale el conjunto de datos. La academia Gallos San Rafael Serratos entregó su hoja de asistencia y se cargó a la base. Lo que se busca con la minería es práctico: anticipar quién va a faltar a su siguiente sesión, para que el entrenador avise a tiempo. Aclara que cada academia solo ve sus datos, porque toda tabla lleva el identificador de la academia.

---

## Diapositiva 3 · `vista`

La vista minable 

### Una fila es una sesión de un alumno 
La pregunta que responde la tabla: ¿faltará este alumno a su siguiente sesión? Cada fila describe lo que se sabía antes de esa sesión y guarda, al final, lo que pasó. 
 | alumno  | fecha  | edad  | n_previas  | tasa_previa  | racha_faltas  | dias_desde  | falta_siguiente 
 | A137  | 2026-10-13  | 10  | 2  | 0.50  | 1  | 5  | 0 
 | A137  | 2026-10-15  | 10  | 3  | 0.67  | 0  | 2  | 0 
 | A137  | 2026-10-22  | 10  | 4  | 0.75  | 0  | 7  | 0 
566 
filas 
152 
alumnos 
11 
columnas 
18.6 % 
de las filas son falta 
Filas reales, con identificadores seudonimizados · 26 de marzo al 22 de octubre de 2026 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Explica la unidad de análisis antes que cualquier etapa: una fila no es un alumno, es un alumno en una sesión concreta. Lee una fila de la tabla: el alumno A137, el 13 de octubre, tiene 10 años, dos sesiones previas, asistió a la mitad, viene de una falta y pasaron 5 días desde su última marca; la última columna, la que se quiere predecir, vale 0 porque ese día sí asistió. La tabla final tiene 566 filas de 152 alumnos y 11 columnas; el 18.6 % de las filas son falta, un desbalance que hay que tener presente. Aclara que los alumnos están seudonimizados (A001, A002…): no hay nombres ni fechas de nacimiento en la vista.

---

## Diapositiva 4 · `ruta`

Ruta · KDD 

### Cuatro etapas, cuatro números 
1 · Limpieza 
−90 
alumnos fuera por fecha de nacimiento ausente, imposible o repetida 
2 · Integración 
12→1 
pestañas de la hoja unidas en una sola tabla por alumno y sesión 
3 · Selección 
8+1 
atributos y una etiqueta, con su tipo, sus valores y sus atípicos 
4 · Transformación 
566 
filas calculadas solo con lo ocurrido antes de cada sesión 
Todo lo que sigue sale de un script que se puede volver a correr: mineria/vista_minable.py . Si cambia la hoja, cambia la vista. 
Andrea: etapas 1 y 2 · Sergio: etapas 3 y 4 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Es el mapa de lo que viene; no te detengas en los números, solo anuncia qué etapa deja qué rastro. Limpieza: 79 alumnos sin fecha de nacimiento, 5 con fecha imposible y 6 repetidos suman 90 que no entran. Integración: la hoja de cálculo tiene una pestaña por categoría, 12 con datos, y se unen en una sola tabla. Selección: 8 atributos y una etiqueta, cada uno descrito. Transformación: 566 filas, calculadas con ventana previa para no mirar el futuro. Pasa la palabra a Andrea para las dos primeras etapas.

---

## Diapositiva 5 · `limpieza`

Etapa 1 · Limpieza de datos 

### Seis problemas encontrados en la hoja 
 | Problema  | Casos  | Qué se hizo 
 | Sin fecha de nacimiento  | 79  | Fuera: sin edad no hay atributo y la base la exige 
 | Fecha de nacimiento imposible  | 5  | Fuera: edades de −795, 121 y 24 años 
 | Alumno repetido entre pestañas  | 6  | Se conserva uno (nombre + nacimiento) 
 | Marca con fecha futura  | 23  | Fuera: son sesiones que aún no ocurren 
 | Código distinto de A o F  | 95  | No es presencia ni falta: no se carga 
 | Pago con mes repetido  | 18  | Se conserva el primero (los pagos no entran a la vista) 

**Regla de la limpieza: lo dudoso se excluye, no se inventa **
Ningún dato faltante se rellenó con un promedio ni con un valor supuesto. 
Fuente: hoja de asistencia de Gallos San Rafael Serratos, extraída con scripts/extract_serratos.py 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Cada fila es un problema real que apareció al leer la hoja. 79 alumnos no traían fecha de nacimiento: sin ella no se puede calcular la edad y la base de datos la exige, así que se dejaron fuera en lugar de inventarla. 5 traían fechas imposibles: el año 2821, tres con 1905 y una de 2002 en una categoría de 12 a 13 años; darían edades de menos 795, 121 y 24 años. 6 alumnos aparecían en dos pestañas. 23 marcas tienen fecha de finales de octubre, posterior al corte del 22, así que no son asistencia sino calendario. 95 celdas traen un código que no es A ni F (lesión, Córdica, liga, partido de preparación u otro color) y no se puede decir si fue presencia o falta. 18 pagos repetían mes. Termina con la regla: lo dudoso se excluye, nunca se rellena.

---

## Diapositiva 6 · `embudo`

Etapa 1 · Resultado de la limpieza 

### De 352 alumnos a 152 
Alumnos en la hoja 
352 
Con fecha de nacimiento 
273 
Con fecha posible 
268 
Sin repetidos 
262 
Con al menos 2 marcas 
152 

**Por qué hacen falta 2 marcas **
La primera marca solo sirve de historia: sin una sesión anterior no hay nada que usar para predecir. 

**Las marcas, de 791 a 566 filas **
791 marcas A/F, 750 al limpiar; la primera de cada alumno no genera fila y quedan 566. 
Los 110 alumnos descartados en el último paso siguen en la base de producción 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Es el mismo resultado de la lámina anterior, ahora como embudo. Se parte de 352 alumnos en la hoja; sin fecha de nacimiento quedan 273; sin fechas imposibles, 268; sin repetidos, 262. El último escalón es el más grande: 110 alumnos tienen una sola marca o ninguna, y con una sola marca no se puede construir ni una fila, porque cada fila usa lo ocurrido en sesiones anteriores. Quedan 152 alumnos. Aclara que ninguno de los descartados se borra de la base: solo no entran a esta vista. De las 791 marcas A o F, quedan 750 al limpiar y la vista tiene 566 filas.

---

## Diapositiva 7 · `integracion`

Etapa 2 · Integración de datos 

### Doce pestañas, una sola tabla 
Fuente 

**Hoja de la academia **
14 pestañas, una por categoría; 12 traen datos. La asistencia va como letra A o F, o solo como color de celda. 
Reglas de unión 
Llave del alumno: nombre + fecha de nacimiento 
Cada día de la hoja se resuelve contra el mes del encabezado 
Las pestañas A y B de un año comparten categoría 
El nombre se sustituye por un seudónimo (A001, A002…) 
Resultado 

**Alumno × sesión **
Una fila por marca: alumno, fecha y si estuvo presente. De ahí se calculan los atributos. 

**Lo que todavía no se integra **
Los pagos (llevan fecha estimada: día 1 del mes) y el tutor del alumno (la hoja no lo trae). Se integrarán para el modelo de morosidad. 
Los datos ya están cargados en producción; la vista se construye desde el mismo archivo 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. La integración aquí no es juntar bases distintas sino juntar doce pestañas que se parecen pero no son iguales. Primero, la llave: nombre más fecha de nacimiento identifica al alumno aunque aparezca en dos pestañas. Segundo, las fechas: cada pestaña trae los días sueltos (28, 30, 5, 7…) y cruzan dos meses, así que cada día se resuelve contra el mes del encabezado. Tercero, las pestañas A y B del mismo año comparten categoría, porque la base de datos solo admite una categoría por año de nacimiento en cada academia. Cuarto, el nombre se cambia por un seudónimo, porque son menores de edad. El resultado es una tabla alumno por sesión. Sé honesta con lo pendiente: los pagos tienen fecha estimada y el tutor no viene en la hoja, por eso no están en esta vista.

---

## Diapositiva 8 · `seleccion`

Etapa 3 · Selección de datos 

### Ocho atributos y una etiqueta 
 | Atributo  | Tipo  | Qué significa  | Valores observados 
 | edad  | Entero  | Años cumplidos en 2026  | 5 a 15 · mediana 10 
 | n_previas  | Entero  | Sesiones anteriores  | 1 a 7 · mediana 3 
 | tasa_previa  | Decimal 0–1  | Asistencias ÷ sesiones previas  | 0 a 1 · mediana 1.00 
 | tasa_ultimas3  | Decimal 0–1  | Lo mismo, últimas 3 sesiones  | 0 · 0.33 · 0.5 · 0.67 · 1 
 | racha_faltas  | Entero  | Faltas seguidas justo antes  | 0 a 7 · mediana 0 
 | dias_desde_ultima  | Entero  | Días desde la marca anterior  | 2 · 5 · 7 · 12 · 14 
 | mes  | Categórico  | Mes de la sesión  | 3 · 4 · 9 · 10 
 | dia_semana  | Categórico  | 0 lunes … 6 domingo  | 0 a 3 (lunes a jueves) 
 | falta_siguiente  | Binario · etiqueta  | 1 si faltó, 0 si asistió  | 0: 461 · 1: 105 
Fuera de la vista: el identificador y la fecha, que solo sirven para ordenar y particionar 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Esta es la tabla que pide la actividad: cada atributo con su tipo, sus valores posibles y lo que realmente se observó. Léela por bloques. Los cuatro primeros describen al alumno y su historial: edad, cuántas sesiones tiene, y qué proporción de ellas asistió, en total y en las últimas tres. Racha de faltas y días desde la última marca describen qué tan reciente es su ausencia. Mes y día de la semana describen cuándo ocurre la sesión. La última fila, en naranja, es la etiqueta: 1 si faltó y 0 si asistió; hay 105 faltas y 461 asistencias. Dos observaciones honestas sobre los valores: los días de la semana solo van de lunes a jueves, porque son los días de entrenamiento de la academia; y el mes casi no varía, porque casi todo ocurre en octubre. Eso lo vuelve un atributo débil, y se revisará antes de minar. Quedan fuera de la vista el identificador del alumno y la fecha: sirven para ordenar y para partir los datos, no para predecir.

---

## Diapositiva 9 · `atipicos`

Etapa 3 · Valores atípicos 

### Un error y varios atípicos legítimos 
El error 
−795 
años de edad. La primera versión de la vista traía 4 filas con edades de −795 y 24; venían de fechas de nacimiento imposibles. Se excluyeron y la edad quedó entre 5 y 15. 
 | Atributo  | Atípicos  | Qué son 
 | racha_faltas  | 94  | Rachas de 1 a 7 faltas 
 | tasa_ultimas3  | 139  | Alumnos con faltas recientes 
 | tasa_previa  | 85  | Menos de la mitad de asistencia 
 | mes  | 79  | Marzo y abril: el resto es octubre 
 | dias_desde_ultima  | 5  | 12 y 14 días sin sesión 
 | edad, n_previas, dia_semana  | 0  | Ninguno 
Criterio: fuera del rango de 1.5 × el rango intercuartil 

**Decisión: se conservan los atípicos de conducta **
Una racha de 7 faltas no es un error de captura: es el comportamiento que se quiere predecir. Quitarla borraría la señal. 
Detectado al perfilar los atributos con mineria/vista_minable.py 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Separa dos cosas que suelen confundirse. Primero, el error: al perfilar la edad en la primera versión de la vista apareció un mínimo de menos 795 años y un máximo de 24 en una categoría de 12 a 13; eran cuatro filas que venían de fechas de nacimiento imposibles en la hoja, y se excluyeron. Es un hallazgo de esta etapa, no algo que ya estuviera limpio. Segundo, los atípicos estadísticos: con el criterio de 1.5 veces el rango intercuartil, cinco atributos marcan valores atípicos, pero ninguno es un error. Racha, tasa de asistencia reciente y tasa total marcan a los alumnos que faltan; el mes marca marzo y abril porque casi toda la vista es de octubre; y 12 y 14 días son semanas sin sesión. Decisión: se conservan, porque borrarlos eliminaría justo el comportamiento que se quiere predecir.

---

## Diapositiva 10 · `transformacion`

Etapa 4 · Transformación 

### De marcas sueltas a una fila por sesión 
Un alumno real, seudonimizado (A137). Cada fila usa solo lo ocurrido antes de esa sesión. 
 | Fecha  | Marca  | n_previas  | tasa_previa  | racha  | días  | falta_siguiente 
 | 2026-10-06  | Asistió  | —  | —  | —  | —  | solo historia 
 | 2026-10-08  | Faltó  | 1  | 1.00  | 0  | 2  | 1 
 | 2026-10-13  | Asistió  | 2  | 0.50  | 1  | 5  | 0 
 | 2026-10-15  | Asistió  | 3  | 0.67  | 0  | 2  | 0 
 | 2026-10-22  | Asistió  | 4  | 0.75  | 0  | 7  | 0 

**Etiqueta **
falta_siguiente vale 1 si en esa sesión faltó. 

**Partición por fecha **
Entrena hasta el 13 de octubre (355 filas) y prueba después (211). 

**Sin normalizar **
El árbol de decisión no lo necesita; se hará con la regresión logística. 
Se usa la fecha y no un sorteo al azar: un alumno aporta varias filas parecidas entre sí 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Este es el ejemplo más importante de la presentación, léelo despacio. El alumno A137 tiene cinco marcas en octubre. La primera, el 6, es solo historia: no hay nada antes de ella, así que no genera fila. La del 8 sí: antes de ella tenía una sesión y la había asistido, por eso su tasa previa es 1.00; ese día faltó, y por eso la etiqueta, en naranja, vale 1. La del 13: antes tenía dos sesiones y una falta, su tasa previa es 0.50 y viene de una falta, así que la racha es 1; esta vez sí asistió y la etiqueta vale 0. Cada fila solo usa información anterior: nunca se mira el futuro para predecir. La partición también respeta el tiempo: se entrena con sesiones hasta el 13 de octubre y se prueba con las posteriores, porque un mismo alumno aporta varias filas parecidas y un sorteo al azar mezclaría al mismo alumno en entrenamiento y prueba. No se normalizó nada todavía: el árbol de decisión no lo necesita.

---

## Diapositiva 11 · `entrenamiento`

Entrenamiento del modelo 

### Un árbol de decisión que explica el riesgo 
1 

**Partir por fecha **
Entrena con 355 filas hasta el 13 de octubre; prueba con 211 posteriores. 
2 

**Ajustar el árbol **
CART con criterio Gini, profundidad 4 y mínimo de 15 filas por hoja. 
3 

**Predecir **
Cada fila recibe una probabilidad de falta, según la hoja del árbol donde cae. 
4 

**Evaluar **
AUC en la prueba y recall al marcar el 25 % de las sesiones con más riesgo. 
Lo que aprendió el árbol 
3 % a 25 % 
de riesgo si no traía faltas seguidas 
22 % a 79 % 
si venía de una falta o más 
La racha de faltas pesa 0.65 de la importancia total del modelo. 
Entrenado con mineria/entrenar_vista.py sobre mineria/real/vista_minable.csv 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Explica cómo se está entrenando el modelo, en cuatro pasos. Uno: se parte por fecha, no al azar: entrena con 355 filas hasta el 13 de octubre y se prueba con las 211 posteriores. Dos: se ajusta un árbol de decisión CART con criterio Gini, profundidad 4 y mínimo de 15 filas por hoja, para que no memorice. Tres: cada fila cae en una hoja del árbol y recibe la probabilidad de falta de esa hoja. Cuatro: se evalúa con AUC en la prueba y con el recall al marcar el 25 % de las sesiones de más riesgo. La razón de usar un árbol es que se lee: lo que aprendió es sencillo. Si el alumno no traía faltas seguidas, el riesgo va de 3 % a 25 %; si venía de una falta o más, sube de 22 % a 79 %. La racha de faltas explica 0.65 de la importancia del modelo.

---

## Diapositiva 12 · `comprobacion`

Comprobación 

### Dos programas, el mismo resultado 
 | Herramienta  | AUC prueba  | Recall al 25 %  | Lift 
 | Árbol propio, Python estándar  | 0.779  | 0.725  | 2.89× 
 | scikit-learn 1.6.1, DecisionTreeClassifier  | 0.779  | 0.725  | 2.89× 
 | Validación cruzada por alumno, 5 pliegues  | 0.730  | —  | — 

**Cómo repetirlo **
Un solo comando; si scikit-learn está instalado, hace también el contraste. 
python3 mineria/entrenar_vista.py 

**Una advertencia honesta **
La tasa de asistencia previa, sola, da AUC 0.784: el árbol no la supera. Su valor es traducir el riesgo a reglas que el entrenador entiende. Y por alumno el AUC baja a 0.730, la cifra más realista. 
Mismos parámetros, misma partición por fecha: 355 filas de entrenamiento y 211 de prueba 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Esto responde a cómo se sabe que el resultado es real. El árbol se escribió dos veces: una con Python estándar, sin librerías, y otra con scikit-learn, la biblioteca que usa casi cualquier herramienta de minería. Con los mismos parámetros y la misma partición por fecha dan exactamente lo mismo: AUC de 0.779 en la prueba, recall de 0.725 al marcar el 25 % de las sesiones y lift de 2.89. Cualquiera lo puede repetir con un comando. La tercera fila es la más exigente: validación cruzada agrupada por alumno, que impide que el mismo alumno esté en entrenamiento y en prueba; ahí el AUC medio es 0.730, con un rango de 0.630 a 0.833 entre pliegues, y es la cifra más realista. Di también la advertencia: la tasa de asistencia previa por sí sola da 0.784, así que el árbol no la supera en AUC; su aporte es dar reglas legibles para el entrenador.

---

## Diapositiva 13 · `resultado`

Resultado · Vista minable 

### Lo que quedó después de las cuatro etapas 
566 
filas 
152 
alumnos 
18 
fechas de sesión 
18.6 % 
de las filas son falta 
 | Etapa  | Qué quedó 
 | 1 · Limpieza  | 90 alumnos y 23 marcas futuras fuera; nada se rellenó 
 | 2 · Integración  | 12 pestañas en una tabla alumno × sesión, con seudónimos 
 | 3 · Selección  | 8 atributos y 1 etiqueta; 4 filas con edad imposible corregidas 
 | 4 · Transformación  | 566 filas con ventana previa; partición por fecha, 355 y 211 
Del 26 de marzo al 22 de octubre de 2026 · mineria/real/vista_minable.csv 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Recoge lo que contaron Andrea y Sergio en una sola lámina. La vista tiene 566 filas de 152 alumnos, repartidas en 18 fechas de sesión entre el 26 de marzo y el 22 de octubre. Detalle importante: el 18.6 % de las filas son faltas, así que no está balanceada y más adelante se evaluará con recall y no solo con exactitud. La tabla de abajo es el resumen de qué dejó cada etapa: la limpieza sacó 90 alumnos y 23 marcas futuras sin rellenar nada; la integración unió las pestañas; la selección describió los atributos y corrigió cuatro filas con edad imposible; la transformación calculó las 566 filas y partió por fecha. Todo se puede regenerar con el script mineria/vista_minable.py.

---

## Diapositiva 14 · `pendiente`

Siguiente paso 

### Qué falta antes de minar 

**Clase desbalanceada **
Solo 18.6 % de las filas son falta. Hay que medir con recall y probar un umbral, no solo con exactitud. 

**Un atributo débil **
487 de 566 filas caen en octubre, así que el mes casi no distingue. Se evaluará si se descarta. 

**Historial corto **
La hoja registra bloques cortos: 110 alumnos tienen una sola marca y quedaron fuera de la vista. 

**Bajas sin historial **
Las 33 bajas no tienen asistencia registrada. La deserción necesitará su propia vista. 

**Siguiente: comparar modelos y priorizar el recall **
Regresión logística y bosque aleatorio frente al árbol; después, integrar pagos y tutor para el modelo de morosidad. 
Andrea Lizbeth Torres Arana · Sergio Samhir Peña Galván · Christian Alejandro Ramos Pérez 
Minería de Datos · D02 2026 B 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez, con Andrea y Sergio al frente para las preguntas. Cierra con honestidad: la vista está lista, pero no es perfecta. Cuatro cosas quedan abiertas. Uno, la clase está desbalanceada: solo 18.6 % son faltas, así que la métrica clave será el recall, porque una falsa alarma cuesta una llamada y una falta no detectada cuesta más. Dos, el mes es un atributo débil, porque casi todo es octubre. Tres, hay historial corto: la hoja registra bloques de pocas sesiones, y 110 alumnos tienen una sola marca. Cuatro, las bajas no tienen asistencia, así que la deserción necesita su propia vista. El árbol de decisión ya está entrenado y comprobado; siguiente paso: compararlo con regresión logística y bosque aleatorio y priorizar el recall. Invita a Andrea a responder dudas de limpieza e integración, y a Sergio sobre atributos y transformación.
