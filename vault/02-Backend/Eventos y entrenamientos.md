---
tipo: nota
area: backend
estado: verificado
actualizado: 2026-10-26
fuentes:
  - backend/api/controllers/event.controller.ts
  - backend/api/routes/event.routes.ts
tags:
  - backend
  - eventos
---

# Eventos y entrenamientos

## Modelo

| Tabla | Rol |
|---|---|
| `events` | Serie o evento padre: categoría, sede, tipo, hora, regla de recurrencia |
| `trainings` | Ocurrencia concreta con fecha; es lo que se pasa a lista |
| `event_exceptions` | Excepciones por fecha (existe; la cancelación actual no la usa) |

`type`: `entrenamiento` o `partido`. `venues` aporta sede y coordenadas.

## Recurrencia

`POST /api/events` acepta dos mecanismos:

1. **Legacy semanal**: `recurringWeeks` (máximo 52). Genera N sesiones semanales.
2. **Regla explícita**: `recurrenceRule` con `pattern`, `daysOfWeek` y `endDate`.

Guarda `is_recurring`, `recurring_weeks`, `recurring_end_date` y `recurrence_rule`.

## Endpoints

| Endpoint | Rol | Uso |
|---|---|---|
| `GET /events` | autenticado | lista; `?category_id=` |
| `GET /events/:id` | autenticado | detalle |
| `GET /events/:id/trainings` | autenticado | sesiones de la serie |
| `GET /events/trainings?date=` | autenticado | sesiones de un día |
| `POST /events` | admin, profesor | crear serie + sesiones |
| `PUT /events/:id` | admin, profesor | editar |
| `POST /events/cancel` | admin, profesor | cancelar una sesión |
| `DELETE /events/:id` | admin | borrar |

## Cancelar una sesión

`POST /api/events/cancel` recibe `training_id` **o** `event_id + date`.

- Marca `trainings.is_cancelled = true`.
- Busca la categoría afectada y notifica por push a los padres con `push_token`.
- No borra la sesión ni el evento.

## Dónde mirar

- `backend/api/controllers/event.controller.ts` (generación de recurrencia y cancelación).
- `trainings` es la tabla que consulta el pase de lista: [[Asistencias]].
- Tablas: [[Tablas#events]], [[Tablas#trainings]], [[Tablas#event_exceptions]], [[Tablas#venues]].
