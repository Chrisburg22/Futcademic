---
tipo: nota
area: producto
estado: verificado
actualizado: 2026-10-26
fuentes:
  - mineria/README.md
  - mineria/generar_dataset.py
  - mineria/validar_dataset.py
  - docs/mineria-datos-proyecto-final.md
  - compartir/01-RESUMEN-DEL-PROYECTO.md
tags:
  - producto
  - datos
---

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

Cuaderno de estudio (2026-11-11): Gemini Notebook "Futcademic · Minería de Datos D02 2026 B" con 27 fuentes: los 18 `.md` de `entrega-mineria/` + la bóveda consolidada en 9 archivos (`entrega-mineria/05-vault-app/vault-<carpeta>.md`).

PR #20 (2026-11-12): vista minable, entrenamiento y `entrega-mineria/` subidos en la rama `claude/futcademic-university-project-e6e6ec`. Pendientes de la revisión: 6 alumnos sin asistencia inflan el AUC; la validación cruzada no separa fechas; los repetidos entre pestañas deben unir marcas.

## Correcciones de la revisión y presentaciones (2026-11-16)

`vista_minable.py` excluye 18 alumnos sin ninguna asistencia y une las marcas de los 6 repetidos; `entrenar_vista.py` valida por alumno y fecha, marca exactamente el 25 % y lee el corte del informe. Se borraron `validar_real.py` y `real/dataset_real.csv`. Cifras vigentes del Modelo A: 548 filas, 146 alumnos, 14.1 % faltas, corte 12/oct (300/248), AUC prueba 0.675 (scikit-learn igual), recall 0.533, lift 2.13×, CV alumno+fecha 0.630, solo tasa previa 0.639. Presentaciones: deck "Vista minable" y animación actualizados; nueva "Pasos 1 al 4 KDD" (https://claude.ai/artifact/UPXMFATicRBVNLkEK1hwjR), centrada en los archivos de cada etapa.

## Paso 1 desde la base de producción (2026-11-16)

`mineria/extraer_bd.py` lee de Supabase `schools`, `students` (sin nombre ni contacto), `attendances` y `deleted_students` con `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` (o `FUTCADEMIC_ENV`) y escribe `mineria/bd/extraccion_bd.json` (en `.gitignore`). `vista_minable.py` usa la base por defecto (`--fuente hoja` para la ruta vieja) y descarta 31 marcas registradas antes de su fecha. La base trae casi lo mismo que la hoja (la cargó el 22/oct) más 7 marcas del 12/nov. Cifras: 544 filas, 147 alumnos, 18 fechas, 14.3 % faltas, AUC 0.643 (scikit-learn igual), recall 0.542, lift 2.17×, CV 0.620, tasa previa 0.613.

Materiales al día con la base (2026-11-16): deck «Vista minable» v16, animación v3, `compartir/`, `docs/`, README y `entrega-mineria/` usan 544 filas / AUC 0.643 (commit `e979f50`). «Pasos 1 al 4 KDD» v6 añade la diapositiva `archivos` (inventario: base Supabase, `.json`, `.csv`).

Cuaderno de estudio actualizado (2026-11-16): «Futcademic · Minería D02 2026 B (base de producción)» en la cuenta personal, 29 fuentes `.md` de `entrega-mineria/` (bóveda regenerada en `05-vault-app/`). El cuaderno anterior y uno vacío en la cuenta de exhio quedan para que el usuario los borre.

Cuaderno único (2026-11-17): https://notebook.google.com/notebook/dfa658d1-982e-4f42-a22f-8f429710768a (compartido, cuenta personal), 41 fuentes: 29 `.md`, 2 PDF de las presentaciones (generados con Chrome headless desde los decks), `vista_minable.csv`, informe JSON como `.txt` (Gemini no acepta .json/.xlsx) y 8 CSV sintéticos (`attendances` falla al subir). Video y presentación de Studio regenerados con cifras de la base. Paquete: `entrega-mineria/04-presentaciones/*.pdf` y `06-archivos-de-datos/` (commit `3faf494`).

Lámina de errores (2026-11-19): «Pasos 1 al 4 KDD» v17 tiene 13 láminas; la nueva `p1-errores` (lámina 7) lista los seis problemas de la limpieza y qué se hizo con cada uno. El PDF de `entrega-mineria/04-presentaciones/` y su `.md` están regenerados.

Discursos (2026-11-20): `entrega-mineria/04-presentaciones/Discursos Pasos 1 al 4 KDD.pdf` trae los textos para leer en voz alta de las láminas 1, 2 y 9 a 13, unos 4 min 30 s.

Merge a main local (2026-11-20): commit `459f649` trae a `main` la extracción desde la base, la vista minable, el entrenamiento y `entrega-mineria/`. La copia vieja sin versionar quedó en `entrega-mineria.respaldo-2026-11-11/`.
