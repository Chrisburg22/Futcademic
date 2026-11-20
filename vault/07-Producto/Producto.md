---
tipo: nota
area: producto
estado: verificado
actualizado: 2026-10-26
fuentes:
  - docs/product/DEFINICION-PRODUCTO.md
  - docs/product/PRD-MAIN.md
  - docs/product/PRD-LANDING.md
  - AGENTS.md
tags:
  - producto
---

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
