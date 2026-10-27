---
title: "Futcamedic API Reference"
subtitle: "Complete REST API Documentation"
date: "May 5, 2026"
author:
  - name: "Engineering Team"
    affiliation: "Futcamedic"
---

## Futcamedic API Reference

Base URL: `http://localhost:3000/api` (development) or `https://your-render-app.onrender.com/api` (production)

All endpoints require authentication via Supabase JWT in the Authorization header:
```
Authorization: Bearer <supabase_jwt_token>
```

Multi-tenancy is enforced via `school_id` from the authenticated user's profile.

---

## Authentication Endpoints

### POST /auth/register
Register a new school with admin user.

**Request Body:**
```json
{
  "schoolName": "Academia de Fútbol XYZ",
  "fullName": "Juan Pérez",
  "email": "juan@xyz.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "School and admin created successfully",
  "user": { "id": "uuid", "email": "juan@xyz.com" },
  "school": { "id": "uuid", "name": "Academia de Fútbol XYZ" }
}
```

### POST /auth/invite
Invite a user (teacher, admin, parent). Requires `admin` role.

**Request Body:**
```json
{
  "email": "teacher@xyz.com",
  "fullName": "Carlos Gómez",
  "role": "profesor",
  "phone": "555-1234"
}
```

**Response:**
```json
{
  "message": "User invited successfully",
  "user": { "id": "uuid", "email": "teacher@xyz.com", "role": "profesor" }
}
```

---

## Student Endpoints

### GET /students
List students. Admin sees all; parent sees only their children.

**Query Parameters:**
- `category_id` (optional): Filter by category
- `status` (optional): Filter by status (activo, beca, pendiente, inactivo)

**Response:**
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
Create a new student. Requires `admin` role.

**Request Body:**
```json
{
  "fullName": "Juanito Pérez",
  "birthDate": "2012-05-15",
  "categoryId": "uuid",
  "parentEmail": "maria@email.com",
  "parentName": "María Pérez",
  "parentPhone": "555-5678",
  "medicalNotes": "No allergies"
}
```

### GET /students/:id
Get student details with attendance and payment history.

### PUT /students/:id
Update student information.

**Request Body:**
```json
{
  "fullName": "Juanito Pérez",
  "birthDate": "2012-05-15",
  "categoryId": "uuid",
  "parentId": "uuid",
  "medicalNotes": "Updated notes"
}
```

### PATCH /students/:id/status
Change student status.

**Request Body:**
```json
{
  "status": "beca"
}
```

Valid statuses: `activo`, `beca`, `pendiente`, `inactivo`

### PATCH /students/:id/uniform
Toggle uniform delivery status.

**Response:**
```json
{
  "message": "Uniform status updated",
  "uniform_delivered": true
}
```

### DELETE /students/:id
Delete student (permanent). Creates audit record in `deleted_students`.

### GET /students/deleted
List deleted students (admin only).

---

## Student Expediente Endpoints

The *expediente* is the enrollment file: signed informed consent, tutor
identification and the standard document checklist. An incomplete expediente
**never** blocks training, payments or the student's status; it only blocks the
league/cup package download.

Required documents: `acta_nacimiento`, `curp`, `identificacion_tutor_frente`,
`identificacion_tutor_reverso`, `comprobante_domicilio`, `certificado_medico`,
`foto_alumno`. `otro` is optional.

### GET /students/:id/expediente
Returns the computed expediente status, the active consent, signed document URLs
(valid 5 minutes) and the active consent template.

Roles: `super_admin`, `admin`, `profesor`, `padre`, `alumno` (row-scoped: a parent
only sees their own children, a student only their own record).

**Response:**
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

Status values: `sin_tutor` (legacy student with no tutor linked), `incompleto`,
`en_revision`, `completo`.

`missing_documents` counts the required documents that are not yet validated
(uploaded but still `pendiente` counts as missing).

### POST /students/:id/consent
Capture informed consent. This is **not** a certified e-signature: it stores the
checkboxes, the typed name, timestamp, IP, user agent, the text version and its
hash, and archives a PDF as evidence.

**Request Body:**
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
Download the archived consent PDF. Same row-scoped access as the expediente.

### POST /students/:id/documents
Upload a document (`multipart/form-data`): `file`, `doc_type`, `owner_type`
(`alumno` | `tutor`), `expires_at` (optional). Max 10 MB. Validated by magic
bytes: PDF, JPEG, PNG, WEBP, HEIC, HEIF. Files live in the private
`enrollment-documents` bucket.

### PATCH /students/:id/documents/:docId
Review a document.

**Request Body:**
```json
{ "status": "validado", "rejection_reason": null, "expires_at": null }
```

`rejection_reason` is mandatory when `status` is `rechazado`.

### DELETE /students/:id/documents/:docId
Delete the document row and its stored file. Requires `admin`, `super_admin` or a
professor with `can_manage_students`.

### GET /students/:id/documents/:docId/url
Return `{ "url": "..." }`, a signed URL valid for 300 seconds. Every access is
written to `enrollment_access_log`.

### POST /students/:id/documents/reuse-tutor
Copy the validated tutor ID (front and back) from a sibling into this student.
Files are not duplicated: the new rows reference the same stored objects.

**Response:** `{ "copied": 2 }`

### GET /students/:id/tutor-documents/availability
`{ "available": true }` when a sibling already has a validated tutor ID that can
be reused.

### GET /students/:id/expediente/package
Download a ZIP with a cover sheet, the consent PDF and the seven validated
documents. `admin`/`super_admin` only. Returns `409` when the expediente is not
`completo`.

---

## Enrollment Endpoints

Remote enrollment through a single-use, category-scoped link. The token is
opaque: it only resolves the school, the category, the invitation and its draft.
It never exposes other students or families.

Invitations expire after 7 days by default (1–30), can be revoked, and are
single-use. Submitting creates a **pending application**, not a student: an admin
must approve it. The plaintext token is stored only as a hash, so a lost link
must be regenerated.

> Route order matters: admin routes (`/enrollment/invitations`,
> `/enrollment/applications`, `/enrollment/consent-template`) are declared before
> `/enrollment/:token`; otherwise they would be consumed as tokens.

### GET /enrollment/:token
**Public** (authorized by the token, no JWT). Returns only the academy, the
category, the invitation state, the editable draft, uploaded documents, the
checklist and the consent template text.

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

Returns `404` for unknown tokens and `410` when the link is expired, revoked or
already used.

### PUT /enrollment/:token/draft
Save the draft without submitting. Accepts the student and tutor fields. Returns
`409` once the application is submitted.

### POST /enrollment/:token/documents
Upload a document for the draft (`multipart/form-data`, same validation rules as
the student expediente).

### POST /enrollment/:token/submit
Submit the application. Requires the student data, the tutor name/email/phone and
relationship, the consent payload and the tutor ID (front and back). Student
documents may remain pending.

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
**Public.** Download the consent PDF once the application is submitted.

### GET /enrollment/invitations
List invitations with a derived `status`: `activa`, `expirada`, `revocada`,
`usada`. The token hash and URL are never returned.

### POST /enrollment/invitations
Create a link.

```json
{ "category_id": "uuid", "expires_in_days": 7, "note": "Papá de Diego" }
```

**Response (the only time the URL is returned):**
```json
{
  "id": "uuid",
  "url": "https://app.example.com/inscripcion/tok_...",
  "expires_at": "2026-11-02T18:00:00Z",
  "category": { "name": "Sub-12" }
}
```

### DELETE /enrollment/invitations/:id
Revoke an active invitation. `admin`/`super_admin` only.

### GET /enrollment/applications
List applications. Optional `status` and `category_id` filters. Roles:
`super_admin`, `admin`, `profesor`.

### GET /enrollment/applications/:id
Full application detail: student and tutor data, consent with a signed PDF URL,
documents with signed URLs, sibling tutor documents, checklist and review
history.

### POST /enrollment/applications/:id/approve
Approve and create the student. Requires the consent and the tutor ID (front and
back). `category_id` may be corrected; `validate_tutor_docs: true` marks the tutor
ID as validated in the same step.

```json
{ "category_id": "uuid", "validate_tutor_docs": true }
```

**Response:**
```json
{
  "student_id": "uuid",
  "guardian_reused": false,
  "guardian_email_sent": true,
  "credentials": { "username": "diego.ramos", "temp_password": "..." }
}
```

Approval runs the same `createStudentRecord` path as the in-person wizard, moves
the consent/documents from the application to the student and keeps
`application.student_id` as the link between both records.

### POST /enrollment/applications/:id/reject
Reject with a mandatory reason. The link can be reopened afterwards.

```json
{ "reason": "La identificación está borrosa." }
```

### POST /enrollment/applications/:id/reopen
Reopen a rejected application: the invitation returns to `borrador` and its
expiry is extended 7 days.

**Response:** `{ "expires_at": "..." }`

### PATCH /enrollment/applications/:id/documents/:docId
Validate or reject a document before approval. `rejection_reason` is mandatory
for `rechazado`. Returns `409` once the application is approved (use the student
expediente instead).

### GET /enrollment/consent-template
Active consent template for the school (`version`, `body_md`, `body_hash`).

---

## Attendance Endpoints

### GET /attendances/category/:categoryId
Get attendances for a category, filtered by date.

**Query Parameters:**
- `date` (optional): Filter by date (YYYY-MM-DD)

### GET /attendances/student/:studentId
Get attendance history for a student.

### POST /attendances
Save bulk attendance (pass the list). Uses upsert to prevent duplicates.

**Request Body:**
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
Mark a training session as completed.

**Response:**
```json
{
  "message": "Training marked as completed",
  "is_completed": true
}
```

---

## Payment Endpoints

### GET /payments
List payments.

**Query Parameters:**
- `type` (optional): `mensualidad` or `pago_profesor`
- `month` (optional): Filter by month (YYYY-MM format, e.g., "2026-05")

### GET /payments/student/:studentId
Get payment history for a specific student.

### GET /payments/pending
Get students with no payment in the current month.

### POST /payments/students
Register payment for student(s). Supports single or bulk payments.

**Request Body (Single):**
```json
{
  "studentId": "uuid",
  "amount": 500.00,
  "paymentDate": "2026-05-05",
  "description": "Mensualidad Mayo 2026"
}
```

**Request Body (Bulk):**
```json
{
  "studentIds": ["uuid1", "uuid2", "uuid3"],
  "amount": 1500.00,
  "paymentDate": "2026-05-05",
  "description": "Mensualidad Mayo 2026 (Grupal)"
}
```
Note: For bulk payments, the amount is divided equally among students and recorded in `payment_students`.

### POST /payments/teachers
Register payment to teacher (payroll).

**Request Body:**
```json
{
  "teacherId": "uuid",
  "amount": 2000.00,
  "paymentDate": "2026-05-05",
  "description": "Pago quincenal Mayo"
}
```

---

## Event Endpoints

### GET /events
List events. Teachers see only events for their categories.

**Query Parameters:**
- `category_id` (optional): Filter by category
- `month` (optional): Filter by month (YYYY-MM)

### GET /events/trainings
Get today's training sessions. Teachers see only their categories.

**Query Parameters:**
- `date` (optional): Filter by date (YYYY-MM-DD), defaults to today

### POST /events
Create a new event with optional recurrence.

**Request Body (Single Event):**
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

**Request Body (Recurring Event - Weekly):**
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

**Request Body (Recurring Event - Biweekly):**
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
Get all training sessions generated from a recurring event.

### POST /events/cancel
Cancel training session(s).

**Request Body (Cancel single training):**
```json
{
  "trainingId": "uuid",
  "notifyParents": true
}
```

**Request Body (Cancel entire event/recurrence):**
```json
{
  "eventId": "uuid",
  "cancelAll": true,
  "notifyParents": true
}
```

### DELETE /events/:id
Delete an event and all its training sessions.

---

## Category Endpoints

A category is the team for a generation. `birth_year` is a **text label**, not
a number: a single year (`"2015"`), a range (`"2014-2015"`, `"2012-2013-2014"`)
or a group with no year at all (`"Porteros"`), exactly as the academy writes it.
It is unique per school.

There is no hard delete: `students`, `events`, `trainings` and `attendances`
reference a category without `ON DELETE`, so categories are archived instead.

Write access: `super_admin` and `admin` always; `profesor` only with
`teacher_permissions.can_manage_categories`, and only on their own categories.

### GET /categories
List categories, scoped by role: admins see the whole school, a teacher sees
the ones assigned to them, a parent sees their children's, a student their own.

**Query params:** `search`, `status` (`activa` | `inactiva` | `archivada` |
`all`; archived are hidden by default), `birth_year`, `teacher_id`, `sort`
(`birth_year` | `name` | `created_at` | `monthly_fee`), `order` (`asc` |
`desc`), `page`, `per_page` (max 100).

Returns a plain array; the total count travels in the `X-Total-Count` header.
Each item carries `coaches_count`, `students_count`, `teacher` (name string),
`teacher_id` and `all_teachers[]`.

### GET /categories/mine
Get categories assigned to the current teacher.

### GET /categories/:id
Single category with `students_count`, `sessions_count`,
`upcoming_sessions_count` and `schedule[]` (recurring training events).

### POST /categories
Create a new category.

**Request Body:**
```json
{
  "name": "U-12",
  "birth_year": "2012-2013",
  "description": "Mixed generation",
  "color": "#1971c2",
  "monthly_fee": 500,
  "max_students": 20,
  "teacher_ids": ["uuid"]
}
```

`name` (2-60 chars), `birth_year` (1-40 chars), `color` (`#RRGGBB`),
`monthly_fee` (>= 0) and `max_students` (>= 1) are validated. Repeating a
generation within the school returns **409**.

### POST /categories/full
Same body plus a recurring schedule; also generates the training sessions.

**Extra fields:** `days` (numbers 0-6 with 0 = Sunday, or english names
`monday`…`sunday`), `start_time` (`HH:MM`, required when `days` is set),
`venue_id`, `recurrence_weeks` (1-52, default 12).

### PATCH /categories/:id
Update a category. Partial: only the fields present in the body are written.

### PATCH /categories/:id/status
Archive, deactivate or restore. `super_admin` and `admin` only.

**Request Body:**
```json
{ "status": "archivada" }
```

Archiving stamps `archived_at`; restoring clears it. The response includes
`students_count` so the UI can warn about players still attached.

### POST /categories/:id/teachers
Assign a teacher to a category. Idempotent.

**Request Body:**
```json
{
  "teacher_id": "uuid"
}
```

### DELETE /categories/:id/teachers/:teacherId
Unassign a teacher from a category.

---

## Venue Endpoints

### GET /venues
List all venues.

### POST /venues
Create a new venue.

**Request Body:**
```json
{
  "name": "Campo Principal",
  "address": "Av. Reforma 123, Ciudad",
  "notes": "Césped artificial, vestidores disponibles"
}
```

### PATCH /venues/:id
Update venue information.

### DELETE /venues/:id
Delete a venue.

---

## User Endpoints

### GET /users
List users filtered by role.

**Query Parameters:**
- `role` (optional): Filter by role (super_admin, admin, profesor, padre, alumno)

### GET /users/teachers/:id
Get teacher details with assigned categories and email from auth.

### PUT /users/:id
Update user profile.

**Request Body:**
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
Change current user's password.

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

---

## Teacher Permissions Endpoints

### GET /permissions/mine
Get current teacher's permissions.

### GET /permissions/:teacherId
Get permissions for a specific teacher (admin only).

### PUT /permissions/:teacherId
Update teacher permissions (admin only).

**Request Body:**
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

## School Endpoints

### PUT /schools/:id
Update school information (admin only).

**Request Body:**
```json
{
  "name": "Nueva Academia XYZ",
  "logoUrl": "https://supabase.storage.com/avatars/school-logo.png"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient role/permissions)
- `404` - Not Found
- `409` - Conflict (duplicate record)
- `500` - Internal Server Error

---

## Middleware Stack

All API requests pass through this middleware chain:

1. **requireAuth** (`api/middlewares/auth.middleware.ts`)
   - Validates Supabase JWT from `Authorization: Bearer <token>` header
   - Sets `req.user = { id, email, ...decodedJWT }`

2. **requireTenant** (`api/middlewares/tenant.middleware.ts`)
   - Looks up `users` table using `req.user.id`
   - Sets `req.tenant = { school_id, role, user_id }`
   - Rejects if user not found in `users` table

3. **requireRole(...roles)** (applied per route)
   - Checks if `req.tenant.role` is in the allowed roles list
   - Rejects with 403 if role not authorized

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production:
- Supabase Auth has built-in rate limiting for auth endpoints
- Consider `express-rate-limit` for API endpoints in production
