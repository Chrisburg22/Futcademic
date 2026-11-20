# Bóveda Futcademic

Documentación navegable del proyecto en formato Obsidian. Responde "¿dónde está…?" leyendo una nota corta en vez de recorrer el repositorio completo.

## Abrirla

1. Obsidian → **Open folder as vault** → elige esta carpeta (`vault/`).
2. O desde la raíz del repo:

```bash
open "obsidian://open?path=$(python3 -c 'import pathlib, urllib.parse; print(urllib.parse.quote(str(pathlib.Path("vault").resolve())))')"
```

3. Empieza en [`00-Inicio/Boveda Futcademic.md`](00-Inicio/Boveda%20Futcademic.md).

## Cómo está organizada

| Carpeta | Contenido |
|---|---|
| `00-Inicio/` | Portada, índice y convenciones |
| `01-Proyecto/` | Repositorio, arquitectura, comandos, entornos, despliegue |
| `02-Backend/` | Express, middlewares, rutas, dominios y chat IA |
| `03-Web/` | Next.js, rutas, pantallas, hooks y convenciones |
| `04-Datos/` | Esquema, tablas, migraciones y deriva conocida |
| `05-Dominio/` | Glosario, roles, multi-tenant y flujos |
| `06-Recetas/` | Procedimientos paso a paso |
| `07-Producto/` | Producto, landing y minería de datos |
| `08-Agentes/` | Protocolo de búsqueda y bitácora |

## Notas generadas

Cinco notas se construyen desde el código y **no se editan a mano**:

- `02-Backend/API - rutas.md` ← `backend/api-contract.json`
- `04-Datos/Tablas.md` ← `schema.sql` + `migrations/*.sql`
- `03-Web/Rutas web.md` ← `web/app/**/page.tsx`
- `03-Web/Hooks y endpoints.md` ← `web/src/hooks/*.ts`
- `00-Inicio/Indice completo.md` ← el resto de la bóveda

Para regenerarlas:

```bash
python3 scripts/vault/vault.py generar
```

Para revisar enlaces rotos, fuentes inexistentes, notas generadas obsoletas y notas más viejas que el código que citan:

```bash
python3 scripts/vault/vault.py verificar
```

## Regla de oro

La bóveda dice **dónde** y **qué**; el código dice **cómo**. Si una nota contradice al código, gana el código y hay que corregir la nota en el mismo cambio.
