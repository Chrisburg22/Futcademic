---
tipo: generado
generado_por: scripts/vault/vault.py
hash: 3a83f9c36bcc
actualizado: 2026-11-20
tags:
  - web
  - generado
---

<!-- No editar a mano: python3 scripts/vault/vault.py generar -->

# Rutas web

Páginas de `web/app/**/page.tsx`: ruta, roles del `ProtectedRoute` y pantalla real que montan.

- **35 rutas**.
- `cualquier autenticado` = la página no declara `roles` pero vive en `app/(app)` y pasa por el layout protegido.
- La implementación está en `web/src/screens/`; la página solo envuelve.

| Ruta | Acceso | Pantalla | Archivo |
| --- | --- | --- | --- |
| `/` | cualquier autenticado | `DashboardPage` | `app/(app)/page.tsx` |
| `/accept-invite` | público | `auth/AcceptInvitePage` | `app/(auth)/accept-invite/page.tsx` |
| `/achievements` | alumno, super_admin, admin | `AchievementsPage` | `app/(app)/achievements/page.tsx` |
| `/admin/categories` | super_admin, admin, profesor | `admin/CategoriesPage` | `app/(app)/admin/categories/page.tsx` |
| `/admin/categories/[id]` | super_admin, admin, profesor | `admin/CategoryDetailPage` | `app/(app)/admin/categories/[id]/page.tsx` |
| `/admin/chat` | super_admin, admin | `admin/ChatPage` | `app/(app)/admin/chat/page.tsx` |
| `/admin/enrollments` | super_admin, admin, profesor | `admin/EnrollmentApplicationsPage` | `app/(app)/admin/enrollments/page.tsx` |
| `/admin/enrollments/[id]` | super_admin, admin, profesor | `admin/EnrollmentApplicationDetailPage` | `app/(app)/admin/enrollments/[id]/page.tsx` |
| `/admin/events` | super_admin, admin | `admin/EventsPage` | `app/(app)/admin/events/page.tsx` |
| `/admin/students` | super_admin, admin, profesor | `admin/StudentsPage` | `app/(app)/admin/students/page.tsx` |
| `/admin/students/[id]` | super_admin, admin, profesor | `admin/StudentDetailPage` | `app/(app)/admin/students/[id]/page.tsx` |
| `/admin/teachers` | super_admin, admin | `admin/TeachersPage` | `app/(app)/admin/teachers/page.tsx` |
| `/admin/teachers/[id]` | super_admin, admin | `admin/TeacherDetailPage` | `app/(app)/admin/teachers/[id]/page.tsx` |
| `/admin/venues` | super_admin, admin | `admin/VenuesPage` | `app/(app)/admin/venues/page.tsx` |
| `/attendance` | cualquier autenticado | `AttendancePage` | `app/(app)/attendance/page.tsx` |
| `/change-password` | con sesión | `auth/ChangePasswordPage` | `app/(auth)/change-password/page.tsx` |
| `/children` | padre | `ChildrenPage` | `app/(app)/children/page.tsx` |
| `/finances` | super_admin, admin, padre | `FinancesPage` | `app/(app)/finances/page.tsx` |
| `/forgot-password` | público | `auth/ForgotPasswordPage` | `app/(auth)/forgot-password/page.tsx` |
| `/inscripcion/[token]` | cualquier autenticado | `enrollment/PublicEnrollmentPage` | `app/inscripcion/[token]/page.tsx` |
| `/login` | público | `auth/LoginPage` | `app/(auth)/login/page.tsx` |
| `/onboarding` | cualquier autenticado | `OnboardingPage` | `app/(app)/onboarding/page.tsx` |
| `/profile` | cualquier autenticado | `ProfilePage` | `app/(app)/profile/page.tsx` |
| `/register` | público | `auth/RegisterPage` | `app/(auth)/register/page.tsx` |
| `/reset-password` | público | `auth/ResetPasswordPage` | `app/(auth)/reset-password/page.tsx` |
| `/settings/edit-academy` | super_admin, admin | `settings/EditAcademyPage` | `app/(app)/settings/edit-academy/page.tsx` |
| `/settings/edit-profile` | cualquier autenticado | `settings/EditProfilePage` | `app/(app)/settings/edit-profile/page.tsx` |
| `/settings/export` | cualquier autenticado | `settings/ExportPage` | `app/(app)/settings/export/page.tsx` |
| `/settings/notifications` | cualquier autenticado | `settings/NotificationsPage` | `app/(app)/settings/notifications/page.tsx` |
| `/settings/security` | cualquier autenticado | `settings/SecurityPage` | `app/(app)/settings/security/page.tsx` |
| `/settings/support` | cualquier autenticado | `settings/SupportPage` | `app/(app)/settings/support/page.tsx` |
| `/settings/terms` | cualquier autenticado | `settings/TermsPage` | `app/(app)/settings/terms/page.tsx` |
| `/stats` | alumno | `StatsPage` | `app/(app)/stats/page.tsx` |
| `/student-login` | público | `auth/StudentLoginPage` | `app/(auth)/student-login/page.tsx` |
| `/team` | alumno | `TeamPage` | `app/(app)/team/page.tsx` |
