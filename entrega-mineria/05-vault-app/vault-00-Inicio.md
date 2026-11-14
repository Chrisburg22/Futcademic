# Bóveda de la app Futcademic · 00-Inicio

Notas técnicas internas de la app (Obsidian). Los [[enlaces]] apuntan a otras notas de la bóveda.

---

## Nota: Boveda Futcademic

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

---

## Nota: Convenciones de la boveda

# Convenciones de la bóveda

Reglas para que la bóveda siga siendo barata de leer y difícil de romper.

## Nombres y enlaces

- **Archivos sin acentos** (`Boveda Futcademic.md`, no `Bóveda…`). Los títulos dentro de la nota sí llevan acentos. Evita que un sync o un sistema de archivos distinto rompa los `[[enlaces]]`.
- Un nombre de nota es **único en toda la bóveda**; Obsidian resuelve por nombre, no por ruta.
- Enlaces internos con `[[Nombre de la nota]]`. Para una sección: `[[Nota#Encabezado]]`.
- No enlaces a archivos de código con `[[...]]`: son rutas, no notas. Escríbelas como `` `backend/api/app.ts` ``.

## Frontmatter

Toda nota escrita a mano empieza así:

```yaml
---
tipo: nota
area: backend
estado: verificado
actualizado: 2026-10-26
fuentes:
  - backend/api/app.ts
tags:
  - backend
---
```

- `tipo`: `inicio`, `indice`, `nota`, `receta`, `bitacora`, `generado`. Las
  notas reescritas el 27-oct usan `manual` como valor único para todo lo que no
  es `generado`; el verificador acepta ambos esquemas y solo distingue
  `generado`. Al tocar una nota, conserva el esquema que ya tenga.
- `area`: `proyecto`, `backend`, `web`, `datos`, `dominio`, `recetas`, `producto`, `agentes`.
- `estado`: `verificado` (leído contra el código) o `borrador`.
- `fuentes`: rutas reales, relativas a la raíz del repo. `verificar` falla si no existen.
- `tags`: los mismos valores de `area`, más `indice` cuando aplica. El grafo colorea por tag.

## Tamaño y enfoque

- Una nota = una pregunta. Si pasa de ~150 líneas, pártela y enlaza.
- Primero la respuesta, después el detalle. Nada de introducciones largas.
- Las tablas son preferibles a párrafos para rutas, columnas y roles.
- Fecha `actualizado` solo cuando se **verificó** contra la fuente, no cuando se tocó el texto.

## Notas generadas

Llevan `tipo: generado`, `hash` y un comentario de cabecera. **No se editan a mano**: el siguiente `generar` las pisa. Si falta un dato, se cambia el generador (`scripts/vault/vault.py`) o la nota escrita a mano que lo explica.

## Al agregar una nota

1. Elige carpeta y nombre ASCII único.
2. Copia el frontmatter y rellena `fuentes`.
3. Enlázala desde [[Boveda Futcademic]] o desde la nota índice de su área.
4. Corre `python3 scripts/vault/vault.py verificar`.

## Al cambiar código

1. Actualiza la nota afectada y su fecha `actualizado`.
2. Si cambió una ruta, tabla, pantalla o hook: `python3 scripts/vault/vault.py generar`.
3. Anota el cambio en [[Bitacora de sesiones]].

---

## Nota: Indice completo

<!-- No editar a mano: python3 scripts/vault/vault.py generar -->

# Índice completo

46 notas. Ordenadas por carpeta; el nombre del enlace es el título visible.

## 00-Inicio

- [[Boveda Futcademic|Bóveda Futcademic]]
- [[Convenciones de la boveda|Convenciones de la bóveda]]

## 01-Proyecto

- [[Arquitectura]]
- [[Comandos y verificacion]]
- [[Despliegue]]
- [[Entornos y variables]]
- [[Mapa del repositorio]]

## 02-Backend

- [[Alumnos y acceso]]
- [[API - rutas]]
- [[Asistencias]]
- [[Auth y usuarios]]
- [[Categorias y equipo]]
- [[Chat IA - backend]]
- [[Eventos y entrenamientos]]
- [[Mapa backend]]
- [[Middlewares y autenticacion]]
- [[Pagos]]

## 03-Web

- [[Chat IA]]
- [[Convenciones web]]
- [[Hooks y endpoints]]
- [[Mapa web]]
- [[Modulo Alumnos|Módulo Alumnos]]
- [[Modulo Asistencias|Módulo Asistencias]]
- [[Modulo Categorias|Módulo Categorías]]
- [[Pantallas]]
- [[Rutas web]]

## 04-Datos

- [[Base de datos]]
- [[Deriva conocida]]
- [[Migraciones]]
- [[Relaciones]]
- [[Tablas]]

## 05-Dominio

- [[Flujos clave]]
- [[Glosario]]
- [[Multi-tenant]]
- [[Roles y permisos]]

## 06-Recetas

- [[Actualizar la boveda]]
- [[Agregar un endpoint]]
- [[Agregar una pantalla]]
- [[Cambiar la base de datos]]
- [[Verificar cambios]]

## 07-Producto

- [[Datos y mineria]]
- [[Landing]]
- [[Producto]]

## 08-Agentes

- [[Bitacora]]
- [[Bitacora de sesiones|Bitácora de sesiones]]
- [[Protocolo de busqueda|Protocolo de búsqueda]]
