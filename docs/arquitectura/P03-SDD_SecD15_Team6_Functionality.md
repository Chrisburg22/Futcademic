# SW Design Description (SDD) — Futcamedic

**Title:** Futcamedic — SW Component `swcAttendanceController` (Funcionalidad: Registro de Asistencias)
**Sección:** D15 · **Equipo:** 6 · **Término:** 2026
**Documento:** P03-SDD_SecD15_Team6_Functionality

## History

| Issue status (Index) | Maturity/Date | Author | Department | Check/Release | Description |
|---|---|---|---|---|---|
| 1.0 | Valid — 22-Apr-2026 | Christian A. Ramos Pérez | TEC-IDS | TEC-IDS | Diseño detallado del componente Attendance. |

## Table of Contents

1. Purpose
2. Definitions and Abbreviations
3. References
4. Realization Constraints and Targets
5. SW Conceptual Design
6. SW Component Internal Breakdown
   - 6.1 Functional Decomposition
   - 6.2 Functions — Description and Dynamic Behavior

## 1. Purpose

Describir el diseño detallado del componente `swcAttendanceController` (y sus vecinos directos `swcMobileHooks::useAttendances`, `swcAttendanceScreen`) que implementa el registro de asistencias en Futcamedic. El SDD baja desde la arquitectura (P03-SWA) hasta la descripción de cada función pública, sus parámetros, pre/post-condiciones, errores y comportamiento dinámico.

## 2. Definitions and Abbreviations

### Definitions

| Término | Descripción |
|---|---|
| `iAttendanceRecord` | `{ student_id: str, present: b }` — record individual de asistencia en el batch. |
| `iAttendanceBatch` | `{ category_id, date, type, training_id?, records: arr<iAttendanceRecord> }`. |
| Upsert | `INSERT … ON CONFLICT (student_id,date,type) DO UPDATE SET present=EXCLUDED.present`. |

### Abbreviations

| Abrev. | Significado |
|---|---|
| RLS | Row Level Security |
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control |
| SWC | SW Component |

## 3. References

| N° | Document name | Reference |
|---|---|---|
| 1 | SW Architecture | `P03-SWA_SecD15_Team6.md` |
| 2 | Source code | `backend/api/controllers/attendance.controller.ts` |
| 3 | Middlewares | `backend/api/middlewares/auth.middleware.ts`, `backend/api/middlewares/tenant.middleware.ts` |
| 4 | Schema | `schema.sql` (tabla `attendances` líneas 70-82) |
| 5 | Mobile hook | `mobile/src/hooks/useAttendances.ts` |

## 4. Realization Constraints and Targets

- Una única fila por `(student_id, date, type)` — constraint UNIQUE en DB (`schema.sql:81`).
- Sólo usuarios con rol `super_admin`, `admin` o `profesor` pueden invocar `fnSaveAttendances` (RBAC).
- Toda consulta/escritura filtra por `school_id` (multi-tenant).
- Insert batch: soportar hasta N=60 records en una sola request (típico en una categoría grande).
- Marcar la sesión (`trainings.is_completed`) al guardar, si se pasó `training_id`.
- Response time objetivo: p95 < 500 ms (batch de 30 records).

## 5. SW Conceptual Design

### 5.1 Package Diagram

```mermaid
graph TD
  pkgMobile[pkgMobile] --> pkgMobileHooks[pkgMobile.hooks<br/>useAttendances]
  pkgMobileHooks --> pkgMobileApi[pkgMobile.api<br/>axios]
  pkgMobileApi -.HTTP.-> pkgBackend[pkgBackend]
  pkgBackend --> pkgMiddlewares[pkgBackend.middlewares<br/>auth + tenant + role]
  pkgMiddlewares --> pkgCtrl[pkgBackend.controllers<br/>attendance]
  pkgCtrl --> pkgDB[pkgSupabase.Admin]
  pkgDB --> pkgPostgres[(public.attendances<br/>public.trainings)]
```

### 5.2 Class Diagram (entidades involucradas)

```mermaid
classDiagram
  class clsAttendance {
    +str id
    +str school_id
    +str student_id
    +str category_id
    +str teacher_id
    +str training_id
    +date date
    +str type
    +bool present
    +date created_at
  }
  class clsStudent {
    +str id
    +str school_id
    +str category_id
    +str full_name
    +date birth_date
  }
  class clsCategory {
    +str id
    +str school_id
    +int birth_year
    +str name
  }
  class clsTraining {
    +str id
    +str event_id
    +str category_id
    +date date
    +bool is_completed
    +bool is_cancelled
  }

  clsStudent "1" --> "*" clsAttendance
  clsCategory "1" --> "*" clsAttendance
  clsTraining "0..1" --> "*" clsAttendance : training_id
```

### 5.3 ERD simplificado

```mermaid
erDiagram
  attendances }o--|| students : student_id
  attendances }o--|| categories : category_id
  attendances }o--o| trainings : training_id
  attendances }o--o| users : teacher_id
  students }o--|| categories : category_id
  trainings }o--|| events : event_id
  events }o--|| categories : category_id
```

### 5.4 System Boundary

Dentro del boundary: `swcAttendanceController`, `swcAuthMiddleware`, `swcTenantMiddleware`.
Fuera del boundary: Postgres (accedido vía `swcSupabaseAdmin`), Supabase Auth (token source), cliente mobile.

## 6. SW Component Internal Breakdown

El SWC no se subdivide en subcomponentes; está representado por un único object file (`attendance.controller.ts`), que exporta 3 funciones públicas.

### 6.1 Functional Decomposition (Static Function Diagram)

```mermaid
graph LR
  fnSave[fnSaveAttendances] --> valPayload[Validar payload]
  fnSave --> mapPayload[Mapear a insertPayload]
  fnSave --> upsert[supabaseAdmin.attendances.upsert]
  fnSave --> markDone{training_id?}
  markDone -- sí --> updTraining[supabaseAdmin.trainings.update is_completed]
  markDone -- no --> ret200[return 200]

  fnByCat[fnGetAttendancesByCategory] --> qCat[query attendances + join students]
  fnByCat --> ret200

  fnByStu[fnGetAttendancesByStudent] --> qStu[query attendances order by date]
  fnByStu --> ret200
```

### 6.2 Function Description and Dynamic Behavior

---

#### 6.2.1 Function `async fnGetAttendancesByCategory(req, res) → pVoid`

**Signature (código real, `attendance.controller.ts:4-25`):**

```ts
export const getAttendancesByCategory = async (req: Request, res: Response) => { ... }
```

| Campo | Detalle |
|---|---|
| **Description** | Retorna todas las asistencias de una categoría, filtrables opcionalmente por fecha. Incluye el nombre del alumno via inner join a `students`. |
| **Parameter 1 — req.params.id** `<input: str>` | UUID de la categoría. El controlador confía en que el router ya lo valida; si la categoría no es del tenant, RLS lo filtra. |
| **Parameter 2 — req.query.date** `<input: str?>` | Fecha ISO (`YYYY-MM-DD`) opcional. No sanitizada: si el cliente manda basura, Supabase devuelve 0 rows (no 500). |
| **Parameter 3 — req.tenant** `<input: iTenantContext>` | Inyectado por `requireTenant`. Aporta `school_id`. |
| **Return Value** | `Response JSON 200` con `arr<iAttendanceWithStudent>` (spread de attendance + `student.full_name`). `500` en error. |
| **Precondition** | Request pasó por `requireAuth` → `requireTenant`. `req.tenant.school_id` existe. |
| **Post condition** | Ninguna mutación de estado. |
| **Error Conditions** | `500 { error: 'Error al obtener asistencias.' }` si Supabase falla. `500 { error: 'Error interno.' }` si excepción. |
| **Requirements** | REQ-ATT-01 (consulta asistencias por categoría), REQ-MT-01 (aislamiento por school_id). |

**Dynamic Behavior — Flow Chart:**

```mermaid
flowchart TD
  A([Request entra]) --> B[req.tenant.school_id]
  B --> C[Query attendances<br/>eq school_id + category_id]
  C --> D{req.query.date?}
  D -- sí --> E[query.eq date]
  D -- no --> F[skip]
  E --> G[select + join students.full_name]
  F --> G
  G --> H{error?}
  H -- sí --> I[res.status 500]
  H -- no --> J[res.status 200 data]
  I --> K([End])
  J --> K
```

---

#### 6.2.2 Function `async fnGetAttendancesByStudent(req, res) → pVoid`

**Signature (`attendance.controller.ts:27-44`):**

```ts
export const getAttendancesByStudent = async (req: Request, res: Response) => { ... }
```

| Campo | Detalle |
|---|---|
| **Description** | Devuelve el historial de asistencias de un alumno (ordenado desc por fecha). |
| **Parameter 1 — req.params.id** `<input: str>` | UUID del alumno. |
| **Parameter 2 — req.tenant** `<input: iTenantContext>` | — |
| **Return Value** | `Response JSON 200 arr<iAttendance>`. |
| **Precondition** | Autenticado, tenant válido. Alumno debe pertenecer a la misma escuela (RLS + filtro explícito). |
| **Post condition** | Sin mutaciones. |
| **Error Conditions** | `500 { error: 'Fallo consulta.' }`; excepción → `500 { error: 'Error servidor.' }`. |
| **Requirements** | REQ-ATT-02 (historial alumno), REQ-MT-01. |

**Flow Chart:**

```mermaid
flowchart TD
  A([Request]) --> B[Query attendances<br/>eq school_id + student_id<br/>order date desc]
  B --> C{error?}
  C -- sí --> D[500 'Fallo consulta']
  C -- no --> E[200 data]
  D --> F([End])
  E --> F
```

---

#### 6.2.3 Function `async fnSaveAttendances(req, res) → pVoid`

**Signature (`attendance.controller.ts:46-85`):**

```ts
export const saveAttendances = async (req: Request, res: Response) => { ... }
```

| Campo | Detalle |
|---|---|
| **Description** | Upsert batch de asistencias para una (categoría, fecha, tipo). Si se provee `training_id`, marca la sesión como completada. |
| **Parameter 1 — req.body.category_id** `<input: str>` | UUID categoría. Requerido. |
| **Parameter 2 — req.body.date** `<input: str>` | ISO `YYYY-MM-DD`. Requerido. |
| **Parameter 3 — req.body.type** `<input: str>` | `'entrenamiento'` \| `'partido'`. Requerido. |
| **Parameter 4 — req.body.records** `<input: arr<iAttendanceRecord>>` | `[{student_id, present}, ...]`. Debe ser array. |
| **Parameter 5 — req.body.training_id** `<input: str?>` | UUID de sesión; opcional. |
| **Parameter 6 — req.tenant** `<input: iTenantContext>` | Aporta `school_id` y `user_id` (teacher_id). |
| **Return Value** | `200 { message: 'Asistencia sincronizada.' }` o `4xx/500`. |
| **Precondition** | `requireAuth → requireTenant → requireRole('super_admin','admin','profesor')`. `records` es array no vacío (debería validarse — ver Code Review §1). |
| **Post condition** | Filas upsertadas en `attendances`. Si `training_id` provisto: `trainings.is_completed = true`. |
| **Error Conditions** | `400 { error: 'Payload incompleto.' }` si falta campo o records no es array. `500 { error: 'Sucedió un error al guardar.' }` si upsert falla. `500 { error: 'Excepción servidor.' }` si excepción. |
| **Requirements** | REQ-ATT-03 (pase de lista batch), REQ-ATT-04 (marcar sesión completada), REQ-MT-01 (aislamiento). |

**State Chart:**

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Validating : POST /api/attendances
  Validating --> Error400 : payload incompleto
  Validating --> Mapping : payload OK
  Mapping --> Upserting : insertPayload listo
  Upserting --> Error500 : supabase error
  Upserting --> CheckTraining : upsert OK
  CheckTraining --> UpdatingTraining : training_id presente
  CheckTraining --> Done : training_id ausente
  UpdatingTraining --> Done : update OK (errores ignorados)
  Done --> [*] : 200 OK
  Error400 --> [*] : 400
  Error500 --> [*] : 500
```

**Flow Chart:**

```mermaid
flowchart TD
  A([POST /api/attendances]) --> B{category_id, date,<br/>type, records OK?}
  B -- no --> BE[400 'Payload incompleto']
  B -- sí --> C[map records → insertPayload<br/>add school_id + teacher_id]
  C --> D[supabaseAdmin.attendances<br/>.upsert ON CONFLICT<br/>student_id,date,type]
  D --> E{error?}
  E -- sí --> EE[500 'Sucedió un error al guardar']
  E -- no --> F{training_id?}
  F -- sí --> G[update trainings<br/>is_completed=true<br/>eq id + school_id]
  F -- no --> H[200 'Asistencia sincronizada']
  G --> H
  H --> END([End])
  BE --> END
  EE --> END
```

**Fragmento de código (real, `attendance.controller.ts:54-80`):**

```ts
const insertPayload = records.map((r: any) => ({
  school_id,
  category_id,
  student_id: r.student_id,
  teacher_id: user_id,
  date,
  type,
  present: r.present,
  training_id: training_id || null
}));

const { error } = await supabaseAdmin
  .from('attendances')
  .upsert(insertPayload, { onConflict: 'student_id,date,type' });

if (error) return res.status(500).json({ error: 'Sucedió un error al guardar.' });

if (training_id) {
  await supabaseAdmin
    .from('trainings')
    .update({ is_completed: true })
    .eq('id', training_id)
    .eq('school_id', school_id);
}
```

**Observación de diseño:** el `update` del training no está dentro de una transacción con el upsert de attendances. Si el upsert tiene éxito y el update falla (o viceversa), la consistencia se pierde. Documentado como (E) Risk en Code Review.

---

## Trazabilidad Requisitos → Funciones → SWC

| Requisito | Función | SWC |
|---|---|---|
| REQ-ATT-01 (listar por categoría) | `fnGetAttendancesByCategory` | `swcAttendanceController` |
| REQ-ATT-02 (historial por alumno) | `fnGetAttendancesByStudent` | `swcAttendanceController` |
| REQ-ATT-03 (pase de lista batch) | `fnSaveAttendances` | `swcAttendanceController` |
| REQ-ATT-04 (completar sesión) | `fnSaveAttendances` (branch `training_id`) | `swcAttendanceController` |
| REQ-MT-01 (aislamiento multi-tenant) | Todas | `swcTenantMiddleware` + RLS |
| REQ-SEC-01 (RBAC) | Todas (guard con `requireRole`) | `swcTenantMiddleware::requireRole` |
