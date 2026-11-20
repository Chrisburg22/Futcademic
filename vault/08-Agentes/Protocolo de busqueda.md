---
tipo: manual
actualizado: 2026-10-27
tags:
  - agentes
  - proceso
---

# Protocolo de búsqueda

Reglas para que un agente trabaje con la bóveda sin leer de más y sin dejarla
desactualizada. Aplica a OpenCode y a Claude Code.

## Al iniciar

1. Lee [[Boveda Futcademic|la nota de inicio]].
2. Identifica el área y lee **solo** esa nota.
3. Abre los archivos que la nota nombra. Si no alcanza, busca con `rg` acotado
   a la carpeta del área, no a todo el repo.

El hook de OpenCode inyecta la nota de inicio en cada sesión. En Claude Code,
el hook `SessionStart` imprime el mismo mapa. Si el hook no está activo, lee
`vault/00-Inicio/Boveda Futcademic.md` a mano.

## Al buscar

- **Rutas y pantallas**: [[Rutas web]] antes de mirar `web/app/`.
- **Llamadas a la API**: [[Hooks y endpoints]] antes de abrir los hooks.
- **Backend**: [[API - rutas]] y el controlador que nombre la tabla.
- **Base de datos**: [[Tablas]] y, si una columna no aparece, [[Deriva conocida]].
- **Chat**: [[Chat IA]], que separa web, backend y persistencia.
- **Categorías**: [[Modulo Categorias|Módulo Categorías]].

No leas notas generadas completas si solo necesitas una sección: usa sus
encabezados (`[[Tabla#students]]`, `[[API - rutas#payments]]`).

## Al cambiar código

- Si cambias rutas, esquema, pantallas o hooks, actualiza la nota manual del
  área en el mismo cambio.
- No edites notas con `tipo: generado`: se reconstruyen con
  `python3 scripts/vault/vault.py generar`.
- Si cambias rutas del backend, primero `cd backend && npm run routes:dump`;
  después regenera la bóveda.
- Añade `fuentes:` al frontmatter de una nota manual cuando dependa de archivos
  concretos; así `verificar` avisa si envejeció.
- Si una nota contradice al código, corrige la nota; no dejes la discrepancia.

## Al cerrar la conversación

1. `python3 scripts/vault/vault.py generar`
2. `python3 scripts/vault/vault.py verificar` (0 errores; revisa los avisos)
3. Añade una entrada al principio de [[Bitacora de sesiones]] con:
   - fecha y objetivo;
   - cambios y archivos principales;
   - decisiones que la siguiente sesión necesita conocer;
   - pendientes o riesgos.

El hook de cierre regenera las notas automáticamente, pero **la entrada de la
bitácora y las notas manuales son responsabilidad del agente**: el generador no
puede deducir decisiones.

## Qué no hacer

- No leer toda la bóveda ni todo el repo "por si acaso".
- No duplicar en una nota manual lo que ya genera `vault.py`.
- No editar `Indice completo.md` ni las demás notas generadas.
