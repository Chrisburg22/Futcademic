---
tipo: nota
area: backend
estado: verificado
actualizado: 2026-10-27
fuentes:
  - backend/api/controllers/attendance.controller.ts
  - backend/api/routes/attendance.routes.ts
  - backend/api/controllers/achievement.controller.ts
tags:
  - backend
  - asistencia
---

# Asistencias

## Dos tablas

| Tabla | Qué guarda |
|---|---|
| `trainings` | Una sesión concreta (ocurrencia de un evento) con fecha, hora, sede y categoría |
| `attendances` | Una marca por alumno y sesión: `present` booleano |

`attendances` tiene `student_id`, `category_id`, `teacher_id`, `training_id`, `date`, `type` (`entrenamiento` \| `partido`).

## Pase de lista

`POST /api/attendances` — `super_admin`, `admin`, `profesor`

```json
{
  "category_id": "uuid",
  "date": "2026-10-26",
  "type": "entrenamiento",
  "training_id": "uuid-o-event-id-o-temp",
  "records": [{ "student_id": "uuid", "present": true }]
}
```

Comportamiento real:

1. Valida que los alumnos existan **en la escuela**.
2. Resuelve `training_id`: si no existe en `trainings`, lo busca como `event_id` para esa fecha; si no, lo deja `NULL`.
3. **Borra** las marcas previas de esos alumnos para esa fecha y tipo.
4. Inserta el lote nuevo.

Es un *replace* manual, no un upsert por constraints. Reenviar el pase de lista del mismo día sobrescribe.

## Consultas

| Endpoint | Rol | Uso |
|---|---|---|
| `GET /attendances/category/:id?date=` | admin, profesor | lista del día por categoría |
| `GET /attendances/student/:id` | admin, profesor, padre, alumno | historial; pasa por `findStudentForTenant` |
| `PATCH /attendances/trainings/:id/complete` | admin, profesor | marca `trainings.is_completed` |

## Rachas y logros

`attendances` **no** actualiza `current_streak`, `max_streak` ni `last_attendance_date`. El backend solo los **lee** (dashboard, stats, logros). No hay trigger en `schema.sql` ni migraciones.

`POST /achievements/check` compara `current_streak`/`max_streak` contra `achievements.threshold` y desbloquea, pero si nadie escribe la racha, los logros de racha no avanzan. El documento de minería afirma que la racha se actualiza en cada marca: **no verificable en este repo** (podría estar en la app móvil o en Supabase). Ver [[Deriva conocida]].

## Quién lo llama

La pantalla web manda **todos** los alumnos de la categoría (menos los
inactivos sin marca) con `present` true o false, y el `training_id` de la
sesión del día cuando la hay. Ver [[Modulo Asistencias|Módulo Asistencias]].

## Dónde mirar

- Lógica: `backend/api/controllers/attendance.controller.ts`
- Prueba de integración: `TC-I-03 — Pase de lista batch`
- Tablas: [[Tablas#trainings]], [[Tablas#attendances]]
