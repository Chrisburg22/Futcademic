# Futcademic · Proyecto final de Minería de Datos

> Resumen de una página. Léelo primero; los otros cuatro archivos de esta carpeta profundizan.

## Qué es

**Futcademic** es una aplicación web y móvil para administrar academias de futbol infantil y juvenil: inscribe alumnos, programa entrenamientos, pasa lista en la cancha, cobra mensualidades y avisa a los padres. Es **multi-inquilino**: muchas academias comparten la misma aplicación y la misma base de datos, pero cada una solo ve sus propios datos.

El **proyecto final de Minería de Datos** usa la base de datos real de esa aplicación como conjunto de datos, con dos objetivos: anticipar quién va a **faltar** y quién va a **abandonar** la academia.

## Los cuatro puntos que pedía la actividad

| # | Punto | Respuesta corta |
|---|---|---|
| 1 | Proceso en el que se utilizan los datos | La operación diaria de una academia: inscribir, programar sesiones, pasar lista, cobrar y dar de baja. |
| 2 | Cómo se obtienen los datos | Captura propia desde la app móvil y el panel web, validada por una API; más una carga de la hoja de cálculo de una academia. |
| 3 | Histórico y periodo de recolección | Asistencia del 19 de marzo al 22 de octubre de 2026 (≈ 7 meses): 353 alumnos, 33 bajas, 192 sesiones, 779 asistencias, 620 pagos. |
| 4 | Objetivos de aplicar minería | Predecir faltas, deserción y morosidad; segmentar alumnos; comparar academias. |

## Resultado principal

Se entrenaron **dos modelos separados**, y la diferencia importa:

| | **Modelo A · datos reales** | **Modelo B · datos simulados** |
|---|---|---|
| Pregunta | ¿Faltará a su siguiente sesión? | ¿Abandonará en los próximos 30 días? |
| Datos | Asistencia real de una academia | Conjunto sintético derivado del esquema real |
| Filas | 570 (154 alumnos) | 1,731 (230 alumnos) |
| AUC en prueba | **0.779** | 0.779 |
| Sobreajuste | **−0.004** | 0.099 |
| Detección | 7 de cada 10 faltas | 5.7 de cada 10 bajas |

Ambos dieron 0.779 **por coincidencia**; son modelos con etiquetas y datos distintos.

**Hallazgo del Modelo A:** una falta llama a otra. Sin racha de faltas la probabilidad de faltar ronda el 12 %; después de una falta sube a cerca del 54 %.

## Por qué hay un modelo simulado

La deserción es el objetivo más valioso, pero **no se puede entrenar con datos reales todavía**: las 33 bajas pertenecen a academias que casi no registran asistencia, y la academia con más asistencia no tiene ninguna baja. No existe un solo alumno con historial **y** baja conocida. Por eso el Modelo B usa datos simulados, y **está etiquetado como simulado en todos los archivos y diapositivas**. Dos de las academias de ese conjunto (*Gallos San Rafael* y *Master Fut MR Aguascalientes*) **no existen**; se añadieron solo para dar volumen y no deben presentarse como reales.

## Contenido de esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `01-RESUMEN-DEL-PROYECTO.md` | Este resumen. |
| `02-LA-APLICACION.md` | Qué hace la aplicación, para quién y con qué pantallas. |
| `03-ARQUITECTURA-TECNICA.md` | Cómo está construida: tecnologías, seguridad, despliegue. |
| `04-BASE-DE-DATOS.md` | Las 17 tablas, sus relaciones y las reglas de la base. |
| `05-PROYECTO-MINERIA-DE-DATOS.md` | El proyecto de minería completo: datos, calidad, modelos y cómo reproducirlo. |

## Privacidad

La base contiene datos de **menores de edad**. Nada de lo que se comparte incluye nombres, fechas de nacimiento, teléfonos, direcciones ni notas médicas. El conjunto publicado del modelo real usa identificadores seudonimizados (`A001`, `A002`…) y solo la edad en años.
