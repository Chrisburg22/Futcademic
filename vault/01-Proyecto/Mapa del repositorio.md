---
tipo: nota
area: proyecto
estado: verificado
actualizado: 2026-10-26
fuentes:
  - AGENTS.md
  - .gitignore
tags:
  - proyecto
---

# Mapa del repositorio

## Qué vive dónde

| Ruta | Qué es | Repo git |
|---|---|---|
| `web/` | Panel administrativo. Next.js 16 App Router + React 19 + Mantine + TanStack Query | raíz |
| `landing/` | Sitio público estático. Astro, sin JS de cliente propio | raíz |
| `backend/` | API REST. Express + TypeScript + Supabase | **independiente** (`futcademic-backend`) |
| `mobile/` | App Expo. **Fuera de alcance por ahora** | **independiente** (`futcademic-mobile`) |
| `docs/` | Producto, técnica, scrum, PDFs (pares EN/ES) | raíz |
| `migrations/` | SQL incremental fechado | raíz |
| `schema.sql` | Esquema base de referencia | raíz |
| `mineria/` | Dataset sintético del proyecto de minería | raíz |
| `compartir/` | Resúmenes del proyecto para exposición | raíz |
| `scripts/` | Importaciones one-off + `vault/vault.py` | raíz |
| `vault/` | Esta bóveda Obsidian | raíz |

`mobile/` y `backend/` están en `.gitignore` del repo raíz. `git status` desde la raíz **no muestra** sus cambios: se commitean desde dentro de cada carpeta.

## Árbol resumido

```text
Futcademic/
├── AGENTS.md                  instrucciones para agentes (fuente de verdad operativa)
├── schema.sql                 18 tablas base
├── migrations/                4 migraciones fechadas
├── docs/
│   ├── product/               PRD y definición (EN/ES)
│   ├── technical/             API y esquema (EN/ES)
│   ├── arquitectura/          entregables académicos
│   └── scrum/                 historias de usuario
├── web/
│   ├── app/                   rutas Next (page.tsx finos)
│   └── src/                   screens, hooks, api, contexts, components
├── landing/
│   └── src/consts.ts          todo el copy del sitio
├── backend/
│   ├── api/                   routes, controllers, services, middlewares
│   └── dist/                  build commiteado
├── mineria/                   generador + dataset + validación
├── compartir/                 resúmenes de exposición
├── scripts/vault/vault.py     genera y verifica esta bóveda
└── vault/                     notas
```

## No buscar aquí

| Ruta | Por qué |
|---|---|
| `**/node_modules/` | Dependencias; usa `package.json` |
| `backend/dist/` | Build; la fuente está en `backend/api/` |
| `web/.next/`, `web/playwright-report/`, `web/test-results/` | Artefactos |
| `.claude/worktrees/` | Copias de trabajo antiguas; no es el código vigente |
| `*.pen` | Diseños binarios, ignorados por git |
| `**/package-lock.json`, `pnpm-lock.yaml` | Ruido; hay dos lockfiles en `web/` (npm manda) |

## Regla de alcance

El foco actual es **`backend/` + `web/` + `landing/`**. `mobile/` no se toca ni se replica salvo petición explícita.

## Dónde seguir

- Piezas y flujo de una petición: [[Arquitectura]]
- Comandos por workspace: [[Comandos y verificacion]]
- Qué está desactualizado: [[Deriva conocida]]
