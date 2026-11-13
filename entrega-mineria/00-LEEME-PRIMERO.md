# Futcademic · Proyecto final de Minería de Datos

**Materia:** Minería de Datos · D02 2026 B
**Equipo:** Andrea Lizbeth Torres Arana · Sergio Samhir Peña Galván · Christian Alejandro Ramos Pérez

## Para quien lee (persona o IA)

Esta carpeta reúne todo el proyecto universitario en archivos Markdown. Futcademic es una app real para administrar academias de fútbol, con varias academias en la misma app. Sobre sus datos se hizo un proyecto de minería siguiendo KDD.

- **Modelo A (datos reales):** ¿faltará el alumno a su siguiente sesión? Usa la hoja de asistencia de la academia Gallos San Rafael Serratos, ya anonimizada.
- **Modelo B (datos sintéticos):** ¿desertará el alumno en 30 días? Se simula porque las bajas reales no tienen historial de asistencia.

**Cifras vigentes del Modelo A:**
- 566 filas, 152 alumnos, 18.6 % de faltas.
- Partición por fecha: 355 filas para entrenar y 211 para probar.
- Árbol CART (Gini, profundidad 4, hoja mínima 15): AUC de prueba 0.779, recall 0.725 marcando el 25 %, lift 2.89×.
- scikit-learn 1.6.1 da el mismo resultado.
- La validación cruzada por alumno da 0.730.
- La tasa de asistencia previa, sola, da 0.784.

## Orden de lectura

| # | Archivo | Qué contiene |
|---|---|---|
| 1 | `01-documentacion/01-RESUMEN-DEL-PROYECTO.md` | Resumen general |
| 2 | `01-documentacion/02-LA-APLICACION.md` | Qué hace la app |
| 3 | `01-documentacion/03-ARQUITECTURA-TECNICA.md` | Arquitectura de la app |
| 4 | `01-documentacion/04-BASE-DE-DATOS.md` | Tablas y relaciones |
| 5 | `01-documentacion/05-PROYECTO-MINERIA-DE-DATOS.md` | Planteamiento de minería |
| 6 | `01-documentacion/06-mineria-datos-proyecto-final.md` | Entregable académico completo |
| 7 | `01-documentacion/07-README-mineria.md` | Guía técnica de la carpeta de minería |
| 8 | `04-presentaciones/presentacion-vista-minable.md` | Las 14 diapositivas del avance, con notas de quién presenta |
| 9 | `04-presentaciones/animacion-ruta-minable.md` | Paso a paso animado: 4 etapas KDD y entrenamiento |
| 10 | `02-codigo/*.md` | Código Python completo, un archivo por script |
| 11 | `03-datos/vista-minable-real.md` | Tabla real completa (566 filas) e informe KDD |
| 12 | `03-datos/conjunto-sintetico.md` | Esquema y muestra del conjunto sintético |

## Flujo del código

```
Hoja de asistencia (.xlsx) → extract_serratos.py → JSON privado (con nombres, no incluido)
  → vista_minable.py (KDD 1-4: limpieza, integración, selección, transformación)
  → vista_minable.csv (anónima) → entrenar_vista.py (usa el árbol de validar_dataset.py + scikit-learn)
generar_dataset.py → conjunto sintético → validar_dataset.py (Modelo B)
generar_carga_serratos.py → SQL para cargar la hoja en la base de producción (Supabase)
```

## Lo que no se incluye

No se incluyen nombres ni fechas de nacimiento de alumnos reales, porque son menores de edad. Tampoco se incluyen credenciales.
