---
tipo: indice
area: proyecto
estado: verificado
actualizado: 2026-10-27
fuentes:
  - scripts/vault/vault.py
tags:
  - indice
---

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
