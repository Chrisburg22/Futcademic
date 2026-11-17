# Presentación: Vista minable — Futcademic

14 diapositivas. Avance de la vista minable y entrenamiento del modelo, con datos extraídos de la base de producción (16/11/2026). Texto de cada diapositiva y notas de quién presenta.

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
 | A001  | 2026-10-13  | 10  | 2  | 0.50  | 1  | 5  | 0 
 | A001  | 2026-10-15  | 10  | 3  | 0.67  | 0  | 2  | 0 
 | A001  | 2026-10-22  | 10  | 4  | 0.75  | 0  | 7  | 0 
544 
filas 
147 
alumnos 
11 
columnas 
14.3 % 
de las filas son falta 
Filas reales, con identificadores seudonimizados · 26 de marzo al 12 de noviembre de 2026 · extraídas de la base 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Explica la unidad de análisis antes que cualquier etapa: una fila no es un alumno, es un alumno en una sesión concreta. Lee una fila de la tabla: el alumno A001, el 13 de octubre, tiene 10 años, dos sesiones previas, asistió a la mitad, viene de una falta y pasaron 5 días desde su última marca; la última columna, la que se quiere predecir, vale 0 porque ese día sí asistió. La tabla final tiene 544 filas de 147 alumnos y 11 columnas, extraídas directo de la base de producción de la app; el 14.3 % de las filas son falta, un desbalance que hay que tener presente. Aclara que los alumnos están seudonimizados (A001, A002…): no hay nombres ni fechas de nacimiento en la vista.

---

## Diapositiva 4 · `ruta`

Ruta · KDD 

### Cuatro etapas, cuatro números 
1 · Limpieza 
−208 
alumnos fuera: edad imposible, sin marcas, nunca asistieron o una sola marca 
2 · Integración 
3→1 
tablas de la base unidas por sus llaves en una tabla alumno × sesión 
3 · Selección 
8+1 
atributos y una etiqueta, con su tipo, sus valores y sus atípicos 
4 · Transformación 
544 
filas calculadas solo con lo ocurrido antes de cada sesión 
Todo sale de dos scripts que se pueden volver a correr: extraer_bd.py lee la base y vista_minable.py construye la vista. 
Andrea: etapas 1 y 2 · Sergio: etapas 3 y 4 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Es el mapa de lo que viene; no te detengas en los números, solo anuncia qué etapa deja qué rastro. Los datos salen directo de la base de producción de la app. Limpieza: de 355 alumnos quedan 147; salen 3 con edad imposible, 147 sin ninguna marca, 23 que nunca asistieron y 35 con una sola marca, en total 208. Integración: tres tablas de la base, asistencias, alumnos y academias, se unen por sus llaves en una sola tabla. Selección: 8 atributos y una etiqueta, cada uno descrito. Transformación: 544 filas, calculadas con ventana previa para no mirar el futuro. Pasa la palabra a Andrea para las dos primeras etapas.

---

## Diapositiva 5 · `limpieza`

Etapa 1 · Limpieza de datos 

### Seis problemas encontrados en la base 
 | Problema  | Casos  | Qué se hizo 
 | Marca registrada antes de su fecha  | 31  | Fuera: es calendario, no asistencia 
 | Edad imposible (nacido en 2026)  | 3  | Fuera: fecha de relleno al darlo de alta 
 | Alumno sin ninguna marca  | 147  | Fuera: su academia aún no pasa lista 
 | Alumno que nunca asistió  | 23  | Fuera: ya no está activo e inflaría el modelo 
 | Alumno con una sola marca  | 35  | Fuera: no alcanza para una fila con historia 
 | Datos sensibles  | —  | Nombre, CURP, teléfono y notas médicas no se leen 

**Regla de la limpieza: lo dudoso se excluye, no se inventa **
Ningún dato faltante se rellenó con un promedio ni con un valor supuesto. 
Fuente: base de producción de Futcademic, extraída con mineria/extraer_bd.py 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Cada fila es un problema real que apareció al extraer la base. 31 marcas se guardaron días antes de la fecha que dicen, por ejemplo marcas del 27 y 29 de octubre registradas el 22: no pueden ser asistencia, son calendario, y salen. 3 alumnos tienen fecha de nacimiento en 2026, edad cero: son fechas de relleno que se pusieron al darlos de alta. 147 alumnos están inscritos pero no tienen ninguna marca, porque su academia todavía no pasa lista en la app. 23 solo tienen faltas, nunca asistieron: ya no están activos y sus filas serían aciertos fáciles que inflarían el modelo. 35 tienen una sola marca, que no alcanza para construir una fila con historia. Y la última fila es una decisión de privacidad: la extracción nunca lee nombres, CURP, teléfonos ni notas médicas. Termina con la regla: lo dudoso se excluye, nunca se rellena.

---

## Diapositiva 6 · `embudo`

Etapa 1 · Resultado de la limpieza 

### De 355 alumnos a 147 
Alumnos en la base 
355 
Con edad posible 
352 
Con alguna marca 
205 
Con alguna asistencia 
182 
Con al menos 2 marcas 
147 

**Por qué hacen falta 2 marcas **
La primera marca solo sirve de historia: sin una sesión anterior no hay nada que usar para predecir. 

**Las marcas, de 809 a 544 filas **
809 marcas extraídas, 726 al limpiar; la primera de cada alumno no genera fila y quedan 544. 
Los alumnos descartados no se borran: siguen en la base de producción 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Es el mismo resultado de la lámina anterior, ahora como embudo. Se parte de 355 alumnos en la base; con edad posible quedan 352. El escalón más grande es el siguiente: solo 205 tienen alguna marca, porque muchos alumnos están inscritos en academias que todavía no pasan lista en la app. Quitando a 23 que nunca asistieron quedan 182, y quitando a 35 con una sola marca, 147: con una sola marca no se puede construir ni una fila, porque cada fila usa lo ocurrido en sesiones anteriores. Aclara que ninguno de los descartados se borra de la base: solo no entran a esta vista. De las 809 marcas extraídas quedan 726 al limpiar, y la vista tiene 544 filas.

---

## Diapositiva 7 · `integracion`

Etapa 2 · Integración de datos 

### Tres tablas, una sola vista 
Fuente 

**Base de la app **
attendances (809 marcas), students (355) y schools (20), extraídas con extraer_bd.py. 
Reglas de unión 
Cada marca apunta a su alumno por student_id 
El alumno da la edad (birth_date) y la academia (school_id) 
Una sola marca por alumno y día: se queda la primera registrada 
El identificador se sustituye por un seudónimo (A001, A002…) 
Resultado 

**Alumno × sesión **
Una fila por marca: alumno, fecha y si estuvo presente. De ahí se calculan los atributos. 

**Lo que todavía no se integra **
Los pagos y las bajas (deleted_students) ya se extraen, pero no entran a esta vista: servirán para los modelos de morosidad y deserción. 
Al cargar la hoja en la base, las 12 pestañas ya quedaron unidas: un alumno, un identificador 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Integrar es juntar fuentes distintas en una sola tabla; aquí son tres tablas de la base unidas por sus llaves. Cada marca de asistencia trae el identificador del alumno; con él se busca al alumno, de donde sale su fecha de nacimiento, y con ella la edad, y su academia. Si un alumno tuviera dos marcas el mismo día, se queda la primera que se registró. Antes de escribir cualquier archivo, el identificador se cambia por un seudónimo, porque son menores de edad. El resultado es una tabla alumno por sesión. Menciona que en la base ya no hay que unir pestañas: al cargar la hoja, cada alumno quedó con un solo identificador. Sé honesta con lo pendiente: los pagos y las bajas ya se extraen, pero no están en esta vista; servirán para los modelos de morosidad y deserción.

---

## Diapositiva 8 · `seleccion`

Etapa 3 · Selección de datos 

### Ocho atributos y una etiqueta 
 | Atributo  | Tipo  | Qué significa  | Valores observados 
 | edad  | Entero  | Años cumplidos en 2026  | 5 a 15 · mediana 10 
 | n_previas  | Entero  | Sesiones anteriores  | 1 a 6 · mediana 3 
 | tasa_previa  | Decimal 0–1  | Asistencias ÷ sesiones previas  | 0 a 1 · mediana 1.00 
 | tasa_ultimas3  | Decimal 0–1  | Lo mismo, últimas 3 sesiones  | 0 · 0.33 · 0.5 · 0.67 · 1 
 | racha_faltas  | Entero  | Faltas seguidas justo antes  | 0 a 5 · mediana 0 
 | dias_desde_ultima  | Entero  | Días desde la marca anterior  | 2 · 5 · 7 · 12 · 14 · 105 · 203 
 | mes  | Categórico  | Mes de la sesión  | 3 · 4 · 9 · 10 · 11 
 | dia_semana  | Categórico  | 0 lunes … 6 domingo  | 0 a 3 (lunes a jueves) 
 | falta_siguiente  | Binario · etiqueta  | 1 si faltó, 0 si asistió  | 0: 466 · 1: 78 
Fuera de la vista: el identificador y la fecha, que solo sirven para ordenar y particionar 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Esta es la tabla que pide la actividad: cada atributo con su tipo, sus valores posibles y lo que realmente se observó. Léela por bloques. Los cuatro primeros describen al alumno y su historial: edad, cuántas sesiones tiene, y qué proporción de ellas asistió, en total y en las últimas tres. Racha de faltas y días desde la última marca describen qué tan reciente es su ausencia. Mes y día de la semana describen cuándo ocurre la sesión. La última fila, en naranja, es la etiqueta: 1 si faltó y 0 si asistió; hay 78 faltas y 466 asistencias. Dos observaciones honestas sobre los valores: los días de la semana solo van de lunes a jueves, porque son los días de entrenamiento de la academia; y el mes casi no varía, porque casi todo ocurre en octubre. Eso lo vuelve un atributo débil, y se revisará antes de minar. Quedan fuera de la vista el identificador del alumno y la fecha: sirven para ordenar y para partir los datos, no para predecir.

---

## Diapositiva 9 · `atipicos`

Etapa 3 · Valores atípicos 

### Un error y varios atípicos legítimos 
El error 
0 
años de edad: 3 alumnos «nacidos» en 2026, fechas de relleno al darlos de alta. Se excluyeron y la edad quedó entre 5 y 15. 
 | Atributo  | Atípicos  | Qué son 
 | racha_faltas  | 68  | Rachas de 1 a 5 faltas 
 | tasa_ultimas3  | 114  | Alumnos con faltas recientes 
 | tasa_previa  | 127  | Menos de la mitad de asistencia 
 | mes  | 83  | Todo lo que no es octubre 
 | dias_desde_ultima  | 11  | 12 a 203 días: pausas largas 
 | edad, n_previas, dia_semana  | 0–1  | Casi ninguno 
Criterio: fuera del rango de 1.5 × el rango intercuartil 

**Decisión: se conservan los atípicos de conducta **
Una racha de 5 faltas no es un error de captura: es el comportamiento que se quiere predecir. Quitarla borraría la señal. 
Detectado al perfilar los atributos con mineria/vista_minable.py 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Separa dos cosas que suelen confundirse. Primero, el error: al perfilar la edad aparecieron tres alumnos con edad cero, nacidos en 2026, que no pueden entrenar en una academia; son fechas de relleno que se pusieron al darlos de alta, y se excluyeron. Con la hoja de cálculo pasaba algo parecido: había edades de menos 795 y 24 años. Segundo, los atípicos estadísticos: con el criterio de 1.5 veces el rango intercuartil, cinco atributos marcan valores atípicos, pero ninguno es un error. Racha, tasa de asistencia reciente y tasa total marcan a los alumnos que faltan; el mes marca todo lo que no es octubre, porque casi toda la vista es de octubre; y de 12 a 203 días son pausas largas: un grupo entrenó en marzo y abril y volvió a pasar lista el 12 de noviembre. Decisión: se conservan, porque borrarlos eliminaría justo el comportamiento que se quiere predecir.

---

## Diapositiva 10 · `transformacion`

Etapa 4 · Transformación 

### De marcas sueltas a una fila por sesión 
Un alumno real, seudonimizado (A001). Cada fila usa solo lo ocurrido antes de esa sesión. 
 | Fecha  | Marca  | n_previas  | tasa_previa  | racha  | días  | falta_siguiente 
 | 2026-10-06  | Asistió  | —  | —  | —  | —  | solo historia 
 | 2026-10-08  | Faltó  | 1  | 1.00  | 0  | 2  | 1 
 | 2026-10-13  | Asistió  | 2  | 0.50  | 1  | 5  | 0 
 | 2026-10-15  | Asistió  | 3  | 0.67  | 0  | 2  | 0 
 | 2026-10-22  | Asistió  | 4  | 0.75  | 0  | 7  | 0 

**Etiqueta **
falta_siguiente vale 1 si en esa sesión faltó. 

**Partición por fecha **
Entrena antes del 13 de octubre (344 filas) y prueba después (200). 

**Sin normalizar **
El árbol de decisión no lo necesita; se hará con la regresión logística. 
Se usa la fecha y no un sorteo al azar: un alumno aporta varias filas parecidas entre sí 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Este es el ejemplo más importante de la presentación, léelo despacio. El alumno A001 tiene cinco marcas en octubre. La primera, el 6, es solo historia: no hay nada antes de ella, así que no genera fila. La del 8 sí: antes de ella tenía una sesión y la había asistido, por eso su tasa previa es 1.00; ese día faltó, y por eso la etiqueta, en naranja, vale 1. La del 13: antes tenía dos sesiones y una falta, su tasa previa es 0.50 y viene de una falta, así que la racha es 1; esta vez sí asistió y la etiqueta vale 0. Cada fila solo usa información anterior: nunca se mira el futuro para predecir. La partición también respeta el tiempo: se entrena con sesiones anteriores al 13 de octubre y se prueba con las posteriores, porque un mismo alumno aporta varias filas parecidas y un sorteo al azar mezclaría al mismo alumno en entrenamiento y prueba. No se normalizó nada todavía: el árbol de decisión no lo necesita.

---

## Diapositiva 11 · `entrenamiento`

Entrenamiento del modelo 

### Un árbol de decisión que explica el riesgo 
1 

**Partir por fecha **
Entrena con 344 filas antes del 13 de octubre; prueba con 200 posteriores. 
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
19 % a 58 % 
si venía de una falta o más 
La racha de faltas pesa 0.55 de la importancia total del modelo. 
Entrenado con mineria/entrenar_vista.py sobre mineria/real/vista_minable.csv 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Explica cómo se está entrenando el modelo, en cuatro pasos. Uno: se parte por fecha, no al azar: entrena con 344 filas antes del 13 de octubre y se prueba con las 200 posteriores. Dos: se ajusta un árbol de decisión CART con criterio Gini, profundidad 4 y mínimo de 15 filas por hoja, para que no memorice. Tres: cada fila cae en una hoja del árbol y recibe la probabilidad de falta de esa hoja. Cuatro: se evalúa con AUC en la prueba y con el recall al marcar el 25 % de las sesiones de más riesgo. La razón de usar un árbol es que se lee: lo que aprendió es sencillo. Si el alumno no traía faltas seguidas, el riesgo va de 3 % a 25 %; si venía de una falta o más, sube de 19 % a 58 %, y llega a 58 % de martes a jueves. La racha de faltas explica 0.55 de la importancia del modelo.

---

## Diapositiva 12 · `comprobacion`

Comprobación 

### Dos programas, el mismo resultado 
 | Herramienta  | AUC prueba  | Recall al 25 %  | Lift 
 | Árbol propio, Python estándar  | 0.643  | 0.542  | 2.17× 
 | scikit-learn 1.6.1, DecisionTreeClassifier  | 0.643  | 0.542  | 2.17× 
 | Validación por alumno y fecha, 5 pliegues  | 0.620  | —  | — 

**Cómo repetirlo **
Un solo comando; si scikit-learn está instalado, hace también el contraste. 
python3 mineria/entrenar_vista.py 

**Lo que corrigió la revisión **
Antes daba 0.779, inflado por alumnos que nunca asistieron. Sin ellos, el árbol supera a la tasa previa sola (0.613). La cifra más realista es 0.620. 
Mismos parámetros, misma partición por fecha: 344 filas de entrenamiento y 200 de prueba 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Esto responde a cómo se sabe que el resultado es real. El árbol se escribió dos veces: una con Python estándar, sin librerías, y otra con scikit-learn, la biblioteca que usa casi cualquier herramienta de minería. Con los mismos parámetros y la misma partición por fecha dan exactamente lo mismo: AUC de 0.643 en la prueba, recall de 0.542 al marcar exactamente el 25 % de las sesiones y lift de 2.17. Cualquiera lo puede repetir con un comando. La tercera fila es la más exigente: validación por alumno y por fecha, que impide que el mismo alumno o la misma sesión estén en entrenamiento y en prueba; ahí el AUC medio es 0.620, con un rango de 0.385 a 0.811 entre pliegues: con pocos alumnos el resultado varía mucho, y es la cifra más realista. Cuenta la corrección: una revisión del código encontró alumnos que nunca asistieron; sus filas eran aciertos fáciles que subían el AUC a 0.779. Sin ellos baja, pero el árbol sí supera a la tasa de asistencia previa sola, que da 0.613.

---

## Diapositiva 13 · `resultado`

Resultado · Vista minable 

### Lo que quedó después de las cuatro etapas 
544 
filas 
147 
alumnos 
18 
fechas de sesión 
14.3 % 
de las filas son falta 
 | Etapa  | Qué quedó 
 | 1 · Limpieza  | 208 alumnos y 31 marcas de calendario fuera; nada se rellenó 
 | 2 · Integración  | 3 tablas de la base en una tabla alumno × sesión, con seudónimos 
 | 3 · Selección  | 8 atributos y 1 etiqueta; 3 alumnos con edad imposible excluidos 
 | 4 · Transformación  | 544 filas con ventana previa; partición por fecha, 344 y 200 
Del 26 de marzo al 12 de noviembre de 2026 · mineria/real/vista_minable.csv 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Recoge lo que contaron Andrea y Sergio en una sola lámina. La vista tiene 544 filas de 147 alumnos, repartidas en 18 fechas de sesión entre el 26 de marzo y el 12 de noviembre, extraídas directo de la base de la app. Detalle importante: el 14.3 % de las filas son faltas, así que no está balanceada y se evalúa con recall y no solo con exactitud. La tabla de abajo resume qué dejó cada etapa: la limpieza sacó 208 alumnos y 31 marcas de calendario sin rellenar nada; la integración unió tres tablas de la base; la selección describió los atributos y excluyó tres alumnos con edad imposible; la transformación calculó las 544 filas y partió por fecha. Todo se regenera con extraer_bd.py y vista_minable.py.

---

## Diapositiva 14 · `pendiente`

Siguiente paso 

### Qué falta antes de minar 

**Clase desbalanceada **
Solo 14.3 % de las filas son falta. Hay que medir con recall y probar un umbral, no solo con exactitud. 

**Un atributo débil **
461 de 544 filas caen en octubre, así que el mes casi no distingue. Se evaluará si se descarta. 

**Historial corto **
147 alumnos inscritos no tienen ninguna marca y 35 solo una: hace falta que más academias pasen lista. 

**Bajas sin historial **
Las 33 bajas no tienen asistencia registrada. La deserción necesitará su propia vista. 

**Siguiente: comparar modelos y priorizar el recall **
Regresión logística y bosque aleatorio frente al árbol; después, integrar pagos y bajas, que ya se extraen de la base. 
Andrea Lizbeth Torres Arana · Sergio Samhir Peña Galván · Christian Alejandro Ramos Pérez 
Minería de Datos · D02 2026 B 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez, con Andrea y Sergio al frente para las preguntas. Cierra con honestidad: la vista está lista, pero no es perfecta. Cuatro cosas quedan abiertas. Uno, la clase está desbalanceada: solo 14.3 % son faltas, así que la métrica clave será el recall, porque una falsa alarma cuesta una llamada y una falta no detectada cuesta más. Dos, el mes es un atributo débil, porque casi todo es octubre. Tres, hay historial corto: la hoja registra bloques de pocas sesiones, 147 alumnos no tienen ninguna marca y 35 solo una. Cuatro, las bajas no tienen asistencia, así que la deserción necesita su propia vista. El árbol de decisión ya está entrenado y comprobado; siguiente paso: compararlo con regresión logística y bosque aleatorio y priorizar el recall. Invita a Andrea a responder dudas de limpieza e integración, y a Sergio sobre atributos y transformación.
