# Landing de Futcademic

Sitio público estático (Astro) que lleva al registro del panel. Independiente de
`web/` y `backend/`: no consume Supabase ni la API, no tiene JavaScript de
cliente propio y se despliega por separado.

El contenido y las decisiones de producto detrás de cada sección están en
[`docs/product/PRD-LANDING.md`](../docs/product/PRD-LANDING.md).

## Comandos

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # dist/
npm run preview    # sirve dist/
npm run capturas   # regenera public/capturas/*.png y public/og.png
npm run demo       # regraba public/demo/recorrido.mp4 (necesita ffmpeg)
```

## Variables de entorno

Copia `.env.example` a `.env`. Las tres son opcionales en local; en producción
`PUBLIC_APP_URL` es obligatoria o los CTA apuntan al dominio de ejemplo.

| Variable | Para qué |
|----------|----------|
| `PUBLIC_APP_URL` | Base del panel. Los CTA van a `${PUBLIC_APP_URL}/register`. |
| `PUBLIC_SITE_URL` | URL canónica del sitio: `og:url`, `sitemap.xml`. |
| `PUBLIC_PRIVACY_URL` | Aviso de privacidad. Vacía ⇒ el footer no muestra el enlace. |

## Contenido

Todo el texto vive en [`src/consts.ts`](src/consts.ts). Las secciones de
`src/components/sections/` solo lo maquetan: para corregir una frase no hace
falta tocar markup.

Regla heredada del PRD: **ninguna afirmación sin respaldo**. Cada capacidad que
el sitio menciona corresponde a una fila "Verificado" de
`docs/product/DEFINICION-PRODUCTO.md` o a una pantalla real de `web/src/pages/`.
No hay testimonios ni logos de clientes porque todavía no hay clientes.

## Capturas y video

`capturas/` levanta el panel de `web/` en modo dev con Supabase y la API
apuntando a hosts stub, y lo recorre con el arnés de mocks de
`web/e2e/helpers.ts` (`page.route`). Nada real se toca y no hace falta backend
ni base de datos.

- `capturas/datos.ts` — datos de demostración compartidos.
- `capturas/capturas.spec.ts` — las ocho capturas del panel.
- `capturas/og.spec.ts` — imagen para compartir (1200×630).
- `capturas/demo.spec.ts` + `capturas/video.mjs` — recorrido grabado → MP4.

Requisitos: dependencias de `web/` instaladas (`npm --prefix ../web ci`),
`npx playwright install chromium` y, para el video, `ffmpeg`.

`src/components/Shot.astro` lee las dimensiones reales del PNG para reservar el
espacio exacto (CLS 0). Si falta una captura, muestra un hueco rotulado en vez
de una imagen rota: el sitio nunca se publica con imágenes de ejemplo.

## Despliegue

Proyecto estático en Vercel, separado del panel. Root directory `landing/`,
build `npm run build`, output `dist/`. Define `PUBLIC_APP_URL` y
`PUBLIC_SITE_URL` en el proyecto antes del primer deploy.
