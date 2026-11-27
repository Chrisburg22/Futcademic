---
tipo: receta
area: recetas
estado: verificado
actualizado: 2026-10-27
fuentes:
  - AGENTS.md
  - web/package.json
  - backend/package.json
  - landing/package.json
  - scripts/vault/vault.py
tags:
  - recetas
---

# Verificar cambios

## Comandos por pieza

| Pieza | Comando | Qué debe pasar |
|---|---|---|
| Backend | `cd backend && npm test` | 26 suites verdes, Supabase mockeado |
| Backend build | `cd backend && npm run build` | `dist/` actualizado |
| Contrato | `cd backend && npm run routes:dump` | `api-contract.json` sin diff inesperado |
| Web | `cd web && npm run build` | typecheck + build |
| Web e2e | `cd web && npm run test:e2e` | flujos mockeados |
| Landing | `cd landing && npm run build` | `dist/` |
| Bóveda | `python3 scripts/vault/vault.py verificar` | 0 errores |

## Según el cambio

| Cambio | Obligatorio |
|---|---|
| Nueva ruta / rol | `npm test`, `routes:dump`, `npm run build`, regenerar bóveda |
| Controlador sin ruta nueva | `npm test`, `npm run build` |
| Migración | aplicar SQL, probar endpoint, `schema.sql`, docs EN/ES, regenerar bóveda |
| Pantalla / hook | `npm run build`; e2e si es flujo |
| Solo texto de landing | `npm run build` |
| Solo notas | `python3 scripts/vault/vault.py verificar` |

## Señales de que algo está mal

| Señal | Probable causa |
|---|---|
| `contract.test.ts` falla | falta `routes:dump` o el router cambió sin actualizar el JSON |
| 403 en una ruta que la UI muestra | `ProtectedRoute` permite más que `requireRole` |
| Datos de otra academia | falta `school_id` o `findStudentForTenant` |
| Error de columna inexistente | deriva entre SQL y código: [[Deriva conocida]] |
| Build de Next falla por hidratación | chequeo de navegador en render |
| `verificar` marca nota obsoleta | corre `generar` o actualiza la nota y su fecha |

## Antes de decir "listo"

- [ ] El comando de la tabla pasó, no "debería pasar".
- [ ] `git status` incluye lo esperado (y `dist/` si tocaste backend).
- [ ] No hay secretos nuevos en archivos versionados.
- [ ] La bóveda quedó coherente: `python3 scripts/vault/vault.py verificar`.
- [ ] [[Bitacora de sesiones]] tiene la entrada del cambio (el hook `Stop` de Claude Code bloquea el cierre si falta).

## Lo que no se corre a la ligera

- `ALLOW_PROD_SMOKE=yes npm run test:smoke`: golpea producción y **crea academias reales**.
- Migraciones en producción sin backup/ventana.
- `npm run capturas` / `npm run demo` del landing: levantan `../web` con build + start en 5174 y necesitan que `web/` compile.
