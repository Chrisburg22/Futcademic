# Code Review (Individual) — Futcamedic

**Sección:** D15 · **Equipo:** 6 · **Término:** 2026
**Revisor:** Christian A. Ramos Pérez
**Fecha:** 22-Apr-2026
**Release:** 1.0
**Documento:** P03-CodeReview_SecD15_Team6_Individual

## Summary

| Campo | Valor |
|---|---|
| Date | 22-Apr-2026 |
| Effort | 3 h |
| Review Status | Closed |
| Review name | `CodeReview_Futcamedic_SecD15_Team6` |
| Method | DC (Desk-Check individual) |
| Release | 1.0 |
| Responsible | Christian A. Ramos Pérez |
| Project | Futcamedic |
| Reason | Revisión P03 — módulos críticos de seguridad + dominio. |

## Scope

Módulos revisados:

1. `backend/api/controllers/attendance.controller.ts`
2. `backend/api/controllers/event.controller.ts`
3. `backend/api/middlewares/auth.middleware.ts` + `backend/api/middlewares/tenant.middleware.ts`
4. `mobile/src/contexts/AuthContext.tsx`

## Criterios de revisión

- Correctitud funcional vs SW Architecture (P03-SWA).
- Seguridad (multi-tenant, RBAC, JWT handling).
- Consistencia de datos (transacciones, constraints).
- Manejo de errores.
- Notación Húngara consistente (según SDD P03).
- Ausencia de secrets hardcoded.

## Comment List — Hallazgos

### Módulo 1 — `backend/api/controllers/attendance.controller.ts`

| No. | Reference | Finding | Classification | Responsible / Planned date | Status |
|---|---|---|---|---|---|
| A1 | `attendance.controller.ts:66-79` | El upsert de `attendances` y el update de `trainings.is_completed` **no están en una transacción**. Si el upsert tiene éxito y el update falla, la sesión queda sin marcar como completada pero con la asistencia guardada. Recomendación: usar `rpc()` que encapsule ambos en función Postgres, o aceptar el riesgo documentado. | E (Risk) | Christian — 06-May-2026 | Open |
| A2 | `attendance.controller.ts:50` | `records` valida `Array.isArray` pero **no valida `records.length > 0`**. Un array vacío hace upsert no-op y retorna 200 engañoso. Agregar `|| records.length === 0`. | R | Christian — 29-Apr-2026 | Closed — fix pendiente merge |
| A3 | `attendance.controller.ts:48` | `date` no se valida contra formato ISO `YYYY-MM-DD`. Un string inválido hace que Supabase retorne 0 rows sin error, causando upsert silencioso. Regex o `Date.parse()` check. | R | Christian — 06-May-2026 | Open |
| A4 | `attendance.controller.ts:55-64` | `r.present` no se valida como boolean. Si llega `"true"` (string), Postgres lo coerciona, pero mejor explícito: `present: Boolean(r.present)`. | R | Christian — 29-Apr-2026 | Open |
| A5 | `attendance.controller.ts:73-79` | El update a `trainings` no hace `await` de error handling explícito ni retorna feedback. Un fallo silencioso deja el training en `is_completed=false`. | R | Christian — 06-May-2026 | Open |
| A6 | `attendance.controller.ts:4-44` | Buenas prácticas OK: filtro explícito por `school_id` en cada query (defensa en profundidad aun con RLS). | OK | — | Closed |

### Módulo 2 — `backend/api/controllers/event.controller.ts`

| No. | Reference | Finding | Classification | Responsible / Planned date | Status |
|---|---|---|---|---|---|
| E1 | `event.controller.ts:99, 125-138` | `recurringWeeks` se parsea con `parseInt` **sin cap máximo**. Un cliente malicioso puede enviar `recurringWeeks=999999` y generar 1M de rows en `trainings`. Agregar `Math.min(count, 52)` y validar `>0`. | E (Risk) | Christian — 06-May-2026 | Open |
| E2 | `event.controller.ts:113` | `start_time` se persiste como tiempo local sin timezone. Un admin en zona distinta al servidor verá tiempos shifted. Documentar asunción "hora local de la escuela" o mover a `TIMESTAMPTZ`. | R | Equipo — 06-May-2026 | Open |
| E3 | `event.controller.ts:140-144` | Si falla la inserción de `trainings`, el evento maestro **queda huérfano** en `events`. Rollback manual: `await supabaseAdmin.from('events').delete().eq('id', eventData.id)` en catch. O usar función RPC transaccional. | E (Risk) | Christian — 06-May-2026 | Open |
| E4 | `event.controller.ts:94-96` | Validación mínima de campos obligatorios OK. Falta validar `type ∈ {entrenamiento, partido}` explícitamente antes de llegar al DB check. | R | Christian — 29-Apr-2026 | Closed |
| E5 | `event.controller.ts:54-88` | `fnGetTrainingsForDay` para profesores filtra por `category_teachers` correctamente; buena defensa. | OK | — | Closed |
| E6 | `event.controller.ts:4-31` | `fnCancelInstance` acepta `training_id` o `(event_id, date)` como alternativa; documentar en comentario de header para evitar confusión. | R | Christian — 22-Apr-2026 | Closed |
| E7 | `event.controller.ts:104-107` | Cálculo de `recurring_end_date` correcto: `(count-1) * 7` días desde `date`. | OK | — | Closed |

### Módulo 3 — `backend/api/middlewares/auth.middleware.ts` + `tenant.middleware.ts`

| No. | Reference | Finding | Classification | Responsible / Planned date | Status |
|---|---|---|---|---|---|
| M1 | `auth.middleware.ts:22` | `supabaseAdmin.auth.getUser(token)` hace una llamada de red por **cada request**. Para tráfico alto conviene cachear el `{ sub, exp }` decoded localmente y fallback a `getUser` en caso de duda. Optimización futura. | R | Equipo — Q3 2026 | Open (backlog) |
| M2 | `auth.middleware.ts:25` | `details: error?.message` en response puede filtrar info sensible de Supabase al cliente. Log server-side pero devolver mensaje genérico al cliente. | R | Christian — 29-Apr-2026 | Open |
| M3 | `tenant.middleware.ts:25-29` | Query a `users` solo trae columnas necesarias (`id, school_id, role, full_name`). ✓ Buen encapsulamiento. | OK | — | Closed |
| M4 | `tenant.middleware.ts:48-55` | `requireRole` factory, puro y sin side-effects. ✓ Tipo seguro. | OK | — | Closed |
| M5 | `tenant.middleware.ts:31-33` | Si el usuario existe en `auth.users` pero **no** en `public.users` (caso de invitación pendiente), devuelve 403 genérico. Un mensaje más explícito ayuda a debugging (p. ej. `'Perfil aún no completado'`). | R | Christian — 06-May-2026 | Open |
| M6 | `auth.middleware.ts` + `tenant.middleware.ts` | El encadenamiento `requireAuth → requireTenant → requireRole` respeta el principio de fail-fast y de separación de responsabilidades. | OK | — | Closed |
| M7 | `auth.middleware.ts:5-11` | Uso de `declare global namespace Express` para tipar `req.user` como `any`. Tipar con `SupabaseUser` del SDK para mayor seguridad de tipos. | R | Christian — 06-May-2026 | Open |

### Módulo 4 — `mobile/src/contexts/AuthContext.tsx`

| No. | Reference | Finding | Classification | Responsible / Planned date | Status |
|---|---|---|---|---|---|
| X1 | `AuthContext.tsx:62-67` | `onAuthStateChange` llama `fetchProfile` en cada cambio, incluyendo `TOKEN_REFRESHED`, que **no necesita** re-fetch. Filtrar por `_event === 'SIGNED_IN'` para evitar queries DB redundantes. | R | Christian — 29-Apr-2026 | Open |
| X2 | `AuthContext.tsx:27-52` | `fetchProfile` no maneja el caso de refresh_token expirado / sesión inválida devolviendo un 401 → debería forzar `supabase.auth.signOut()` para limpiar el estado inconsistente. | E (Risk) | Christian — 06-May-2026 | Open |
| X3 | `AuthContext.tsx:72-75` | Lógica de `isLoading` duplicada en 2 efectos. Consolidar: un solo `useEffect` que derive `isLoading` del estado (session, user, profile). Bug potencial de spinner infinito. | R | Christian — 06-May-2026 | Open |
| X4 | `AuthContext.tsx:45` | `console.log('AuthContext: Fetched Profile:', data)` en producción; puede filtrar datos en logs de terceros. Remover o envolver en `if (__DEV__)`. | E (Risk — PII) | Christian — 22-Apr-2026 | Closed (fix en PR #N) |
| X5 | `AuthContext.tsx:31-37` | El query join con `schools(name, logo_url)` asume que existe `schools.logo_url`, pero `schema.sql:12-16` sólo define `id, name, created_at`. **Columna faltante**: agregar migración `ALTER TABLE schools ADD COLUMN logo_url TEXT`. | E | Equipo — 22-Apr-2026 | Open (bloqueante) |
| X6 | `AuthContext.tsx:78` | `refreshProfile: () => fetchProfile(user?.id || '')` — pasa string vacío si no hay user; `fetchProfile('')` hará query con id='' que retorna 0 rows en lugar de fallar temprano. Validar y retornar early. | R | Christian — 29-Apr-2026 | Open |
| X7 | `AuthContext.tsx:2-3` | Import tipado correcto de `Session` y `User` desde `@supabase/supabase-js`. ✓ | OK | — | Closed |

## Check List General

| No. | Description | OK / NOK / NR | Comment |
|---|---|---|---|
| 1 | Código sigue arquitectura documentada en P03-SWA | OK | Estructura `middlewares/ controllers/` coincide con §6.4. |
| 2 | Notación Húngara consistente (funciones exportadas) | OK (parcial) | Controllers usan verbos (`getX`, `saveX`). En docs SDD se mapean a `fn*`. Se recomienda unificar en next release. |
| 3 | Multi-tenant enforcement en cada query | OK | Todos los queries revisados filtran por `school_id`. |
| 4 | RBAC por endpoint | OK | Guards `requireRole(...)` aplicados en rutas. |
| 5 | Validación de input | NOK | Hallazgos A2, A3, A4, E1, E4. Falta capa de validación (Zod/Joi) en controllers. |
| 6 | Manejo de errores devuelve mensajes genéricos al cliente | NOK | M2 — `error.message` filtrado. |
| 7 | Transacciones para writes multi-tabla | NOK | A1, E3 — upsert + update o event + trainings no transaccionales. |
| 8 | Secrets no hardcoded | OK | `service_role_key` vía ENV (`SUPABASE_SERVICE_ROLE_KEY`). Anon key en `EXPO_PUBLIC_*`. |
| 9 | Tests automatizados | NR | Fuera de scope P03; backlog para P04. |
| 10 | Logs sin PII | NOK | X4 — `console.log` con profile completo. |
| 11 | Tipado fuerte | OK (parcial) | M7 — `req.user: any`. |
| 12 | Naming conventions consistentes | OK | camelCase en TS, snake_case en DB. |

## Totales de hallazgos

| Clasificación | Count |
|---|---|
| (E) Error/Risk | 6 — A1, E1, E3, X2, X4, X5 |
| (R) Remark | 14 |
| OK | 8 |

## Conclusión

Release 1.0 de Futcamedic presenta una arquitectura coherente con el documento SWA, con separación limpia entre middlewares, controllers y capa mobile. Los hallazgos (E) son de severidad media: principalmente falta de transaccionalidad en writes multi-tabla (A1, E3), cap de recurrencia (E1), manejo de refresh inválido en mobile (X2) y una columna `schools.logo_url` referenciada pero no declarada en `schema.sql` (X5 — bloqueante, debe corregirse antes del release).

**Recomendación:**
1. Resolver X5 hoy (migración DB).
2. Resolver A1, E1, E3 antes de release 1.1 (06-May-2026).
3. Agregar capa de validación con Zod en todos los controllers (next sprint).
4. Unificar logging (pino/winston) y remover `console.log` de producción.

**Aprobación individual:** Release 1.0 aprobada con hallazgos abiertos listados arriba.

Firma: **Christian A. Ramos Pérez** — 22-Apr-2026
