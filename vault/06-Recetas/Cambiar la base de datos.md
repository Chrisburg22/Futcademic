---
tipo: receta
area: recetas
estado: verificado
actualizado: 2026-10-27
fuentes:
  - migrations
  - schema.sql
  - AGENTS.md
  - docs/technical/ESQUEMA-BASE-DATOS.md
tags:
  - recetas
  - datos
---

# Cambiar la base de datos

## 1. Migración

Crea `migrations/YYYYMMDD_descripcion.sql`. Idempotente y compatible hacia atrás:

```sql
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS talla_uniforme TEXT;

CREATE INDEX IF NOT EXISTS students_talla_idx
  ON public.students (school_id, talla_uniforme);
```

- No borres ni renombres columnas en el mismo paso que despliega el código.
- Para un campo obligatorio: agregar nullable → backfill → `SET NOT NULL` en migración posterior.
- Si creas una **tabla** nueva, cierra la puerta directa como las migraciones
  del 26-oct: `alter table ... enable row level security;` sin políticas. El
  backend entra con la service key; el navegador no.

## 2. Aplicar

En el **SQL Editor de Supabase**, en orden de nombre. No hay runner. Verifica en una base de prueba antes de producción.

## 3. Actualizar la base documental

- `schema.sql` si el cambio debe existir en instalaciones nuevas.
- `docs/technical/DATABASE-SCHEMA.md` **y** `ESQUEMA-BASE-DATOS.md` (par EN/ES).

## 4. Código

| Capa | Qué tocar |
|---|---|
| Backend | controlador que lee/escribe la columna; tipos si aplica |
| Web | `src/types/index.ts`, hook y formulario |
| Tests | caso que cubra el campo nuevo |

## 5. Verificar

```bash
cd backend && npm test && npm run build
cd ../web && npm run build
python3 scripts/vault/vault.py generar
```

## 6. Desplegar en orden

1. Migración aplicada.
2. Backend desplegado (con `dist/` actualizado).
3. Web desplegada.
4. Smoke: login + lectura/escritura del campo.

## Checklist

- [ ] Migración fechada e idempotente.
- [ ] `schema.sql` actualizado si aplica.
- [ ] Docs EN/ES actualizados.
- [ ] Tipos y hooks actualizados.
- [ ] `Tablas.md` regenerado.
- [ ] Deriva revisada: ¿la columna ya existía sin documentar?
- [ ] Tabla nueva con RLS habilitado.

Ver [[Migraciones]] y [[Deriva conocida]].
