---
tipo: nota
area: datos
estado: verificado
actualizado: 2026-10-26
fuentes:
  - migrations
  - schema.sql
  - AGENTS.md
tags:
  - datos
---

# Migraciones

## Inventario

| Archivo | Qué hace |
|---|---|
| `20260511_add_financial_fields.sql` | `categories.monthly_fee`, `payments.payment_year`; backfill del año; comentarios |
| `20260512_add_user_onboarded_at.sql` | `users.onboarded_at` para el onboarding de profesor |
| `20260512_add_username_to_users.sql` | `users.username` + índice único `(school_id, username)` para login de alumno |
| `20260709_add_chat_tables.sql` | `chat_conversations`, `chat_messages` + índices |

## Cómo se aplican

No hay runner. Se pegan en el **SQL Editor de Supabase**, en orden de nombre:

1. `schema.sql` (instalación nueva).
2. Migraciones `YYYYMMDD_*` de la más vieja a la más nueva.

> [!warning] `schema.sql` se contradice
> Su primera línea dice "not meant to be run", pero el onboarding del repo indica aplicarlo primero. En una instalación nueva, verifica el orden y prueba contra una base vacía antes de confiar. Ver [[Deriva conocida]].

## Reglas para una migración nueva

1. Nombre `YYYYMMDD_descripcion.sql`.
2. Idempotente: `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.
3. No romper datos existentes: agregar nullable o con `DEFAULT`, luego backfill, luego constraint.
4. Actualizar `schema.sql` si el cambio debe existir en instalaciones nuevas.
5. Actualizar `docs/technical/DATABASE-SCHEMA.md` y `ESQUEMA-BASE-DATOS.md` (par EN/ES).
6. Regenerar la bóveda: `python3 scripts/vault/vault.py generar`.
7. Probar el endpoint afectado.

## Orden seguro en producción

```text
1. Aplicar migración (aditiva, compatible hacia atrás)
2. Desplegar backend que la usa
3. Verificar
4. Limpiar columnas viejas en una migración posterior
```

Nunca al revés: el código nuevo no debe llegar antes que la columna.

## Dónde mirar

- Columnas resultantes: [[Tablas]].
- Deriva entre SQL y código: [[Deriva conocida]].
- Procedimiento completo: [[Cambiar la base de datos]].
