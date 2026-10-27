---
title: "Esquema de Base de Datos Futcamedic"
subtitle: "Documentación del Esquema PostgreSQL"
date: "5 de mayo de 2026"
author:
  - name: "Equipo de Ingeniería"
    affiliation: "Futcamedic"
---

## Esquema de Base de Datos Futcamedic

Base de Datos: PostgreSQL (alojada en Supabase)
Row Level Security (RLS): Habilitado en todas las tablas
Multi-Tenencia: Todas las tablas tienen columna `school_id`

---

## Resumen de Relaciones de Entidad

```
schools (1) -----> (N) users
schools (1) -----> (N) categories
schools (1) -----> (N) students
schools (1) -----> (N) attendances
schools (1) -----> (N) payments
schools (1) -----> (N) events
schools (1) -----> (N) trainings
schools (1) -----> (N) venues
schools (1) -----> (N) profile_information
schools (1) -----> (N) deleted_students
schools (1) -----> (N) teacher_permissions
schools (1) -----> (N) consent_templates
schools (1) -----> (N) enrollment_invitations
schools (1) -----> (N) enrollment_applications
schools (1) -----> (N) enrollment_consents
schools (1) -----> (N) enrollment_documents
schools (1) -----> (N) enrollment_access_log

enrollment_invitations (1) -----> (1) enrollment_applications
enrollment_applications (1) -----> (0..1) enrollment_consents
enrollment_applications (1) -----> (N) enrollment_documents
enrollment_applications (1) -----> (0..1) students (tras aprobar)
students (1) -----> (0..1) enrollment_consents
students (1) -----> (N) enrollment_documents

categories (1) -----> (N) students
categories (1) -----> (N) category_teachers
categories (1) -----> (N) attendances
categories (1) -----> (N) events
categories (1) -----> (N) trainings

users (1) -----> (N) students (como padre)
users (1) -----> (N) category_teachers (como profesor)
users (1) -----> (N) attendances (como profesor)
users (1) -----> (N) payments (como alumno o profesor)
users (1) -----> (N) teacher_permissions

events (1) -----> (N) trainings

payments (1) -----> (N) payment_students
students (1) -----> (N) payment_students
```

---

## Definición de Tablas

### 1. schools
Tenant principal — cada academia de fútbol es una escuela.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identificador único de escuela |
| name | VARCHAR(255) | NOT NULL | Nombre de la academia |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Política RLS:** Los usuarios solo pueden ver su propia escuela (`id = (SELECT school_id FROM users WHERE id = auth.uid())`)

---

### 2. users
Vinculado a `auth.users` de Supabase — almacena rol y asociación de escuela.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, FK → auth.users(id) ON DELETE CASCADE | Igual al ID de usuario de Supabase Auth |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| role | VARCHAR(50) | CHECK IN ('super_admin','admin','profesor','padre','alumno') | Rol del usuario |
| full_name | VARCHAR(255) | NOT NULL | Nombre completo del usuario |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Política RLS:** Los usuarios solo pueden ver usuarios de la misma escuela.
**Nota:** `auth.users` es gestionado por Supabase — email, contraseña, confirmación de email se manejan allí.

---

### 3. categories
Categorías deportivas basadas en año de nacimiento.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único de categoría |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| birth_year | INT | NOT NULL | Año de nacimiento para agrupación por edad |
| name | VARCHAR(100) | NOT NULL | Nombre de categoría (ej., "U-12") |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Restricción Única:** `UNIQUE(school_id, birth_year)` — previene categorías duplicadas por escuela por año.
**Política RLS:** Los usuarios solo pueden ver categorías de la misma escuela.

---

### 4. category_teachers
Relación muchos-a-muchos entre profesores y categorías.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único de registro |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| category_id | UUID | FK → categories(id) ON DELETE CASCADE, NOT NULL | Categoría vinculada |
| teacher_id | UUID | FK → users(id) ON DELETE CASCADE, NOT NULL | Profesor vinculado |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Restricción Única:** `UNIQUE(category_id, teacher_id)` — previene asignaciones duplicadas.
**Política RLS:** Los usuarios solo pueden ver asignaciones de la misma escuela.

---

### 5. students
Alumnos inscritos en la academia.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único de alumno |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| category_id | UUID | FK → categories(id) ON DELETE CASCADE, NOT NULL | Categoría asignada |
| parent_id | UUID | FK → users(id) ON DELETE SET NULL | Padre vinculado (rol padre) |
| full_name | VARCHAR(255) | NOT NULL | Nombre completo del alumno |
| birth_date | DATE | NOT NULL | Fecha de nacimiento del alumno |
| uniform_delivered | BOOLEAN | DEFAULT FALSE | Si se entregó el uniforme |
| status | VARCHAR(20) | CHECK IN ('activo','beca','pendiente','inactivo'), DEFAULT 'activo' | Estado de inscripción |
| curp | TEXT | | CURP del alumno (opcional, indexada por escuela) |
| guardian_relationship | TEXT | | Parentesco del tutor vinculado (`madre`, `padre`, `tutor_legal`, `abuelo`, `otro`) |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Política RLS:** Los usuarios solo pueden ver alumnos de la misma escuela. Los padres solo ven a sus propios hijos (`parent_id = auth.uid()`).
**Valores de Estado:**
- `activo` — Activo, alumno pagando
- `beca` — Alumno becado (no requiere pago)
- `pendiente` — Inscripción pendiente
- `inactivo` — Inactivo, ya no asiste

---

### 6. attendances
Registros de asistencias para sesiones de entrenamiento y partidos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único de asistencia |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| student_id | UUID | FK → students(id) ON DELETE CASCADE, NOT NULL | Alumno marcado |
| category_id | UUID | FK → categories(id) ON DELETE CASCADE, NOT NULL | Contexto de categoría |
| teacher_id | UUID | FK → users(id) ON DELETE SET NULL | Profesor que tomó asistencia |
| training_id | UUID | FK → trainings(id) ON DELETE SET NULL | Sesión de entrenamiento vinculada |
| date | DATE | NOT NULL | Fecha de asistencia |
| type | VARCHAR(50) | CHECK IN ('entrenamiento','partido') | Tipo de sesión |
| present | BOOLEAN | NOT NULL, DEFAULT FALSE | Si el alumno estuvo presente |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Restricción Única:** `UNIQUE(student_id, date, type)` — previene asistencia duplicada para mismo alumno/fecha/tipo.
**Política RLS:** Los usuarios solo pueden ver asistencias de la misma escuela.

---

### 7. payments
Registros de pagos y mensualidades.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único de pago |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| amount | NUMERIC(10,2) | NOT NULL | Monto del pago |
| payment_date | DATE | NOT NULL | Fecha en que se realizó el pago |
| payment_type | VARCHAR(50) | CHECK IN ('mensualidad','pago_profesor') | Tipo de pago |
| student_id | UUID | FK → students(id) ON DELETE SET NULL | Alumno vinculado (para mensualidad) |
| teacher_id | UUID | FK → users(id) ON DELETE SET NULL | Profesor vinculado (para pago_profesor) |
| description | TEXT | | Concepto del pago |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Tipos de Pago:**
- `mensualidad` — Mensualidad de alumno
- `pago_profesor` — Pago de nómina a profesor

**Política RLS:** Los usuarios solo pueden ver pagos de la misma escuela.

---

### 8. payment_students
Vincula múltiples alumnos a un pago grupal.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único de registro |
| payment_id | UUID | FK → payments(id) ON DELETE CASCADE, NOT NULL | Registro de pago padre |
| student_id | UUID | FK → students(id) ON DELETE CASCADE, NOT NULL | Alumno vinculado |
| amount | NUMERIC(10,2) | NOT NULL | Monto asignado a este alumno |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Restricción Única:** `UNIQUE(payment_id, student_id)` — previene entradas duplicadas de alumno en mismo pago.
**Política RLS:** Hereda de la política de tabla payments.

---

### 9. venues
Sedes / Campos de entrenamiento.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único de sede |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| name | VARCHAR(255) | NOT NULL | Nombre de la sede |
| address | TEXT | | Dirección física |
| notes | TEXT | | Notas adicionales |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Política RLS:** Los usuarios solo pueden ver sedes de la misma escuela.

---

### 10. events
Agenda maestra con reglas de recurrencia.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único de evento |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| category_id | UUID | FK → categories(id) ON DELETE CASCADE, NOT NULL | Categoría vinculada |
| venue_id | UUID | FK → venues(id) ON DELETE SET NULL | Sede vinculada |
| date | DATE | NOT NULL | Fecha de inicio del evento |
| start_time | TIME | | Hora de inicio del evento |
| type | VARCHAR(50) | CHECK IN ('entrenamiento','partido') | Tipo de evento |
| description | TEXT | | Descripción del evento |
| is_recurring | BOOLEAN | DEFAULT FALSE | Si el evento es recurrente |
| recurring_weeks | INT | | Número de semanas para recurrencia |
| recurring_end_date | DATE | | Fecha de fin para recurrencia |
| recurrence_rule | JSONB | | Configuración de recurrencia (frecuencia, días) |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Ejemplo de Regla de Recurrencia JSONB (Semanal):**
```json
{
  "frequency": "weekly",
  "days": ["Monday", "Wednesday", "Friday"]
}
```

**Ejemplo de Regla de Recurrencia JSONB (Quincenal):**
```json
{
  "frequency": "biweekly",
  "day": "Saturday"
}
```

**Política RLS:** Los usuarios solo pueden ver eventos de la misma escuela.

---

### 11. trainings
Sesiones individuales generadas de eventos recurrentes.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único de entrenamiento |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| event_id | UUID | FK → events(id) ON DELETE CASCADE, NOT NULL | Evento recurrente padre |
| category_id | UUID | FK → categories(id) ON DELETE CASCADE, NOT NULL | Categoría vinculada |
| venue_id | UUID | FK → venues(id) ON DELETE SET NULL | Sede vinculada |
| date | DATE | NOT NULL | Fecha de entrenamiento |
| start_time | TIME | | Hora de inicio de entrenamiento |
| type | VARCHAR(50) | CHECK IN ('entrenamiento','partido') | Tipo de sesión |
| is_completed | BOOLEAN | DEFAULT FALSE | Si se tomó asistencia |
| is_cancelled | BOOLEAN | DEFAULT FALSE | Si la sesión fue cancelada |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Política RLS:** Los usuarios solo pueden ver entrenamientos de la misma escuela.

---

### 12. profile_information
Detalles personales adicionales para usuarios.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, FK → users(id) ON DELETE CASCADE | Igual que users.id |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| phone | VARCHAR(20) | | Número de teléfono |
| address | TEXT | | Dirección física |
| birth_date | DATE | | Fecha de nacimiento |
| gender | VARCHAR(20) | | Género |
| emergency_contact_name | VARCHAR(255) | | Nombre de contacto de emergencia |
| emergency_contact_phone | VARCHAR(20) | | Teléfono de contacto de emergencia |
| medical_notes | TEXT | | Notas médicas/alergias |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de última actualización |

**Política RLS:** Los usuarios solo pueden ver perfiles de la misma escuela.

---

### 13. deleted_students
Registro de auditoría para alumnos eliminados.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único de registro |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| original_student_id | UUID | NOT NULL | ID original del alumno (antes de eliminación) |
| full_name | VARCHAR(255) | NOT NULL | Nombre del alumno al momento de eliminación |
| birth_date | DATE | NOT NULL | Fecha de nacimiento del alumno |
| category_id | UUID | | Categoría al momento de eliminación |
| parent_id | UUID | | Padre al momento de eliminación |
| deleted_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de eliminación |
| deleted_by | UUID | FK → users(id) ON DELETE SET NULL | Usuario que eliminó al alumno |

**Política RLS:** Solo admin/super_admin de la misma escuela pueden ver.

---

### 14. teacher_permissions
Permisos granulares por profesor.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único de registro |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Asociación de tenant |
| teacher_id | UUID | FK → users(id) ON DELETE CASCADE, NOT NULL | Profesor vinculado |
| can_manage_students | BOOLEAN | DEFAULT TRUE | Puede gestionar alumnos |
| can_manage_events | BOOLEAN | DEFAULT TRUE | Puede gestionar eventos |
| can_view_finances | BOOLEAN | DEFAULT FALSE | Puede ver información financiera |
| can_manage_payments | BOOLEAN | DEFAULT FALSE | Puede registrar pagos |
| can_take_attendance | BOOLEAN | DEFAULT TRUE | Puede tomar asistencias |
| can_manage_categories | BOOLEAN | DEFAULT FALSE | Puede gestionar categorías |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Marca de tiempo de creación del registro |

**Restricción Única:** `UNIQUE(teacher_id)` — un registro de permisos por profesor.
**Política RLS:** Solo admin/super_admin de la misma escuela pueden ver/gestionar.

---

### 15. consent_templates
Textos de consentimiento informado versionados. Una fila con `school_id = NULL` es
la plantilla global.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único del registro |
| school_id | UUID | FK → schools(id), NULL | NULL para la plantilla global |
| version | TEXT | NOT NULL | Etiqueta de versión (ej. `2026-10-v1`) |
| body_md | TEXT | NOT NULL | Texto del consentimiento en Markdown |
| body_hash | TEXT | | Hash del texto mostrado; se guarda con cada firma |
| active | BOOLEAN | NOT NULL, DEFAULT TRUE | Solo una plantilla activa por ámbito |
| created_by | UUID | FK → users(id) | Quién la publicó |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Restricciones únicas:** una plantilla global activa (`school_id IS NULL AND
active`) y una plantilla activa por escuela (`school_id IS NOT NULL AND active`).
**Política RLS:** lectura para usuarios autenticados de la escuela; escritura vía
clave de servicio.

---

### 16. enrollment_invitations
Links de inscripción de un solo uso, limitados a una categoría.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único del registro |
| school_id | UUID | FK → schools(id), NOT NULL | Asociación de tenant |
| category_id | UUID | FK → categories(id), NOT NULL | Categoría a la que se invita |
| token_hash | TEXT | UNIQUE, NOT NULL | SHA-256 del token opaco (nunca el token) |
| created_by | UUID | FK → users(id) | Admin que generó el link |
| expires_at | TIMESTAMPTZ | NOT NULL | Vigencia (7 días por defecto, 1–30 permitidos) |
| used_at | TIMESTAMPTZ | | Se marca al enviar la solicitud |
| revoked_at | TIMESTAMPTZ | | Se marca cuando un admin revoca el link |
| application_id | UUID | | Solicitud vinculada al abrirse |
| note | TEXT | | Nota interna (ej. "Papá de Diego") |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Estado derivado:** `activa`, `expirada`, `revocada`, `usada`.
**Política RLS:** solo admin/super_admin de la escuela puede listar o revocar.

---

### 17. enrollment_applications
Solicitudes pendientes creadas desde un link remoto. Solo se convierten en alumno
cuando un admin las aprueba.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único del registro |
| school_id | UUID | FK → schools(id), NOT NULL | Asociación de tenant |
| invitation_id | UUID | UNIQUE, FK → enrollment_invitations(id), NOT NULL | Link de origen |
| category_id | UUID | FK → categories(id), NOT NULL | Categoría solicitada |
| original_category_id | UUID | FK → categories(id) | Categoría antes de una corrección del admin |
| status | TEXT | CHECK IN ('borrador','enviada','en_revision','aprobada','rechazada'), DEFAULT 'borrador' | Estado de la solicitud |
| student_full_name | TEXT | | Nombre del alumno |
| student_birth_date | DATE | | Fecha de nacimiento |
| student_curp | TEXT | | CURP del alumno |
| student_phone | TEXT | | Teléfono del alumno |
| student_address | TEXT | | Domicilio del alumno |
| emergency_contact_name | TEXT | | Contacto de emergencia |
| emergency_contact_phone | TEXT | | Teléfono de emergencia |
| medical_notes | TEXT | | Alergias / condiciones |
| guardian_full_name | TEXT | | Nombre del tutor |
| guardian_relationship | TEXT | | Parentesco del tutor |
| guardian_email | TEXT | | Correo del tutor (obligatorio en el formulario) |
| guardian_phone | TEXT | | Celular del tutor (obligatorio en el formulario) |
| guardian_address | TEXT | | Domicilio del tutor |
| guardian_user_id | UUID | FK → users(id) | Cuenta de tutor existente, si coincide |
| submitted_at | TIMESTAMPTZ | | Fecha de envío |
| submitted_ip | INET | | IP de envío |
| submitted_user_agent | TEXT | | Dispositivo de envío |
| reviewed_by | UUID | FK → users(id) | Admin que aprobó/rechazó |
| reviewed_at | TIMESTAMPTZ | | Fecha de revisión |
| rejection_reason | TEXT | | Motivo mostrado a la familia |
| student_id | UUID | FK → students(id) | Alumno creado/vinculado tras aprobar |
| category_mismatch | BOOLEAN | NOT NULL, DEFAULT FALSE | Fecha fuera de los años de la categoría |
| reopen_count | INTEGER | NOT NULL, DEFAULT 0 | Veces que se reabrió el link |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Política RLS:** admin/profesor de la escuela pueden leer; solo admin/super_admin
puede aprobar, rechazar o reabrir.

---

### 18. enrollment_consents
Consentimiento informado firmado. No es una firma electrónica certificada: guarda
la evidencia (casillas, nombre escrito, fecha y hora, IP, dispositivo, versión y
hash del texto) más el PDF archivado.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único del registro |
| school_id | UUID | FK → schools(id), NOT NULL | Asociación de tenant |
| application_id | UUID | UNIQUE, FK → enrollment_applications(id) | Dueño mientras está pendiente |
| student_id | UUID | FK → students(id) | Dueño tras la aprobación |
| guardian_name | TEXT | NOT NULL | Nombre escrito (firma) |
| guardian_relationship | TEXT | | Parentesco con el alumno |
| consent_version | TEXT | NOT NULL | Versión de la plantilla aceptada |
| text_hash | TEXT | NOT NULL | Hash del texto exacto mostrado |
| accepted_data | BOOLEAN | NOT NULL, DEFAULT FALSE | Autorización de datos personales |
| accepted_participation | BOOLEAN | NOT NULL, DEFAULT FALSE | Entrenamientos/partidos/traslados |
| accepted_medical | BOOLEAN | NOT NULL, DEFAULT FALSE | Atención médica de urgencia |
| accepted_image | BOOLEAN | NOT NULL, DEFAULT FALSE | Uso de imagen (opcional) |
| accepted_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de aceptación |
| ip | INET | | IP de aceptación |
| user_agent | TEXT | | Dispositivo de aceptación |
| pdf_path | TEXT | | Ruta del PDF archivado |
| captured_by | UUID | FK → users(id) | Personal que lo capturó presencialmente |
| revoked_at | TIMESTAMPTZ | | Fecha de revocación |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Restricciones:** exactamente un dueño (`application_id` XOR `student_id`) y un
solo consentimiento activo por alumno (`student_id IS NOT NULL AND revoked_at IS
NULL`).
**Política RLS:** admin/profesor de la escuela pueden leer y capturar.

---

### 19. enrollment_documents
Documentos subidos desde el link remoto o el wizard presencial.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único del registro |
| school_id | UUID | FK → schools(id), NOT NULL | Asociación de tenant |
| application_id | UUID | FK → enrollment_applications(id) | Dueño mientras está pendiente |
| student_id | UUID | FK → students(id) | Dueño tras la aprobación |
| owner_type | TEXT | CHECK IN ('alumno','tutor'), NOT NULL | A quién pertenece |
| doc_type | TEXT | NOT NULL | Clave del catálogo (`acta_nacimiento`, `curp`, `identificacion_tutor_frente`, …) |
| file_path | TEXT | NOT NULL | Ruta del objeto en el bucket privado |
| file_name | TEXT | | Nombre original del archivo |
| mime_type | TEXT | | Tipo MIME validado |
| size_bytes | BIGINT | | Tamaño del archivo |
| file_hash | TEXT | | SHA-256 para deduplicar |
| status | TEXT | CHECK IN ('pendiente','validado','rechazado','vencido'), DEFAULT 'pendiente' | Estado de revisión |
| expires_at | DATE | | Vencimiento opcional (ej. certificado médico) |
| uploaded_by | UUID | FK → users(id) | Quién subió (personal) |
| uploaded_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de carga |
| verified_by | UUID | FK → users(id) | Quién revisó |
| verified_at | TIMESTAMPTZ | | Fecha de revisión |
| rejection_reason | TEXT | | Motivo mostrado a la familia |
| reused_from | UUID | FK → enrollment_documents(id) | Documento de hermano reutilizado |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Restricciones:** exactamente un dueño (`application_id` XOR `student_id`) y una
fila por `(dueño, owner_type, doc_type)`.
**Política RLS:** admin/profesor con `can_manage_students`; padres/alumnos pueden
leer los propios.

---

### 20. enrollment_access_log
Bitácora de accesos al link y acciones sobre documentos (descargas, validaciones,
aprobaciones).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único del registro |
| school_id | UUID | FK → schools(id), NOT NULL | Asociación de tenant |
| invitation_id | UUID | FK → enrollment_invitations(id) | Link relacionado |
| user_id | UUID | FK → users(id) | Usuario del personal, si está autenticado |
| action | TEXT | NOT NULL | Ej. `view_application`, `validate_document`, `approve_application` |
| entity_type | TEXT | | `application`, `document`, `consent`, … |
| entity_id | UUID | | Registro afectado |
| ip | INET | | IP de la petición |
| user_agent | TEXT | | Dispositivo de la petición |
| metadata | JSONB | | Contexto adicional |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha y hora |

**Política RLS:** solo admin/super_admin.

---

### 21. student_expediente_status (vista)
Vista de solo lectura que calcula el estado del expediente de cada alumno en vez de
guardar una columna redundante:

- `sin_tutor` — el alumno no tiene tutor vinculado (alumnos históricos conservados
  tal cual).
- `incompleto` — falta el consentimiento o al menos un documento obligatorio.
- `en_revision` — todos los documentos obligatorios están cargados pero no todos
  validados, o falta el consentimiento.
- `completo` — consentimiento firmado y los siete documentos obligatorios
  validados.

Incluye `student_id`, `school_id`, `status`, `present_documents`,
`validated_documents` y `missing_documents` (arreglo de claves obligatorias que
aún no están validadas). La
lista de alumnos funciona sin la vista si la migración aún no se aplicó.

**Almacenamiento:** la migración también crea el bucket privado
`enrollment-documents` (límite 10 MB, PDF/JPEG/PNG/WEBP/HEIC/HEIF). La API solo
expone URLs firmadas de 300 segundos.

---

## Políticas de Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. La política base de aislamiento de tenant:

```sql
CREATE POLICY "Aislamiento tenant <tabla>" ON public.<tabla>
FOR ALL USING (school_id = (SELECT school_id FROM public.users WHERE id = auth.uid()));
```

**Excepción:** El rol `super_admin` omite RLS vía clave de rol de servicio en backend.

**Excepciones del expediente:** `consent_templates` es legible por cualquier
usuario autenticado de la escuela (el link público la lee con la clave de
servicio), y las rutas públicas de inscripción no pasan por RLS: usan la clave de
servicio después de resolver el token opaco, y cada consulta se limita al
`school_id` embebido en ese token.

---

## Índices (Recomendados)

Para rendimiento, considerar agregar estos índices:

```sql
-- Columnas consultadas frecuentemente
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_category_id ON students(category_id);
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_attendances_school_id ON attendances(school_id);
CREATE INDEX idx_attendances_student_id ON attendances(student_id);
CREATE INDEX idx_attendances_date ON attendances(date);
CREATE INDEX idx_payments_school_id ON payments(school_id);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_events_school_id ON events(school_id);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_trainings_event_id ON trainings(event_id);
CREATE INDEX idx_trainings_date ON trainings(date);

-- Expediente de inscripción
CREATE INDEX idx_enrollment_invitations_school ON enrollment_invitations(school_id, created_at DESC);
CREATE INDEX idx_enrollment_applications_school_status ON enrollment_applications(school_id, status, created_at DESC);
CREATE INDEX idx_enrollment_documents_student ON enrollment_documents(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_enrollment_documents_application ON enrollment_documents(application_id) WHERE application_id IS NOT NULL;
CREATE INDEX idx_students_school_curp ON students(school_id, curp) WHERE curp IS NOT NULL;
```
