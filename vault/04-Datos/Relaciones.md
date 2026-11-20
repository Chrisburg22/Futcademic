---
tipo: nota
area: datos
estado: verificado
actualizado: 2026-10-26
fuentes:
  - schema.sql
tags:
  - datos
---

# Relaciones

Diagramas de las relaciones que usa el código. Las columnas exactas están en [[Tablas]].

> [!note] Cardinalidad simplificada
> Varias FK son nullable: `students.parent_id`, `attendances.training_id` y `payments.student_id` (pago grupal). Los diagramas muestran la relación típica, no la obligatoriedad.

## Academia y personas

```mermaid
erDiagram
  schools ||--o{ users : tiene
  schools ||--o{ students : tiene
  schools ||--o{ categories : tiene
  schools ||--o{ venues : tiene
  schools ||--o{ deleted_students : archiva

  users ||--o{ students : "padre de"
  users ||--o| profile_information : perfil
  users ||--o| teacher_permissions : permisos
  users ||--o{ category_teachers : imparte

  categories ||--o{ students : agrupa
  categories ||--o{ category_teachers : asignada
```

- `students.id` es también `users.id` cuando el alumno tiene cuenta.
- `deleted_students` guarda una copia antes del borrado permanente.

## Operación

```mermaid
erDiagram
  categories ||--o{ events : programa
  venues ||--o{ events : sede
  events ||--o{ trainings : ocurrencias
  events ||--o{ event_exceptions : excepciones
  trainings ||--o{ attendances : registra
  students ||--o{ attendances : asiste
  users ||--o{ attendances : profesor
```

- `events` es la serie; `trainings` la ocurrencia con fecha.
- `attendances.training_id` puede ser `NULL` (pase de lista sin sesión vinculada).

## Dinero y logros

```mermaid
erDiagram
  students ||--o{ payments : "mensualidad directa"
  users ||--o{ payments : "pago a profesor"
  payments ||--o{ payment_students : divide
  students ||--o{ payment_students : recibe

  achievements ||--o{ student_achievements : desbloquea
  students ||--o{ student_achievements : obtiene
```

- `payments.student_id` es `NULL` en un pago grupal; el reparto vive en `payment_students`.
- `payment_students` y `student_achievements` no tienen `school_id`.

## Lectura rápida

| Pregunta | Ruta |
|---|---|
| ¿Quién es el padre de este alumno? | `students.parent_id → users.id` |
| ¿Qué sesión generó esta asistencia? | `attendances.training_id → trainings.id` |
| ¿Qué evento genera estas sesiones? | `trainings.event_id → events.id` |
| ¿Cómo se repartió un pago grupal? | `payment_students` |
| ¿Qué logros tiene un alumno? | `student_achievements` |
