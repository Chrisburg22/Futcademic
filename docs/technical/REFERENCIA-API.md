---
title: "Referencia de API Futcamedic"
subtitle: "Documentación Completa de la API REST"
date: "5 de mayo de 2026"
author:
  - name: "Equipo de Ingeniería"
    affiliation: "Futcamedic"
---

## Referencia de API Futcamedic

URL Base: `http://localhost:3000/api` (desarrollo) o `https://your-render-app.onrender.com/api` (producción)

Todos los endpoints requieren autenticación vía JWT de Supabase en el encabezado Authorization:
```
Authorization: Bearer <supabase_jwt_token>
```

El multi-tenancia se impone vía `school_id` del perfil del usuario autenticado.

---

## Endpoints de Autenticación

### POST /auth/register
Registra una nueva escuela con usuario admin.

**Cuerpo de la Solicitud:**
```json
{
  "schoolName": "Academia de Fútbol XYZ",
  "fullName": "Juan Pérez",
  "email": "juan@xyz.com",
  "password": "SecurePass123!"
}
```

**Respuesta:**
```json
{
  "message": "Escuela y admin creados exitosamente",
  "user": { "id": "uuid", "email": "juan@xyz.com" },
  "school": { "id": "uuid", "name": "Academia de Fútbol XYZ" }
}
```

### POST /auth/invite
Invita un usuario (profesor, admin, padre). Requiere rol `admin`.

**Cuerpo de la Solicitud:**
```json
{
  "email": "profesor@xyz.com",
  "fullName": "Carlos Gómez",
  "role": "profesor",
  "phone": "555-1234"
}
```

**Respuesta:**
```json
{
  "message": "Usuario invitado exitosamente",
  "user": { "id": "uuid", "email": "profesor@xyz.com", "role": "profesor" }
}
```

---

## Endpoints de Alumnos

### GET /students
Lista alumnos. Admin ve todos; padre ve solo sus hijos.

**Parámetros de Consulta:**
- `category_id` (opcional): Filtrar por categoría
- `status` (opcional): Filtrar por estado (activo, beca, pendiente, inactivo)

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "full_name": "Juanito Pérez",
    "birth_date": "2012-05-15",
    "status": "activo",
    "uniform_delivered": false,
    "category": { "id": "uuid", "name": "U-12", "birth_year": 2012 },
    "parent": { "id": "uuid", "full_name": "María Pérez", "email": "maria@email.com" }
  }
]
```

### POST /students
Crea un nuevo alumno. Requiere rol `admin`.

**Cuerpo de la Solicitud:**
```json
{
  "fullName": "Juanito Pérez",
  "birthDate": "2012-05-15",
  "categoryId": "uuid",
  "parentEmail": "maria@email.com",
  "parentName": "María Pérez",
  "parentPhone": "555-5678",
  "medicalNotes": "No alergias"
}
```

### GET /students/:id
Obtiene detalles del alumno con historial de asistencias y pagos.

### PUT /students/:id
Actualiza información del alumno.

**Cuerpo de la Solicitud:**
```json
{
  "fullName": "Juanito Pérez",
  "birthDate": "2012-05-15",
  "categoryId": "uuid",
  "parentId": "uuid",
  "medicalNotes": "Notas actualizadas"
}
```

### PATCH /students/:id/status
Cambia estado del alumno.

**Cuerpo de la Solicitud:**
```json
{
  "status": "beca"
}
```

Estados válidos: `activo`, `beca`, `pendiente`, `inactivo`

### PATCH /students/:id/uniform
Alterna estado de entrega de uniforme.

**Respuesta:**
```json
{
  "message": "Estado de uniforme actualizado",
  "uniform_delivered": true
}
```

### DELETE /students/:id
Elimina alumno (permanente). Crea registro de auditoría en `deleted_students`.

### GET /students/deleted
Lista alumnos eliminados (solo admin).

---

## Endpoints del Expediente del Alumno

El *expediente* es el archivo de inscripción: consentimiento informado firmado,
identificación del tutor y el checklist estándar de documentos. Un expediente
incompleto **nunca** bloquea entrenamientos, pagos ni el estado del alumno; solo
bloquea la descarga del paquete para liga/copa.

Documentos obligatorios: `acta_nacimiento`, `curp`, `identificacion_tutor_frente`,
`identificacion_tutor_reverso`, `comprobante_domicilio`, `certificado_medico`,
`foto_alumno`. `otro` es opcional.

### GET /students/:id/expediente
Devuelve el estado calculado del expediente, el consentimiento activo, URLs
firmadas de los documentos (válidas 5 minutos) y la plantilla de consentimiento
activa.

Roles: `super_admin`, `admin`, `profesor`, `padre`, `alumno` (con alcance por
fila: un padre solo ve a sus hijos y un alumno solo su propia ficha).

**Respuesta:**
```json
{
  "student_id": "uuid",
  "status": "incompleto",
  "has_consent": false,
  "present_documents": 2,
  "validated_documents": 1,
  "missing_documents": 5,
  "consent": null,
  "documents": [
    {
      "id": "uuid",
      "doc_type": "curp",
      "owner_type": "alumno",
      "status": "validado",
      "signed_url": "https://..."
    }
  ],
  "checklist": [
    { "type": "curp", "label": "CURP", "owner_type": "alumno", "required": true }
  ],
  "consent_template": { "version": "2026-10-v1", "body_md": "..." },
  "can_download_package": false
}
```

Valores de estado: `sin_tutor` (alumno histórico sin tutor vinculado),
`incompleto`, `en_revision`, `completo`.

`missing_documents` cuenta los documentos obligatorios que aún no están
validados (un documento cargado pero `pendiente` también cuenta como faltante).

### POST /students/:id/consent
Captura el consentimiento informado. **No** es una firma electrónica
certificada: guarda las casillas, el nombre escrito, la fecha y hora, la IP, el
dispositivo, la versión del texto y su hash, y archiva un PDF como constancia.

**Cuerpo de la petición:**
```json
{
  "guardian_name": "María Pérez",
  "guardian_relationship": "madre",
  "guardian_email": "maria@email.com",
  "guardian_phone": "555-5678",
  "accepted_data": true,
  "accepted_participation": true,
  "accepted_medical": true,
  "accepted_image": false
}
```

### GET /students/:id/consent.pdf
Descarga el PDF archivado del consentimiento. Mismo alcance por fila que el
expediente.

### POST /students/:id/documents
Sube un documento (`multipart/form-data`): `file`, `doc_type`, `owner_type`
(`alumno` | `tutor`), `expires_at` (opcional). Máximo 10 MB. Se valida por magic
bytes: PDF, JPEG, PNG, WEBP, HEIC, HEIF. Los archivos viven en el bucket privado
`enrollment-documents`.

### PATCH /students/:id/documents/:docId
Revisa un documento.

**Cuerpo de la petición:**
```json
{ "status": "validado", "rejection_reason": null, "expires_at": null }
```

`rejection_reason` es obligatorio cuando `status` es `rechazado`.

### DELETE /students/:id/documents/:docId
Elimina el registro y el archivo almacenado. Requiere `admin`, `super_admin` o un
profesor con `can_manage_students`.

### GET /students/:id/documents/:docId/url
Devuelve `{ "url": "..." }`, una URL firmada válida 300 segundos. Cada acceso se
registra en `enrollment_access_log`.

### POST /students/:id/documents/reuse-tutor
Copia la identificación validada del tutor (frente y reverso) de un hermano a
este alumno. Los archivos no se duplican: los nuevos registros apuntan a los
mismos objetos almacenados.

**Respuesta:** `{ "copied": 2 }`

### GET /students/:id/tutor-documents/availability
`{ "available": true }` cuando un hermano ya tiene una identificación de tutor
validada que se puede reutilizar.

### GET /students/:id/expediente/package
Descarga un ZIP con la carátula, el PDF del consentimiento y los siete documentos
validados. Solo `admin`/`super_admin`. Devuelve `409` si el expediente no está
`completo`.

---

## Endpoints de Inscripción

Inscripción remota mediante un link de un solo uso, limitado a una categoría. El
token es opaco: solo resuelve la escuela, la categoría, la invitación y su
borrador. Nunca expone a otros alumnos ni a otras familias.

Las invitaciones vencen a los 7 días por defecto (1–30), se pueden revocar y son
de un solo uso. Al enviar se crea una **solicitud pendiente**, no un alumno: un
admin debe aprobarla. El token en claro solo se guarda como hash, así que un link
perdido debe regenerarse.

> El orden de las rutas importa: las rutas de administración
> (`/enrollment/invitations`, `/enrollment/applications`,
> `/enrollment/consent-template`) se declaran antes de `/enrollment/:token`; de
> lo contrario se interpretarían como tokens.

### GET /enrollment/:token
**Público** (autorizado por el token, sin JWT). Devuelve solo la academia, la
categoría, el estado de la invitación, el borrador editable, los documentos
cargados, el checklist y el texto de la plantilla de consentimiento.

```json
{
  "academy": { "name": "Academia Halcones", "logo_url": null },
  "category": { "name": "Sub-12", "color": "#1c7ed6", "birth_years": ["2014-2015"] },
  "invitation": {
    "status": "activa",
    "expires_at": "2026-11-02T18:00:00Z",
    "editable": true,
    "can_download_consent": false
  },
  "application": null,
  "terminal": false,
  "form": { "fields": { "student_full_name": "" }, "category_mismatch": false },
  "documents": [],
  "consent_template": { "version": "2026-10-v1", "body_md": "..." },
  "checklist": []
}
```

Devuelve `404` para tokens desconocidos y `410` cuando el link expiró, fue
revocado o ya se usó.

### PUT /enrollment/:token/draft
Guarda el borrador sin enviarlo. Acepta los campos del alumno y del tutor.
Devuelve `409` cuando la solicitud ya fue enviada.

### POST /enrollment/:token/documents
Sube un documento del borrador (`multipart/form-data`, mismas reglas de
validación que el expediente del alumno).

### POST /enrollment/:token/submit
Envía la solicitud. Requiere los datos del alumno, nombre/correo/celular y
parentesco del tutor, el consentimiento y la identificación del tutor (frente y
reverso). Los documentos del alumno pueden quedar pendientes.

```json
{
  "fields": {
    "student_full_name": "Diego Ramos",
    "student_birth_date": "2015-03-04",
    "guardian_email": "ana@email.com",
    "guardian_phone": "5551234567"
  },
  "consent": {
    "guardian_name": "Ana Ramos",
    "guardian_relationship": "madre",
    "accepted_data": true,
    "accepted_participation": true,
    "accepted_medical": true,
    "accepted_image": false
  }
}
```

### GET /enrollment/:token/consent.pdf
**Público.** Descarga el PDF del consentimiento una vez enviada la solicitud.

### GET /enrollment/invitations
Lista las invitaciones con un `status` derivado: `activa`, `expirada`,
`revocada`, `usada`. Nunca se devuelve el hash del token ni la URL.

### POST /enrollment/invitations
Crea un link.

```json
{ "category_id": "uuid", "expires_in_days": 7, "note": "Papá de Diego" }
```

**Respuesta (la única vez que se devuelve la URL):**
```json
{
  "id": "uuid",
  "url": "https://app.example.com/inscripcion/tok_...",
  "expires_at": "2026-11-02T18:00:00Z",
  "category": { "name": "Sub-12" }
}
```

### DELETE /enrollment/invitations/:id
Revoca una invitación activa. Solo `admin`/`super_admin`.

### GET /enrollment/applications
Lista las solicitudes. Filtros opcionales `status` y `category_id`. Roles:
`super_admin`, `admin`, `profesor`.

### GET /enrollment/applications/:id
Detalle completo de la solicitud: datos del alumno y del tutor, consentimiento con
URL firmada del PDF, documentos con URLs firmadas, documentos de tutor
reutilizables de un hermano, checklist e historial de revisión.

### POST /enrollment/applications/:id/approve
Aprueba y crea al alumno. Requiere el consentimiento y la identificación del tutor
(frente y reverso). Se puede corregir `category_id`; `validate_tutor_docs: true`
marca la identificación del tutor como validada en el mismo paso.

```json
{ "category_id": "uuid", "validate_tutor_docs": true }
```

**Respuesta:**
```json
{
  "student_id": "uuid",
  "guardian_reused": false,
  "guardian_email_sent": true,
  "credentials": { "username": "diego.ramos", "temp_password": "..." }
}
```

La aprobación usa el mismo `createStudentRecord` que el wizard presencial, mueve
el consentimiento y los documentos de la solicitud al alumno y conserva
`application.student_id` como vínculo entre ambos registros.

### POST /enrollment/applications/:id/reject
Rechaza con motivo obligatorio. Después se puede reabrir el link.

```json
{ "reason": "La identificación está borrosa." }
```

### POST /enrollment/applications/:id/reopen
Reabre una solicitud rechazada: la invitación vuelve a `borrador` y su vigencia se
extiende 7 días.

**Respuesta:** `{ "expires_at": "..." }`

### PATCH /enrollment/applications/:id/documents/:docId
Valida o rechaza un documento antes de aprobar. `rejection_reason` es obligatorio
para `rechazado`. Devuelve `409` si la solicitud ya fue aprobada (en ese caso se
usa el expediente del alumno).

### GET /enrollment/consent-template
Plantilla de consentimiento activa de la escuela (`version`, `body_md`,
`body_hash`).

---

## Endpoints de Asistencias

### GET /attendances/category/:categoryId
Obtiene asistencias para una categoría, filtrado por fecha.

**Parámetros de Consulta:**
- `date` (opcional): Filtrar por fecha (AAAA-MM-DD)

### GET /attendances/student/:studentId
Obtiene historial de asistencias de un alumno.

### POST /attendances
Guarda asistencias en bloque (pase de lista). Usa upsert para prevenir duplicados.

**Cuerpo de la Solicitud:**
```json
{
  "trainingId": "uuid",
  "date": "2026-05-05",
  "type": "entrenamiento",
  "records": [
    { "studentId": "uuid", "present": true },
    { "studentId": "uuid", "present": false }
  ]
}
```

### PATCH /attendances/trainings/:id/complete
Marca sesión de entrenamiento como completada.

**Respuesta:**
```json
{
  "message": "Entrenamiento marcado como completado",
  "is_completed": true
}
```

---

## Endpoints de Pagos

### GET /payments
Lista pagos.

**Parámetros de Consulta:**
- `type` (opcional): `mensualidad` o `pago_profesor`
- `month` (opcional): Filtrar por mes (formato AAAA-MM, ej., "2026-05")

### GET /payments/student/:studentId
Obtiene historial de pagos de un alumno específico.

### GET /payments/pending
Obtiene alumnos sin pago en el mes actual.

### POST /payments/students
Registra pago para alumno(s). Soporta pagos individuales o en bloque.

**Cuerpo de la Solicitud (Individual):**
```json
{
  "studentId": "uuid",
  "amount": 500.00,
  "paymentDate": "2026-05-05",
  "description": "Mensualidad Mayo 2026"
}
```

**Cuerpo de la Solicitud (En bloque):**
```json
{
  "studentIds": ["uuid1", "uuid2", "uuid3"],
  "amount": 1500.00,
  "paymentDate": "2026-05-05",
  "description": "Mensualidad Mayo 2026 (Grupal)"
}
```
Nota: Para pagos en bloque, el monto se divide equitativamente entre los alumnos y se registra en `payment_students`.

### POST /payments/teachers
Registra pago a profesor (nómina).

**Cuerpo de la Solicitud:**
```json
{
  "teacherId": "uuid",
  "amount": 2000.00,
  "paymentDate": "2026-05-05",
  "description": "Pago quincenal Mayo"
}
```

---

## Endpoints de Eventos

### GET /events
Lista eventos. Los profesores ven solo eventos para sus categorías.

**Parámetros de Consulta:**
- `category_id` (opcional): Filtrar por categoría
- `month` (opcional): Filtrar por mes (AAAA-MM)

### GET /events/trainings
Obtiene sesiones de entrenamiento de hoy. Los profesores ven solo sus categorías.

**Parámetros de Consulta:**
- `date` (opcional): Filtrar por fecha (AAAA-MM-DD), por defecto hoy

### POST /events
Crea un nuevo evento con recurrencia opcional.

**Cuerpo de la Solicitud (Evento Único):**
```json
{
  "categoryId": "uuid",
  "venueId": "uuid",
  "date": "2026-05-10",
  "startTime": "16:00",
  "type": "entrenamiento",
  "description": "Entrenamiento técnico"
}
```

**Cuerpo de la Solicitud (Evento Recurrente - Semanal):**
```json
{
  "categoryId": "uuid",
  "venueId": "uuid",
  "date": "2026-05-10",
  "startTime": "16:00",
  "type": "entrenamiento",
  "description": "Entrenamiento semanal",
  "isRecurring": true,
  "recurringWeeks": 12,
  "recurrenceRule": {
    "frequency": "weekly",
    "days": ["Monday", "Wednesday", "Friday"]
  }
}
```

**Cuerpo de la Solicitud (Evento Recurrente - Quincenal):**
```json
{
  "categoryId": "uuid",
  "venueId": "uuid",
  "date": "2026-05-10",
  "startTime": "16:00",
  "type": "entrenamiento",
  "isRecurring": true,
  "recurringWeeks": 8,
  "recurrenceRule": {
    "frequency": "biweekly",
    "day": "Saturday"
  }
}
```

### GET /events/:id/trainings
Obtiene todas las sesiones de entrenamiento generadas de un evento recurrente.

### POST /events/cancel
Cancela sesión(es) de entrenamiento.

**Cuerpo de la Solicitud (Cancelar entrenamiento individual):**
```json
{
  "trainingId": "uuid",
  "notifyParents": true
}
```

**Cuerpo de la Solicitud (Cancelar evento completo/recurrencia):**
```json
{
  "eventId": "uuid",
  "cancelAll": true,
  "notifyParents": true
}
```

### DELETE /events/:id
Elimina un evento y todas sus sesiones de entrenamiento.

---

## Endpoints de Categorías

Una categoría es el equipo de una generación. `birth_year` es el año ancla;
`birth_year_end` solo se usa cuando la categoría junta dos generaciones.

No hay borrado duro: `students`, `events`, `trainings` y `attendances` apuntan a
la categoría sin `ON DELETE`, así que las categorías se archivan.

Escritura: `super_admin` y `admin` siempre; `profesor` solo con
`teacher_permissions.can_manage_categories`, y solo en sus propias categorías.

### GET /categories
Lista las categorías, acotadas por rol: los administradores ven toda la escuela,
el profesor las suyas, el padre las de sus hijos y el alumno la suya.

**Parámetros:** `search`, `status` (`activa` | `inactiva` | `archivada` |
`all`; las archivadas se ocultan por defecto), `birth_year`, `teacher_id`,
`sort` (`birth_year` | `name` | `created_at` | `monthly_fee`), `order` (`asc` |
`desc`), `page`, `per_page` (máximo 100).

Devuelve un array plano; el total viaja en la cabecera `X-Total-Count`. Cada
elemento trae `coaches_count`, `students_count`, `teacher` (nombre),
`teacher_id` y `all_teachers[]`.

### GET /categories/mine
Obtiene las categorías asignadas al profesor actual.

### GET /categories/:id
Una categoría con `students_count`, `sessions_count`,
`upcoming_sessions_count` y `schedule[]` (eventos de entrenamiento recurrentes).

### POST /categories
Crea una nueva categoría.

**Cuerpo de la Solicitud:**
```json
{
  "name": "U-12",
  "birth_year": 2013,
  "birth_year_end": 2012,
  "description": "Generación mixta",
  "color": "#1971c2",
  "monthly_fee": 500,
  "max_students": 20,
  "teacher_ids": ["uuid"]
}
```

Se validan `name` (2-60 caracteres), `birth_year` (entero), `color`
(`#RRGGBB`), `monthly_fee` (>= 0) y `max_students` (>= 1). Un nombre repetido
dentro de la escuela devuelve **409**.

### POST /categories/full
El mismo cuerpo más un horario recurrente; además genera los entrenamientos.

**Campos extra:** `days` (números 0-6, con 0 = domingo, o nombres en inglés
`monday`…`sunday`), `start_time` (`HH:MM`, obligatorio si hay `days`),
`venue_id`, `recurrence_weeks` (1-52, por defecto 12).

### PATCH /categories/:id
Actualiza una categoría. Es parcial: solo se escriben los campos presentes.

### PATCH /categories/:id/status
Archiva, desactiva o restaura. Solo `super_admin` y `admin`.

**Cuerpo de la Solicitud:**
```json
{ "status": "archivada" }
```

Archivar sella `archived_at`; restaurar lo limpia. La respuesta incluye
`students_count` para que la UI avise de los jugadores que siguen asociados.

### POST /categories/:id/teachers
Asigna un profesor a una categoría. Es idempotente.

**Cuerpo de la Solicitud:**
```json
{
  "teacher_id": "uuid"
}
```

### DELETE /categories/:id/teachers/:teacherId
Quita un profesor de una categoría.

---

## Endpoints de Sedes

### GET /venues
Lista todas las sedes.

### POST /venues
Crea una nueva sede.

**Cuerpo de la Solicitud:**
```json
{
  "name": "Campo Principal",
  "address": "Av. Reforma 123, Ciudad",
  "notes": "Césped artificial, vestidores disponibles"
}
```

### PATCH /venues/:id
Actualiza información de la sede.

### DELETE /venues/:id
Elimina una sede.

---

## Endpoints de Usuarios

### GET /users
Lista usuarios filtrados por rol.

**Parámetros de Consulta:**
- `role` (opcional): Filtrar por rol (super_admin, admin, profesor, padre, alumno)

### GET /users/teachers/:id
Obtiene detalles del profesor con categorías asignadas y email de Auth.

### PUT /users/:id
Actualiza perfil de usuario.

**Cuerpo de la Solicitud:**
```json
{
  "fullName": "Carlos Gómez",
  "phone": "555-1234",
  "address": "Calle 123",
  "emergencyContactName": "Ana Gómez",
  "emergencyContactPhone": "555-5678",
  "medicalNotes": "Ninguna"
}
```

### PATCH /users/me/password
Cambia contraseña del usuario actual.

**Cuerpo de la Solicitud:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

---

## Endpoints de Permisos de Profesores

### GET /permissions/mine
Obtiene permisos del profesor actual.

### GET /permissions/:teacherId
Obtiene permisos de un profesor específico (solo admin).

### PUT /permissions/:teacherId
Actualiza permisos de profesor (solo admin).

**Cuerpo de la Solicitud:**
```json
{
  "can_manage_students": true,
  "can_manage_events": true,
  "can_view_finances": false,
  "can_manage_payments": false,
  "can_take_attendance": true,
  "can_manage_categories": false
}
```

---

## Endpoints de Escuelas

### PUT /schools/:id
Actualiza información de la escuela (solo admin).

**Cuerpo de la Solicitud:**
```json
{
  "name": "Nueva Academia XYZ",
  "logoUrl": "https://supabase.storage.com/avatars/school-logo.png"
}
```

---

## Respuestas de Error

Todos los endpoints devuelven errores en este formato:

```json
{
  "error": "Mensaje de error describiendo qué salió mal"
}
```

**Códigos de Estado HTTP Comunes:**
- `200` - Éxito
- `201` - Creado
- `400` - Solicitud Incorrecta (error de validación)
- `401` - No Autorizado (token faltante/inválido)
- `403` - Prohibido (rol/permisos insuficientes)
- `404` - No Encontrado
- `409` - Conflicto (registro duplicado)
- `500` - Error Interno del Servidor

---

## Pila de Middleware

Todas las solicitudes de API pasan por esta cadena de middleware:

1. **requireAuth** (`api/middlewares/auth.middleware.ts`)
   - Valida JWT de Supabase del encabezado `Authorization: Bearer <token>`
   - Configura `req.user = { id, email, ...decodedJWT }`

2. **requireTenant** (`api/middlewares/tenant.middleware.ts`)
   - Busca en tabla `users` usando `req.user.id`
   - Configura `req.tenant = { school_id, role, user_id }`
   - Rechaza si usuario no se encuentra en tabla `users`

3. **requireRole(...roles)** (aplicado por ruta)
   - Verifica si `req.tenant.role` está en la lista de roles permitidos
   - Rechaza con 403 si rol no autorizado

---

## Limitación de Tasa

Actualmente no hay limitación de tasa implementada. Considerar agregar para producción:
- Supabase Auth tiene limitación de tasa integrada para endpoints de auth
- Considerar `express-rate-limit` para endpoints de API en producción
