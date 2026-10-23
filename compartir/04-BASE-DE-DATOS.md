# Base de datos

PostgreSQL sobre Supabase. El esquema base está en `schema.sql` y los cambios posteriores en `migrations/`. Todas las claves primarias son UUID.

## Las 17 tablas

### Núcleo del negocio
| Tabla | Qué guarda |
|---|---|
| `schools` | Las academias (inquilinos): nombre, logo, razón social, dirección, correo de contacto. |
| `users` | Las personas con acceso: rol, nombre, teléfono, apodo, número favorito, posición. Su `id` es el de la cuenta de autenticación. |
| `profile_information` | Datos personales ampliados del usuario: contacto de emergencia, fecha de nacimiento, notas médicas, foto. |
| `students` | Los alumnos: categoría, tutor, fecha de nacimiento, estatus, uniforme, contacto, racha actual y máxima, última asistencia. |
| `deleted_students` | Bajas: copia mínima del alumno, con fecha y quién la ejecutó. **Es la etiqueta natural del modelo de deserción.** |
| `categories` | Categorías por año de nacimiento, con color y cuota mensual. |
| `category_teachers` | Qué profesor atiende qué categoría. |
| `teacher_permissions` | Qué puede hacer cada profesor (alumnos, eventos, finanzas, pagos, asistencia, categorías). |

### Agenda y asistencia
| Tabla | Qué guarda |
|---|---|
| `venues` | Sedes: nombre, dirección, capacidad, latitud y longitud. |
| `events` | Entrenamientos y partidos, con recurrencia semanal. |
| `event_exceptions` | Fechas en que un evento recurrente se cancela. |
| `trainings` | Las sesiones concretas (una por ocurrencia): fecha, hora, sede, completada, cancelada. |
| `attendances` | El pase de lista: alumno, sesión, fecha, tipo (`entrenamiento` o `partido`) y si estuvo presente. **Es la tabla principal para minería.** |

### Finanzas y comunicación
| Tabla | Qué guarda |
|---|---|
| `payments` | Mensualidades de alumnos y pagos a profesores, con mes y año de aplicación. |
| `payment_students` | Reparto de un mismo pago entre varios alumnos, con el monto de cada uno. |
| `notifications` | Avisos a usuarios: pago recibido, recordatorio, sesión cancelada, bienvenida, logro. |
| `achievements` | Catálogo de logros por racha, asistencias, goles, puntualidad o progreso. |
| `student_achievements` | Qué logro ha desbloqueado cada alumno. |

Además, una migración añade las tablas de **conversaciones y mensajes del asistente de IA**.

## Relaciones clave

```
schools ─┬─ users ──── category_teachers ─── categories ──┬─ students ──┬─ attendances
         │                                                │             ├─ payments
         ├─ venues ─── events ─── trainings ──────────────┘             └─ student_achievements
         └─ (toda tabla de negocio lleva school_id)
```

- `attendances` apunta a un alumno, una categoría y, opcionalmente, una sesión (`trainings`).
- `students.parent_id` apunta al usuario con rol `padre`.
- `users.id` referencia a la cuenta de autenticación.

## Reglas que la base impone

| Regla | Efecto |
|---|---|
| `categories`: único `(school_id, birth_year)` | **Una categoría por año de nacimiento en cada academia.** Dos categorías «A» y «B» del mismo año no pueden coexistir como filas distintas. |
| `attendances`: único `(student_id, date, type)` | Un alumno no puede tener dos asistencias el mismo día del mismo tipo. |
| `students.status` ∈ `activo`, `beca`, `pendiente`, `inactivo` | Estatus controlado. |
| `students.birth_date` obligatorio | No se puede inscribir a un alumno sin fecha de nacimiento. |
| `attendances.type` y `trainings.type` ∈ `entrenamiento`, `partido` | Tipo controlado. |
| `payments.payment_type` ∈ `mensualidad`, `pago_profesor` | No hay otros tipos de pago. |
| `payments.payment_date` obligatorio | Todo pago lleva fecha. |
| `users.role` ∈ `super_admin`, `admin`, `profesor`, `padre`, `alumno` | Cinco roles. |

## Seguridad por fila (RLS)

`students`, `categories`, `attendances` y `payments` tienen una política `tenant_*` que restringe el acceso a las filas cuyo `school_id` coincide con el del usuario autenticado. Protege el acceso directo desde los clientes; el backend aplica el mismo filtro por su cuenta.

## Volumen al 22 de octubre de 2026

| Tabla | Registros |
|---|---:|
| `users` | 175 |
| `students` | 353 (349 activos) |
| `deleted_students` | 33 |
| `categories` | 27 |
| `trainings` | 192 |
| `attendances` | 802 (779 hasta el 22/oct; 23 con fecha futura) |
| `payments` | 620 |
| `schools` | 20 (6 con actividad real, 14 de prueba) |
| `events` · `venues` · `notifications` | 11 · 10 · 3 |

## Migraciones

| Archivo | Cambio |
|---|---|
| `20260511_add_financial_fields.sql` | Campos financieros. |
| `20260512_add_user_onboarded_at.sql` | Marca de fin de onboarding del usuario. |
| `20260512_add_username_to_users.sql` | Nombre de usuario. |
| `20260709_add_chat_tables.sql` | Tablas del asistente de IA. |
