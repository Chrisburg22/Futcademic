import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { AuthGate } from './components/auth/AuthGate';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { StudentLoginPage } from './pages/auth/StudentLoginPage';
import { AcceptInvitePage } from './pages/auth/AcceptInvitePage';

import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { AttendancePage } from './pages/AttendancePage';
import { FinancesPage } from './pages/FinancesPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChildrenPage } from './pages/ChildrenPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { TeamPage } from './pages/TeamPage';
import { StatsPage } from './pages/StatsPage';

import { StudentsPage } from './pages/admin/StudentsPage';
import { StudentDetailPage } from './pages/admin/StudentDetailPage';
import { TeachersPage } from './pages/admin/TeachersPage';
import { TeacherDetailPage } from './pages/admin/TeacherDetailPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { CategoryDetailPage } from './pages/admin/CategoryDetailPage';
import { EventsPage } from './pages/admin/EventsPage';
import { VenuesPage } from './pages/admin/VenuesPage';

import { EditAcademyPage } from './pages/settings/EditAcademyPage';
import { EditProfilePage } from './pages/settings/EditProfilePage';
import { SecurityPage } from './pages/settings/SecurityPage';
import { NotificationsPage } from './pages/settings/NotificationsPage';
import { ExportPage } from './pages/settings/ExportPage';
import { SupportPage } from './pages/settings/SupportPage';
import { TermsPage } from './pages/settings/TermsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student-login" element={<StudentLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AuthGate>
              <AppShell />
            </AuthGate>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/children"
          element={
            <ProtectedRoute roles={['padre']}>
              <ChildrenPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/achievements"
          element={
            <ProtectedRoute roles={['alumno', 'super_admin', 'admin']}>
              <AchievementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute roles={['alumno']}>
              <TeamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <ProtectedRoute roles={['alumno']}>
              <StatsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route
          path="/finances"
          element={
            <ProtectedRoute roles={['super_admin', 'admin', 'padre']}>
              <FinancesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute roles={['super_admin', 'admin', 'profesor']}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students/:id"
          element={
            <ProtectedRoute roles={['super_admin', 'admin', 'profesor']}>
              <StudentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <TeachersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers/:id"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <TeacherDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories/:id"
          element={
            <ProtectedRoute roles={['super_admin', 'admin', 'profesor']}>
              <CategoryDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <EventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/venues"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <VenuesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings/edit-academy"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <EditAcademyPage />
            </ProtectedRoute>
          }
        />
        <Route path="/settings/edit-profile" element={<EditProfilePage />} />
        <Route path="/settings/security" element={<SecurityPage />} />
        <Route path="/settings/notifications" element={<NotificationsPage />} />
        <Route path="/settings/export" element={<ExportPage />} />
        <Route path="/settings/support" element={<SupportPage />} />
        <Route path="/settings/terms" element={<TermsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
