---
tipo: nota
area: backend
estado: verificado
actualizado: 2026-10-28
fuentes:
  - backend/api/controllers/payment.controller.ts
  - backend/api/routes/payment.routes.ts
  - backend/api/controllers/export.controller.ts
tags:
  - backend
  - pagos
---

# Pagos

## Dos tipos

| `payment_type` | Quién paga | Campos |
|---|---|---|
| `mensualidad` | alumno/tutor | `student_id` o `payment_students` |
| `pago_profesor` | profesor | `teacher_id` |

`payment_month` y `payment_year` indican **a qué periodo corresponde** el pago, independientes de `payment_date` (fecha de la transacción).

## Individual vs. grupal

`POST /api/payments/students`

- **1 alumno** (`student_id`): un `payments` con `student_id`.
- **Varios** (`student_ids: []`): un `payments` padre con `student_id = NULL` y una fila por alumno en `payment_students` con el monto **dividido en partes iguales** (`amount / n`).

Al registrar, notifica por push al padre del alumno (si tiene `push_token`).

## Mensualidades pendientes

`GET /api/payments/pending?month=&year=` — admin

1. Toma alumnos con `status` `activo` o `pendiente`.
2. Esperado = `categories.monthly_fee` de su categoría.
3. Pagado = suma de pagos directos + `payment_students` de ese mes/año.
4. Devuelve solo a quienes `pagado < esperado`, con `pending_amount` y totales.

Una beca (`status = beca`) **no** aparece en pendientes.

## Estado de cuenta

`GET /api/payments/account-statement/:studentId` — admin, padre

- Verifica que el padre sea dueño del alumno (chequeo propio, no `findStudentForTenant`).
- Suma pagos directos + grupales.
- Devuelve `monthlyFee`, `pendingAmount`, `hasPaidThisMonth`, `totalPaid` y `movements`.

`dueDate` se calcula con el año en curso (`<año actual>-<mes>-10`), así que no hay que tocarlo cada enero.

## Resumen del año (salud financiera)

`GET /api/payments/summary?year=` — admin

Una sola consulta anual (`payments` de ese `payment_year` y tipos `mensualidad`/`pago_profesor`) que devuelve los 12 meses con `collected`, `payroll` y `margin`, más los `totals` del año. Es la fuente de los KPIs y la gráfica de `/finances`; el "por cobrar" y la tasa de cobranza se calculan en el cliente cruzando este resumen con `GET /payments/pending`.

- `collected` suma mensualidades; `payroll` suma `pago_profesor`.
- `margin = collected - payroll`.
- Meses sin movimientos vienen en ceros, nunca ausentes.

## Endpoints

| Endpoint | Rol |
|---|---|
| `GET /payments` | admin (`?type=`, `?month=`, `?year=`) |
| `GET /payments/summary` | admin (`?year=`; resumen anual) |
| `GET /payments/pending` | admin (`?month=`, `?year=`) |
| `GET /payments/student/:id` | admin, padre, alumno |
| `GET /payments/account-statement/:studentId` | admin, padre |
| `POST /payments/students` | admin |
| `POST /payments/teachers` | admin |
| `GET /export/payments` | admin (CSV/export) |

## Tablas

[[Tablas#payments]] · [[Tablas#payment_students]] · [[Tablas#categories]]

`payment_students` no tiene `school_id`: hereda el tenant del `payment` padre. Al consultar, filtra por el `payment` o por el alumno, no por `school_id` en esa tabla.
