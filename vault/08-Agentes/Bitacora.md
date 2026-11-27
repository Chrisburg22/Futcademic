---
tipo: bitacora
area: agentes
estado: verificado
actualizado: 2026-10-27
fuentes:
  - vault
  - scripts/vault/vault.py
tags:
  - agentes
---

# Bitacora

Registro append-only de cambios **de la bóveda**. La entrada más reciente
arriba. Lo que se decidió en cada conversación va en
[[Bitacora de sesiones]], que es la que revisa el hook `Stop`.

| Fecha | Cambio | Archivos |
|---|---|---|
| 2026-10-27 | `Pantallas` completada: inscripciones, expediente, inscripción pública por token, recuperación de contraseña y componentes nuevos; `Sidebar.tsx` añadido a sus fuentes | `vault/03-Web/Pantallas.md` |
| 2026-10-27 | Notas del 26-oct revisadas contra el código: 28 tablas y 8 migraciones, RLS de las tablas nuevas, inscripciones y rutas públicas por token, 26 suites, comando `brief` y los hooks | `vault/04-Datos/Base de datos.md`, `vault/05-Dominio/Roles y permisos.md`, `vault/01-Proyecto/`, `vault/06-Recetas/`, `vault/00-Inicio/Convenciones de la boveda.md` |
| 2026-10-27 | Fusión de las dos bóvedas en `vault/` (46 notas), `.obsidian` movido, `Chat IA` del backend renombrada y mapa de la portada ampliado | `vault/**` |
| 2026-10-26 | Revisión final: 34 tools del chat, borrado de evento para admin, cascadas no versionadas y búsquedas portables sin `rg` | `vault/02-Backend/`, `vault/04-Datos/Deriva conocida.md`, `vault/05-Dominio/`, `vault/08-Agentes/` |
| 2026-10-26 | Creación de la bóveda: portada, 5 notas generadas, arquitectura, backend, web, datos, dominio, recetas, producto y agentes | `vault/**`, `scripts/vault/vault.py` |
| 2026-10-26 | Generador y verificador: rutas de API, tablas + migraciones, rutas web, hooks, índice, enlaces y fuentes | `scripts/vault/vault.py` |
| 2026-10-26 | Deriva documentada: columnas fantasma, RLS no versionado, rachas, permisos de profesor y fechas fijas | `vault/04-Datos/Deriva conocida.md` |

## Cómo agregar una entrada

```markdown
| 2026-11-02 | Descripción corta | `ruta/afectada` |
```

- Una fila por cambio relevante, no por archivo tocado.
- Si se corrige una deriva, se anota aquí y se borra la fila de [[Deriva conocida]].
- No borrar filas antiguas.
