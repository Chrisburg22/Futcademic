# Presentación: Pasos 1 al 4 KDD

11 diapositivas. Enfocada solo en las etapas 1 a 4 de KDD: en cada paso se muestra el archivo que entra, el que sale y cómo cambia la información hasta la vista lista para minar.

---

## Diapositiva 1 · `cover`

Minería de Datos · Vista minable 

### Pasos 1 al 4 de KDD 
Cómo la hoja de asistencia de una academia se convierte, archivo por archivo, en datos listos para minar. 
Hoja .xlsx 
serratos_data.json 
…_filtrado.json 
vista_minable.csv 
Equipo 
Andrea Lizbeth Torres Arana 
Sergio Samhir Peña Galván 
Christian Alejandro Ramos Pérez 
Minería de Datos · D02 2026 B 
Futcademic 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Esta presentación se enfoca solo en las cuatro primeras etapas de KDD: limpieza, integración, selección y transformación. La idea es seguir a los datos: en cada paso se muestra el archivo que entra, el archivo que sale y cómo cambió la información, hasta llegar a vista_minable.csv, la tabla lista para minar. Reparto: Christian abre con el mapa de archivos y cierra con el resultado; Andrea presenta los pasos 1 y 2; Sergio presenta los pasos 3 y 4.

---

## Diapositiva 2 · `mapa`

El recorrido 

### Cinco archivos, cuatro pasos 
Hoja de asistencia .xlsx 
12 pestañas, letras A/F o colores 
Origen 
extract_serratos.py 
serratos_data.json 
Paso 1 · leer y clasificar 
filtro de nacimiento 
serratos_data_filtrado.json 
Paso 1 · limpiar 
vista_minable.py 
tabla alumno × sesión 
Pasos 1 y 2 · integrar 
vista_minable.py 
vista_minable_informe.json 
Paso 3 · perfilar 
vista_minable.py 
vista_minable.csv 
Paso 4 · transformar 
Los dos JSON llevan nombres de menores: no se publican. Solo el CSV final es anónimo. 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Este es el mapa de toda la presentación. La información parte de la hoja de cálculo de la academia, con doce pestañas, una por categoría. El script extract_serratos.py la lee y produce serratos_data.json, que es la hoja convertida a datos estructurados. Un filtro deja solo a los alumnos con fecha de nacimiento y produce serratos_data_filtrado.json. A partir de ahí, vista_minable.py hace el resto: integra las pestañas en una tabla alumno por sesión, perfila los atributos en un informe JSON y transforma todo en vista_minable.csv, la tabla final. Aclara la privacidad: los dos JSON intermedios tienen nombres y fechas de nacimiento de menores, por eso nunca se publican; el CSV final usa seudónimos. Pasa la palabra a Andrea.

---

## Diapositiva 3 · `origen`

Punto de partida 

### La hoja de asistencia, tal como llega 
Lista de asistencia serratos.xlsx · pestaña «20-21 A» 
Excel · 12 pestañas con datos 
 | N°  | Nombre  | Nacimiento  | 29  | 1  | 6  | 8  | 13  | …  | LIGA  | AGO  | SEP 
 | 1  | [alumno]  | 15/3/2020  | A  | A  | F  | A  | A  | …  | $  | $400  | $400 
 | 2  | [alumno]  | 10/nov/2020  | verde  | verde  | verde  | rojo  | verde  | …  |  | $450  | 
 | 3  | [alumno]  | 2020  | A  | L  | A  | A  | PP  | …  | $  | $400  | $400 
 | 4  | [alumno]  | (vacía)  | A  | F  | F  | A  | A  | …  |  |  | $400 

**Los días van sueltos **
29, 1, 6, 8… cruzan septiembre y octubre; el mes sale del encabezado. 

**Dos formas de marcar **
Unas pestañas usan A y F; otras solo pintan la celda de verde o rojo. 

**Fechas en cinco formatos **
15/3/2020, 10/nov/2020, 16/01/16, solo el año, o vacía. 
Ilustración de la estructura: nombres ocultos y filas de ejemplo 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Antes de limpiar hay que ver cómo llega el dato. Esta es la forma de una pestaña de la hoja; los nombres están ocultos y las filas son de ejemplo para mostrar la estructura. Cada fila es un alumno, con su fecha de nacimiento, una columna por día de entrenamiento y al final los pagos. Tres problemas saltan a la vista. Uno, los días van sueltos: 29, 1, 6, 8; cruzan dos meses y hay que deducir el mes del encabezado. Dos, no todas las pestañas marcan igual: unas usan las letras A y F y otras solo colorean la celda de verde o rojo. Tres, la fecha de nacimiento viene en cinco formatos distintos, y a veces vacía. También aparecen códigos como L de lesión o PP de partido de preparación, que no son ni asistencia ni falta.

---

## Diapositiva 4 · `p1-extraer`

Paso 1 · Limpieza · leer y clasificar 

### De celdas pintadas a datos estructurados 

**La letra manda **
Si la celda dice A o F, eso se usa. 

**Si no hay letra, manda el color **
Verde es asistió, rojo es faltó. 

**Lo demás se aparta **
L, C, LG, PP y colores sin significado: 95 celdas en «sin_clasificar». 
serratos_data.json 
salida de extract_serratos.py 
{ "hoja" : "20-21 A" , 
"mes_encabezado" : 10, 
"fechas" : [ "2026-09-29" , "2026-10-01" , …], 
"alumnos" : [ { 
"nombre" : "[oculto]" , 
"fecha_nac" : "2020-03-15" , 
"asistencias" : [ 
{ "fecha" : "2026-10-01" , "present" : true }, 
{ "fecha" : "2026-10-06" , "present" : false } ], 
"sin_clasificar" : {} } ] } 
352 alumnos y 791 marcas A/F leídas de 12 pestañas · fecha de ejemplo, nombre oculto 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. El primer archivo que produce el proceso es serratos_data.json. El script extract_serratos.py recorre las doce pestañas y aplica una regla simple para cada celda de asistencia: si tiene letra, la letra manda; si está vacía, manda el color de relleno, verde para asistió y rojo para faltó. Todo lo que no es ni asistencia ni falta, como L de lesión, C, LG, PP o un color sin significado, se aparta en un campo llamado sin_clasificar: son 95 celdas. Además resuelve cada día suelto a una fecha completa usando el mes del encabezado, y convierte las fechas de nacimiento a un mismo formato. A la derecha se ve cómo queda un alumno: su pestaña, sus fechas de sesión y una lista de marcas con fecha y presente verdadero o falso. En total salen 352 alumnos y 791 marcas A o F.

---

## Diapositiva 5 · `p1-filtrar`

Paso 1 · Limpieza · qué se filtra y en qué archivo 

### De 352 alumnos a 146 con historial útil 
 | Filtro  | Alumnos  | Quedan  | Dónde ocurre 
 | Sin fecha de nacimiento  | −79  | 273  | serratos_data_filtrado.json 
 | Edad imposible (−795, 121, 24)  | −5  | 268  | vista_minable.py 
 | Repetido entre pestañas: se une  | −6  | 262  | vista_minable.py 
 | Nunca asistió (solo faltas)  | −18  | 244  | vista_minable.py 
 | Una sola marca o ninguna  | −98  | 146  | vista_minable.py 
791 → 715 
marcas A/F: fuera 23 con fecha futura y las de alumnos excluidos 

**Regla: lo dudoso se excluye, no se inventa **
Ningún dato faltante se rellenó con promedios ni supuestos. 
Los conteos salen de vista_minable_informe.json, que el script escribe en cada corrida 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Aquí se ve qué se quita y en qué archivo pasa. El primer filtro ocurre al crear serratos_data_filtrado.json: 79 alumnos no tienen fecha de nacimiento y sin ella no hay edad, así que salen; quedan 273. Lo demás lo hace vista_minable.py. Cinco alumnos tienen fechas imposibles que darían edades de menos 795, 121 y 24 años; salen. Seis aparecen en dos pestañas: no se pierden, se unen en un solo alumno con las marcas de ambas, por eso el conteo baja a 262. Dieciocho alumnos solo tienen faltas, nunca asistieron: ya no están activos y sus filas serían aciertos fáciles que inflarían el modelo; salen y quedan 244. Por último, 98 tienen una sola marca o ninguna, y con una sola marca no se puede construir una fila, porque cada fila necesita una sesión anterior. Quedan 146 alumnos. De las 791 marcas, quedan 715: se quitan 23 con fecha futura y las de los alumnos excluidos. La regla de todo el paso: lo dudoso se excluye, nunca se rellena.

---

## Diapositiva 6 · `p2-integrar`

Paso 2 · Integración 

### Doce pestañas, una sola tabla alumno × sesión 
TM 
20-21 A 
20-21 B 
18-19 A 
18-19 B 
16-17 
14-15 A 
14-15 B 
12-13 A 
12-13 B 
PORTEROS 
FEMENIL 14-15 
Alumno en dos pestañas 
llave: nombre + nacimiento 
pestaña A → 2026-03-26 A · 2026-04-02 A 
pestaña B → 2026-09-30 A · 2026-10-05 F 
unión → 4 marcas, ordenadas por fecha 
misma fecha en ambas: se queda la primera 
tabla alumno × sesión 
en memoria 
alumno fecha presente 
A132 2026-10-06 sí 
A132 2026-10-08 no 
A132 2026-10-13 sí 
A132 2026-10-15 sí 

**Fechas completas **
Cada día suelto se resuelve con el mes del encabezado. 

**Seudónimo **
El nombre se cambia por A001, A002… antes de escribir nada. 

**Aún fuera **
Pagos (fecha estimada) y tutor (la hoja no lo trae). 
Ejemplo de unión ilustrativo · tabla de A132 con sus marcas reales 
Andrea 

> **Notas del presentador:** Presenta: Andrea Lizbeth Torres Arana. Integrar aquí no es juntar bases distintas, es juntar doce pestañas que se parecen pero no son iguales. La llave para reconocer a un alumno es su nombre más su fecha de nacimiento. Si un alumno aparece en dos pestañas, por ejemplo porque cambió de grupo, sus marcas se unen y se ordenan por fecha; si las dos pestañas marcan el mismo día, se queda la primera. El ejemplo de la izquierda es ilustrativo. El resultado, a la derecha, es una tabla con una fila por alumno y sesión: quién, qué día y si estuvo presente; ese es el caso real del alumno A132. Antes de escribir cualquier archivo, el nombre se reemplaza por un seudónimo. Queda pendiente integrar los pagos, que tienen fecha estimada, y el tutor, que la hoja no trae. Pasa la palabra a Sergio.

---

## Diapositiva 7 · `p3-atributos`

Paso 3 · Selección · atributos 

### Ocho atributos y una etiqueta 
 | Atributo  | Tipo  | Qué mide  | Valores observados 
 | edad  | Entero  | Años cumplidos en 2026  | 5 a 15 · mediana 10 
 | n_previas  | Entero  | Sesiones anteriores  | 1 a 9 · mediana 3 
 | tasa_previa  | Decimal 0–1  | Asistencias ÷ previas  | 0 a 1 · mediana 1 
 | tasa_ultimas3  | Decimal 0–1  | Lo mismo, últimas 3  | 0 · 0.33 · 0.5 · 0.67 · 1 
 | racha_faltas  | Entero  | Faltas seguidas justo antes  | 0 a 4 · mediana 0 
 | dias_desde_ultima  | Entero  | Días desde la marca anterior  | 2 a 14, y 166 
 | mes  | Categórico  | Mes de la sesión  | 3 · 4 · 9 · 10 
 | dia_semana  | Categórico  | 0 lunes … 3 jueves  | 0 a 3 
 | falta_siguiente  | Binario · etiqueta  | 1 faltó · 0 asistió  | 0: 471 · 1: 77 
Fuera de la vista como atributo: el seudónimo y la fecha, que solo ordenan y parten los datos 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Esta es la tabla que pide la actividad: cada atributo con su tipo, lo que mide y los valores que realmente aparecen en los datos. Los cuatro primeros describen al alumno y su historial: edad, cuántas sesiones lleva y qué proporción asistió, en total y en las últimas tres. Racha de faltas y días desde la última marca dicen qué tan reciente es la ausencia. Mes y día de la semana dicen cuándo es la sesión. La última fila es la etiqueta, lo que se quiere predecir: 1 si faltó y 0 si asistió; hay 77 faltas y 471 asistencias, un desbalance a tener en cuenta. Dos observaciones: solo hay sesiones de lunes a jueves, porque son los días de entrenamiento, y el valor 166 en días aparece porque un alumno volvió meses después, en otra pestaña. El seudónimo y la fecha no son atributos: sirven para ordenar y para partir los datos.

---

## Diapositiva 8 · `p3-atipicos`

Paso 3 · Selección · perfil y atípicos 

### El informe perfila cada atributo 
vista_minable_informe.json 
perfil · racha_faltas 
{ "min" : 0, "max" : 4, 
"media" : 0.161, 
"mediana" : 0, 
"q1" : 0, "q3" : 0, 
"atipicos_iqr" : 66 , 
"distintos" : 5, 
"valores" : [0, 1, 2, 3, 4] } 
 | Atributo  | Atípicos  | Qué son 
 | tasa_previa  | 123  | Menos de la mitad de asistencia 
 | tasa_ultimas3  | 111  | Faltas recientes 
 | mes  | 86  | Marzo, abril y septiembre 
 | racha_faltas  | 66  | Rachas de 1 a 4 faltas 
 | dias_desde_ultima  | 7  | Pausas de 12 a 166 días 
Criterio: fuera de 1.5 × el rango intercuartil 

**El único error: edad −795 **
Al perfilar la edad aparecieron −795 y 24 años: fechas imposibles. Se excluyeron. 

**Los demás se conservan **
Una racha de faltas no es un error de captura: es lo que se quiere predecir. 
El informe se regenera con cada corrida de vista_minable.py 
Sergio 

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Para describir los atributos no se hizo a mano: vista_minable.py escribe un informe JSON con el perfil de cada uno, mínimo, máximo, media, mediana, cuartiles y cuántos valores caen fuera de 1.5 veces el rango intercuartil. A la izquierda está el perfil real de racha de faltas. A la derecha, los atributos con atípicos. Hay que separar dos cosas. El error: al perfilar la edad en la primera versión aparecieron edades de menos 795 y 24 años, que venían de fechas de nacimiento imposibles; se excluyeron. Los atípicos estadísticos, en cambio, no son errores: tasas bajas y rachas de faltas son justamente los alumnos que faltan; el mes marca marzo, abril y septiembre porque casi todo es octubre; y las pausas largas son alumnos que volvieron después de un tiempo. Se conservan, porque quitarlos borraría la señal que se quiere predecir.

---

## Diapositiva 9 · `p4-ventana`

Paso 4 · Transformación 

### Cinco marcas de A132 se vuelven cuatro filas 
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

> **Notas del presentador:** Presenta: Sergio Samhir Peña Galván. Este es el corazón de la transformación; léelo despacio. El alumno A132 tiene cinco marcas en octubre. La primera, el 6, solo sirve de historia: no hay nada antes, así que no genera fila. La del 8 sí: antes tenía una sesión y la había asistido, por eso su tasa previa es 1.00 y su racha 0; ese día faltó, así que la etiqueta vale 1. La del 13: antes tenía dos sesiones y una falta, tasa 0.50, y viene de una falta, racha 1; ese día asistió, etiqueta 0. Así se recorre toda la secuencia. La regla es que cada fila mira solo hacia atrás: nunca usa lo que pasó después, porque al predecir no se conoce el futuro. No se normalizaron los valores: el árbol de decisión no lo necesita. Estas son filas reales del CSV final.

---

## Diapositiva 10 · `p4-codigo`

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

## Diapositiva 11 · `resultado`

Resultado 

### vista_minable.csv: lista para minar 
mineria/real/vista_minable.csv 
548 filas · 11 columnas · anónima 
alumno, fecha, edad, n_previas, tasa_previa, tasa_ultimas3, racha_faltas, dias_desde_ultima, mes, dia_semana, falta_siguiente 
A001,2026-09-30,11,1,1.0,1.0,0,2,9,2,0 
A001,2026-10-05,11,2,1.0,1.0,0,5,10,0,0 
A001,2026-10-19,11,3,1.0,1.0,0,14,10,0,0 
A132,2026-10-08,10,1,1.0,1.0,0,2,10,3, 1 
A132,2026-10-13,10,2,0.5,0.5,1,5,10,1,0 
548 
filas 
146 
alumnos 
17 
fechas de sesión 
14.1 % 
filas que son falta 
python3 mineria/vista_minable.py 
regenera el CSV y el informe desde la hoja; si cambia la hoja, cambia la vista. 
Del 26 de marzo al 22 de octubre de 2026 · siguiente etapa: minería 
Christian 

> **Notas del presentador:** Presenta: Christian Alejandro Ramos Pérez. Este es el punto de llegada de las cuatro etapas: vista_minable.csv. Es una tabla plana, anónima, con una fila por alumno y sesión y once columnas: el seudónimo, la fecha, los ocho atributos y la etiqueta. Se ven filas reales: el alumno A001 y, abajo, el A132 que seguimos en la transformación, con su falta del 8 de octubre marcada con 1. En números: 548 filas de 146 alumnos, en 17 fechas de sesión, y el 14.1 % de las filas son falta, por lo que la clase está desbalanceada. Todo se regenera con un comando: si la academia actualiza la hoja, se vuelve a correr y la vista cambia sola. Con esto los datos quedan listos para la siguiente etapa de KDD, la minería.
