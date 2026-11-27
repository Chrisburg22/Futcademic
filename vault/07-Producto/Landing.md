---
tipo: nota
area: producto
estado: verificado
actualizado: 2026-10-26
fuentes:
  - landing/README.md
  - landing/AGENTS.md
  - landing/src/consts.ts
  - landing/src/pages/index.astro
  - landing/src/components/sections
  - docs/product/PRD-LANDING.md
  - AGENTS.md
tags:
  - producto
  - landing
---

# Landing

## Qué es

Sitio público **estático** en Astro. No consume Supabase ni la API, no tiene JavaScript de cliente propio y se despliega aparte del panel. Su único trabajo es llevar a `/register`.

## Dónde está el copy

**Todo** el texto vive en `landing/src/consts.ts`. Las secciones de `src/components/sections/` solo lo maquetan.

| Sección | Archivo |
|---|---|
| Hero | `Hero.astro` |
| Antes / dolor | `Antes.astro` |
| Módulos | `Modulos.astro` |
| Roles | `Roles.astro` |
| Demo | `Demo.astro` |
| Límites | `Limites.astro` |
| Prueba | `Prueba.astro` |
| FAQ | `Faq.astro` |
| CTA final | `CtaFinal.astro` |

## Regla de evidencia

Ninguna afirmación sin respaldo en una fila "Verificado" de `docs/product/DEFINICION-PRODUCTO.md` o en una pantalla real de `web/src/screens/`. El PRD lo exige y el README lo repite.

> [!warning] Ruta desactualizada en docs
> `landing/README.md` y `PRD-LANDING.md` dicen `web/src/pages/`. Esa carpeta no existe: las pantallas están en `web/src/screens/` y las rutas en `web/app/`. Ver [[Deriva conocida]].

## Comandos

```bash
cd landing
npm install
npm run dev        # http://localhost:4321
npm run build
npm run preview
npm run capturas   # PNGs + og.png
npm run demo       # MP4 del recorrido (ffmpeg)
```

`capturas` y `demo` levantan `../web` con `next build && next start` en el puerto **5174** (Supabase/API stub). Necesitan que `web/` compile; regeneran archivos versionados en `landing/public/`.

## Variables

`PUBLIC_APP_URL`, `PUBLIC_SITE_URL`, `PUBLIC_PRIVACY_URL`. Ver [[Entornos y variables]].

## Antes de cambiar una frase

1. ¿La capacidad existe en una pantalla real? Si no, no se publica.
2. ¿El precio sigue siendo "gratis durante la beta"?
3. ¿Evita testimonios, logos y métricas de clientes? No hay clientes reales todavía.
4. ¿El copy nuevo quedó en `consts.ts`, no en el markup?
5. `npm run build`.

Ver [[Producto]] y [[Verificar cambios]].
