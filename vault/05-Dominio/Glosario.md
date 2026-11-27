---
tipo: nota
area: dominio
estado: verificado
actualizado: 2026-10-27
fuentes:
  - schema.sql
  - backend/api/routes
  - docs/product/DEFINICION-PRODUCTO.md
tags:
  - dominio
---

# Glosario

| Término | Significado en este proyecto |
|---|---|
| **Futcademic** | Nombre del producto. El código heredado y algunos docs dicen "Futcamedic" |
| **Academia / escuela** | `schools`. Es el tenant |
| **Tenant** | Conjunto de datos de una academia, aislado por `school_id` |
| **Sede** | `venues`: lugar físico con dirección y coordenadas |
| **Categoría** | `categories`: equipo de una generación (`birth_year`, etiqueta de texto) con cuota (`monthly_fee`) |
| **Alumno** | `students`; si tiene cuenta, `students.id = users.id` y rol `alumno` |
| **Tutor / padre** | `users` con rol `padre`; se enlaza por `students.parent_id` |
| **Profesor** | `users` con rol `profesor`; se asigna a categorías por `category_teachers` |
| **Admin** | Dueño/operador de la academia; crea la cuenta en `/register` |
| **`super_admin`** | En la práctica comparte permisos con `admin` en todas las rutas; no cruza escuelas (`requireTenant` también lo acota a un `school_id`) |
| **Evento** | `events`: serie o plantilla (categoría, sede, hora, recurrencia) |
| **Sesión / entrenamiento** | `trainings`: ocurrencia concreta de un evento en una fecha |
| **Pase de lista** | Acción de marcar `present` por alumno en una sesión |
| **Asistencia** | Fila en `attendances` |
| **Racha** | `current_streak` / `max_streak`; hoy solo se leen, no se escriben en el backend |
| **Logro** | `achievements` + `student_achievements`; umbral por tipo (`racha`, `asistencias`, …) |
| **Mensualidad** | Pago `payment_type = mensualidad` asociado a un periodo (`payment_month`/`payment_year`) |
| **Beca** | `students.status = beca`; no aparece en pendientes de pago |
| **Pago grupal** | Un `payments` con `student_id = NULL` repartido en `payment_students` |
| **Estado de cuenta** | Resumen de cuota, pagado y pendiente de un alumno |
| **Onboarding** | Completar perfil tras la invitación (`users.onboarded_at`) |
| **Username interno** | `nombre.apellido###`; identifica al alumno sin email real |
| **Uniforme** | `students.uniform_delivered`, entregado o no |

## Nombres que se confunden

| Se dice | Tabla / ruta real |
|---|---|
| "clase" o "entrenamiento" | `trainings` (no `events`) |
| "escuela" | `schools` |
| "cuenta" o "usuario" | `users` (Auth vive aparte) |
| "cobro" | `payments` |
| "asistencia" | `attendances` (una marca, no la sesión) |

Ver [[Roles y permisos]] y [[Flujos clave]].
