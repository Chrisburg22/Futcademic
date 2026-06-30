---
title: "Futcamedic - Product Requirements Document"
subtitle: "Complete System PRD"
date: "May 5, 2026"
author:
  - name: "Product Team"
    affiliation: "Futcamedic"
---

## PRD: Futcamedic - Multi-Tenant Football Academy Management System

### Problem Statement
Football academy owners managing 50-500 students struggle with fragmented tools: paper attendance notebooks, WhatsApp groups for scheduling, manual cash collection tracking, and Excel spreadsheets for student records. This fragmentation causes missed payments (15-25% of monthly revenue lost), inaccurate attendance tracking (no historical data), scheduling conflicts across categories, and delayed parent communication. Academy owners need a unified system where they can manage students, track attendance, collect payments, and schedule training sessions from a mobile device, with automated parent notifications.

### Success Criteria
1. Academy owner can register school and invite 3+ teachers within 10 minutes of first login
2. Teachers can take attendance for 20+ students in under 3 minutes per training session
3. Payment collection rate increases by 30% within 90 days due to automated parent notifications
4. 95% of academy operations (attendance, payments, scheduling) handled within the app within 60 days of adoption
5. Zero data leakage between schools (multi-tenant isolation verified via RLS policies)

### Customer Stories
- As an **academy owner (admin)**, I need to register my school and invite teachers so that my staff can start using the system immediately
- As a **teacher**, I need to take attendance for my assigned categories so that the academy tracks student participation accurately
- As a **teacher**, I need to view my training schedule so that I know where and when to show up for sessions
- As a **parent**, I need to view my child's attendance and payment history so that I stay informed of their status
- As an **academy owner**, I need to record payments and automatically notify parents so that I reduce collection friction
- As an **academy owner**, I need to create recurring training events so that I don't manually schedule each session

### What Is In Scope
1. Multi-tenant school registration with admin user creation
2. Role-based access control (super_admin, admin, profesor, padre, alumno)
3. Student management with medical info, parent linking, and status tracking (active, scholarship, pending, inactive)
4. Attendance tracking with bulk "pass the list" functionality
5. Payment recording (student monthly fees, teacher payroll) with push notifications to parents
6. Event management with recurrence engine (weekly, biweekly, monthly)
7. Category management linked to birth years with teacher assignments
8. Venue (field) management for training locations
9. Teacher permissions system (granular control over what teachers can access)
10. Mobile app (iOS/Android) with role-based tab navigation
11. Web app alternative with identical functionality
12. Push notification system via Expo
13. Profile photo upload to Supabase Storage
14. Export financial reports to PDF/Excel

### What Is Out of Scope
1. Online payment processing (Stripe, PayPal integration) — payments recorded manually
2. GPS/location validation for attendance taking
3. Bulk CSV import for students
4. Parent communication beyond payment notifications
5. Student portal (alumno role exists but UI not implemented)
6. Multi-language support (Spanish-only currently)
7. Offline mode (requires internet connection)
8. Integration with external calendar systems (Google Calendar, Outlook)
9. Automated payment reminders (only notification on manual recording)
10. Medical emergency alerts based on student health info

### Acceptance Criteria
**Authentication & Registration:**
- [ ] School registration creates auth user, school record, and admin profile in <30 seconds
- [ ] Email confirmation sent via Supabase Auth on registration
- [ ] Invited users receive temporary password and must change on first login
- [ ] JWT token validated on every API request via `requireAuth` middleware
- [ ] Multi-tenant isolation enforced via `requireTenant` middleware on all routes

**Student Management:**
- [ ] Admin can create student with name, birthdate, medical info, parent link
- [ ] Student status can be changed: active, beca (scholarship), pendiente, inactivo
- [ ] Student photo uploaded to Supabase Storage `avatars` bucket
- [ ] Parent can only view their own children (filtered via `parent_id`)
- [ ] Deleted students audited in `deleted_students` table with `deleted_by` tracking

**Attendance:**
- [ ] Teacher sees only trainings for their assigned categories
- [ ] Bulk attendance save with present/absent toggle for each student
- [ ] Upsert logic prevents duplicate attendance records (unique: student_id, date, type)
- [ ] Training marked as `is_completed = true` after attendance saved
- [ ] Attendance viewable by student, parent, teacher, and admin

**Payments:**
- [ ] Payment recording for individual student or bulk (multi-student)
- [ ] Automatic division of amount when multiple students selected (group payment)
- [ ] Push notification sent to parent(s) on payment registration
- [ ] Payment types: mensualidad (monthly), pago_profesor (teacher payroll)
- [ ] Pending payments report shows students without payment for current month
- [ ] Export to PDF/Excel with filters by month and type

**Events & Scheduling:**
- [ ] Event creation with recurrence: weekly (select days), biweekly, monthly
- [ ] Recurrence engine generates individual `trainings` records
- [ ] Events linked to category, venue, and with start time
- [ ] Event types: entrenamiento (training), partido (match)
- [ ] Cancel individual training or entire event with parent notification
- [ ] Teacher views only trainings for their categories

**Teacher Permissions:**
- [ ] Granular permissions: can_manage_students, can_manage_events, can_view_finances, can_manage_payments, can_take_attendance, can_manage_categories
- [ ] Default permissions set on teacher invitation
- [ ] Admin can update permissions per teacher
- [ ] Teacher's UI adapts based on permission flags

**Multi-Tenancy:**
- [ ] All tables have `school_id` column
- [ ] RLS policies enforce `school_id` match on all queries
- [ ] Backend middleware sets `req.tenant` with `school_id`, `role`, `user_id`
- [ ] Zero cross-tenant data leakage verified via manual testing

### Dependencies
1. **Supabase Project**: PostgreSQL database with RLS enabled, Auth configured, Storage bucket `avatars` created
2. **Render.com Account**: For backend API deployment
3. **Expo Account**: For mobile app build and push notification service
4. **Node.js & npm**: Backend runtime and package management
5. **Supabase Service Role Key**: For admin operations bypassing RLS in backend
6. **Environment Variables**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`

### Open Questions
1. What is the maximum number of students per academy before performance degrades?
2. Should the system support multiple parents per student (mother + father)?
3. What happens to historical data when a teacher is deleted from the system?
4. Should recurring events stop generating if a category is deactivated?
5. Is there a need for payment plans (installments) beyond monthly fees?
6. How should the system handle teacher substitutions for a training session?
7. Should venue capacity limits be enforced on event creation?
