# Presentación: Pasos 1 al 4 KDD

12 diapositivas. Enfocada solo en las etapas 1 a 4 de KDD: en cada paso, el archivo que entra, el que sale y cómo cambia la información, desde la base de producción hasta la vista lista para minar.

---

## Diapositiva 1 · `cover`

Minería de Datos · Vista minable 

### Pasos 1 al 4 de KDD 
Cómo los pases de lista guardados en la base de Futcademic se convierten, archivo por archivo, en datos listos para minar. 
Base Supabase 
extraccion_bd.json 
vista_minable_informe.json 
vista_minable.csv 
Equipo 
Andrea Lizbeth Torres Arana 
Sergio Samhir Peña Galván 
Christian Alejandro Ramos Pérez 
Minería de Datos · D02 2026 B 
Futcademic 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Esta presentación se enfoca solo en las cuatro primeras etapas de KDD: limpieza, integración, selección y transformación. La idea es seguir a los datos: en cada paso se muestra el archivo que entra, el archivo que sale y cómo cambió la información, hasta llegar a vista_minable.csv, la tabla lista para minar. Los datos salen directo de la base de producción, así que la vista se actualiza cada vez que la academia pasa lista. Reparto: Christian abre con el mapa de archivos y cierra con el resultado; Andrea presenta los pasos 1 y 2; Sergio presenta los pasos 3 y 4.

---

## Diapositiva 2 · `mapa`

El recorrido 

### Una base, dos scripts, tres archivos 
Base de producción 
Supabase: lo que la app guarda al pasar lista 
Origen 
extraer_bd.py 
extraccion_bd.json 
Paso 1 · extraer 
vista_minable.py 
marcas limpias 
Paso 1 · limpiar 
vista_minable.py 
tabla alumno × sesión 
Paso 2 · integrar 
vista_minable.py 
vista_minable_informe.json 
Paso 3 · perfilar 
vista_minable.py 
vista_minable.csv 
Paso 4 · transformar 
extraccion_bd.json lleva identificadores y fechas de nacimiento: no se publica. El CSV final es anónimo. 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Este es el mapa de toda la presentación. La información ya no parte de una hoja de cálculo: parte de la base de producción de Futcademic, donde la app guarda cada pase de lista. Un primer script, extraer_bd.py, lee de la base solo las columnas necesarias y produce extraccion_bd.json. A partir de ahí, vista_minable.py hace el resto: limpia las marcas, las integra en una tabla alumno por sesión, perfila los atributos en un informe JSON y transforma todo en vista_minable.csv, la tabla final. La ventaja de partir de la base es que la vista se actualiza sola: basta volver a correr los dos scripts después de cada semana de entrenamientos. Aclara la privacidad: el archivo extraído tiene identificadores y fechas de nacimiento, por eso no se publica; el CSV final usa seudónimos. Pasa la palabra a Andrea.

---

## Diapositiva 3 · `archivos`

Inventario 

### Todos los datos del proyecto, en tres listas 
Base Supabase 
proyecto Futcademic 
attendances 809 
students 355 
schools 20 
deleted_students 33 
+ 24 tablas que 
no se leen 
Archivos .json 
2 
bd/extraccion_bd.json 
252 KB · privado 
4 tablas extraídas 

real/vista_minable_ 
informe.json 
8 KB · conteos y perfil 
Archivos .csv 
1 + 9 
real/vista_minable.csv 
544 filas · 11 col · anónimo 

dataset/ · Modelo B 
dataset_ml.csv 1,731 
attendances.csv 10,259 
+ 7 tablas sintéticas 

**Base **
La fuente: lo que guarda la app al pasar lista. 

**JSON **
El extraído es privado; el informe documenta las 4 etapas. 

**CSV **
La vista minable real, y aparte el conjunto simulado. 
Rutas dentro de mineria/ · extraído el 16 de noviembre de 2026 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Antes de recorrer los pasos, este es el inventario completo de datos. Primero, la base de Supabase, la fuente: de sus 28 tablas solo se leen cuatro, asistencias con 809 marcas, alumnos con 355, academias con 20 y bajas con 33. Segundo, los archivos JSON: extraccion_bd.json, de 252 kilobytes, es la copia de esas cuatro tablas y es privado porque lleva identificadores y fechas de nacimiento; vista_minable_informe.json, de 8 kilobytes, guarda los conteos de cada etapa y el perfil de cada atributo. Tercero, los CSV: vista_minable.csv es el resultado, 544 filas por 11 columnas y anónimo. Aparte, en la carpeta dataset hay nueve CSV del conjunto simulado que se usa para el modelo de deserción, Modelo B, que no es parte de esta vista.

---

## Diapositiva 4 · `origen`

Punto de partida 

### La base de producción: 4 tablas de las 28 
 | Tabla  | Filas  | Columnas que se leen  | Para qué 
 | attendances  | 809  | student_id, school_id, date, present, created_at  | Cada pase de lista 
 | students  | 355  | id, school_id, category_id, birth_date, status  | Edad y academia 
 | schools  | 20  | id, name  | De qué academia es cada marca 
 | deleted_students  | 33  | school_id, original_student_id  | Bajas, para el futuro modelo de deserción 

**Una sola academia domina **
Gallos San Rafael Serratos aporta 781 de las 809 marcas; Master Fut MR, 17. 

**Datos vivos **
Las marcas van del 19 de marzo al 12 de noviembre; la del 12 se pasó desde la app. 

**Lo que no se lee **
Nombre, CURP, teléfono, dirección y notas médicas nunca salen de la base. 
Conteos de la extracción del 16 de noviembre de 2026 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. El punto de partida ahora es la base de datos de la aplicación, en Supabase. Tiene 28 tablas, pero para esta vista solo hacen falta cuatro. La principal es attendances, con 809 marcas: cada vez que un entrenador pasa lista queda una fila con el alumno, la academia, la fecha y si estuvo presente. De students se toma la fecha de nacimiento para la edad y la academia. De schools, el nombre de la academia. Y de deleted_students, las bajas, que se guardan para un futuro modelo de deserción. Casi toda la asistencia es de Gallos San Rafael Serratos, 781 de 809 marcas. Los datos llegan hasta el 12 de noviembre, y esa última fecha ya se registró desde la app, no desde la hoja. Lo más importante: la extracción no lee nombres, CURP, teléfonos, direcciones ni notas médicas; son datos de menores y nunca salen de la base.

---

## Diapositiva 5 · `p1-extraer`

Paso 1 · Limpieza · extraer de la base 

### De la base a un archivo con solo lo necesario 

**Solo columnas útiles **
Cada tabla se pide con su lista de columnas; nada sensible viaja. 

**De mil en mil **
La API entrega páginas de 1,000 filas; el script las pide hasta terminar. 

**Sin claves en el código **
La conexión se lee de variables de entorno; nunca queda escrita. 
mineria/bd/extraccion_bd.json 
salida de extraer_bd.py 
{ "extraido_en" : "2026-11-16" , 
"attendances" : [ { 
"student_id" : "00dc…" , 
"school_id" : "cc9e…" , 
"date" : "2026-10-08" , 
"present" : false , 
"created_at" : "2026-10-22" }, … ], 
"students" : [ { 
"id" : "00dc…" , 
"birth_date" : "2016-03-15" , 
"status" : "activo" }, … ] } 
809 marcas y 355 alumnos extraídos · identificadores recortados y fecha de nacimiento de ejemplo 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. El primer archivo del proceso es extraccion_bd.json, y lo genera el script extraer_bd.py. Tres decisiones. Uno, solo se piden las columnas útiles de cada tabla, así que los datos sensibles nunca viajan. Dos, la API de la base entrega como máximo mil filas por petición, así que el script pide página por página hasta terminar. Tres, la dirección de la base y la clave de acceso se leen de variables de entorno: nunca quedan escritas en el código. A la derecha se ve la forma del archivo: una lista de marcas, cada una con el alumno, la academia, la fecha, si estuvo presente y cuándo se registró; y una lista de alumnos con su fecha de nacimiento y su estado. Los identificadores están recortados y la fecha de nacimiento es de ejemplo. En total se extrajeron 809 marcas y 355 alumnos.

---

## Diapositiva 6 · `p1-filtrar`

Paso 1 · Limpieza · qué se filtra 

### De 809 marcas a 726, de 355 alumnos a 147 
 | Marcas  | Quedan 
 | Extraídas de la base  | 809 
 | Registradas antes de ocurrir (−31)  | 778 
 | De alumnos con edad imposible (−1)  | 777 
 | De alumnos que nunca asistieron (−51)  | 726 
 | Alumnos  | Quedan 
 | En la base  | 355 
 | Edad imposible (−3)  | 352 
 | Sin ninguna marca (−147)  | 205 
 | Nunca asistió (−23)  | 182 
 | Una sola marca (−35)  | 147 

**El hallazgo de este paso **
31 marcas se guardaron días antes de su fecha: eran calendario, no asistencia. 

**Regla: lo dudoso se excluye, no se inventa **
Ningún dato faltante se rellenó con promedios ni supuestos. 
Conteos de vista_minable_informe.json, que el script escribe en cada corrida 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Aquí se ve qué se quita, en marcas y en alumnos. Marcas: se extrajeron 809. El hallazgo de este paso es que 31 se guardaron días antes de la fecha que dicen: por ejemplo, marcas del 27 y 29 de octubre registradas el 22. No pueden ser asistencia real, son calendario, así que salen; quedan 778. Una más pertenece a un alumno con edad imposible, y 51 a alumnos que nunca asistieron. Quedan 726. Alumnos: hay 355 en la base. Tres tienen fechas de nacimiento imposibles. 147 nunca tienen una marca: están inscritos, pero su academia todavía no pasa lista en la app o no tenían marcas en la hoja original. 23 solo tienen faltas, nunca asistieron: ya no están activos y sus filas serían aciertos fáciles que inflarían el modelo. Y 35 tienen una sola marca, que no alcanza para construir una fila. Quedan 147 alumnos. La regla de todo el paso: lo dudoso se excluye, nunca se rellena.

---

## Diapositiva 7 · `p2-integrar`

Paso 2 · Integración 

### Tres tablas unidas por sus llaves 
attendances 
809 
student_id 
school_id 
date · present 
students 
355 
id 
school_id 
birth_date → edad 
schools 
20 
id 
name 

alumno × sesión 
726 
A001 · 2026-10-06 · sí 
A001 · 2026-10-08 · no 
A001 · 2026-10-13 · sí 

**Una marca por día **
Si un alumno tiene dos marcas el mismo día, se queda la primera registrada. 

**Seudónimo **
El identificador se cambia por A001, A002… antes de escribir nada. 

**Aún fuera **
Pagos y bajas: se integrarán para los modelos de morosidad y deserción. 
En la base, las 12 pestañas de la hoja ya quedaron unidas al cargarla: un alumno, un id 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Integrar es juntar fuentes distintas en una sola tabla. Aquí son tres tablas de la base unidas por sus llaves. Cada marca de attendances trae el identificador del alumno, que apunta a students, de donde sale la fecha de nacimiento y con ella la edad. Y el identificador de la academia apunta a schools. El resultado es una tabla con una fila por alumno y sesión: quién, qué día y si estuvo presente; ahí se ve el caso real del alumno A001. Dos reglas: si un alumno tuviera dos marcas el mismo día, se queda la primera que se registró, y antes de escribir cualquier archivo el identificador se reemplaza por un seudónimo. Vale la pena mencionar que en la base ya no hay que unir pestañas: al cargar la hoja, cada alumno quedó con un solo identificador aunque apareciera en dos pestañas. Quedan pendientes los pagos y las bajas, que se integrarán para los modelos de morosidad y deserción. Pasa la palabra a Sergio.

---

## Diapositiva 8 · `p3-atributos`

Paso 3 · Selección · atributos 

### Ocho atributos y una etiqueta 
 | Atributo  | Tipo  | Qué mide  | Valores observados 
 | edad  | Entero  | Años cumplidos en 2026  | 5 a 15 · mediana 10 
 | n_previas  | Entero  | Sesiones anteriores  | 1 a 6 · mediana 3 
 | tasa_previa  | Decimal 0–1  | Asistencias ÷ previas  | 0 a 1 · mediana 1 
 | tasa_ultimas3  | Decimal 0–1  | Lo mismo, últimas 3  | 0 · 0.33 · 0.5 · 0.67 · 1 
 | racha_faltas  | Entero  | Faltas seguidas justo antes  | 0 a 5 · mediana 0 
 | dias_desde_ultima  | Entero  | Días desde la marca anterior  | 2 a 14, y 105 o 203 
 | mes  | Categórico  | Mes de la sesión  | 3 · 4 · 9 · 10 · 11 
 | dia_semana  | Categórico  | 0 lunes … 3 jueves  | 0 a 3 
 | falta_siguiente  | Binario · etiqueta  | 1 faltó · 0 asistió  | 0: 466 · 1: 78 
Fuera de la vista como atributo: el seudónimo y la fecha, que solo ordenan y parten los datos 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Esta es la tabla que pide la actividad: cada atributo con su tipo, lo que mide y los valores que realmente aparecen en los datos. Los cuatro primeros describen al alumno y su historial: edad, cuántas sesiones lleva y qué proporción asistió, en total y en las últimas tres. Racha de faltas y días desde la última marca dicen qué tan reciente es la ausencia. Mes y día de la semana dicen cuándo es la sesión. La última fila es la etiqueta, lo que se quiere predecir: 1 si faltó y 0 si asistió; hay 78 faltas y 466 asistencias, un desbalance a tener en cuenta. Dos observaciones: solo hay sesiones de lunes a jueves, porque son los días de entrenamiento, y los valores de 105 y 203 días aparecen porque un grupo entrenó en marzo y abril y volvió a pasar lista el 12 de noviembre. El seudónimo y la fecha no son atributos: sirven para ordenar y para partir los datos.

---

## Diapositiva 9 · `p3-atipicos`

Paso 3 · Selección · perfil y atípicos 

### El informe perfila cada atributo 
vista_minable_informe.json 
perfil · racha_faltas 
{ "min" : 0, "max" : 5, 
"media" : 0.173, 
"mediana" : 0, 
"q1" : 0, "q3" : 0, 
"atipicos_iqr" : 68 , 
"distintos" : 6, 
"valores" : [0, 1, 2, 3, 4, 5] } 
 | Atributo  | Atípicos  | Qué son 
 | tasa_previa  | 127  | Menos de la mitad de asistencia 
 | tasa_ultimas3  | 114  | Faltas recientes 
 | mes  | 83  | Todo lo que no es octubre 
 | racha_faltas  | 68  | Rachas de 1 a 5 faltas 
 | dias_desde_ultima  | 11  | Pausas de 12 a 203 días 
Criterio: fuera de 1.5 × el rango intercuartil 

**El único error: edad 0 **
3 alumnos nacidos «en 2026»: fechas de relleno al darlos de alta. Se excluyeron. 

**Los demás se conservan **
Una racha de faltas no es un error de captura: es lo que se quiere predecir. 
El informe se regenera con cada corrida de vista_minable.py 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Para describir los atributos no se hizo a mano: vista_minable.py escribe un informe JSON con el perfil de cada uno, mínimo, máximo, media, mediana, cuartiles y cuántos valores caen fuera de 1.5 veces el rango intercuartil. A la izquierda está el perfil real de racha de faltas. A la derecha, los atributos con atípicos. Hay que separar dos cosas. El error: al perfilar la edad aparecieron tres alumnos con edad 0, nacidos en 2026, que no pueden entrenar en una academia; son fechas de relleno que se pusieron al darlos de alta, y se excluyeron. Con la hoja de cálculo pasaba algo parecido: había edades de menos 795 y 24 años. Los atípicos estadísticos, en cambio, no son errores: tasas bajas y rachas de faltas son justamente los alumnos que faltan; el mes marca todo lo que no es octubre, porque casi todo es octubre; y las pausas largas son alumnos que volvieron después de un tiempo. Se conservan, porque quitarlos borraría la señal que se quiere predecir.

---

## Diapositiva 10 · `p4-ventana`

Paso 4 · Transformación 

### Cinco marcas de A001 se vuelven cuatro filas 
6 oct · A 
8 oct · F 
13 oct · A 
15 oct · A 
22 oct · A 
marcas de la tabla alumno × sesión 
 | fecha  | n_previas  | tasa_previa  | racha_faltas  | dias_desde  | falta_siguiente 
 | 2026-10-06  | —  | —  | —  | —  | solo historia 
 | 2026-10-08  | 1  | 1.00  | 0  | 2  | 1 
 | 2026-10-13  | 2  | 0.50  | 1  | 5  | 0 
 | 2026-10-15  | 3  | 0.67  | 0  | 2  | 0 
 | 2026-10-22  | 4  | 0.75  | 0  | 7  | 0 

**Ventana hacia atrás **
Cada fila usa solo las marcas anteriores a su fecha. 

**La etiqueta es el día mismo **
falta_siguiente vale 1 si en esa sesión faltó. 

**Sin normalizar **
El árbol de decisión no lo necesita. 
Filas reales de mineria/real/vista_minable.csv (alumno seudonimizado) 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Este es el corazón de la transformación; léelo despacio. El alumno A001 tiene cinco marcas en octubre. La primera, el 6, solo sirve de historia: no hay nada antes, así que no genera fila. La del 8 sí: antes tenía una sesión y la había asistido, por eso su tasa previa es 1.00 y su racha 0; ese día faltó, así que la etiqueta vale 1. La del 13: antes tenía dos sesiones y una falta, tasa 0.50, y viene de una falta, racha 1; ese día asistió, etiqueta 0. Así se recorre toda la secuencia. La regla es que cada fila mira solo hacia atrás: nunca usa lo que pasó después, porque al predecir no se conoce el futuro. No se normalizaron los valores: el árbol de decisión no lo necesita. Estas son filas reales del CSV final.

---

## Diapositiva 11 · `p4-codigo`

Paso 4 · Transformación · el código 

### Doce líneas que convierten marcas en filas 
mineria/vista_minable.py 
fragmento simplificado 
for i in range(1, len(marcas)): 
previas = marcas[:i] # solo lo anterior a la sesión i 
ult = previas[-3:] 
racha = faltas seguidas al final de previas 
filas.append({ 
"n_previas" : i, 
"tasa_previa" : presentes(previas) / i, 
"tasa_ultimas3" : presentes(ult) / len(ult), 
"racha_faltas" : racha, 
"dias_desde_ultima" : dias(marcas[i], previas[-1]), 
"falta_siguiente" : not marcas[i].present # etiqueta 
}) 

**marcas[:i] **
El corte que impide mirar el futuro. 

**range(1, …) **
La primera marca no genera fila. 

**marcas[i] **
Solo se usa para la etiqueta y la fecha. 
Código completo en mineria/vista_minable.py · se ejecuta con python3 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Esto es lo que hace el script en el paso que acabamos de ver, simplificado para leerlo en una lámina. El ciclo empieza en 1, no en 0, porque la primera marca no tiene historia y no genera fila. En cada vuelta, previas es la lista de marcas antes de la sesión i: ese corte, marcas hasta i sin incluirla, es lo que garantiza que no se mire el futuro. De previas salen todos los atributos: cuántas hay, qué proporción asistió, la proporción en las últimas tres, la racha de faltas al final y los días desde la última. La marca de la sesión i solo se usa para dos cosas: su fecha y la etiqueta, que vale 1 si faltó. Pasa la palabra a Christian para el resultado.

---

## Diapositiva 12 · `resultado`

Resultado 

### vista_minable.csv: lista para minar 
mineria/real/vista_minable.csv 
544 filas · 11 columnas · anónima 
alumno, fecha, edad, n_previas, tasa_previa, tasa_ultimas3, racha_faltas, dias_desde_ultima, mes, dia_semana, falta_siguiente 
A001,2026-10-08,10,1,1.0,1.0,0,2,10,3, 1 
A001,2026-10-13,10,2,0.5,0.5,1,5,10,1,0 
A001,2026-10-15,10,3,0.6667,0.6667,0,2,10,3,0 
A058,2026-11-12,10,6,1.0,1.0,0,203,11,3,0 
A077,2026-11-12,11,6,0.1667,0.0,5,203,11,3,0 
544 
filas 
147 
alumnos 
18 
fechas de sesión 
14.3 % 
filas que son falta 
extraer_bd.py + vista_minable.py 
regeneran todo desde la base: cada pase de lista nuevo entra en la vista. 
Del 26 de marzo al 12 de noviembre de 2026 · siguiente etapa: minería 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Este es el punto de llegada de las cuatro etapas: vista_minable.csv. Es una tabla plana, anónima, con una fila por alumno y sesión y once columnas: el seudónimo, la fecha, los ocho atributos y la etiqueta. Se ven filas reales: el alumno A001 que seguimos en la transformación, con su falta del 8 de octubre marcada con 1, y dos filas del 12 de noviembre, registradas desde la app. En números: 544 filas de 147 alumnos, en 18 fechas de sesión, y el 14.3 % de las filas son falta, por lo que la clase está desbalanceada. Todo se regenera con dos comandos: extraer de la base y construir la vista; cada pase de lista nuevo entra solo. Con esto los datos quedan listos para la siguiente etapa de KDD, la minería.
