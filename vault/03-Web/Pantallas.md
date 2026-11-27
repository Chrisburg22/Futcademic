---
tipo: nota
area: web
estado: verificado
actualizado: 2026-11-13
fuentes:
  - web/app
  - web/src/screens
  - web/src/components
  - web/src/components/layout/Sidebar.tsx
tags:
  - web
---

# Pantallas

`web/app/**/page.tsx` es un envoltorio; la implementación vive en `web/src/screens/`.

## Públicas y de sesión

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/login` | `auth/LoginPage` | login de staff (email) |
| `/student-login` | `auth/StudentLoginPage` | login de alumno por username |
| `/register` | `auth/RegisterPage` | crear academia + admin |
| `/accept-invite` | `auth/AcceptInvitePage` | aceptar invitación con `token_hash` |
| `/change-password` | `auth/ChangePasswordPage` | cambio obligatorio de contraseña |
| `/forgot-password` | `auth/ForgotPasswordPage` | pedir correo de recuperación |
| `/reset-password` | `auth/ResetPasswordPage` | fijar contraseña nueva desde el correo |
| `/onboarding` | `OnboardingPage` | completar perfil de profesor/padre/alumno |
| `/profile` | `ProfilePage` | perfil propio |

## Panel

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/` | `DashboardPage` | elige `AdminDashboard`, `TeacherDashboard`, `ParentDashboard` o `StudentDashboard`; el de admin es el tablero de la jornada |
| `/achievements` | `AchievementsPage` | logros y progreso |
| `/attendance` | `AttendancePage` | pase de lista e histórico; el padre y el alumno ven historial |
| `/finances` | `FinancesPage` | bandeja de cobranza, pagos, nómina y salud del mes; el padre ve el estado de cuenta de sus hijos |
| `/children` | `ChildrenPage` | hijos del padre; vincular/desvincular |
| `/stats` | `StatsPage` | estadísticas del alumno |
| `/team` | `TeamPage` | compañeros de categoría |

## Administración

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/admin/students` | `admin/StudentsPage` | listado con KPIs, filtros, orden, acciones masivas y exportación; alta y baja |
| `/admin/students/[id]` | `admin/StudentDetailPage` | ficha en pestañas: resumen, datos, expediente, pagos, asistencia |
| `/admin/categories` | `admin/CategoriesPage` | categorías y cuotas |
| `/admin/categories/[id]` | `admin/CategoryDetailPage` | alumnos y profesores de la categoría |
| `/admin/teachers` | `admin/TeachersPage` | listado de profesores |
| `/admin/teachers/[id]` | `admin/TeacherDetailPage` | ficha y permisos |
| `/admin/events` | `admin/EventsPage` | calendario, recurrencia, cancelaciones |
| `/admin/venues` | `admin/VenuesPage` | sedes |
| `/admin/enrollments` | `admin/EnrollmentApplicationsPage` | solicitudes de inscripción e invitaciones por link |
| `/admin/enrollments/[id]` | `admin/EnrollmentApplicationDetailPage` | revisar una solicitud: datos, documentos, aprobar o rechazar |
| `/admin/chat` | `admin/ChatPage` | asistente IA con confirmación de acciones |

`/attendance` se rehízo el 27-oct, ver [[Modulo Asistencias|Módulo Asistencias]]:
pase de lista con sesión del día, tri-estado y filtros, e histórico por alumno
o por sesión. Su estado también viaja en la query (`?categoria=…&vista=historico`),
de ahí el `<Suspense>` en `app/(app)/attendance/page.tsx`.

Ambas se rediseñaron el 27-oct, ver [[Modulo Alumnos|Módulo Alumnos]]. El listado
abre `InviteStudentModal` para mandar un link de inscripción y la ficha monta
`StudentExpediente` (expediente, documentos y consentimiento). Los filtros del
listado viajan en la query (`?tutor=sin`, `?adeudo=con`), que es como Inicio
enlaza a cada aviso.

## Inicio del administrador

`screens/dashboard/AdminDashboard` responde "qué hay que hacer hoy", no
"cuántos alumnos tengo":

| Bloque | Componente | De dónde sale |
|---|---|---|
| Indicadores con contexto | `dashboard/components/MetricCard` | `GET /dashboard/admin` + `GET /payments/pending` |
| Por atender | `dashboard/components/WorkQueueCard` | `GET /students` cruzado con la cobranza; cada línea enlaza al listado filtrado |
| Próximos 7 días | `dashboard/components/AgendaCard` | `upcomingEvents` de `GET /dashboard/admin` |
| Altas recientes | `dashboard/components/RecentStudentsCard` | `GET /students`, últimos 30 días |

`upcomingEvents` y `pendingPayments` ya venían en el endpoint y la pantalla
anterior no los usaba.

## Inscripción pública

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/inscripcion/[token]` | `enrollment/PublicEnrollmentPage` | el tutor llena el expediente desde el link, sin cuenta |

Vive **fuera** del shell autenticado: no pasa por `AppShell` ni por
`ProtectedRoute`, y su `layout.tsx` fuerza `robots: noindex, nofollow, nocache`
y `referrer: no-referrer` porque la URL lleva el token. La única credencial es
ese token; ver [[Roles y permisos#Rutas públicas por token]].

## Ajustes

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/settings/edit-academy` | `settings/EditAcademyPage` | nombre y logo de la academia |
| `/settings/edit-profile` | `settings/EditProfilePage` | datos personales |
| `/settings/security` | `settings/SecurityPage` | contraseña y seguridad |
| `/settings/notifications` | `settings/NotificationsPage` | preferencias de aviso |
| `/settings/export` | `settings/ExportPage` | descarga CSV |
| `/settings/support` | `settings/SupportPage` | soporte |
| `/settings/terms` | `settings/TermsPage` | términos |

## Componentes clave

| Componente | Rol |
|---|---|
| `components/layout/AppShell` | shell autenticado (sidebar + header) |
| `components/layout/Sidebar` | navegación por rol |
| `components/layout/NotificationBell` | avisos |
| `components/layout/ProtectedRoute` | guard de sesión/rol en cliente |
| `components/auth/AuthGate` | redirecciones de contraseña/onboarding |
| `components/chat/*` | conversación SSE y confirmaciones |
| `components/attendance/*` | lista y marcado |
| `screens/admin/components/StudentWizard` | alta de alumno por pasos |
| `screens/admin/components/StudentExpediente` | expediente, documentos y consentimiento en la ficha |
| `screens/admin/components/InviteStudentModal` | genera y comparte el link de inscripción |
| `screens/enrollment/ConsentCaptureForm` | firma del consentimiento |
| `screens/enrollment/labels` | etiquetas del formulario público |

> [!warning] `/settings/export` no declara roles
> La pantalla es visible para cualquier autenticado, pero `GET /export/payments` y `/export/attendance` son solo admin. Un profesor o padre que pulse esos botones recibe error. Ver [[Deriva conocida]].

## Asistencias por rol (13-nov)

`AttendancePage` despacha **explícitamente** por rol:

| Rol | Pantalla |
| --- | --- |
| `padre` | `ParentAttendance` (en el mismo archivo) |
| `alumno` | `OwnAttendance` (en el mismo archivo) |
| `profesor`, `admin`, `super_admin` | `RollCallScreen` |

Antes era `if (padre) …; return <RollCallView />`, así que **el alumno caía en
el pase de lista del profesor**: selector de categoría, fecha, tipo de sesión y
un switch por compañero. `app/(app)/attendance/page.tsx` declara ahora sus
`roles` y envuelve la pantalla en `<Suspense>`, porque lee categoría, fecha y
periodo de la query —y el padre su `?student_id=`— con `useSearchParams`.

`ParentAttendance` y `OwnAttendance` son dos cabeceras distintas sobre el mismo
componente, `components/attendance/StudentAttendanceHistory.tsx`, que consulta
`/attendances/student/:id`. En teléfono pinta la tira de últimas sesiones
(`AttendanceStrip`) y filas táctiles; desde `sm`, la tabla. Ahí vive también el
`ErrorState` con reintento: sin él un fallo de red se leía como «Sin
asistencias registradas».

El padre llega desde Inicio con `?student_id=`, que `ParentAttendance` lee como
inicializador perezoso del `useState`. Con varios hijos, el selector son fichas
con avatar de 44 px, no un desplegable. `StudentAttendancePanel.tsx` ya no
existe: la ficha del alumno usa el mismo `StudentAttendanceHistory`.
