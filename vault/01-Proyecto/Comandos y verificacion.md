---
tipo: nota
area: proyecto
estado: verificado
actualizado: 2026-10-27
fuentes:
  - AGENTS.md
  - web/package.json
  - backend/package.json
  - landing/package.json
  - scripts/vault/vault.py
tags:
  - proyecto
---

# Comandos y verificacion

## Panel web (`web/`)

```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm run build      # next build; incluye typecheck
npm run start      # sirve el build en 5173
npm run test:e2e   # Playwright con backend mockeado; levanta dev solo
```

| Tarea | Comando |
|---|---|
| Un solo test | `npx playwright test e2e/fase2.spec.ts -g "nombre"` |
| Smoke contra producción | `ALLOW_PROD_SMOKE=yes npm run test:smoke` ⚠️ crea academias reales |
| Video de e2e | `npm run e2e:video` |

## API (`backend/`)

```bash
cd backend
npm install
npm run dev          # ts-node api/index.ts, puerto 3000
npm test             # jest, todo api/__tests__
npm run build        # tsc → dist/
npm run routes:dump  # regenera api-contract.json
```

| Tarea | Comando |
|---|---|
| Un solo archivo | `npx jest api/__tests__/auth.test.ts` |
| Un solo test | `npx jest api/__tests__/auth.test.ts -t "nombre"` |

- Los tests mockean `supabaseAdmin`: no necesitan Supabase real.
- Tras cambiar rutas o roles: **`npm run routes:dump` es obligatorio**. `contract.test.ts` compara el JSON commiteado contra el router real.
- Tras cambiar `api/**`: **`npm run build` y commitear `dist/`** junto con la fuente.

## Landing (`landing/`)

```bash
cd landing
npm install
npm run dev        # http://localhost:4321
npm run build
npm run preview
npm run capturas   # regenera public/capturas/*.png y og.png
npm run demo       # regraba public/demo/recorrido.mp4 (ffmpeg)
```

## Bóveda (`vault/`)

```bash
python3 scripts/vault/vault.py generar
python3 scripts/vault/vault.py verificar
python3 scripts/vault/vault.py brief      # mapa de inicio; lo usan los hooks
```

Claude Code corre `brief` al abrir sesión y `generar` + `verificar` al cerrarla
(hooks en `~/.claude/hooks/futcademic-vault-*.sh`); el log queda en
`~/.claude/futcademic-vault-end.log`. Los comandos siguen sirviendo a mano.

## Qué verificar según el cambio

| Cambio | Verificación mínima |
|---|---|
| Ruta, controlador o rol | `npm test` · `npm run routes:dump` · `npm run build` · regenerar bóveda |
| Solo lógica interna del backend | `npm test` · `npm run build` |
| Pantalla, hook o componente web | `npm run build`; si es flujo de usuario, `npm run test:e2e` |
| Esquema o migración | Aplicar SQL · probar endpoint afectado · regenerar bóveda · actualizar docs EN/ES |
| Landing | `npm run build` |
| Texto de esta bóveda | `python3 scripts/vault/vault.py verificar` |
| Cualquier cambio de código | entrada en [[Bitacora de sesiones]] |

## Puertos

| Servicio | Puerto |
|---|---|
| Panel Next | 5173 |
| API Express | 3000 (o `PORT`) |
| Landing Astro | 4321 |

No hay task runner raíz, workspaces ni CI: cada verificación se corre a mano.
