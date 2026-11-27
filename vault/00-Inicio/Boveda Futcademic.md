---
tipo: manual
actualizado: 2026-10-27
tags:
  - inicio
  - agentes
---

# Bóveda Futcademic

Mapa compacto del proyecto para encontrar código sin recorrer todo el repo.
**Lee esta nota al inicio de cada conversación** y después solo la nota del área
que vas a tocar. Si eres un agente, sigue [[Protocolo de busqueda]].

## Mapa

| Si necesitas… | Lee |
| --- | --- |
| Cómo se conectan landing, web, API y Supabase | [[Arquitectura]] |
| Ubicar una carpeta o saber qué repo la contiene | [[Mapa del repositorio]] |
| Saber qué comando corre cada cosa | [[Comandos y verificacion]] |
| Ver o cambiar variables de entorno | [[Entornos y variables]] |
| Desplegar un cambio | [[Despliegue]] |
| Endpoints, roles y permisos del backend | [[API - rutas]] · [[Mapa backend]] |
| Autenticación, tenant y autorización | [[Middlewares y autenticacion]] · [[Auth y usuarios]] |
| Subir fotos, avatares, logo o escudo | [[Fotos e imagenes\|Fotos e imágenes]] |
| Alumnos, asistencias, pagos, eventos o categorías | [[Alumnos y acceso]] · [[Asistencias]] · [[Pagos]] · [[Eventos y entrenamientos]] · [[Categorias y equipo]] |
| Rutas, roles y pantallas web | [[Rutas web]] · [[Pantallas]] · [[Mapa web]] |
| Qué hook de TanStack llama a qué endpoint | [[Hooks y endpoints]] |
| Convenciones al escribir web | [[Convenciones web]] |
| Módulo de categorías | [[Modulo Categorias\|Módulo Categorías]] |
| Módulo de alumnos (listado y ficha) | [[Modulo Alumnos\|Módulo Alumnos]] |
| Módulo de asistencias (pase de lista e histórico) | [[Modulo Asistencias\|Módulo Asistencias]] |
| Chat IA: SSE, herramientas y contexto de pantalla | [[Chat IA]] · [[Chat IA - backend]] |
| Tablas, columnas y migraciones | [[Tablas]] · [[Base de datos]] · [[Migraciones]] · [[Relaciones]] |
| Diferencias entre el SQL y lo que escribe el código | [[Deriva conocida]] |
| Roles, permisos y aislamiento entre academias | [[Roles y permisos]] · [[Multi-tenant]] |
| Un término del dominio | [[Glosario]] |
| Un flujo completo (alta, pase de lista, cobro) | [[Flujos clave]] |
| Agregar un endpoint o una pantalla | [[Agregar un endpoint]] · [[Agregar una pantalla]] |
| Cambiar el esquema | [[Cambiar la base de datos]] |
| Verificar un cambio antes de cerrarlo | [[Verificar cambios]] |
| Actualizar esta bóveda | [[Actualizar la boveda]] |
| Producto, sitio público y dataset sintético | [[Producto]] · [[Landing]] · [[Datos y mineria]] |
| Qué se decidió en cada conversación | [[Bitacora de sesiones]] · [[Bitacora]] |
| Convenciones de la bóveda | [[Convenciones de la boveda]] |
| Todas las notas | [[Indice completo]] |

## Regla de oro

1. Empieza por la nota del área: te da los archivos exactos.
2. Abre solo esos archivos; no greppees todo el repo.
3. Si el código contradice la nota, gana el código: corrige la nota en el mismo
   cambio.
4. Al terminar: `python3 scripts/vault/vault.py generar`, después `verificar` y
   una entrada en [[Bitacora de sesiones]].

Las notas con `tipo: generado` se reconstruyen desde el código; no se editan a
mano.
