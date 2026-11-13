# Bóveda de la app Futcademic · 07-Producto

Notas técnicas internas de la app (Obsidian). Los [[enlaces]] apuntan a otras notas de la bóveda.

---

## Nota: Datos y mineria

# Datos y mineria

## Qué hay

`mineria/` es el proyecto final de minería de datos: un dataset **sintético** derivado del esquema y de los datos reales de Futcademic, más scripts de generación y validación.

```bash
python3 mineria/generar_dataset.py   # reproducible: semilla fija 20261021
python3 mineria/validar_dataset.py
```

Salidas en `mineria/dataset/` (`attendances.csv`, `students.csv`, `payments.csv`, `dataset_ml.csv`, …) y `mineria/real/dataset_real.csv`.

## Por qué es sintético

La base real tenía muy pocos registros (28 asistencias, 7 pagos) para entrenar un modelo supervisado. El generador completa la malla sesiones × alumnos con distribuciones calibradas sobre lo real.

- **Real**: esquema, 5 escuelas con actividad, 14 categorías, periodo, 121 alumnos, 33 bajas, patrón de días, edades y cuotas.
- **Simulado**: el detalle fila por fila de asistencia y pago.

## Dos academias inventadas

- **Gallos San Rafael** (5 categorías, 60 alumnos)
- **Master Fut MR Aguascalientes** (6 categorías, 75 alumnos)

No existen. Van marcadas con `origen = "simulada"`; las reales con `origen = "espejo_real"`. `origen` está excluida como predictor. **Nunca presentarlas como academias reales.**

## Modelos

| | Modelo A | Modelo B |
|---|---|---|
| Pregunta | ¿faltará a la próxima sesión? | ¿abandonará en 30 días? |
| Datos | asistencia real | sintético |
| AUC | 0.779 | 0.779 (coincidencia) |

El resumen completo está en `compartir/01-RESUMEN-DEL-PROYECTO.md`.

## Privacidad

- `scripts/serratos_*` contiene datos de menores de una academia real: **nunca** se commitea (`.gitignore` lo bloquea).
- No usar el dataset sintético para afirmar tracción, clientes o ingresos.
- No mezclar filas `origen = "simulada"` con métricas reales sin etiquetarlas.

## Dónde mirar

- `mineria/README.md` — metodología y calibración.
- `docs/mineria-datos-proyecto-final.md` — entregable académico.
- `compartir/` — resúmenes de exposición.

Ver [[Producto]].

## Vista minable (2026-11-10)

`mineria/vista_minable.py` aplica las etapas 1-4 de KDD a la hoja de Serratos y escribe `mineria/real/vista_minable.csv` (566 filas, 152 alumnos, 18.6 % faltas). Corrige las 4 filas con edad imposible que aún trae `real/dataset_real.csv` (570 filas).

## Paquete para compartir (2026-11-11)

Carpeta `entrega-mineria/` (+ `.zip`, sin seguimiento en git, solo en el worktree): `01-documentacion`, `02-codigo` (mineria, extraccion), `03-datos` (real, sintetico), `04-presentaciones`. Las copias de los scripts apuntan a `../../03-datos/`. Excluye JSON con nombres, credenciales y `validar_real.py`/`dataset_real.csv` (obsoletos).

Actualización 2026-11-11: `entrega-mineria/` se rehízo solo con `.md` para pasarla a Gemini (índice `00-LEEME-PRIMERO.md`; código, datos y diapositivas convertidos; cifras corregidas a 566 filas en las copias). Zip de 72 KB.

---

## Nota: Landing

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

---

## Nota: Producto

# Producto

## Una frase

Aplicación web y móvil para que el dueño de una academia de fútbol administre alumnos, asistencias, pagos, categorías, sedes y entrenamientos desde el teléfono.

## Comprador

Dueño o director de una academia con **50–500 alumnos**, 4–12 categorías, 5–20 profesores y 1–5 sedes. Hoy opera con cuadernos, WhatsApp, efectivo y Excel.

## Día 1

1. Registra la academia en `/register`.
2. Crea categorías y sede.
3. Invita profesores.
4. Da de alta alumnos.
5. Programa el primer entrenamiento.
6. Pasa lista y registra el primer cobro.

## Alcance actual

| Pieza | Estado |
|---|---|
| `web/` | Panel completo por rol |
| `backend/` | API Express + Supabase |
| `landing/` | Sitio público estático |
| `mobile/` | Repo Expo separado, **fuera de alcance** |

## Precio

Beta **gratis**, declarada en el landing. Sin planes ni cobro todavía. Cualquier cambio de precio pasa por el PRD y por [[Landing]].

## Roles

`super_admin`, `admin`, `profesor`, `padre`, `alumno`. Matriz completa: [[Roles y permisos]].

## Regla de evidencia

Ninguna afirmación pública sin respaldo:

- una fila **"Verificado"** de `docs/product/DEFINICION-PRODUCTO.md`, o
- una pantalla real de `web/src/screens/`.

Aplica al landing y a cualquier material de venta. Ver [[Landing]].

## Documentos

| Documento | Uso |
|---|---|
| `docs/product/DEFINICION-PRODUCTO.md` | definición y buyer persona |
| `docs/product/PRD-MAIN.md` | requisitos completos |
| `docs/product/PRD-LANDING.md` | decisiones del sitio público |
| `docs/scrum/user-stories.csv` | historias |

## Cuidado

- El nombre del producto es **Futcademic**; el código heredado dice "Futcamedic". No mezclar en copy nuevo.
- No prometer app móvil como disponible: el repo móvil está separado y fuera de alcance.
- No usar datos sintéticos como prueba de tracción: [[Datos y mineria]].
