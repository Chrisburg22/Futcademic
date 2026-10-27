---
title: "Futcamedic Database Schema"
subtitle: "PostgreSQL Schema Documentation"
date: "May 5, 2026"
author:
  - name: "Engineering Team"
    affiliation: "Futcamedic"
---

## Futcamedic Database Schema

Database: PostgreSQL (hosted on Supabase)
Row Level Security (RLS): Enabled on all tables
Multi-Tenancy: All tables have `school_id` column

---

## Entity Relationship Summary

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
enrollment_applications (1) -----> (0..1) students (after approval)
students (1) -----> (0..1) enrollment_consents
students (1) -----> (N) enrollment_documents

categories (1) -----> (N) students
categories (1) -----> (N) category_teachers
categories (1) -----> (N) attendances
categories (1) -----> (N) events
categories (1) -----> (N) trainings

users (1) -----> (N) students (as parent)
users (1) -----> (N) category_teachers (as teacher)
users (1) -----> (N) attendances (as teacher)
users (1) -----> (N) payments (as student or teacher)
users (1) -----> (N) teacher_permissions

events (1) -----> (N) trainings

payments (1) -----> (N) payment_students
students (1) -----> (N) payment_students
```

---

## Table Definitions

### 1. schools
Tenant principal — each football academy is a school.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique school identifier |
| name | VARCHAR(255) | NOT NULL | Academy name |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**RLS Policy:** Users can only see their own school (`id = (SELECT school_id FROM users WHERE id = auth.uid())`)

---

### 2. users
Links to Supabase `auth.users` — stores role and school association.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK → auth.users(id) ON DELETE CASCADE | Same as Supabase Auth user ID |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| role | VARCHAR(50) | CHECK IN ('super_admin','admin','profesor','padre','alumno') | User role |
| full_name | VARCHAR(255) | NOT NULL | User's full name |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**RLS Policy:** Users can only see users from same school.
**Note:** `auth.users` is managed by Supabase — email, password, email confirmation handled there.

---

### 3. categories
Football categories based on birth year.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique category ID |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| birth_year | INT | NOT NULL | Birth year for age grouping |
| name | VARCHAR(100) | NOT NULL | Category name (e.g., "U-12") |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**Unique Constraint:** `UNIQUE(school_id, birth_year)` — prevents duplicate categories per school per year.
**RLS Policy:** Users can only see categories from same school.

---

### 4. category_teachers
Many-to-many relationship between teachers and categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique record ID |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| category_id | UUID | FK → categories(id) ON DELETE CASCADE, NOT NULL | Linked category |
| teacher_id | UUID | FK → users(id) ON DELETE CASCADE, NOT NULL | Linked teacher |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**Unique Constraint:** `UNIQUE(category_id, teacher_id)` — prevents duplicate assignments.
**RLS Policy:** Users can only see assignments from same school.

---

### 5. students
Football academy students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique student ID |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| category_id | UUID | FK → categories(id) ON DELETE CASCADE, NOT NULL | Assigned category |
| parent_id | UUID | FK → users(id) ON DELETE SET NULL | Linked parent (padre role) |
| full_name | VARCHAR(255) | NOT NULL | Student's full name |
| birth_date | DATE | NOT NULL | Student's birth date |
| uniform_delivered | BOOLEAN | DEFAULT FALSE | Whether uniform was delivered |
| status | VARCHAR(20) | CHECK IN ('activo','beca','pendiente','inactivo'), DEFAULT 'activo' | Enrollment status |
| curp | TEXT | | CURP of the student (optional, indexed per school) |
| guardian_relationship | TEXT | | Relationship of the linked tutor (`madre`, `padre`, `tutor_legal`, `abuelo`, `otro`) |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**RLS Policy:** Users can only see students from same school. Parents only see their own children (`parent_id = auth.uid()`).
**Status Values:**
- `activo` — Active, paying student
- `beca` — Scholarship student (no payment required)
- `pendiente` — Pending enrollment
- `inactivo` — Inactive, no longer attending

---

### 6. attendances
Attendance records for training sessions and matches.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique attendance ID |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| student_id | UUID | FK → students(id) ON DELETE CASCADE, NOT NULL | Student being marked |
| category_id | UUID | FK → categories(id) ON DELETE CASCADE, NOT NULL | Category context |
| teacher_id | UUID | FK → users(id) ON DELETE SET NULL | Teacher who took attendance |
| training_id | UUID | FK → trainings(id) ON DELETE SET NULL | Linked training session |
| date | DATE | NOT NULL | Attendance date |
| type | VARCHAR(50) | CHECK IN ('entrenamiento','partido') | Session type |
| present | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether student was present |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**Unique Constraint:** `UNIQUE(student_id, date, type)` — prevents duplicate attendance for same student/date/type.
**RLS Policy:** Users can only see attendances from same school.

---

### 7. payments
Payment records for student monthly fees and teacher payroll.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique payment ID |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| amount | NUMERIC(10,2) | NOT NULL | Payment amount |
| payment_date | DATE | NOT NULL | Date payment was made |
| payment_type | VARCHAR(50) | CHECK IN ('mensualidad','pago_profesor') | Payment type |
| student_id | UUID | FK → students(id) ON DELETE SET NULL | Linked student (for mensualidad) |
| teacher_id | UUID | FK → users(id) ON DELETE SET NULL | Linked teacher (for pago_profesor) |
| description | TEXT | | Payment description/concept |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**Payment Types:**
- `mensualidad` — Student monthly fee
- `pago_profesor` — Teacher payroll payment

**RLS Policy:** Users can only see payments from same school.

---

### 8. payment_students
Links multiple students to a single group payment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique record ID |
| payment_id | UUID | FK → payments(id) ON DELETE CASCADE, NOT NULL | Parent payment record |
| student_id | UUID | FK → students(id) ON DELETE CASCADE, NOT NULL | Linked student |
| amount | NUMERIC(10,2) | NOT NULL | Amount allocated to this student |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**Unique Constraint:** `UNIQUE(payment_id, student_id)` — prevents duplicate student entries in same payment.
**RLS Policy:** Inherits from payments table policy.

---

### 9. venues
Training venues / fields.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique venue ID |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| name | VARCHAR(255) | NOT NULL | Venue name |
| address | TEXT | | Physical address |
| notes | TEXT | | Additional notes |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**RLS Policy:** Users can only see venues from same school.

---

### 10. events
Master events with recurrence rules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique event ID |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| category_id | UUID | FK → categories(id) ON DELETE CASCADE, NOT NULL | Linked category |
| venue_id | UUID | FK → venues(id) ON DELETE SET NULL | Linked venue |
| date | DATE | NOT NULL | Event start date |
| start_time | TIME | | Event start time |
| type | VARCHAR(50) | CHECK IN ('entrenamiento','partido') | Event type |
| description | TEXT | | Event description |
| is_recurring | BOOLEAN | DEFAULT FALSE | Whether event recurs |
| recurring_weeks | INT | | Number of weeks for recurrence |
| recurring_end_date | DATE | | End date for recurrence |
| recurrence_rule | JSONB | | Recurrence configuration (frequency, days) |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**Recurrence Rule JSONB Example (Weekly):**
```json
{
  "frequency": "weekly",
  "days": ["Monday", "Wednesday", "Friday"]
}
```

**Recurrence Rule JSONB Example (Biweekly):**
```json
{
  "frequency": "biweekly",
  "day": "Saturday"
}
```

**RLS Policy:** Users can only see events from same school.

---

### 11. trainings
Individual training sessions generated from recurring events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique training ID |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| event_id | UUID | FK → events(id) ON DELETE CASCADE, NOT NULL | Parent recurring event |
| category_id | UUID | FK → categories(id) ON DELETE CASCADE, NOT NULL | Linked category |
| venue_id | UUID | FK → venues(id) ON DELETE SET NULL | Linked venue |
| date | DATE | NOT NULL | Training date |
| start_time | TIME | | Training start time |
| type | VARCHAR(50) | CHECK IN ('entrenamiento','partido') | Session type |
| is_completed | BOOLEAN | DEFAULT FALSE | Whether attendance was taken |
| is_cancelled | BOOLEAN | DEFAULT FALSE | Whether session was cancelled |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**RLS Policy:** Users can only see trainings from same school.

---

### 12. profile_information
Additional personal details for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK → users(id) ON DELETE CASCADE | Same as users.id |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| phone | VARCHAR(20) | | Phone number |
| address | TEXT | | Physical address |
| birth_date | DATE | | Birth date |
| gender | VARCHAR(20) | | Gender |
| emergency_contact_name | VARCHAR(255) | | Emergency contact name |
| emergency_contact_phone | VARCHAR(20) | | Emergency contact phone |
| medical_notes | TEXT | | Medical notes/allergies |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

**RLS Policy:** Users can only see profiles from same school.

---

### 13. deleted_students
Audit trail for deleted students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique record ID |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| original_student_id | UUID | NOT NULL | Original student ID (before deletion) |
| full_name | VARCHAR(255) | NOT NULL | Student name at time of deletion |
| birth_date | DATE | NOT NULL | Student birth date |
| category_id | UUID | | Category at time of deletion |
| parent_id | UUID | | Parent at time of deletion |
| deleted_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Deletion timestamp |
| deleted_by | UUID | FK → users(id) ON DELETE SET NULL | User who deleted the student |

**RLS Policy:** Only admin/super_admin from same school can view.

---

### 14. teacher_permissions
Granular permissions for teachers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique record ID |
| school_id | UUID | FK → schools(id) ON DELETE CASCADE, NOT NULL | Tenant association |
| teacher_id | UUID | FK → users(id) ON DELETE CASCADE, NOT NULL | Linked teacher |
| can_manage_students | BOOLEAN | DEFAULT TRUE | Can CRUD students |
| can_manage_events | BOOLEAN | DEFAULT TRUE | Can manage events |
| can_view_finances | BOOLEAN | DEFAULT FALSE | Can view payment info |
| can_manage_payments | BOOLEAN | DEFAULT FALSE | Can record payments |
| can_take_attendance | BOOLEAN | DEFAULT TRUE | Can take attendance |
| can_manage_categories | BOOLEAN | DEFAULT FALSE | Can manage categories |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |

**Unique Constraint:** `UNIQUE(teacher_id)` — one permission record per teacher.
**RLS Policy:** Only admin/super_admin from same school can view/manage.

---

### 15. consent_templates
Versioned informed-consent texts. A `school_id = NULL` row is the global template.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique record ID |
| school_id | UUID | FK → schools(id), NULL | NULL for the global template |
| version | TEXT | NOT NULL | Version label (e.g. `2026-10-v1`) |
| body_md | TEXT | NOT NULL | Consent text in Markdown |
| body_hash | TEXT | | Hash of the text shown, stored with each signature |
| active | BOOLEAN | NOT NULL, DEFAULT TRUE | Only one active template per scope |
| created_by | UUID | FK → users(id) | Who published it |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Unique constraints:** one active global template (`school_id IS NULL AND active`)
and one active template per school (`school_id IS NOT NULL AND active`).
**RLS Policy:** read for authenticated users of the school; writes via service role.

---

### 16. enrollment_invitations
Single-use, category-scoped enrollment links.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique record ID |
| school_id | UUID | FK → schools(id), NOT NULL | Tenant association |
| category_id | UUID | FK → categories(id), NOT NULL | Category the family is invited to |
| token_hash | TEXT | UNIQUE, NOT NULL | SHA-256 of the opaque token (never the token itself) |
| created_by | UUID | FK → users(id) | Admin who generated the link |
| expires_at | TIMESTAMPTZ | NOT NULL | Expiry (7 days by default, 1–30 allowed) |
| used_at | TIMESTAMPTZ | | Set when the application is submitted |
| revoked_at | TIMESTAMPTZ | | Set when an admin revokes the link |
| application_id | UUID | | Linked application once opened |
| note | TEXT | | Internal note (e.g. "Papá de Diego") |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Derived status:** `activa`, `expirada`, `revocada`, `usada`.
**RLS Policy:** only admin/super_admin of the school can list or revoke.

---

### 17. enrollment_applications
Pending applications created by a remote link. They become a student only after
an admin approves them.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique record ID |
| school_id | UUID | FK → schools(id), NOT NULL | Tenant association |
| invitation_id | UUID | UNIQUE, FK → enrollment_invitations(id), NOT NULL | Source link |
| category_id | UUID | FK → categories(id), NOT NULL | Category being applied to |
| original_category_id | UUID | FK → categories(id) | Category before any admin correction |
| status | TEXT | CHECK IN ('borrador','enviada','en_revision','aprobada','rechazada'), DEFAULT 'borrador' | Application state |
| student_full_name | TEXT | | Student name |
| student_birth_date | DATE | | Student birth date |
| student_curp | TEXT | | Student CURP |
| student_phone | TEXT | | Student phone |
| student_address | TEXT | | Student address |
| emergency_contact_name | TEXT | | Emergency contact |
| emergency_contact_phone | TEXT | | Emergency phone |
| medical_notes | TEXT | | Allergies / conditions |
| guardian_full_name | TEXT | | Tutor name |
| guardian_relationship | TEXT | | Tutor relationship |
| guardian_email | TEXT | | Tutor email (mandatory in the form) |
| guardian_phone | TEXT | | Tutor cell phone (mandatory in the form) |
| guardian_address | TEXT | | Tutor address |
| guardian_user_id | UUID | FK → users(id) | Existing tutor account, when matched |
| submitted_at | TIMESTAMPTZ | | Submission timestamp |
| submitted_ip | INET | | Submission IP |
| submitted_user_agent | TEXT | | Submission device |
| reviewed_by | UUID | FK → users(id) | Admin who approved/rejected |
| reviewed_at | TIMESTAMPTZ | | Review timestamp |
| rejection_reason | TEXT | | Reason shown to the family |
| student_id | UUID | FK → students(id) | Created/linked student after approval |
| category_mismatch | BOOLEAN | NOT NULL, DEFAULT FALSE | Birth date outside the category years |
| reopen_count | INTEGER | NOT NULL, DEFAULT 0 | Times the link was reopened |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**RLS Policy:** admin/profesor of the school can read; only admin/super_admin can
approve, reject or reopen.

---

### 18. enrollment_consents
Signed informed consent. Not a certified e-signature: it stores the evidence
(checkboxes, typed name, timestamp, IP, device, text version and hash) plus the
archived PDF.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique record ID |
| school_id | UUID | FK → schools(id), NOT NULL | Tenant association |
| application_id | UUID | UNIQUE, FK → enrollment_applications(id) | Owner while pending |
| student_id | UUID | FK → students(id) | Owner after approval |
| guardian_name | TEXT | NOT NULL | Typed name (signature) |
| guardian_relationship | TEXT | | Relationship with the student |
| consent_version | TEXT | NOT NULL | Template version accepted |
| text_hash | TEXT | NOT NULL | Hash of the exact text shown |
| accepted_data | BOOLEAN | NOT NULL, DEFAULT FALSE | Personal data authorization |
| accepted_participation | BOOLEAN | NOT NULL, DEFAULT FALSE | Training/matches/transfers |
| accepted_medical | BOOLEAN | NOT NULL, DEFAULT FALSE | Emergency medical care |
| accepted_image | BOOLEAN | NOT NULL, DEFAULT FALSE | Image use (optional) |
| accepted_at | TIMESTAMPTZ | DEFAULT NOW() | Acceptance timestamp |
| ip | INET | | Acceptance IP |
| user_agent | TEXT | | Acceptance device |
| pdf_path | TEXT | | Path of the archived PDF |
| captured_by | UUID | FK → users(id) | Staff member who captured it in person |
| revoked_at | TIMESTAMPTZ | | Revocation timestamp |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Constraint:** exactly one owner (`application_id` XOR `student_id`) and only one
active consent per student (`student_id IS NOT NULL AND revoked_at IS NULL`).
**RLS Policy:** admin/profesor of the school can read and capture.

---

### 19. enrollment_documents
Documents uploaded from the remote link or the in-person wizard.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique record ID |
| school_id | UUID | FK → schools(id), NOT NULL | Tenant association |
| application_id | UUID | FK → enrollment_applications(id) | Owner while pending |
| student_id | UUID | FK → students(id) | Owner after approval |
| owner_type | TEXT | CHECK IN ('alumno','tutor'), NOT NULL | Whose document it is |
| doc_type | TEXT | NOT NULL | Catalog key (`acta_nacimiento`, `curp`, `identificacion_tutor_frente`, …) |
| file_path | TEXT | NOT NULL | Object path in the private bucket |
| file_name | TEXT | | Original filename |
| mime_type | TEXT | | Validated MIME type |
| size_bytes | BIGINT | | File size |
| file_hash | TEXT | | SHA-256 for de-duplication |
| status | TEXT | CHECK IN ('pendiente','validado','rechazado','vencido'), DEFAULT 'pendiente' | Review state |
| expires_at | DATE | | Optional expiry (e.g. medical certificate) |
| uploaded_by | UUID | FK → users(id) | Uploader (staff) |
| uploaded_at | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |
| verified_by | UUID | FK → users(id) | Reviewer |
| verified_at | TIMESTAMPTZ | | Review timestamp |
| rejection_reason | TEXT | | Reason shown to the family |
| reused_from | UUID | FK → enrollment_documents(id) | Sibling document reused |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Constraints:** exactly one owner (`application_id` XOR `student_id`) and one row
per `(owner, owner_type, doc_type)`.
**RLS Policy:** admin/profesor with `can_manage_students`; parents/students may
read their own.

---

### 20. enrollment_access_log
Audit trail of link access and document actions (downloads, validations,
approvals).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique record ID |
| school_id | UUID | FK → schools(id), NOT NULL | Tenant association |
| invitation_id | UUID | FK → enrollment_invitations(id) | Related link |
| user_id | UUID | FK → users(id) | Staff user, when authenticated |
| action | TEXT | NOT NULL | e.g. `view_application`, `validate_document`, `approve_application` |
| entity_type | TEXT | | `application`, `document`, `consent`, … |
| entity_id | UUID | | Affected record |
| ip | INET | | Request IP |
| user_agent | TEXT | | Request device |
| metadata | JSONB | | Extra context |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Timestamp |

**RLS Policy:** admin/super_admin only.

---

### 21. student_expediente_status (view)
Read-only view that computes each student's expediente state instead of storing a
redundant column:

- `sin_tutor` — the student has no linked tutor (legacy students preserved as-is).
- `incompleto` — missing consent or at least one required document.
- `en_revision` — all required documents uploaded but not all validated, or no
  consent yet.
- `completo` — consent signed and the seven required documents validated.

Columns include `student_id`, `school_id`, `status`, `present_documents`,
`validated_documents` and `missing_documents` (array of required document keys
that are not yet validated). The
students list falls back gracefully when the migration has not been applied.

**Storage:** the migration also creates the private `enrollment-documents` bucket
(10 MB limit, PDF/JPEG/PNG/WEBP/HEIC/HEIF). The API only exposes 300-second signed
URLs.

---

## Row Level Security (RLS) Policies

All tables have RLS enabled. The standard tenant isolation policy:

```sql
CREATE POLICY "Aislamiento tenant <table>" ON public.<table>
FOR ALL USING (school_id = (SELECT school_id FROM public.users WHERE id = auth.uid()));
```

**Exception:** `super_admin` role bypasses RLS via service role key in backend.

**Enrollment exceptions:** `consent_templates` is readable by any authenticated
user of the school (the public link reads it through the service role), and the
public enrollment routes never touch RLS directly: they run through the service
role after resolving the opaque token, and every query is scoped to the
`school_id` embedded in that token.

---

## Indexes (Recommended)

For performance, consider adding these indexes:

```sql
-- Frequently queried columns
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
