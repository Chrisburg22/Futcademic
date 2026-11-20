---
tipo: receta
area: recetas
estado: verificado
actualizado: 2026-10-27
fuentes:
  - scripts/vault/vault.py
  - vault/00-Inicio/Convenciones de la boveda.md
tags:
  - recetas
  - agentes
---

# Actualizar la boveda

## Cuándo

| Cambio | Acción |
|---|---|
| Ruta, rol o controlador | `generar` + revisar [[Middlewares y autenticacion]] |
| Tabla, columna o migración | `generar` + [[Base de datos]] / [[Deriva conocida]] |
| Pantalla, ruta web o hook | `generar` + [[Pantallas]] |
| Arquitectura o flujo | editar la nota a mano + fecha |
| Descubres una contradicción | agregarla a [[Deriva conocida]] |

## Procedimiento

```bash
# 1. Regenerar lo que sale del código
python3 scripts/vault/vault.py generar

# 2. Revisar
python3 scripts/vault/vault.py verificar

# 3. (opcional) ver el mapa que leen los agentes al iniciar
python3 scripts/vault/vault.py brief
```

En Claude Code esto está automatizado: `SessionStart` inyecta `brief`,
`SessionEnd` corre `generar` + `verificar` y `Stop` bloquea el cierre si hubo
código nuevo sin entrada en [[Bitacora de sesiones]]. Los scripts viven en
`~/.claude/hooks/futcademic-vault-*.sh`.

`verificar` reporta:

- **Errores**: enlaces rotos, nombres duplicados, fuentes inexistentes. Se corrigen antes de commitear.
- **Avisos**: nota generada obsoleta (corre `generar`) o nota escrita a mano más vieja que su fuente.

## Corregir un aviso de nota obsoleta

1. Abre la nota y el archivo fuente que cita.
2. Actualiza el contenido.
3. Cambia `actualizado:` a la fecha de hoy **solo si verificaste**.
4. Si el tema cambió de fondo, parte la nota o crea una nueva y enlaza.

## Reglas

- No editar notas `tipo: generado`: el próximo `generar` las pisa.
- No borrar una nota sin quitar los enlaces que la apuntan.
- No duplicar títulos: Obsidian resuelve por nombre.
- No meter secretos, tokens ni datos de menores.
- Cada cambio deja entrada en [[Bitacora de sesiones]] (una por conversación:
  objetivo, cambios, decisiones y pendientes). [[Bitacora]] es la tabla vieja de
  cambios de la bóveda; se conserva como histórico.

## Ver también

- [[Convenciones de la boveda]]
- [[Protocolo de busqueda]]
